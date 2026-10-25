import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Sparkles } from 'lucide-react';

export default function NewArrivals() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('NewArrivals:', e);
      }
    })();
  }, []);

  if (!items.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-yellow-500" size={22} />
        <h2 className="text-xl font-bold text-dark">New Arrivals</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(p => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <img src={p.image} alt={p.title} className="w-full h-32 object-cover" />
            <div className="p-2">
              <p className="text-sm font-semibold truncate">{p.title}</p>
              <p className="text-brand font-bold text-sm">Rs. {p.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
