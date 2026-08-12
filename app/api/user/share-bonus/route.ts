import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: { id: true, hasClaimedShareBonus: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (dbUser.hasClaimedShareBonus) {
      return NextResponse.json({ error: 'Aap already ₹5 claim kar chuke hain!' }, { status: 400 })
    }

    // Process bonus
    const BONUS_AMOUNT = 5

    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: dbUser.id },
        data: {
          hasClaimedShareBonus: true,
          walletBalance: { increment: BONUS_AMOUNT }
        }
      })

      // Add transaction record
      await tx.walletTransaction.create({
        data: {
          userId: dbUser.id,
          type: 'deposit',
          amount: BONUS_AMOUNT,
          status: 'success',
          description: 'App Share Bonus'
        }
      })
    })

    return NextResponse.json({ message: `₹${BONUS_AMOUNT} aapke wallet mein add ho gaye hain!` })

  } catch (error) {
    console.error('POST /api/user/share-bonus error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
