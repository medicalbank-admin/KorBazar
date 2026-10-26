import { ShieldCheck, BadgeCheck, Truck, RefreshCw } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, label: 'Secure Payments' },
  { icon: BadgeCheck, label: 'Verified Sellers' },
  { icon: Truck, label: 'Fast Delivery' },
  { icon: RefreshCw, label: 'Easy Returns' },
];

export default function TrustBadges() {
  return (
    <div className="w-full bg-white border-y border-gray-100 py-2 mb-4">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-2">
        {BADGES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-gray-600">
            <Icon size={14} className="text-brand" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
