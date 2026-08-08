import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/wallet/verify-payment
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json()

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSig !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Fetch payment details from Razorpay to get amount
    const Razorpay = (await import('razorpay')).default
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const payment = await razorpay.payments.fetch(razorpay_payment_id)
    const amountInRupees = Number(payment.amount) / 100

    // Check for duplicate payment
    const existing = await prisma.walletTransaction.findFirst({
      where: { referenceId: razorpay_payment_id },
    })
    if (existing) {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 400 })
    }

    // Credit wallet
    await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          userId: dbUser.id,
          type: 'deposit',
          amount: amountInRupees,
          status: 'success',
          referenceId: razorpay_payment_id,
          description: 'Wallet Recharge via Razorpay',
        },
      }),
      prisma.user.update({
        where: { id: dbUser.id },
        data: { walletBalance: { increment: amountInRupees } },
      }),
    ])

    return NextResponse.json({ success: true, amount: amountInRupees })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: 'Payment verify karne mein error' }, { status: 500 })
  }
}
