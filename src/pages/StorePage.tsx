import { useState, useEffect } from 'react';
import { useParams, } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import { Store, MapPin, Calendar, Truck, ShieldCheck, Facebook, Instagram, MessageCircle, Wallet, Banknote, Sparkles, AlertCircle } from 'lucide-react';

export default function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!id) return;
      try {
        // Fetch Store
        const storeDoc = await getDoc(doc(db, 'sellers', id));
        if (storeDoc.exists()) {
          setStore({ id: storeDoc.id, ...storeDoc.data() });
        }

        // Fetch Products
        const prodQ = query(collection(db, 'products'), where('sellerId', '==', id));
        const prodSnap = await getDocs(prodQ);
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Orders (for stats)
        const orderQ = query(collection(db, 'orders'), where('sellerId', '==', id));
        const orderSnap = await getDocs(orderQ);
        setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-brand font-bold">Loading store...</div>;
  if (!store) return <div className="p-12 text-center text-alert font-bold">Store not found.</div>;

  // Calculate Stats
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length;
  const returnedCount = orders.filter(o => o.status === 'returned').length;

  // Check if store has any customizable products
  const hasCustomizableProducts = products.some(p => p.isCustomizable);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      
      {/* STORE HEADER BANNER */}
      <div className="relative mb-8 rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-white">
        
        {/* Green Gradient Banner with Watermark */}
        <div className="h-40 md:h-56 bg-gradient-to-r from-brand to-green-700 relative overflow-hidden flex items-center justify-end px-4 md:px-12">
          
          {/* Decorative Background Shapes */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

          {/* Watermark Text (Visible on all screens now) */}
          <div className="text-right z-10 block opacity-40 md:opacity-100">
            <div className="flex items-center justify-end gap-2 md:gap-3 mb-1">
              <Store className="text-white hidden md:block" size={40} />
              <h1 className="text-2xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                Khpal Kor, <br className="hidden md:block"/>
                <span className="text-white/90">Khpal Bazar.</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Store Details Area */}
        <div className="px-6 md:px-10 pb-6 relative flex flex-col md:block items-center text-center md:text-left">
          
          {/* Profile Avatar overlapping the banner (Centered on mobile) */}
          <div className="absolute -top-12 md:-top-16 left-1/2 md:left-10 transform -translate-x-1/2 md:translate-x-0">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl p-1 shadow-lg">
              <div className="w-full h-full bg-green-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.storeName} className="w-full h-full object-cover" />
                ) : (
                  <Store size={48} className="text-brand" />
                )}
              </div>
            </div>
          </div>

          {/* Name and Action buttons */}
          <div className="pt-16 md:pt-20 flex flex-col md:flex-row justify-between items-center md:items-end gap-4 w-full">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 md:gap-3 mb-1">
                <h2 className="text-2xl md:text-3xl font-extrabold text-dark">{store.storeName}</h2>
                {store.plan === 'premium' && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-md border border-yellow-200">
                    PREMIUM SELLER
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-xs md:text-sm text-gray-500 font-medium mt-2">
                <span className="flex items-center gap-1"><MapPin size={16} /> {store.city || 'Pakistan'}, {store.area}</span>
                <span className="flex items-center gap-1"><Calendar size={16} /> Member since {new Date(store.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Report Store Button (Red) */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert("Report feature coming soon!")} 
                className="text-alert font-bold text-sm hover:underline flex items-center gap-1 transition-colors bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
              >
                <AlertCircle size={16} /> Report Store
              </button>
            </div>
          </div>

          <hr className="my-6 border-gray-100" />

          {/* Bio, Payment Methods, Stats, and Socials */}
          <div className="flex flex-col md:flex-row justify-between gap-6 w-full text-center md:text-left">
            
            {/* Left Side: Bio, Badges, and Socials */}
            <div className="flex-grow max-w-2xl">
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                {store.bio || "This seller hasn't added a bio yet."}
              </p>

              {/* BADGES SECTION (Delivery, Customization, Payments) */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
                {/* Nationwide Delivery */}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-brand text-xs font-bold rounded-lg border border-green-100">
                  <Truck size={14} /> Nationwide Delivery
                </span>

                {/* Customizable Items */}
                {hasCustomizableProducts && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                    <Sparkles size={14} /> Customization Available
                  </span>
                )}

                {/* Payment Methods */}
                {store.acceptsCod !== false && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200">
                    <Banknote size={14} /> Cash on Delivery
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200">
                  <Wallet size={14} /> JazzCash / Easypaisa
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200">
                  <Wallet size={14} /> Bank Transfer
                </span>
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center md:justify-start gap-3">
                {store.socialLinks?.facebook && (
                  <a href={store.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    <Facebook size={18} />
                  </a>
                )}
                {store.socialLinks?.instagram && (
                  <a href={store.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors">
                    <Instagram size={18} />
                  </a>
                )}
                {store.whatsappNumber && (
                  <a href={`https://wa.me/92${store.whatsappNumber.replace(/^0/, '')}`} target="_blank" rel="noreferrer" className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                    <MessageCircle size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Right Side: Small Stats Boxes */}
            <div className="flex items-center justify-center md:justify-end gap-2 md:gap-3 shrink-0 mt-4 md:mt-0">
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-center min-w-[80px]">
                <p className="text-xl font-extrabold text-dark">{deliveredCount}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Delivered</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-center min-w-[80px]">
                <p className="text-xl font-extrabold text-orange-600">{returnedCount}</p>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Returned</p>
              </div>
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center min-w-[80px]">
                <p className="text-xl font-extrabold text-alert">{cancelledCount}</p>
                <p className="text-[10px] font-bold text-alert uppercase tracking-wider">Cancelled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6 px-2 md:px-0">
          <h2 className="text-xl md:text-2xl font-bold text-dark flex items-center gap-2">
            <ShieldCheck className="text-brand" /> Products from {store.storeName}
          </h2>
          <span className="text-xs md:text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
            {products.length} items
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">This store hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} isSellerPremium={store.plan === 'premium'} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
            }
