'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flame, Smartphone, Shield, Trophy } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-gradient flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-4 orange-glow pulse-ring">
            <Flame className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black gradient-text tracking-tight">FF TOURNAMENT</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">Khelo. Jeeto. Kamaao.</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-10">
          {[
            { icon: Trophy, label: 'Real Prizes' },
            { icon: Shield, label: 'Secure' },
            { icon: Smartphone, label: 'Mobile First' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="glass-card rounded-xl p-3 flex flex-col items-center gap-1.5">
              <Icon className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-gray-400 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm glass-card rounded-2xl p-6 card-gradient-border">
          <h2 className="text-xl font-bold text-white mb-1">Login / Register</h2>
          <p className="text-sm text-gray-400 mb-6">Google account se login karo aur tournament join karo</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3.5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-900" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Please wait...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6 max-w-xs">
          Login karke aap hamare Terms & Conditions aur Privacy Policy se agree karte ho
        </p>
      </div>
    </div>
  )
}
