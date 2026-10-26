import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Star, ShoppingCart, Sparkles, Home, MoreVertical, Share2, Heart, 
  ChevronRight, Store, MessageSquare, Zap, MessageCircle, ShieldCheck, X, MapPin, Ruler
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
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [customizationNote, setCustomizationNote] = useState<string>('');
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'ratings' | 'details'>('overview');
  const [showSpecsModal, setShowSpecsModal] = useState(false);

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
  const totalVariantStock = hasVariants ? product.variants.reduce((sum: number, v: any) => sum + Number(v.qty), 0) : Number(product.stock) || 0;
  const isOutOfStock = hasVariants ? totalVariantStock <= 0 : (product.stock !== undefined && Number(product.stock) <= 0);

  const whatsappMessage = `Assalam-o-Alaikum, I have a question about "${product.title}" on KorBazar.`;
  const cleanNumber = seller?.whatsappNumber?.replace(/^0/, '');
  const whatsappLink = `https://wa.me/92${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const validateVariantAndGetItem = () => {
    if (hasVariants) {
      if (product.variants.some((v: any) => v.size) && !selectedSize) { alert("Please select a size."); return null; }
      if (product.variants.some((v: any) => v.color) && !selectedColor) { alert("Please select a color."); return null; }
      const matchedVariant = product.variants.find((v: any) => (v.size || '') === selectedSize && (v.color || '') === selectedColor);
      if (!matchedVariant || matchedVariant.qty <= 0) { alert("This combination is out of stock."); return null; }
    }
    if (product.isCustomizable && !customizationNote.trim()) { alert("Please fill in the personalization details."); return null; }

    return {
      productId: product.id, title: product.title, price: product.price, image: images[0],
      sellerId: product.sellerId, storeName: product.storeName, deliveryFee: product.deliveryFee || 0,
      selectedSize, selectedColor, customizationNote: product.isCustomizable ? customizationNote.trim() : null
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
    if (!currentUser) { alert("Please login to chat."); navigate('/login'); return; }
    if (currentUser.uid === product.sellerId) { alert("You cannot chat with your own store."); return; }
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
    } catch (error) { alert("Failed to start chat."); }
  };

  const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const uniqueSizes = hasVariants ? [...new Set(product.variants.filter((v:any) => v.size).map((v:any) => v.size))] : [];
  const uniqueColors = hasVariants ? [...new Set(product.variants.filter((v:any) => v.color).map((v:any) => v.color))] : [];
  
  const discountPercent = Number(product.discountPercent) || 0;
  const originalPrice = discountPercent > 0 ? Math.round(product.price / (1 - (discountPercent / 100))) : null;
  const highlightsArray = product.highlights ? product.highlights.split('\n').filter((h: string) => h.trim() !== '') : [];

  return (
    <div className="max-w-3xl mx-auto bg-gray-100 min-h-screen pb-24 md:pb-8 relative">
      
      {/* FLOATING TOP BAR */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50 md:hidden">
        <button onClick={() => navigate(-1)} className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-700"><Home size={20} /></button>
        <div className="flex gap-2">
          <button onClick={() => navigate('/cart')} className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-700"><ShoppingCart size={20} /></button>
          <button className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-700"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* MAIN IMAGE GALLERY */}
      <div className="w-full aspect-square bg-white relative">
        <img src={images[activeImage]} alt={product.title} className={`w-full h-full object-contain ${isOutOfStock ? 'opacity-50' : ''}`} />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">{activeImage + 1} / {images.length}</div>
      </div>

      {/* PRICE & TITLE SECTION */}
      <div className="bg-white p-4 mb-2">
        {discountPercent > 0 && <p className="text-pink-600 text-sm font-semibold mb-1">Rs. {originalPrice! - product.price} off with Promo</p>}
        
        <div className="flex items-end gap-3 mb-2">
          <h1 className="text-3xl font-bold text-[#f85606]">Rs. {product.price}</h1>
          {originalPrice && (
            <>
              <span className="text-gray-400 line-through text-base mb-0.5">Rs. {originalPrice}</span>
              <span className="bg-pink-100 text-pink-600 text-sm font-bold px-2 py-0.5 rounded border border-pink-200 mb-0.5">-{discountPercent}%</span>
            </>
          )}
          <div className="ml-auto flex gap-4 text-gray-400 mb-1"><Heart size={22} /><Share2 size={22} /></div>
        </div>
        
        <h2 className="text-lg text-gray-800 leading-tight mb-2">{product.title}</h2>
        
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-400">
            {[1,2,3,4,5].map(star => <Star key={star} size={16} className={star <= Math.round(Number(averageRating)) ? "fill-yellow-400" : "text-gray-300"} />)}
          </div>
          <span className="text-sm text-gray-600">{averageRating} ({reviews.length})</span>
        </div>
      </div>

      {/* VARIANTS & THUMBNAILS */}
      {(hasVariants || product.isCustomizable) && (
        <div className="bg-white p-4 mb-2">
          {uniqueSizes.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">Product Options <span className="text-gray-800 ml-1">Size: {selectedSize || 'Select'}</span></p>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
              <p className="text-[#f85606] text-xs font-semibold mb-2 flex items-center gap-1"><Ruler size={14}/> Size Guide</p>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size: any) => (
                  <button key={size} onClick={() => setSelectedSize(size)} className={`px-4 py-1.5 rounded border text-sm ${selectedSize === size ? 'border-[#f85606] text-[#f85606] bg-orange-50' : 'border-gray-200 text-gray-700'}`}>{size}</button>
                ))}
              </div>
            </div>
          )}
          {uniqueColors.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Color: <span className="text-gray-800">{selectedColor || 'Select'}</span></p>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color: any) => (
                  <button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-1.5 rounded border text-sm ${selectedColor === color ? 'border-[#f85606] text-[#f85606] bg-orange-50' : 'border-gray-200 text-gray-700'}`}>{color}</button>
                ))}
              </div>
            </div>
          )}
          {product.isCustomizable && (
            <div className="mt-2 bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4">
              <label className="block text-sm font-bold text-blue-900 mb-1 flex items-center gap-1"><Sparkles size={14} className="text-brand" /> Personalization Required</label>
              <textarea required value={customizationNote} onChange={(e) => setCustomizationNote(e.target.value)} placeholder="Enter your personalization details here..." rows={2} className="w-full px-3 py-2 rounded border border-blue-200 focus:border-brand focus:outline-none bg-white text-sm" />
            </div>
          )}
          
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {images.map((img: string, i: number) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden ${activeImage === i ? 'border-[#f85606]' : 'border-transparent'}`}><img src={img} className="w-full h-full object-cover" /></button>
            ))}
            {images.length > 5 && (
               <div className="w-16 h-16 flex-shrink-0 rounded border border-gray-200 bg-gray-800 text-white flex items-center justify-center font-bold text-sm">+{images.length - 5}</div>
            )}
          </div>
        </div>
      )}

      {/* QUICK INFO ROWS (Above Tabs) */}
      <div className="bg-white mb-2">
        {/* Specifications */}
        <div 
          onClick={() => setShowSpecsModal(true)}
          className="flex items-center justify-between p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-500 text-sm w-24">Specificatio...</span>
          <span className="text-gray-800 text-sm flex-grow truncate pr-4">
            {[product.brand, product.occasion, product.pattern, product.material].filter(Boolean).join(', ') || 'Brand, Occasion, Pattern'}
          </span>
          <ChevronRight size={16} className="text-gray-400" />
        </div>

        {/* Delivery */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <span className="text-gray-500 text-sm w-24">Delivery</span>
          <div className="flex-grow pr-4">
            <p className="text-[#f85606] text-sm font-medium mb-1 flex items-center gap-1">
              {seller?.city || 'Pakistan'}, {seller?.area || ''} <MapPin size={14} />
            </p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-800">Standard Delivery</span>
              <span className="font-bold text-gray-800">Rs. {product.deliveryFee || 0}</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 mt-1" />
        </div>

        {/* Service */}
        <div className="flex items-start justify-between p-4">
          <span className="text-gray-500 text-sm w-24">Service</span>
          <div className="flex-grow pr-4 space-y-1">
            <p className="text-sm text-gray-800 flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 bg-black rounded-full shrink-0"></span> 
              14 days easy return
            </p>
            <p className="text-xs text-gray-500 ml-3">Change of Mind applicable</p>
            <p className="text-sm text-gray-800 flex items-start gap-2 mt-2">
              <span className="mt-1.5 w-1 h-1 bg-black rounded-full shrink-0"></span> 
              Warranty not available
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400 mt-1" />
        </div>
      </div>

      {/* STICKY TABS */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 flex overflow-x-auto scrollbar-hide shadow-sm">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-3 text-sm font-semibold whitespace-nowrap px-4 ${activeTab === 'overview' ? 'text-[#f85606] border-b-2 border-[#f85606]' : 'text-gray-600'}`}>Overview</button>
        <button onClick={() => setActiveTab('ratings')} className={`flex-1 py-3 text-sm font-semibold whitespace-nowrap px-4 ${activeTab === 'ratings' ? 'text-[#f85606] border-b-2 border-[#f85606]' : 'text-gray-600'}`}>Ratings</button>
        <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-semibold whitespace-nowrap px-4 ${activeTab === 'details' ? 'text-[#f85606] border-b-2 border-[#f85606]' : 'text-gray-600'}`}>Product details</button>
      </div>

      {/* TAB CONTENT */}
      <div className="mb-2">
        {activeTab === 'overview' && (
          <div>
            {/* Yellow Commitment Banner */}
            <div className="bg-yellow-50 p-4 mx-2 mt-2 rounded-lg border border-yellow-100 mb-4">
              <h3 className="font-extrabold text-lg text-dark mb-2 flex items-center gap-1"><ShieldCheck size={20}/> KorBazar Commitment</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4 marker:text-brand">
                <li>Free Returns within 14 days, no questions asked</li>
                <li>100% Authentic Handmade Products</li>
                <li>Secure Payments & Nationwide Delivery</li>
              </ul>
            </div>

            {/* Ratings Preview */}
            <div className="bg-white p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-500 font-normal">Ratings and Reviews ({reviews.length})</h3>
                <span onClick={() => setActiveTab('ratings')} className="text-[#f85606] text-sm font-semibold hover:underline cursor-pointer">View All</span>
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 1).map((rev, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-600">{rev.buyerName} -</span>
                          <div className="flex">
                            {[1,2,3,4,5].map(star => <Star key={star} size={12} className={star <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />)}
                          </div>
                        </div>
                        <p className="text-gray-800 text-sm mb-2 line-clamp-3">{rev.text}</p>
                      </div>
                      {rev.image && <img src={rev.image} className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No reviews yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="bg-white p-4 min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Ratings & Reviews ({reviews.length})</h3>
              <div className="flex items-center gap-1 text-lg font-bold">
                {averageRating} <Star className="fill-yellow-400 text-yellow-400" size={18}/>
              </div>
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 mb-4 border border-gray-200">
              <span className="text-gray-400">🖼️</span> With images/videos ({reviews.filter(r => r.image).length})
            </button>
            
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 flex gap-3">
                    <div className="flex-grow">
                      <p className="text-gray-800 text-sm mb-2 line-clamp-4">{rev.text}</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => <Star key={star} size={12} className={star <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />)}
                        <span className="text-xs text-gray-500 ml-2">{rev.buyerName}</span>
                      </div>
                    </div>
                    {rev.image && <img src={rev.image} className="w-20 h-20 object-cover rounded-xl shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-white p-4 min-h-[300px]">
            <h3 className="text-xl text-gray-500 font-normal mb-4">Product details</h3>
            
            <div 
              onClick={() => setShowSpecsModal(true)}
              className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4 cursor-pointer"
            >
              <span className="text-gray-800 font-bold text-base">Specifications</span>
              <div className="flex items-center text-gray-500 text-sm">
                Brand, Material, etc <ChevronRight size={16} />
              </div>
            </div>

            <h4 className="text-gray-800 font-bold text-base mb-3">Highlights</h4>
            <div className="text-gray-800 text-sm leading-relaxed space-y-3">
              {highlightsArray.length > 0 ? (
                highlightsArray.map((highlight: string, idx: number) => (
                  <p key={idx}>{highlight}</p>
                ))
              ) : (
                <p>{product.description || "No highlights provided."}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QUESTIONS SECTION */}
      <div className="bg-white mb-2 p-4 text-center">
        <h3 className="text-lg text-gray-800 font-bold mb-4 text-left">Questions about this Product (0)</h3>
        <p className="text-gray-500 text-sm mb-4">There are no questions yet.<br/>Ask the seller now and their answer will show here.</p>
        <button onClick={handleChatWithSeller} className="text-[#1da1f2] font-bold text-sm hover:underline flex items-center justify-center gap-1 mx-auto">
          <MessageSquare size={16} /> Ask Questions <ChevronRight size={14} />
        </button>
      </div>

      {/* SELLER INFO */}
      <div className="bg-white p-4 mb-24 md:mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                <Store size={24} className="text-gray-400" />
             </div>
            <div>
              <p className="font-bold text-gray-800">{product.storeName}</p>
            </div>
          </div>
          <button className="bg-[#f85606] text-white px-5 py-1.5 rounded text-sm font-semibold hover:bg-[#d94a05] transition-colors">Visit Store</button>
        </div>
        
        <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
          <div>
            <p className="font-bold text-xl text-gray-800">95%</p>
            <p className="text-xs text-gray-400">Positive Ratings</p>
          </div>
          <div>
            <p className="font-bold text-xl text-gray-800">100%</p>
            <p className="text-xs text-gray-400">Ship on Time</p>
          </div>
          <div>
            <p className="font-bold text-xl text-gray-800">--</p>
            <p className="text-xs text-gray-400">Chat Response Rate</p>
          </div>
        </div>
      </div>

      {/* FIXED MOBILE BOTTOM BAR */}
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
          <button onClick={handleBuyNow} disabled={isOutOfStock} className={`flex-1 font-semibold text-sm text-white flex items-center justify-center ${isOutOfStock ? 'bg-gray-300' : 'bg-[#42b0d5]'}`}>Buy Now</button>
          <button onClick={handleAddToCart} disabled={isOutOfStock} className={`flex-1 font-semibold text-sm text-white flex items-center justify-center ${isOutOfStock ? 'bg-gray-300' : 'bg-[#f85606]'}`}>Add to Cart</button>
        </div>
      </div>

      {/* SPECIFICATIONS MODAL (Bottom Sheet) */}
      {showSpecsModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end md:items-center justify-center">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl p-6 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowSpecsModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
              <X size={20} className="text-gray-600" />
            </button>
            
            <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Specifications</h2>
            
            <div className="space-y-6">
              <div>
                <p className="font-medium text-gray-600 mb-1">Brand</p>
                <p className="text-sm text-gray-500 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-300 rounded-sm"></span> {product.brand || 'No Brand'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600 mb-1">Material</p>
                <p className="text-sm text-gray-500 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-300 rounded-sm"></span> {product.material || 'Standard'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600 mb-1">Style</p>
                <p className="text-sm text-gray-500 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-300 rounded-sm"></span> {product.style || 'Modern'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600 mb-1">Box Content</p>
                <p className="text-sm text-gray-500 flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-gray-300 rounded-sm shrink-0"></span> 
                  {product.title} - {product.description?.slice(0, 100)}...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartMsg && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-brand text-white px-6 py-2 rounded-full shadow-lg z-[100] font-semibold">{cartMsg}</div>}
    </div>
  );
}
