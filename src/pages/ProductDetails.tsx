import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  CheckCircle2, ChevronLeft, MessageCircle, MessageSquare, ShoppingCart, 
  Truck, Star, Zap, Sparkles, ShieldCheck, HelpCircle, Store, Home, 
  MoreVertical, Share2, Heart, ChevronRight 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const { addToHistory } = useHistory();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [cartMsg, setCartMsg] = useState('');

  // State for selected variant
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  
  // Customization State
  const [customizationNote, setCustomizationNote] = useState<string>('');

  // UI Tabs State (Daraz-style)
  const [activeTab, setActiveTab] = useState<'overview' | 'ratings' | 'details'>('overview');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const prodData = { id: docSnap.id, ...docSnap.data() } as any;
        setProduct(prodData);
        
        addToHistory(prodData);

        const sellerRef = doc(db, 'sellers', prodData.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) setSeller(sellerSnap.data());

        const revQ = query(collection(db, 'reviews'), where('sellerId', '==', prodData.sellerId));
        const revSnap = await getDocs(revQ);
        const productReviews = revSnap.docs
          .map(d => d.data())
          .filter((r: any) => r.productIds.includes(prodData.id));
        
        productReviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(productReviews);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id, addToHistory]);

  if (loading) return <div className="p-12 text-center text-dark">Loading product...</div>;
  if (!product) return <div className="p-12 text-center text-dark">Product not found.</div>;

  const images = product.images?.length > 0 ? product.images : [product.image];
  
  const hasVariants = product.variants && product.variants.length > 0;
  
  const totalVariantStock = hasVariants 
    ? product.variants.reduce((sum: number, v: any) => sum + Number(v.qty), 0) 
    : Number(product.stock) || 0;
    
  const isOutOfStock = hasVariants ? totalVariantStock <= 0 : (product.stock !== undefined && Number(product.stock) <= 0);

  const whatsappMessage = `Assalam-o-Alaikum, I have a question about "${product.title}" (Rs. ${product.price}) on KorBazar.`;
  const cleanNumber = seller?.whatsappNumber?.replace(/^0/, '');
  const whatsappLink = `https://wa.me/92${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const validateVariantAndGetItem = () => {
    if (hasVariants) {
      if (product.variants.some((v: any) => v.size) && !selectedSize) {
        alert("Please select a size.");
        return null;
      }
      if (product.variants.some((v: any) => v.color) && !selectedColor) {
        alert("Please select a color.");
        return null;
      }

      const matchedVariant = product.variants.find((v: any) => 
        (v.size || '') === selectedSize && (v.color || '') === selectedColor
      );

      if (!matchedVariant || matchedVariant.qty <= 0) {
        alert("This specific size/color combination is out of stock.");
        return null;
      }
    }

    if (product.isCustomizable && !customizationNote.trim()) {
      alert("Please fill in the personalization details before adding to cart.");
      return null;
    }

    return {
      productId: product.id,
      title: product.title,
      price: product.price,
      image: images[0],
      sellerId: product.sellerId,
      storeName: product.storeName,
      deliveryFee: product.deliveryFee || 0,
      selectedSize,
      selectedColor,
      customizationNote: product.isCustomizable ? customizationNote.trim() : null
    } as any;
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const item = validateVariantAndGetItem();
    if (!item) return;
    addToCart(item);
    setCartMsg('Added to cart successfully!');
    setTimeout(() => setCartMsg(''), 3000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    const item = validateVariantAndGetItem();
    if (!item) return;
    addToCart(item);
    navigate('/checkout');
  };

  const handleChatWithSeller = async () => {
    if (!currentUser) {
      alert("Please login to chat with the seller.");
      navigate('/login');
      return;
    }
    if (currentUser.uid === product.sellerId) {
      alert("You cannot chat with your own store.");
      return;
    }
    const chatId = [currentUser.uid, product.sellerId].sort().join('_');
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.uid, product.sellerId],
          lastMessage: "Started a new conversation",
          updatedAt: serverTimestamp(),
          unreadCount: { [currentUser.uid]: 0, [product.sellerId]: 0 }
        });
      }
      navigate(`/chat/${chatId}`);
    } catch (error) {
      alert("Failed to start chat.");
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  const uniqueSizes = hasVariants ? [...new Set(product.variants.filter((v:any) => v.size).map((v:any) => v.size))] : [];
  const uniqueColors = hasVariants ? [...new Set(product.variants.filter((v:any) => v.color).map((v:any) => v.color))] : [];

  // Calculate original price if there's a discount
  const discountPercent = Number(product.discountPercent) || 0;
  const originalPrice = discountPercent > 0 ? Math.round(product.price / (1 - (discountPercent / 100))) : null;

  return (
    <div className="max-w-3xl mx-auto bg-gray-100 min-h-screen pb-24 md:pb-8 relative">
      
      {/* FLOATING TOP BAR (Mobile Only) */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50 md:hidden">
        <button onClick={() => navigate(-1)} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white">
          <Home size={20} />
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate('/cart')} className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white">
            <ShoppingCart size={20} />
          </button>
          <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* MAIN IMAGE GALLERY */}
      <div className="w-full aspect-square bg-white relative">
        <img 
          src={images[activeImage]} 
          alt={product.title} 
          className={`w-full h-full object-contain ${isOutOfStock ? 'opacity-50' : ''}`} 
        />
        
        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
          {activeImage + 1} / {images.length}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
            <span className="bg-alert text-white font-bold px-6 py-3 rounded-xl shadow-lg text-lg rotate-[-10deg]">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* PRICE & TITLE SECTION */}
      <div className="bg-white p-4 mb-2">
        {discountPercent > 0 && (
          <p className="text-pink-600 text-sm font-semibold mb-1">Rs. {originalPrice! - product.price} off with Promo</p>
        )}
        
        <div className="flex items-end gap-3 mb-2">
          <h1 className="text-2xl font-bold text-[#f85606]">Rs. {product.price}</h1>
          {originalPrice && (
            <>
              <span className="text-gray-400 line-through text-sm mb-1">Rs. {originalPrice}</span>
              <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-0.5 rounded border border-pink-200 mb-1">
                -{discountPercent}%
              </span>
            </>
          )}
          <div className="ml-auto flex gap-3 text-gray-500">
            <Share2 size={20} />
            <Heart size={20} />
          </div>
        </div>
        
        <h2 className="text-lg text-gray-800 leading-tight mb-2">{product.title}</h2>
        
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-400">
            {[1,2,3,4,5].map(star => (
              <Star key={star} size={14} className={star <= Math.round(Number(averageRating)) ? "fill-yellow-400" : "text-gray-300"} />
            ))}
          </div>
          <span className="text-sm text-gray-600">{averageRating} ({reviews.length})</span>
        </div>
      </div>

      {/* VARIANTS (SIZE / COLOR) */}
      {(hasVariants || product.isCustomizable) && (
        <div className="bg-white p-4 mb-2">
          
          {uniqueSizes.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">Product Options <span className="text-gray-800 ml-1">Size: {selectedSize || 'Select'}</span></p>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size: any) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-1.5 rounded border text-sm ${selectedSize === size ? 'border-[#f85606] text-[#f85606] bg-orange-50' : 'border-gray-200 text-gray-700'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {uniqueColors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Color: <span className="text-gray-800">{selectedColor || 'Select'}</span></p>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color: any) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-1.5 rounded border text-sm ${selectedColor === color ? 'border-[#f85606] text-[#f85606] bg-orange-50' : 'border-gray-200 text-gray-700'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.isCustomizable && (
            <div className="mt-2 bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <label className="block text-sm font-bold text-blue-900 mb-1 flex items-center gap-1">
                <Sparkles size={14} className="text-brand" /> Personalization Required
              </label>
              <textarea
                required
                value={customizationNote}
                onChange={(e) => setCustomizationNote(e.target.value)}
                placeholder="Enter your personalization details here..."
                rows={2}
                className="w-full px-3 py-2 rounded border border-blue-200 focus:border-brand focus:outline-none bg-white text-sm"
              />
            </div>
          )}

          {/* THUMBNAIL GALLERY */}
          <div className="flex gap-2 overflow-x-auto mt-4 scrollbar-hide">
            {images.map((img: string, i: number) => (
              <button 
                key={i} 
                onClick={() => setActiveImage(i)} 
                className={`w-14 h-14 flex-shrink-0 rounded border-2 overflow-hidden ${activeImage === i ? 'border-[#f85606]' : 'border-transparent'}`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STICKY TABS */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 flex overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-semibold whitespace-nowrap px-4 ${activeTab === 'overview' ? 'text-[#f85606] border-b-2 border-[#f85606]' : 'text-gray-600'}`}>Overview</button>
        <button onClick={() => setActiveTab('ratings')} className={`flex-1 py-3 text-sm font-semibold whitespace-nowrap px-4 ${activeTab === 'ratings' ? 'text-[#f85606] border-b-2 border-[#f85606]' : 'text-gray-600'}`}>Ratings</button>
        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-semibold whitespace-nowrap px-4 ${activeTab === 'details' ? 'text-[#f85606] border-b-2 border-[#f85606]' : 'text-gray-600'}`}>Product details</button>
      </div>

      {/* TAB CONTENT */}
      <div className="bg-white mb-2 p-4">
        
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* SPECIFICATIONS */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-gray-500 text-sm">Specifications</span>
              <span className="text-gray-800 text-sm font-semibold text-right">Brand, Occasion, Pattern</span>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            
            {/* DELIVERY */}
            <div className="flex items-start gap-4 border-b border-gray-100 pb-3">
              <span className="text-gray-500 text-sm mt-1 w-16">Delivery</span>
              <div className="flex-grow">
                <p className="text-[#f85606] text-sm mb-1 flex items-center gap-1">
                  {seller?.city || 'Pakistan'}, {seller?.area || ''}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-800">Standard Delivery</span>
                  <span className="font-bold">Rs. {product.deliveryFee || 0}</span>
                </div>
              </div>
            </div>

            {/* SERVICE */}
            <div className="flex items-start gap-4">
              <span className="text-gray-500 text-sm mt-1 w-16">Service</span>
              <div className="flex-grow space-y-1">
                <p className="text-sm text-gray-800 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> 14 days easy return</p>
                <p className="text-xs text-gray-500 ml-3.5">Change of Mind applicable</p>
                <p className="text-sm text-gray-800 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Warranty not available</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Ratings and Reviews ({reviews.length})</h3>
              <span className="text-[#f85606] text-sm font-semibold hover:underline cursor-pointer">View All</span>
            </div>
            
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 3).map((rev, i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-700 text-sm">{rev.buyerName}</span>
                      <span className="text-xs text-gray-400 ml-auto">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex mb-2">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={12} className={star <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                    <p className="text-gray-800 text-sm">{rev.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Product Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{product.description || "No description provided."}</p>
          </div>
        )}
      </div>

      {/* QUESTIONS SECTION */}
      <div className="bg-white mb-2 p-4 text-center">
        <h3 className="font-bold text-gray-800 mb-4 text-left">Questions about this product (0)</h3>
        <div className="py-4 border-b border-gray-100">
          <p className="text-gray-500 text-sm mb-4">There are no questions yet.<br/>ask the seller now and their answer will show here.</p>
        </div>
        <button onClick={handleChatWithSeller} className="text-[#f85606] font-bold text-sm hover:underline mt-4">ASK QUESTIONS</button>
      </div>

      {/* SELLER INFO */}
      <div className="bg-white p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded flex items-center justify-center font-bold text-xs">
              {product.storeName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{product.storeName}</p>
            </div>
          </div>
          <button className="border border-[#f85606] text-[#f85606] px-4 py-1.5 rounded text-sm font-semibold hover:bg-orange-50 transition-colors">Follow</button>
        </div>
        
        <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
          <div>
            <p className="font-bold text-xl text-gray-800">95%</p>
            <p className="text-xs text-gray-500">Positive Seller Ratings</p>
          </div>
          <div>
            <p className="font-bold text-xl text-gray-800">100%</p>
            <p className="text-xs text-gray-500">Ship on Time</p>
          </div>
          <div>
            <p className="font-bold text-xl text-gray-400">--</p>
            <p className="text-xs text-gray-400">Chat Response Rate</p>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-stretch z-50 md:hidden pb-safe">
        <button onClick={() => navigate(`/store/${product.sellerId}`)} className="flex flex-col items-center justify-center w-[60px] text-gray-600 shrink-0">
          <Store size={20} />
          <span className="text-[10px] mt-1">Store</span>
        </button>
        <button onClick={handleChatWithSeller} className="flex flex-col items-center justify-center w-[60px] text-gray-600 shrink-0 border-l border-gray-100">
          <MessageSquare size={20} />
          <span className="text-[10px] mt-1">Chat</span>
        </button>
        
        <div className="flex flex-1">
          <button 
            onClick={handleBuyNow} 
            disabled={isOutOfStock}
            className={`flex-1 font-semibold text-sm text-white flex items-center justify-center ${isOutOfStock ? 'bg-gray-300' : 'bg-[#42b0d5] hover:bg-[#369bbd]'}`}
          >
            Buy Now
          </button>
          <button 
            onClick={handleAddToCart} 
            disabled={isOutOfStock}
            className={`flex-1 font-semibold text-sm text-white flex items-center justify-center ${isOutOfStock ? 'bg-gray-300' : 'bg-[#f85606] hover:bg-[#d94a05]'}`}
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* DESKTOP ACTION BUTTONS */}
      <div className="hidden md:flex gap-4 w-full p-4 max-w-3xl mx-auto">
        <button onClick={handleAddToCart} disabled={isOutOfStock} className={`flex-1 font-bold text-lg py-3 rounded flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-[#f85606] text-white hover:bg-[#d94a05]'}`}>
          <ShoppingCart size={20} /> Add to Cart
        </button>
        <button onClick={handleBuyNow} disabled={isOutOfStock} className={`flex-1 font-bold text-lg py-3 rounded flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-300 text-gray-500' : 'bg-[#42b0d5] text-white hover:bg-[#369bbd]'}`}>
          <Zap size={20} /> Buy Now
        </button>
      </div>

    </div>
  );
}
