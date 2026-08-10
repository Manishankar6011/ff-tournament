import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendAppNotification } from '@/lib/webpush'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // In production, you'd secure this endpoint with a secret key
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const now = new Date()
    const fiveMinsFromNow = new Date(now.getTime() + 5 * 60000)
    const sixMinsFromNow = new Date(now.getTime() + 6 * 60000)
    const fourMinsFromNow = new Date(now.getTime() + 4 * 60000)

    // Find upcoming tournaments starting in exactly ~5 minutes
    const upcomingMatches = await prisma.tournament.findMany({
      where: {
        status: { in: ['upcoming', 'room_released'] },
        matchDatetime: {
          gte: fourMinsFromNow,
          lt: sixMinsFromNow
        }
      },
      include: {
        slots: {
          select: { userId: true }
        }
      }
    })

    let notificationsSent = 0

    for (const match of upcomingMatches) {
      for (const slot of match.slots) {
        await sendAppNotification(
          slot.userId,
          'Match Starting Soon! 🎮',
          `Get ready! ${match.title} starts in 5 minutes. Check Room ID now.`,
          'match_alert',
          `/tournaments/${match.id}`
        )
        notificationsSent++
      }
    }

    return NextResponse.json({ success: true, matchesFound: upcomingMatches.length, notificationsSent })
  } catch (error) {
    console.error('Cron match reminder error:', error)
    return NextResponse.json({ error: 'System error' }, { status: 500 })
  }
}
