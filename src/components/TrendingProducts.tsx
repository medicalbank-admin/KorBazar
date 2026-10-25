import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Flame } from 'lucide-react';

export default function TrendingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('salesCount', 'desc'), limit(8));
        const snap = await getDocs(q);
        const items = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((p: any) => (p.salesCount || 0) > 0);
        setProducts(items);
      } catch (e) {
        console.error('TrendingProducts:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || products.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="text-orange-500" size={24} />
        <h2 className="text-2xl font-bold text-dark">Trending Now</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {products.map(p => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="min-w-[160px] max-w-[160px] bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded-t-2xl" />
            <div className="p-3">
              <p className="text-sm font-semibold text-dark truncate">{p.title}</p>
              <p className="text-brand font-bold text-sm mt-1">Rs. {p.price}</p>
              {p.salesCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">{p.salesCount} sold</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
              }
