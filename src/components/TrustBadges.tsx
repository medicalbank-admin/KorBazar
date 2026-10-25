import { ShieldCheck, BadgeCheck, Truck, RefreshCw } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, title: 'Secure Payments', sub: 'COD & online' },
  { icon: BadgeCheck, title: 'Verified Sellers', sub: 'CNIC checked' },
  { icon: Truck, title: 'Fast Delivery', sub: 'Nationwide' },
  { icon: RefreshCw, title: 'Easy Returns', sub: 'Buyer protection' },
];

export default function TrustBadges() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BADGES.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Icon size={20} />
            </div>
            <div>
              <p className="font-bold text-dark text-sm">{title}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
