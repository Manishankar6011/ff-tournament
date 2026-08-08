export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateResults, DEFAULT_POINT_TABLE, DEFAULT_PRIZE_DISTRIBUTION } from '@/lib/points-calculator'

const resultsSchema = z.object({
  slots: z.array(z.object({
    slotId: z.string(),
    rank: z.number().int().positive(),
    kills: z.number().int().min(0),
  })),
})

// POST /api/results/[tournamentId] — Submit results (Admin)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser || !['admin', 'sub_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = resultsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.errors }, { status: 400 })
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    if (tournament.status === 'completed') {
      return NextResponse.json({ error: 'Results already published' }, { status: 400 })
    }

    const pointTable = (tournament.pointTable as Record<string, number>) || DEFAULT_POINT_TABLE
    const prizeDistribution = (tournament.prizeDistribution as Record<string, number>) || DEFAULT_PRIZE_DISTRIBUTION

    // Calculate results
    const calculated = calculateResults(
      parsed.data.slots,
      tournament.perKillPoint,
      Number(tournament.prizePool),
      prizeDistribution,
      pointTable,
      Number(tournament.perKillReward),
    )

    // Save results and credit prizes in a transaction
    await prisma.$transaction(async (tx) => {
      for (const r of calculated) {
        await tx.result.upsert({
          where: { slotId: r.slotId },
          create: {
            tournamentId,
            slotId: r.slotId,
            rank: r.rank,
            kills: r.kills,
            pointsEarned: r.totalPoints,
            prizeWon: r.prizeWon,
            enteredBy: dbUser.id,
          },
          update: {
            rank: r.rank,
            kills: r.kills,
            pointsEarned: r.totalPoints,
            prizeWon: r.prizeWon,
            enteredBy: dbUser.id,
          },
        })

        // Credit prize if won
        if (r.prizeWon > 0) {
          const slot = await tx.tournamentSlot.findUnique({ where: { id: r.slotId } })
          if (slot) {
            await tx.walletTransaction.create({
              data: {
                userId: slot.userId,
                type: 'prize_credit',
                amount: r.prizeWon,
                status: 'success',
                referenceId: tournamentId,
                description: `Prize: ${tournament.title} — Rank #${r.rank}`,
              },
            })
            await tx.user.update({
              where: { id: slot.userId },
              data: { walletBalance: { increment: r.prizeWon } },
            })
          }
        }
      }

      // Mark tournament completed
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: 'completed' },
      })
    })

    return NextResponse.json({ success: true, resultsCount: calculated.length })
  } catch (error) {
    console.error('POST /api/results error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/results/[tournamentId] — Get leaderboard
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params

    const results = await prisma.result.findMany({
      where: { tournamentId },
      include: {
        slot: {
          include: {
            user: { select: { name: true, ffIgn: true, ffUid: true, avatarUrl: true } },
          },
        },
      },
      orderBy: [{ pointsEarned: 'desc' }, { kills: 'desc' }],
    })

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
