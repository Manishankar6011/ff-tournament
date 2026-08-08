import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    // PhonePe sends redirectMode: POST with code, merchantId, transactionId, amount, providerReferenceId
    const merchantId = formData.get('merchantId') as string
    const transactionId = formData.get('transactionId') as string

    if (!merchantId || !transactionId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=invalid_callback`)
    }

    const saltKey = process.env.PHONEPE_SALT_KEY!
    const saltIndex = process.env.PHONEPE_SALT_INDEX!
    const env = process.env.PHONEPE_ENV || 'UAT'

    // Verify status via S2S API
    const stringToHash = `/pg/v1/status/${merchantId}/${transactionId}` + saltKey
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex')
    const checksum = `${sha256}###${saltIndex}`

    const apiUrl = env === 'PROD' 
      ? `https://api.phonepe.com/apis/hermes/pg/v1/status/${merchantId}/${transactionId}`
      : `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${transactionId}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId
      }
    })

    const statusData = await response.json()

    const existingTx = await prisma.walletTransaction.findFirst({
      where: { referenceId: transactionId }
    })

    if (!existingTx) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=tx_not_found`)
    }

    if (existingTx.status === 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?payment=success`)
    }

    if (statusData.success && statusData.code === 'PAYMENT_SUCCESS') {
      const amountInRupees = statusData.data.amount / 100

      // Use a Prisma transaction to safely update both Tx and User Wallet
      await prisma.$transaction([
        prisma.walletTransaction.update({
          where: { id: existingTx.id },
          data: { status: 'success' }
        }),
        prisma.user.update({
          where: { id: existingTx.userId },
          data: { walletBalance: { increment: amountInRupees } }
        })
      ])

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?payment=success`)
    } else {
      await prisma.walletTransaction.update({
        where: { id: existingTx.id },
        data: { status: 'failed' }
      })
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=payment_failed`)
    }
  } catch (error) {
    console.error('PhonePe callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/wallet?error=internal_error`)
  }
}
