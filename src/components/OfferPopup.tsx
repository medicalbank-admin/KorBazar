import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Sparkles } from 'lucide-react';

export default function OfferPopup() {
  const [show, setShow] = useState(false);
  const [dealProduct, setDealProduct] = useState<any>(null);

  useEffect(() => {
    // 1. Set timer to show popup after 3 seconds
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('popup_dismissed')) {
        setShow(true);
      }
    }, 3000);

    // 2. Fetch products ONLY from Premium Sellers and pick one randomly
    const fetchRandomPremiumDeal = async () => {
      try {
        // Step A: Get all approved & premium sellers
        const sellersSnap = await getDocs(collection(db, 'sellers'));
        const premiumSellerIds = sellersSnap.docs
          .filter(d => {
            const data = d.data();
            return data.status === 'approved' && data.plan === 'premium' && !data.isFrozen;
          })
          .map(d => d.id);

        if (premiumSellerIds.length === 0) return; // No premium sellers, don't show popup

        // Step B: Get all products
        const prodSnap = await getDocs(collection(db, 'products'));
        const allProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        // Step C: Filter products that belong to premium sellers
        const premiumProducts = allProducts.filter(p => premiumSellerIds.includes(p.sellerId));

        if (premiumProducts.length > 0) {
          // Step D: Pick a random product from the premium list
          const randomIndex = Math.floor(Math.random() * premiumProducts.length);
          setDealProduct(premiumProducts[randomIndex]);
        }
      } catch (error) {
        console.error("Error fetching premium deal:", error);
      }
    };

    fetchRandomPremiumDeal();
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem('popup_dismissed', 'true');
  };

  // Don't show if hidden or no premium products found
  if (!show || !dealProduct) return null;

  // Calculate discount if it exists
  const discount = Number(dealProduct.discountPercent) || 0;
  const originalPrice = Number(dealProduct.price);
  const finalPrice = discount > 0 ? Math.round(originalPrice - (originalPrice * (discount / 100))) : originalPrice;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={handleClose} 
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-md p-1.5 rounded-full text-gray-600 hover:text-dark shadow-sm z-10"
        >
          <X size={20} />
        </button>

        {/* TOP BANNER */}
        <div className="bg-[#f85606] text-white text-center py-2 font-bold tracking-wider text-sm flex items-center justify-center gap-2">
          <Sparkles size={16} /> PREMIUM SELLER PICK
        </div>

        {/* PRODUCT IMAGE */}
        <div className="w-full aspect-square bg-gray-50 relative">
          <img src={dealProduct.image} alt={dealProduct.title} className="w-full h-full object-cover" />
          {discount > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white font-bold px-3 py-1 rounded-full shadow-lg">
              -{discount}% OFF
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-5 text-center">
          <h3 className="font-bold text-lg text-dark mb-1 line-clamp-1">{dealProduct.title}</h3>
          <p className="text-sm text-gray-500 mb-4">{dealProduct.storeName}</p>
          
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="text-2xl font-extrabold text-[#f85606]">
              Rs. {finalPrice}
            </span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through">Rs. {originalPrice}</span>
            )}
          </div>

          <Link 
            to={`/product/${dealProduct.id}`} 
            onClick={handleClose}
            className="w-full block bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 transition-colors shadow-md mb-3"
          >
            View Product
          </Link>

          {/* NEW ARRIVALS LINK */}
          <Link 
            to="/explore" 
            onClick={handleClose}
            className="text-sm text-gray-500 font-semibold hover:text-brand transition-colors underline"
          >
            See All New Arrivals
          </Link>
        </div>

      </div>
    </div>
  );
      }
