import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, ChevronLeft, MessageCircle } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const prodData = { id: docSnap.id, ...docSnap.data() } as any;
        setProduct(prodData);

        // Fetch Seller Info
        const sellerRef = doc(db, 'sellers', prodData.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) setSeller(sellerSnap.data());
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-12 text-center">Loading product...</div>;
  if (!product) return <div className="p-12 text-center">Product not found.</div>;

  const images = product.images?.length > 0 ? product.images : [product.image];

  const whatsappMessage = `Assalam-o-Alaikum, I am interested in buying "${product.title}" (Rs. ${product.price}) from KorBazar.`;
  const whatsappLink = `https://wa.me/92${seller?.whatsappNumber?.replace(/^0/, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <Link to="/explore" className="inline-flex items-center text-gray-500 hover:text-brand mb-6 font-medium">
        <ChevronLeft size={20} /> Back to Explore
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Images Section */}
        <div className="w-full md:w-1/2 p-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4">
            <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
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
          
          <div className="flex items-center gap-2 mb-6">
            <Link to={`/store/${product.sellerId}`} className="flex items-center gap-1 text-gray-600 hover:text-brand font-medium">
              {product.storeName} <CheckCircle2 size={16} className="text-brand" />
            </Link>
          </div>

          <div className="text-4xl font-extrabold text-dark mb-8">
            Rs. {product.price}
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-dark mb-2">About this item</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              This item is handmade with love in Charsadda. Contact the seller directly on WhatsApp to discuss delivery, payment, and customization.
            </p>
          </div>

          <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-auto w-full bg-[#25D366] text-white font-bold text-lg py-4 rounded-xl hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2 shadow-md">
            <MessageCircle size={24} /> Order on WhatsApp
          </a>
          <p className="text-center text-xs text-gray-400 mt-4">Cash on Delivery / Seller Arranged Delivery</p>
        </div>
      </div>
    </div>
  );
}
