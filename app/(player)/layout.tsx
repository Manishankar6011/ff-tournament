'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Trophy, Wallet, User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/my-matches', icon: Trophy, label: 'My Matches' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#080812] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 safe-bottom">
        <div className="glass-card border-t border-white/10 backdrop-blur-xl">
          <div className="grid grid-cols-5 px-2 py-2">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-200 active:scale-90',
                    isActive
                      ? 'text-orange-400'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  <div className={cn(
                    'relative p-1.5 rounded-xl transition-colors duration-200',
                    isActive ? 'bg-orange-500/20' : ''
                  )}>
                    <Icon className="w-5 h-5" />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </div>
                  <span className={cn('text-[10px] font-medium', isActive ? 'text-orange-400' : 'text-gray-500')}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
