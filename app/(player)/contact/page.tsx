import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#080812] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        
        <h1 className="text-3xl font-black text-white mb-6">Contact Us</h1>
        
        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
          <p className="text-gray-300">
            If you have any questions or need support regarding our tournaments, wallet, or platform, please feel free to contact us using the details below.
          </p>
          
          <div className="space-y-4 mt-6">
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Business Name</h3>
              <p className="text-white text-lg font-medium">Manishankar Kumar (FF Tournament)</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</h3>
              <p className="text-white text-lg font-medium">+91 7061338807</p>
              <p className="text-xs text-gray-500 mt-1">Available 10:00 AM to 6:00 PM (Mon-Sat)</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</h3>
              <p className="text-white text-lg font-medium">support@ff-tournament.com</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Operating Address</h3>
              <p className="text-white text-lg font-medium">
                Chashma center gali, Kurji, Patna Rural Subdistrict,<br />
                Patna, Bihar, India - 800013
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
