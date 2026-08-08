import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080812] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        
        <h1 className="text-3xl font-black text-white mb-6">Terms & Conditions</h1>
        
        <div className="glass-card rounded-2xl p-6 border border-white/5 prose prose-invert max-w-none">
          <p className="text-gray-300">Last Updated: August 2026</p>
          
          <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Introduction</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Welcome to FF Tournament. By accessing and using our website/app, you agree to comply with and be bound by the following terms and conditions of use, which govern FF Tournament's relationship with you in relation to this platform.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">2. Eligibility</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            You must be at least 18 years of age to participate in paid tournaments on this platform. Users from states where skill-based real money gaming is restricted by law (such as Assam, Odisha, Telangana, Nagaland, Andhra Pradesh, and Sikkim) are prohibited from participating in paid tournaments.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">3. Fair Play & Anti-Cheat</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            We maintain a strict zero-tolerance policy against hackers, emulators, teamers, and exploiters. If you are found using any unfair means during a tournament, your account will be permanently banned and all wallet balances will be forfeited without any prior notice.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">4. Payments & Winnings</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            All entry fees are payable in Indian Rupees (INR). Winnings are credited to the user's FF Tournament wallet upon verification of match results. Users can withdraw their winnings to their respective UPI IDs or Bank Accounts, subject to minimum withdrawal limits and processing times.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">5. Modification of Terms</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            FF Tournament reserves the right to modify these terms and conditions at any time. Your continued use of the platform constitutes your acceptance of the revised terms.
          </p>
        </div>
      </div>
    </div>
  )
}
