import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const orderSchema = z.object({
  amount: z.number().positive().min(10).max(10000),
  type: z.enum(['deposit', 'entry_fee']).default('deposit'),
  tournamentId: z.string().optional(),
})

// POST /api/wallet/create-order
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { amount } = parsed.data

    const merchantId = process.env.PHONEPE_MERCHANT_ID!
    const saltKey = process.env.PHONEPE_SALT_KEY!
    const saltIndex = process.env.PHONEPE_SALT_INDEX!
    const env = process.env.PHONEPE_ENV || 'UAT'

    const merchantTransactionId = `MT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    
    // Construct Payload for PhonePe
    const payload = {
      merchantId: merchantId,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: user.id,
      amount: amount * 100, // in paise
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/phonepe-callback`,
      redirectMode: 'POST',
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/phonepe-callback`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    }

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
    
    // X-VERIFY = SHA256(Base64EncodedPayload + "/pg/v1/pay" + saltKey) + ### + saltIndex
    const stringToHash = base64Payload + '/pg/v1/pay' + saltKey
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex')
    const checksum = `${sha256}###${saltIndex}`

    const apiUrl = env === 'PROD' 
      ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay' 
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json'
      },
      body: JSON.stringify({ request: base64Payload })
    })

    const data = await response.json()
    
    if (data.success) {
      // Create a pending transaction in our DB
      const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
      if (dbUser) {
        await prisma.walletTransaction.create({
          data: {
            userId: dbUser.id,
            type: 'deposit',
            amount: amount,
            status: 'pending',
            referenceId: merchantTransactionId,
            description: 'Wallet Recharge via PhonePe',
          }
        })
      }

      return NextResponse.json({ 
        url: data.data.instrumentResponse.redirectInfo.url,
        orderId: merchantTransactionId
      })
    } else {
      console.error('PhonePe error:', data)
      return NextResponse.json({ error: data.message || 'Payment initiation failed' }, { status: 400 })
    }

  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Order create karne mein error' }, { status: 500 })
  }
}
