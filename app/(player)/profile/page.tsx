'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User as UserIcon, LogOut, ShieldCheck, Gamepad2, Phone, Mail, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

interface UserData {
  name: string
  email: string | null
  phone: string | null
  ffUid: string | null
  ffIgn: string | null
  walletBalance: number
  kycStatus: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logout successful')
      router.push('/login')
    } catch (err) {
      toast.error('Logout failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#080812]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-4">
        <h1 className="text-xl font-black text-white">Profile</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* User Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 p-1 mb-4">
            <div className="w-full h-full rounded-full bg-[#1a1a30] flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          
          <h2 className="text-xl font-black text-white">{user.name}</h2>
          <p className="text-sm text-gray-400 mb-4">{user.email || user.phone || 'No Contact Info'}</p>

          <div className="flex gap-2">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border",
              user.kycStatus === 'verified' 
                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            )}>
              <ShieldCheck className="w-3.5 h-3.5" />
              KYC {user.kycStatus}
            </span>
          </div>
        </div>

        {/* Game Details */}
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-orange-400" />
            Free Fire Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-sm text-gray-400">In-Game Name (IGN)</span>
              <span className="text-sm font-bold text-white">{user.ffIgn || 'Not Set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Game UID</span>
              <span className="text-sm font-bold text-white">{user.ffUid || 'Not Set'}</span>
            </div>
          </div>
        </div>

        {/* Settings Links */}
        <div className="glass-card rounded-2xl p-2 space-y-1">
          <Link href="/setup-profile" className="w-full p-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-white">Edit Profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full p-3 rounded-xl hover:bg-red-500/10 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-red-400">Logout</span>
            </div>
          </button>
        </div>

      </div>
    </div>
  )
}
