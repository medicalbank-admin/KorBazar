import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import { CheckCircle2, MapPin, Facebook, Instagram, Globe, ShieldCheck, ShieldAlert, Crown, Calendar, Truck } from 'lucide-react';
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

  // Format creation date safely
  const memberSince = store.createdAt 
    ? new Date(store.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      
      {/* BEAUTIFUL STORE HEADER */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        
        {/* Cover Banner (Gradient) */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-brand/80 to-green-700 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </div>

        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 mb-6">
            
            {/* Avatar */}
            <div className="w-32 h-32 bg-white rounded-full p-1 shadow-lg flex-shrink-0 z-10">
              <div className="w-full h-full bg-brand/10 rounded-full flex items-center justify-center text-brand font-black text-5xl">
                {store.storeName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Store Name & Badges */}
            <div className="flex-grow text-center md:text-left z-10">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-dark tracking-tight">{store.storeName}</h1>
                
                {store.plan === 'premium' ? (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-300 shadow-sm">
                    <Crown size={14} className="fill-yellow-500 text-yellow-500" /> Premium Seller
                  </span>
                ) : store.status === 'approved' ? (
                  <span className="bg-green-50 text-brand px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-green-200 shadow-sm">
                    <CheckCircle2 size={14} /> Verified
                  </span>
                ) : null}
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1"><MapPin size={16}/> {store.area}, {store.city}</span>
                <span className="flex items-center gap-1"><Calendar size={16}/> Member since {memberSince}</span>
                <span className="flex items-center gap-1 text-brand"><Truck size={16}/> Nationwide Delivery</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="z-10 md:self-end mt-4 md:mt-0">
               <button onClick={() => setIsReportModalOpen(true)} className="text-gray-400 hover:text-alert text-xs font-semibold underline bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                 Report Store
               </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 border-t border-gray-100 pt-6">
            {/* Bio & Socials */}
            <div className="flex-grow">
              <p className="text-gray-600 leading-relaxed mb-6 max-w-3xl">
                {store.bio || "Welcome to my store! Discover unique handmade products crafted with love."}
              </p>
              
              <div className="flex flex-wrap gap-3">
                {store.socialLinks?.facebook && (
                  <a href={store.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors text-sm font-semibold">
                    <Facebook size={16}/> Facebook
                  </a>
                )}
                {store.socialLinks?.instagram && (
                  <a href={store.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-pink-50 text-pink-600 px-4 py-2 rounded-xl hover:bg-pink-100 transition-colors text-sm font-semibold">
                    <Instagram size={16}/> Instagram
                  </a>
                )}
                {store.socialLinks?.tiktok && (
                  <a href={store.socialLinks.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-100 text-dark px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm font-semibold">
                    <Globe size={16}/> TikTok
                  </a>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4 shrink-0">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center min-w-[100px] shadow-sm">
                <p className="text-3xl font-black text-brand">{stats.delivered}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Delivered</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center min-w-[100px] shadow-sm">
                <p className="text-3xl font-black text-alert">{stats.cancelled}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Cancelled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
          <ShieldCheck className="text-brand" /> Products from {store.storeName}
        </h2>
        <span className="text-sm font-semibold text-gray-500">{products.length} items available</span>
      </div>
      
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 text-lg">This store hasn't added any products yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} isSellerPremium={store.plan === 'premium'} />
          ))}
        </div>
      )}

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        targetId={id || ''} 
        targetType="store" 
        targetName={store.storeName} 
      />
    </div>
  );
}
