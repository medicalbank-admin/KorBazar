import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Tag } from 'lucide-react';

export default function DiscountDeals() {
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'products'), where('discountPercent', '>', 0));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.discountPercent || 0) - (a.discountPercent || 0))
          .slice(0, 8);
        setDeals(list);
      } catch (e) { console.error(e); }
    })();
  }, []);

  if (!deals.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="text-pink-500" size={22} />
        <h2 className="text-xl font-bold text-dark">Today's Deals</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {deals.map(p => {
          const discounted = Math.round(p.price * (1 - p.discountPercent / 100));
          return (
            <Link key={p.id} to={`/product/${p.id}`} className="min-w-[170px] max-w-[170px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
              <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{p.discountPercent}%</span>
              <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded-t-2xl" />
              <div className="p-3">
                <p className="text-sm font-semibold text-dark truncate">{p.title}</p>
                <p className="mt-1">
                  <span className="text-brand font-bold text-sm">Rs. {discounted}</span>
                  <span className="text-gray-400 text-xs line-through ml-2">Rs. {p.price}</span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
