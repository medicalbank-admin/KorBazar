import { Store, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SellerCTA() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-gradient-to-r from-brand to-brand/70 text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><Store size={28} /></div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Turn your craft into income</h2>
            <p className="text-white/90 text-sm mt-1">Open your free KorBazar store in minutes. No listing fees.</p>
          </div>
        </div>
        
        {/* UPDATED LINK PATH HERE */}
        <Link to="/sell-with-us" className="bg-white text-brand font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 shrink-0">
          Start Selling <ArrowRight size={18} />
        </Link>
        
      </div>
    </section>
  );
}
