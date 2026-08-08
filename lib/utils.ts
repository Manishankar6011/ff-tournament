import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function getTimeUntilMatch(matchDatetime: Date | string): string {
  const now = new Date()
  const match = new Date(matchDatetime)
  const diff = match.getTime() - now.getTime()

  if (diff < 0) return 'Started'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function getSlotsPercentage(filled: number, max: number): number {
  return Math.round((filled / max) * 100)
}

export function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    solo: 'Solo',
    duo: 'Duo',
    squad: 'Squad (4v4)',
  }
  return labels[mode] || mode
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    room_released: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    upcoming: 'Upcoming',
    room_released: 'Room Released',
    live: 'Live',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}
