import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080812] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        
        <h1 className="text-3xl font-black text-white mb-6">Privacy Policy</h1>
        
        <div className="glass-card rounded-2xl p-6 border border-white/5 prose prose-invert max-w-none">
          <p className="text-gray-300">Last Updated: August 2026</p>
          
          <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Information We Collect</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            We collect personal information that you provide to us when you register on our platform. This includes your name, email address (via Google Login), in-game UID, phone number (if provided for payments), and UPI details for processing withdrawals.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            We use your information to manage your account, verify your identity for tournament payouts, communicate match updates via notifications, and process payments securely. We do not sell your personal data to third parties.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">3. Payment Security</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            All payment transactions are processed through secure, RBI-approved payment gateways (such as PhonePe or Razorpay). We do not store your credit/debit card information or net banking passwords on our servers.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">4. Data Deletion Request</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            If you wish to delete your account and all associated data, please email us at support@ff-tournament.com. We will process your request within 7-14 working days, subject to pending match verifications or wallet balances.
          </p>
        </div>
      </div>
    </div>
  )
}
