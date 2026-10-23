import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import { CheckCircle2, MapPin } from 'lucide-react';

export default function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!id) return;
      
      // Fetch Store
      const storeSnap = await getDoc(doc(db, 'sellers', id));
      if (storeSnap.exists()) setStore(storeSnap.data());

      // Fetch Products
      const q = query(collection(db, 'products'), where('sellerId', '==', id));
      const prodSnap = await getDocs(q);
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      setLoading(false);
    };
    fetchStoreData();
  }, [id]);

  if (loading) return <div className="p-12 text-center">Loading store...</div>;
  if (!store) return <div className="p-12 text-center">Store not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      {/* Store Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 text-center md:text-left flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-3xl flex-shrink-0">
          {store.storeName.charAt(0)}
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <h1 className="text-3xl font-bold text-dark">{store.storeName}</h1>
            {store.status === 'approved' && <CheckCircle2 className="text-brand" size={24} />}
          </div>
          <p className="text-gray-600 mb-4 max-w-2xl">{store.bio || "Welcome to my store!"}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><MapPin size={16}/> {store.area}, {store.city}</span>
            {store.storeType === 'physical' && <span className="bg-gray-100 px-2 py-1 rounded-md">Physical Shop</span>}
            {store.storeType === 'online_only' && <span className="bg-gray-100 px-2 py-1 rounded-md">Online Only</span>}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-dark mb-6">Products from {store.storeName}</h2>
      
      {products.length === 0 ? (
        <p className="text-gray-500">This store hasn't added any products yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
      }
