import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/tournaments — List all tournaments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')
    const status = searchParams.get('status')

    const where: any = {}
    if (mode && mode !== 'all') where.mode = mode
    if (status) where.status = status
    else where.status = { in: ['upcoming', 'room_released', 'live'] }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { matchDatetime: 'asc' },
      take: 20,
      select: {
        id: true, title: true, mode: true, map: true,
        entryFee: true, prizePool: true, perKillPoint: true, perKillReward: true,
        maxSlots: true, slotsFilled: true, matchDatetime: true, status: true, bannerUrl: true,
      },
    })

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error('GET /api/tournaments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const createSchema = z.object({
  title: z.string().min(3).max(100),
  mode: z.enum(['solo', 'duo', 'squad']),
  map: z.string().default('Bermuda'),
  entryFee: z.number().positive(),
  prizePool: z.number().positive(),
  perKillPoint: z.number().int().min(0).default(1),
  perKillReward: z.number().min(0).default(0),
  maxSlots: z.number().int().positive(),
  matchDatetime: z.string().datetime(),
  rulesText: z.string().optional(),
  bannerUrl: z.string().url().optional(),
  prizeDistribution: z.record(z.string(), z.number()).default({ '1': 50, '2': 30, '3': 20 }),
  pointTable: z.record(z.string(), z.number()).default({ '1': 15, '2': 12, '3': 10, '4': 8, '5': 6, '6': 4 }),
})

// POST /api/tournaments — Create tournament (Admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser || !['admin', 'sub_admin'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.errors }, { status: 400 })
    }

    const teamSize = parsed.data.mode === 'solo' ? 1 : parsed.data.mode === 'duo' ? 2 : 4

    const tournament = await prisma.tournament.create({
      data: { ...parsed.data, teamSize, createdBy: dbUser.id },
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error('POST /api/tournaments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
