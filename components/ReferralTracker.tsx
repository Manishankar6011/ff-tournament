'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ReferralTrackerInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      // Store it in localStorage. It will be picked up during profile setup.
      localStorage.setItem('ff_referral_code', refCode)
    }
  }, [searchParams])

  return null
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  )
}
