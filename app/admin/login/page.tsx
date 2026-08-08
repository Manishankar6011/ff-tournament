'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, Mail, Lock, Eye, EyeOff, Flame } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Email ya password galat hai')
      setLoading(false)
      return
    }

    // Verify admin role
    const res = await fetch('/api/auth/me')
    const user = await res.json()

    if (!user || !['admin', 'sub_admin'].includes(user.role)) {
      await supabase.auth.signOut()
      toast.error('Tumhare paas admin access nahi hai')
      setLoading(false)
      return
    }

    toast.success(`Welcome back, ${user.name}!`)
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen animated-gradient flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4 orange-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-orange-400 tracking-widest uppercase">FF Tournament</span>
          </div>
          <h1 className="text-2xl font-black text-white">Admin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">Sirf authorized admins ke liye</p>
        </div>

        <div className="glass-card rounded-2xl p-6 card-gradient-border">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@fftournament.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-95 mt-2"
            >
              {loading ? 'Login ho raha hai...' : 'Admin Login'}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          Player login ke liye main website par jao
        </p>
      </div>
    </div>
  )
}
