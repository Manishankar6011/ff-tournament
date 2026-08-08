export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user exists in DB, if not, handle it (Prisma sync)
      let dbUser = await prisma.user.findUnique({ where: { supabaseId: data.user.id } })
      
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            supabaseId: data.user.id,
            role: 'player',
            name: data.user.user_metadata?.full_name || 'Player',
            email: data.user.email,
          }
        })
      }

      // Check if profile is complete (ffUid and ffIgn)
      if (!dbUser.ffUid || !dbUser.ffIgn) {
        return NextResponse.redirect(`${origin}/setup-profile`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
