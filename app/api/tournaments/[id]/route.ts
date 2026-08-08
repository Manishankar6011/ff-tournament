import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/tournaments/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    })
    if (!tournament) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(tournament)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tournaments/[id] — Update tournament (Admin)
export async function PATCH(
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

    const tournament = await prisma.tournament.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(tournament)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tournaments/[id] — Cancel tournament (Admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cancel tournament — refund all joined players
    await prisma.$transaction(async (tx) => {
      const slots = await tx.tournamentSlot.findMany({
        where: { tournamentId: id, paymentStatus: 'success' },
        include: { user: true },
      })

      // Refund entry fees
      for (const slot of slots) {
        const tournament = await tx.tournament.findUnique({ where: { id } })
        if (!tournament) continue

        await tx.walletTransaction.create({
          data: {
            userId: slot.userId,
            type: 'refund',
            amount: tournament.entryFee,
            status: 'success',
            description: `Refund: ${tournament.title} cancelled`,
          },
        })
        await tx.user.update({
          where: { id: slot.userId },
          data: { walletBalance: { increment: tournament.entryFee } },
        })
        await tx.tournamentSlot.update({
          where: { id: slot.id },
          data: { paymentStatus: 'refunded' },
        })
      }

      await tx.tournament.update({ where: { id }, data: { status: 'cancelled' } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
