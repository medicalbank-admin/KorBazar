import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, Clock, Package, Truck, MessageCircle, Star, Box, CheckSquare } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function TrackOrder() {
  const { token } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [premiumProducts, setPremiumProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const q = query(collection(db, 'orders'), where('trackingToken', '==', token));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const orderData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        setOrder(orderData);
        
        const sellerSnap = await getDoc(doc(db, 'sellers', orderData.sellerId));
        if (sellerSnap.exists()) setSeller(sellerSnap.data());

        const reviewQ = query(collection(db, 'reviews'), where('orderId', '==', orderData.id));
        const reviewSnap = await getDocs(reviewQ);
        if (!reviewSnap.empty) setReviewSubmitted(true);
      }
      setLoading(false);
    };
    
    const fetchPremiumProducts = async () => {
      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const premiumSellerIds = sellersSnap.docs
        .filter(d => d.data().status === 'approved' && d.data().plan === 'premium' && !d.data().isFrozen)
        .map(d => d.id);

      const prodSnap = await getDocs(collection(db, 'products'));
      const allProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      const promoProducts = allProducts.filter(p => premiumSellerIds.includes(p.sellerId));
      setPremiumProducts(promoProducts.sort(() => 0.5 - Math.random()).slice(0, 4));
    };

    fetchOrder();
    fetchPremiumProducts();
  }, [token]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a star rating.');
    setSubmittingReview(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        orderId: order.id,
        sellerId: order.sellerId,
        storeName: order.storeName,
        productIds: order.items.map((i: any) => i.productId),
        buyerName: order.buyerName,
        rating,
        text: reviewText,
        createdAt: new Date().toISOString()
      });
      setReviewSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-dark font-bold">Loading order...</div>;
  if (!order) return <div className="p-12 text-center text-alert font-bold">Order not found. Please check your link.</div>;

  const steps = [
    { id: 'new', label: 'Order Placed', icon: Clock },
    { id: 'accepted', label: 'Confirmed by Seller', icon: CheckCircle2 },
    { id: 'dispatched', label: 'Out for Delivery', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Package },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);

  const whatsappText = `Assalam-o-Alaikum ${order.buyerName}, this is ${seller?.storeName}. Your order #${order.trackingToken.slice(0,6)} is confirmed! Total: Rs. ${order.total}.`;
  const cleanNumber = seller?.whatsappNumber?.replace(/^0/, '');
  const waLink = `https://wa.me/92${cleanNumber}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Order Status</h1>
          <p className="text-gray-500">Order ID: #{order.trackingToken.slice(0,8).toUpperCase()}</p>
        </div>

        {order.status === 'rejected' || order.status === 'cancelled' ? (
          <div className="bg-red-50 text-alert p-6 rounded-2xl text-center mb-8">
            <h3 className="font-bold text-lg mb-2">Order Cancelled</h3>
            <p className="text-sm">Reason: {order.rejectionReason || 'Order was cancelled.'}</p>
          </div>
        ) : (
          <div className="relative mb-12">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStepIndex;
              return (
                <div key={step.id} className="relative z-10 flex items-center gap-6 mb-8 last:mb-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${isActive ? 'text-dark' : 'text-gray-400'}`}>{step.label}</h3>
                    {step.id === 'accepted' && order.paymentVerified && (
                      <p className="text-xs text-brand font-semibold flex items-center gap-1 mt-1"><CheckSquare size={12}/> Payment Verified</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COURIER TRACKING INFO */}
        {order.trackingNumber && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3 mb-6">
            <Box size={24} />
            <div>
              <p className="font-bold text-sm">Courier Tracking Number</p>
              <p className="text-lg font-mono font-bold">{order.trackingNumber}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-dark mb-4">Order Summary</h3>
          <p className="text-sm text-gray-600 mb-2"><span className="font-semibold">Store:</span> {order.storeName}</p>
          
          <div className="space-y-2 mb-4">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.qty}x {item.title}</span>
                <span className="font-medium">Rs. {item.price * item.qty}</span>
              </div>
            ))}
          </div>
          
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-brand font-bold mb-2">
              <span>Discount ({order.couponCode})</span>
              <span>- Rs. {order.discountAmount}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-dark">
            <span>Total</span>
            <span>Rs. {order.total}</span>
          </div>
        </div>

        <a href={waLink} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20bd5a] flex items-center justify-center gap-2">
          <MessageCircle size={20} /> Contact Seller on WhatsApp
        </a>

        {order.status === 'delivered' && (
          <div className="border-t border-gray-100 pt-8 mt-8">
            <h3 className="text-xl font-bold text-dark mb-4 text-center">Rate this order</h3>
            {reviewSubmitted ? (
              <div className="bg-green-50 text-brand p-4 rounded-xl text-center font-semibold">
                Thank you! Your review has been submitted.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                      <Star size={32} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  placeholder="How was the quality, delivery, and service?" 
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none"
                  rows={3}
                />
                <button type="submit" disabled={submittingReview} className="w-full bg-dark text-white font-bold py-3 rounded-xl hover:bg-black transition-colors">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {premiumProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" /> Most Popular in Charsadda
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {premiumProducts.map(product => (
              <ProductCard key={product.id} product={product} isSellerPremium={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
        }
