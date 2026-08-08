import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const releaseSchema = z.object({
  roomIdCode: z.string().min(1).max(20),
  roomPassword: z.string().min(1).max(20),
})

// POST /api/rooms/[tournamentId]/release — Release room credentials
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
    const parsed = releaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Room ID aur Password dono chahiye' }, { status: 400 })
    }

    const { roomIdCode, roomPassword } = parsed.data

    await prisma.$transaction(async (tx) => {
      // Save/update room
      await tx.room.upsert({
        where: { tournamentId },
        create: {
          tournamentId,
          roomIdCode,
          roomPassword,
          releasedBy: dbUser.id,
        },
        update: {
          roomIdCode,
          roomPassword,
          releasedBy: dbUser.id,
          releasedAt: new Date(),
        },
      })

      // Update tournament status
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: 'room_released' },
      })
    })

    // TODO: Send push notifications + SMS to all joined players
    // This would call lib/notifications/push.ts and lib/notifications/sms.ts

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/rooms/[tournamentId]/release error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
