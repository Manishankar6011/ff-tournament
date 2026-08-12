import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const setupSchema = z.object({
  name: z.string().min(2).max(50),
  phone: z.string().min(10).max(15),
  ffUid: z.string().min(8).max(20),
  ffIgn: z.string().min(2).max(30),
  referredByCode: z.string().optional(),
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

    const { name, phone, ffUid, ffIgn, referredByCode } = parsed.data

    // Check if FF UID is already taken
    const existingUid = await prisma.user.findFirst({
      where: { ffUid, NOT: { supabaseId: user.id } },
    })
    if (existingUid) {
      return NextResponse.json({ error: 'Yeh FF UID already registered hai' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })

    if (existingUser) {
      // Just update
      const dbUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, phone, ffUid, ffIgn },
      })
      return NextResponse.json(dbUser)
    }

    // New user creation
    const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Process referral if code provided
    let referrerId: string | undefined = undefined

    const dbUser = await prisma.$transaction(async (tx) => {
      if (referredByCode) {
        const referrer = await tx.user.findUnique({ where: { referralCode: referredByCode } })
        if (referrer) {
          referrerId = referrer.id
          // Reward referrer
          await tx.user.update({
            where: { id: referrer.id },
            data: { walletBalance: { increment: 5 } }
          })
          await tx.walletTransaction.create({
            data: {
              userId: referrer.id,
              type: 'prize_credit',
              amount: 5,
              status: 'success',
              description: 'Referral Bonus',
            }
          })
        }
      }

      return await tx.user.create({
        data: {
          supabaseId: user.id,
          name,
          phone,
          email: user.email || null,
          ffUid,
          ffIgn,
          role: 'player',
          referralCode: newReferralCode,
          referredBy: referrerId,
        }
      })
    })

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('POST /api/auth/setup-profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
