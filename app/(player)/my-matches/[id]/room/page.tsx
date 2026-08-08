import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Key, Copy, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import { RoomCredential } from './RoomCredential'

export const dynamic = 'force-dynamic'
export default async function RoomDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect('/setup-profile')

  // Check if user has joined this tournament
  const slot = await prisma.tournamentSlot.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId: dbUser.id } },
    include: { tournament: true },
  })

  if (!slot) notFound()

  const room = await prisma.room.findUnique({ where: { tournamentId: id } })

  const tournament = slot.tournament

  if (!['room_released', 'live', 'completed'].includes(tournament.status) || !room) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
          <Link href="/my-matches" className="flex items-center gap-2 text-gray-300">
            <ArrowLeft className="w-5 h-5" /> Wapas
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <Clock className="w-12 h-12 text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Room Abhi Release Nahi Hua</h2>
          <p className="text-gray-400 text-sm">
            Match se 30–60 minute pehle admin Room ID/Password release karega.
            Notification allow karke rakho!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <Link href="/my-matches" className="flex items-center gap-2 text-gray-300">
          <ArrowLeft className="w-5 h-5" /> Wapas
        </Link>
      </div>

      <div className="px-4 py-8 space-y-4 max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mx-auto mb-4 pulse-ring">
            <Key className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Room Details</h1>
          <p className="text-gray-400 text-sm mt-1">{tournament.title}</p>
        </div>

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">
            Yeh Room ID/Password kisi ke saath share mat karo. Sirf joined players ko hi ye dikhti hai.
          </p>
        </div>

        {/* Room ID */}
        <RoomCredential label="Room ID" value={room.roomIdCode} />

        {/* Room Password */}
        <RoomCredential label="Room Password" value={room.roomPassword} />

        <div className="glass-card rounded-2xl p-4 text-sm text-gray-400 space-y-1.5">
          <p>📱 Free Fire app kholke <strong className="text-white">Custom Room</strong> me jao</p>
          <p>🔑 Oopar diya Room ID daalo, phir Password</p>
          <p>🎮 Match mein enter ho jao aur <strong className="text-white">best of luck!</strong> 🔥</p>
        </div>
      </div>
    </div>
  )
}
