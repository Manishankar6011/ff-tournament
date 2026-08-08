import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const orderSchema = z.object({
  amount: z.number().positive().min(10).max(10000),
  type: z.enum(['deposit', 'entry_fee']).default('deposit'),
  tournamentId: z.string().optional(),
})

// POST /api/wallet/create-order
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { amount } = parsed.data

    // Lazy init Razorpay to avoid build-time errors when env vars are not set
    const Razorpay = (await import('razorpay')).default
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `wallet_${user.id}_${Date.now()}`,
    })

    return NextResponse.json({ orderId: order.id, amount })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Order create karne mein error' }, { status: 500 })
  }
}
