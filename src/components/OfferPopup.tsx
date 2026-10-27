import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { X, Sparkles, MessageCircle } from 'lucide-react';

export default function OfferPopup() {
  const [show, setShow] = useState(false);
  const [dealProduct, setDealProduct] = useState<any>(null);
  
  // NEW: State to handle the second popup
  const [showChatNotice, setShowChatNotice] = useState(false);

  useEffect(() => {
    // 1. Set timer to show offer popup after 3 seconds
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('popup_dismissed')) {
        setShow(true);
      }
    }, 3000);

    // 2. Fetch products ONLY from Premium Sellers and pick one randomly
    const fetchRandomPremiumDeal = async () => {
      try {
        const sellersSnap = await getDocs(collection(db, 'sellers'));
        const premiumSellerIds = sellersSnap.docs
          .filter(d => {
            const data = d.data();
            return data.status === 'approved' && data.plan === 'premium' && !data.isFrozen;
          })
          .map(d => d.id);

        if (premiumSellerIds.length === 0) return;

        const prodSnap = await getDocs(collection(db, 'products'));
        const allProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        const premiumProducts = allProducts.filter(p => premiumSellerIds.includes(p.sellerId));

        if (premiumProducts.length > 0) {
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

  // Handle closing the Offer popup
  const handleCloseOffer = () => {
    setShow(false);
    sessionStorage.setItem('popup_dismissed', 'true');
    
    // NEW: Trigger the Chat Notice popup 5 seconds AFTER the offer is closed
    if (!sessionStorage.getItem('chat_notice_shown')) {
      setTimeout(() => {
        setShowChatNotice(true);
        sessionStorage.setItem('chat_notice_shown', 'true');
      }, 5000);
    }
  };

  const handleCloseChatNotice = () => {
    setShowChatNotice(false);
  };

  // Calculate discount
  const discount = Number(dealProduct?.discountPercent) || 0;
  const originalPrice = Number(dealProduct?.price);
  const finalPrice = discount > 0 ? Math.round(originalPrice - (originalPrice * (discount / 100))) : originalPrice;

  return (
    <>
      {/* --- POPUP 1: PREMIUM OFFER --- */}
      {show && dealProduct && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={handleCloseOffer} 
              className="absolute top-3 right-3 bg-white/80 backdrop-blur-md p-1.5 rounded-full text-gray-600 hover:text-dark shadow-sm z-10"
            >
              <X size={20} />
            </button>

            <div className="bg-[#f85606] text-white text-center py-2 font-bold tracking-wider text-sm flex items-center justify-center gap-2">
              <Sparkles size={16} /> PREMIUM SELLER PICK
            </div>

            <div className="w-full aspect-square bg-gray-50 relative">
              <img src={dealProduct.image} alt={dealProduct.title} className="w-full h-full object-cover" />
              {discount > 0 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white font-bold px-3 py-1 rounded-full shadow-lg">
                  -{discount}% OFF
                </div>
              )}
            </div>

            <div className="p-5 text-center">
              <h3 className="font-bold text-lg text-dark mb-1 line-clamp-1">{dealProduct.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{dealProduct.storeName}</p>
              
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="text-2xl font-extrabold text-[#f85606]">Rs. {finalPrice}</span>
                {discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">Rs. {originalPrice}</span>
                )}
              </div>

              <Link 
                to={`/product/${dealProduct.id}`} 
                onClick={handleCloseOffer}
                className="w-full block bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 transition-colors shadow-md mb-3"
              >
                View Product
              </Link>

              <Link 
                to="/explore" 
                onClick={handleCloseOffer}
                className="text-sm text-gray-500 font-semibold hover:text-brand transition-colors underline"
              >
                See All New Arrivals
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP 2: FRIENDLY CHAT NOTICE --- */}
      {showChatNotice && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-300 p-6 text-center">
            <button 
              onClick={handleCloseChatNotice} 
              className="absolute top-3 right-3 bg-gray-100 p-1.5 rounded-full text-gray-600 hover:text-dark shadow-sm transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} />
            </div>

            <h2 className="text-xl font-bold text-dark mb-2">Let's Chat Safely! 💬</h2>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Assalam-o-Alaikum! To ensure a smooth and safe shopping experience, we highly recommend using the <strong>in-app Chat feature</strong> for all communications with the seller.
            </p>
            
            <div className="text-left bg-gray-50 p-4 rounded-xl text-sm text-gray-700 mb-6 space-y-3 border border-gray-100">
              <p className="font-semibold text-dark mb-1">Why use In-App Chat?</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-brand">
                <li><strong>Privacy:</strong> Keeps your personal phone number safe and hidden.</li>
                <li><strong>Payment Disputes:</strong> If any issue arises with the payment or order, our support team can review the chat history and step in to help resolve it.</li>
                <li><strong>No Spam:</strong> Avoid unwanted calls or messages outside the platform.</li>
              </ul>
            </div>

            <button 
              onClick={handleCloseChatNotice}
              className="w-full bg-dark text-white font-bold py-3 rounded-xl hover:bg-black transition-colors shadow-md"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
          }
