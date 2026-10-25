import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Store, Star } from 'lucide-react';

export default function FeaturedStores() {
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'sellers'), where('status', '==', 'approved'), limit(10));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStores(all.filter((s: any) => s.plan === 'premium').slice(0, 8));
      } catch (e) {
        console.error('FeaturedStores:', e);
      }
    })();
  }, []);

  if (!stores.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Star className="text-yellow-500 fill-yellow-500" size={22} />
        <h2 className="text-xl font-bold text-dark">Featured Stores</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {stores.map(s => (
          <Link
            key={s.id}
            to={`/store/${s.id}`}
            className="min-w-[220px] bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                <Store size={22} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-dark truncate">{s.storeName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {s.city}{s.area ? `, ${s.area}` : ''}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 line-clamp-2">
              {s.bio || 'Verified KorBazar seller.'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
                  }
