import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendAppNotification } from '@/lib/webpush'

export const dynamic = 'force-dynamic'

const actionSchema = z.object({
  action: z.enum(['approve', 'reject'])
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser || !['admin', 'sub_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = actionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { action } = parsed.data

    const tx = await prisma.walletTransaction.findUnique({ where: { id } })
    if (!tx || tx.type !== 'deposit') {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    if (tx.status !== 'pending') {
      return NextResponse.json({ error: 'Transaction is already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      // Approve and add balance
      await prisma.$transaction(async (prismaTx) => {
        await prismaTx.walletTransaction.update({
          where: { id },
          data: { status: 'success' }
        })
        
        await prismaTx.user.update({
          where: { id: tx.userId },
          data: { walletBalance: { increment: tx.amount } }
        })
      })

      // Send Notification
      await sendAppNotification(
        tx.userId,
        'Deposit Approved! 🎉',
        `₹${tx.amount} has been added to your wallet.`,
        'deposit',
        '/wallet'
      )
    } else {
      // Reject
      await prisma.walletTransaction.update({
        where: { id },
        data: { 
          status: 'failed',
          description: 'Payment Failed'
        }
      })

      // Send Notification
      await sendAppNotification(
        tx.userId,
        'Deposit Failed ❌',
        `Your deposit of ₹${tx.amount} was rejected. (UTR: ${tx.referenceId})`,
        'deposit',
        '/wallet'
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Process deposit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
