'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cancel and delete this tournament? All joined players will be refunded.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete tournament')

      toast.success('Tournament cancelled and users refunded!')
      router.push('/admin/tournaments')
    } catch (error: any) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
    >
      <Ban className="w-4 h-4" />
      {loading ? 'Deleting...' : 'Cancel Tournament'}
    </button>
  )
}
