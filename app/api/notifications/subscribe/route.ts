import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const subscription = await request.json()

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Upsert subscription (if endpoint exists for this user, do nothing basically, or update keys)
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: dbUser.id,
          endpoint: subscription.endpoint
        }
      },
      create: {
        userId: dbUser.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys
      },
      update: {
        keys: subscription.keys
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json({ error: 'System error' }, { status: 500 })
  }
}
