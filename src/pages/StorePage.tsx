import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import { CheckCircle2, MapPin, Facebook, Instagram, Globe, ShieldCheck, ShieldAlert, Crown } from 'lucide-react';
import ReportModal from '../components/ReportModal';

export default function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ delivered: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!id) return;
      
      const storeSnap = await getDoc(doc(db, 'sellers', id));
      if (storeSnap.exists()) setStore(storeSnap.data());

      const q = query(collection(db, 'products'), where('sellerId', '==', id));
      const prodSnap = await getDocs(q);
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const orderQ = query(collection(db, 'orders'), where('sellerId', '==', id));
      const orderSnap = await getDocs(orderQ);
      let delivered = 0;
      let cancelled = 0;
      orderSnap.forEach(doc => {
        const status = doc.data().status;
        if (status === 'delivered') delivered++;
        if (status === 'cancelled' || status === 'rejected') cancelled++;
      });
      setStats({ delivered, cancelled });

      setLoading(false);
    };
    fetchStoreData();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-dark font-bold">Loading store...</div>;
  if (!store) return <div className="p-12 text-center text-dark font-bold">Store not found.</div>;

  if (store.isFrozen) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl text-center max-w-md">
          <ShieldAlert size={64} className="text-alert mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-alert mb-2">Store Temporarily Unavailable</h2>
          <p className="text-gray-700">This store has been temporarily frozen by the administration. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="w-32 h-32 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-5xl flex-shrink-0">
          {store.storeName.charAt(0)}
        </div>
        <div className="flex-grow text-center md:text-left">
          
          {/* PREMIUM vs STANDARD BADGE LOGIC */}
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 mb-2">
            <h1 className="text-3xl font-bold text-dark">{store.storeName}</h1>
            {store.plan === 'premium' ? (
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 border border-yellow-200">
                <Crown size={16} className="fill-yellow-500 text-yellow-500" /> Premium Seller
              </span>
            ) : store.status === 'approved' ? (
              <CheckCircle2 className="text-brand" size={24} />
            ) : null}
          </div>
          
          <p className="text-gray-600 mb-4 max-w-2xl">{store.bio || "Welcome to my store!"}</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1"><MapPin size={16}/> {store.area}, {store.city}</span>
            {store.storeType === 'physical' && <span className="bg-gray-100 px-2 py-1 rounded-md">Physical Shop</span>}
            {store.storeType === 'online_only' && <span className="bg-gray-100 px-2 py-1 rounded-md">Online Only</span>}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            {store.socialLinks?.facebook && <a href={store.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><Facebook size={18}/> Facebook</a>}
            {store.socialLinks?.instagram && <a href={store.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-pink-600 hover:underline"><Instagram size={18}/> Instagram</a>}
            {store.socialLinks?.tiktok && <a href={store.socialLinks.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-dark hover:underline"><Globe size={18}/> TikTok</a>}
          </div>
        </div>
        
        <div className="flex md:flex-col gap-4 bg-gray-50 p-4 rounded-2xl flex-shrink-0">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand">{stats.delivered}</p>
            <p className="text-xs text-gray-500 font-semibold uppercase">Delivered</p>
          </div>
          <div className="w-px h-full bg-gray-200 md:w-full md:h-px hidden md:block"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-alert">{stats.cancelled}</p>
            <p className="text-xs text-gray-500 font-semibold uppercase">Cancelled</p>
            
          </div>
          {/* REPORT BUTTON */}
<div className="w-full text-center mt-6">
  <button onClick={() => setIsReportModalOpen(true)} className="text-gray-400 hover:text-alert text-xs font-semibold underline">
    Report this Store
  </button>
</div>

<ReportModal 
  isOpen={isReportModalOpen} 
  onClose={() => setIsReportModalOpen(false)} 
  targetId={id || ''} 
  targetType="store" 
  targetName={store.storeName} 
/>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
        <ShieldCheck className="text-brand" /> Products from {store.storeName}
      </h2>
      
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
