import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#080812] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        
        <h1 className="text-3xl font-black text-white mb-6">Refund & Cancellation Policy</h1>
        
        <div className="glass-card rounded-2xl p-6 border border-white/5 prose prose-invert max-w-none">
          <p className="text-gray-300">Last Updated: August 2026</p>
          
          <h2 className="text-xl font-bold text-white mt-6 mb-3">1. Wallet Deposits</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Money added to the wallet is strictly for participating in tournaments on FF Tournament. Wallet balances are non-transferable and non-refundable to your bank account once deposited, unless the transaction failed but money was deducted.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">2. Tournament Entry Fees</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            Once you join a tournament and the entry fee is deducted from your wallet, cancellations are generally not permitted. The entry fee is <strong>non-refundable</strong> if you fail to join the custom room or miss the match timing.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">3. Match Cancellations</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            If a tournament is cancelled or postponed by FF Tournament management due to technical issues, insufficient players, or unavoidable circumstances, 100% of the entry fee will be refunded back to your FF Tournament wallet immediately.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">4. Failed Transactions</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            If money is deducted from your bank account but not added to your FF Tournament wallet due to a network issue, it will be automatically refunded by the payment gateway to your original payment method within 5-7 working days.
          </p>

          <h2 className="text-xl font-bold text-white mt-6 mb-3">5. Contact for Refunds</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            For any payment-related disputes or refund requests, please contact our support team at support@ff-tournament.com within 24 hours of the transaction.
          </p>
        </div>
      </div>
    </div>
  )
}
