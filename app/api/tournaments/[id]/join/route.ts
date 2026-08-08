import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const joinSchema = z.object({
  teammates: z.array(z.object({
    name: z.string().min(1),
    ffUid: z.string().min(1),
    ffIgn: z.string().min(1),
  })).optional().default([]),
  paymentMethod: z.enum(['wallet']).default('wallet'),
})

// POST /api/tournaments/[id]/join
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Profile setup karo pehle' }, { status: 400 })

    const body = await request.json()
    const parsed = joinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.findUnique({ where: { id } })
      if (!tournament) throw new Error('Tournament nahi mila')
      if (tournament.status !== 'upcoming') throw new Error('Registration band ho gayi')
      if (tournament.slotsFilled >= tournament.maxSlots) throw new Error('Tournament full ho gaya')

      // Check already joined
      const existing = await tx.tournamentSlot.findUnique({
        where: { tournamentId_userId: { tournamentId: id, userId: dbUser.id } },
      })
      if (existing) throw new Error('Aap already join kar chuke ho')

      // Check wallet balance
      if (Number(dbUser.walletBalance) < Number(tournament.entryFee)) {
        throw new Error('Wallet balance kam hai')
      }

      // Assign slot number
      const slotNumber = tournament.slotsFilled + 1

      // Deduct entry fee
      await tx.user.update({
        where: { id: dbUser.id },
        data: { walletBalance: { decrement: tournament.entryFee } },
      })

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          userId: dbUser.id,
          type: 'entry_fee',
          amount: tournament.entryFee,
          status: 'success',
          description: `Entry fee: ${tournament.title}`,
          referenceId: id,
        },
      })

      // Create slot
      const slot = await tx.tournamentSlot.create({
        data: {
          tournamentId: id,
          slotNumber,
          userId: dbUser.id,
          teamMembers: parsed.data.teammates,
          paymentStatus: 'success',
        },
      })

      // Increment slots filled
      await tx.tournament.update({
        where: { id },
        data: { slotsFilled: { increment: 1 } },
      })

      return slot
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/tournaments/[id]/join error:', error)
    return NextResponse.json({ error: error.message || 'Join failed' }, { status: 400 })
  }
}

// GET /api/tournaments/[id]/join — Get all slots (Admin)
export async function GET(
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

    const slots = await prisma.tournamentSlot.findMany({
      where: { tournamentId: id },
      include: { user: { select: { name: true, phone: true, ffUid: true, ffIgn: true } } },
      orderBy: { slotNumber: 'asc' },
    })

    return NextResponse.json(slots)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
