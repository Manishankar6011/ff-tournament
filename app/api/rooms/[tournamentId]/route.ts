import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/rooms/[tournamentId] — Get room details (for admin)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params
    const room = await prisma.room.findUnique({ where: { tournamentId } })
    return NextResponse.json(room || null)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
