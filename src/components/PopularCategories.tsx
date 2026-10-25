import { Link } from 'react-router-dom';
import { Cake, Gem, Palette, Candle, Gift, Home, Coffee, Key } from 'lucide-react';

const CATS = [
  { name: 'Cakes & Bakes', icon: Cake, color: 'bg-rose-50 text-rose-600' },
  { name: 'Handmade Jewelry', icon: Gem, color: 'bg-purple-50 text-purple-600' },
  { name: 'Crafts & Decor', icon: Palette, color: 'bg-amber-50 text-amber-600' },
  { name: 'Candles', icon: Candle, color: 'bg-orange-50 text-orange-600' },
  { name: 'Gift Hampers', icon: Gift, color: 'bg-pink-50 text-pink-600' },
  { name: 'Home Decor', icon: Home, color: 'bg-teal-50 text-teal-600' },
  { name: 'Customized Mugs', icon: Coffee, color: 'bg-blue-50 text-blue-600' },
  { name: 'Resin Art', icon: Key, color: 'bg-emerald-50 text-emerald-600' },
];

export default function PopularCategories() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-dark mb-4">Shop by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {CATS.map(({ name, icon: Icon, color }) => (
          <Link key={name} to={`/?cat=${encodeURIComponent(name)}`} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${color}`}><Icon size={22} /></div>
            <p className="text-sm font-semibold text-dark">{name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
