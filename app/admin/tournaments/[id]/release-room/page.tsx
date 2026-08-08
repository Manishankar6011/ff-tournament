'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Key, Send, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ReleaseRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [roomId, setRoomId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingRoom, setExistingRoom] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/rooms/${id}`)
      .then(r => r.json())
      .then(d => { if (d?.roomIdCode) setExistingRoom(d) })
  }, [id])

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId || !password) {
      toast.error('Room ID aur Password dono chahiye')
      return
    }

    setLoading(true)
    const res = await fetch(`/api/rooms/${id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomIdCode: roomId, roomPassword: password }),
    })

    if (res.ok) {
      toast.success('Room release ho gaya! Players ko notification bhej di gayi. 🔔')
      router.push(`/admin/tournaments/${id}`)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Room release karne mein error')
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/admin/tournaments/${id}`}>
          <ArrowLeft className="w-5 h-5 text-gray-400 hover:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Release Room</h1>
          <p className="text-gray-400 text-sm">Players ko Room ID/Password do</p>
        </div>
      </div>

      {existingRoom && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-green-400 font-bold">Room already released hai</p>
            <p className="text-xs text-gray-400 mt-1">
              Current Room ID: <strong className="text-white">{existingRoom.roomIdCode}</strong>{' '}
              | Password: <strong className="text-white">{existingRoom.roomPassword}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">Update karne ke liye naya Room ID/Password daalo</p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 card-gradient-border">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-300">
            Pehle Free Fire app mein manually Room banao, phir yahan Room ID aur Password daalo.
            Submit karne ke baad sab joined players ko turant notification jayegi!
          </p>
        </div>

        <form onSubmit={handleRelease} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-yellow-400" />
              Free Fire Room ID
            </label>
            <input
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
              placeholder="Jaise: ABC123"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 font-mono text-lg tracking-wider text-center"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Room Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Jaise: pass1234"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 font-mono text-lg tracking-wider text-center"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !roomId || !password}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Release ho raha hai...
              </span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Room Release Karo + Players ko Notify Karo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
