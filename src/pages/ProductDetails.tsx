import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, ChevronLeft, MessageCircle, ShoppingCart, Truck, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useHistory } from '../context/HistoryContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { addToHistory } = useHistory(); // <-- History tracking restored
  
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const prodData = { id: docSnap.id, ...docSnap.data() } as any;
        setProduct(prodData);
        addToHistory(prodData); // <-- Adds product to Recently Viewed

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
  const isOutOfStock = product.stock !== undefined && Number(product.stock) <= 0;

  const whatsappMessage = `Assalam-o-Alaikum, I have a question about "${product.title}" (Rs. ${product.price}) on KorBazar.`;
  const cleanNumber = seller?.whatsappNumber?.replace(/^0/, '');
  const whatsappLink = `https://wa.me/92${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: images[0],
      sellerId: product.sellerId,
      storeName: product.storeName,
      deliveryFee: product.deliveryFee || 0
    });
    setCartMsg('Added to cart successfully!');
    setTimeout(() => setCartMsg(''), 3000);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : 'New';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <Link to="/explore" className="inline-flex items-center text-gray-500 hover:text-brand mb-6 font-medium">
        <ChevronLeft size={20} /> Back to Explore
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row mb-8">
        {/* Images Section */}
        <div className="w-full md:w-1/2 p-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4 relative">
            <img src={images[activeImage]} alt={product.title} className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-50' : ''}`} />
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-alert text-white font-bold px-6 py-3 rounded-xl shadow-lg text-lg rotate-[-10deg]">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${activeImage === i ? 'border-brand' : 'border-transparent'}`}>
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col">
          <span className="text-sm font-bold text-brand tracking-wider uppercase mb-2">{product.category}</span>
          <h1 className="text-3xl font-bold text-dark mb-2">{product.title}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <Link to={`/store/${product.sellerId}`} className="flex items-center gap-1 text-gray-600 hover:text-brand font-medium">
              {product.storeName} <CheckCircle2 size={16} className="text-brand" />
            </Link>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-sm font-medium text-dark">
              <Star size={16} className="text-yellow-400 fill-yellow-400" /> {averageRating}
            </div>
          </div>

          <div className="text-4xl font-extrabold text-dark mb-2">
            Rs. {product.price}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 bg-gray-50 w-fit px-3 py-1 rounded-lg">
            <Truck size={16} /> Delivery: Rs. {product.deliveryFee || 0}
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-dark mb-2">Product Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {product.description || "No description provided for this item."}
            </p>
          </div>

          {cartMsg && (
            <div className="bg-green-50 text-brand p-3 rounded-xl mb-4 text-center font-semibold">
              {cartMsg}
            </div>
          )}

          <div className="mt-auto space-y-3">
            <button 
              onClick={handleAddToCart} 
              disabled={isOutOfStock}
              className={`w-full font-bold text-lg py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md ${isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-brand text-white hover:bg-brand/90'}`}
            >
              <ShoppingCart size={22} /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="w-full bg-white text-dark border-2 border-[#25D366] font-bold text-lg py-4 rounded-xl hover:bg-[#25D366]/10 transition-colors flex items-center justify-center gap-2">
              <MessageCircle size={22} className="text-[#25D366]" /> Ask Seller on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-dark mb-6">Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet for this product. Be the first to buy and review it!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((rev, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} size={16} className={star <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                  <span className="font-semibold text-dark text-sm">{rev.buyerName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm">{rev.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
    }
