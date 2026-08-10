import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const utrSchema = z.object({
  amount: z.number().positive().min(10).max(10000),
  utr: z.string().min(12, "UTR must be exactly 12 digits").max(12, "UTR must be exactly 12 digits"),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = utrSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { amount, utr } = parsed.data

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Check if UTR is already used
    const existingTx = await prisma.walletTransaction.findFirst({
      where: { referenceId: utr }
    })
    
    if (existingTx) {
      return NextResponse.json({ error: 'Yeh UTR pehle se submit ho chuka hai' }, { status: 400 })
    }

    // Create a pending transaction
    await prisma.walletTransaction.create({
      data: {
        userId: dbUser.id,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        referenceId: utr,
        description: 'Manual UPI Deposit',
      }
    })

    return NextResponse.json({ success: true, message: 'UTR submitted successfully' })

  } catch (error) {
    console.error('Submit UTR error:', error)
    return NextResponse.json({ error: 'System error' }, { status: 500 })
  }
}
