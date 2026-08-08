export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const withdrawSchema = z.object({
  amount: z.number().positive().min(10),
  upiId: z.string().includes('@').min(5),
})

// POST /api/wallet/withdraw
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()
    const parsed = withdrawSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Amount ya UPI ID galat hai' }, { status: 400 })
    }

    const { amount, upiId } = parsed.data

    if (Number(dbUser.walletBalance) < amount) {
      return NextResponse.json({ error: 'Balance kam hai' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.withdrawalRequest.create({
        data: {
          userId: dbUser.id,
          amount,
          upiId,
          status: 'pending',
        },
      }),
      // Hold the amount (deduct from wallet)
      prisma.walletTransaction.create({
        data: {
          userId: dbUser.id,
          type: 'withdrawal_hold',
          amount,
          status: 'success',
          description: `Withdrawal request (UPI: ${upiId})`,
        },
      }),
      prisma.user.update({
        where: { id: dbUser.id },
        data: { walletBalance: { decrement: amount } },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/wallet/withdraw error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
