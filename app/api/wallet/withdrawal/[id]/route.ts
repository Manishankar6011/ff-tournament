import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const actionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

// PATCH /api/wallet/withdrawal/[id] — Approve or reject
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!adminUser || !['admin', 'sub_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    const { action, reason } = parsed.data

    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } })
    if (!withdrawal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'approved',
          processedAt: new Date(),
          processedBy: adminUser.id,
        },
      })
    } else {
      // Reject: refund back to wallet
      await prisma.$transaction([
        prisma.withdrawalRequest.update({
          where: { id },
          data: {
            status: 'rejected',
            reason: reason || 'Admin ne reject kiya',
            processedAt: new Date(),
            processedBy: adminUser.id,
          },
        }),
        prisma.walletTransaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'refund',
            amount: withdrawal.amount,
            status: 'success',
            description: `Withdrawal refund (rejected): ${reason || 'Admin ne reject kiya'}`,
            referenceId: id,
          },
        }),
        prisma.user.update({
          where: { id: withdrawal.userId },
          data: { walletBalance: { increment: withdrawal.amount } },
        }),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/wallet/withdrawal/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
