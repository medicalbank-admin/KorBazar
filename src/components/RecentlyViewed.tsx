import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';

export default function RecentlyViewed() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kb_recent_products');
      if (raw) setItems(JSON.parse(raw).slice(0, 8));
    } catch {}
  }, []);

  if (!items.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <History className="text-gray-600" size={22} />
        <h2 className="text-xl font-bold text-dark">Recently Viewed</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {items.map(p => (
          <Link key={p.id} to={`/product/${p.id}`} className="min-w-[150px] max-w-[150px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <img src={p.image} alt={p.title} className="w-full h-28 object-cover rounded-t-2xl" />
            <div className="p-2">
              <p className="text-xs font-semibold text-dark truncate">{p.title}</p>
              <p className="text-brand font-bold text-xs mt-1">Rs. {p.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
