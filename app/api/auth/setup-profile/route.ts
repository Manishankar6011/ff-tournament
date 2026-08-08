export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const setupSchema = z.object({
  name: z.string().min(2).max(50),
  ffUid: z.string().min(8).max(20),
  ffIgn: z.string().min(2).max(30),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = setupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.errors }, { status: 400 })
    }

    const { name, ffUid, ffIgn } = parsed.data

    // Check if FF UID is already taken
    const existingUid = await prisma.user.findFirst({
      where: { ffUid, NOT: { supabaseId: user.id } },
    })
    if (existingUid) {
      return NextResponse.json({ error: 'Yeh FF UID already registered hai' }, { status: 400 })
    }

    // Upsert user (create if not exists, update if exists)
    const dbUser = await prisma.user.upsert({
      where: { supabaseId: user.id },
      create: {
        supabaseId: user.id,
        name,
        phone: user.phone || null,
        email: user.email || null,
        ffUid,
        ffIgn,
        role: 'player',
      },
      update: {
        name,
        ffUid,
        ffIgn,
      },
    })

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('POST /api/auth/setup-profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
