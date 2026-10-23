import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, Clock, Package, Truck, MessageCircle } from 'lucide-react';

export default function TrackOrder() {
  const { token } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const q = query(collection(db, 'orders'), where('trackingToken', '==', token));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const orderData = snap.docs[0].data();
        setOrder(orderData);
        
        const sellerSnap = await getDoc(doc(db, 'sellers', orderData.sellerId));
        if (sellerSnap.exists()) setSeller(sellerSnap.data());
      }
      setLoading(false);
    };
    fetchOrder();
  }, [token]);

  if (loading) return <div className="p-12 text-center">Loading order...</div>;
  if (!order) return <div className="p-12 text-center text-alert">Order not found. Please check your link.</div>;

  const steps = [
    { id: 'new', label: 'Order Placed', icon: Clock },
    { id: 'accepted', label: 'Confirmed by Seller', icon: CheckCircle2 },
    { id: 'dispatched', label: 'Out for Delivery', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Package },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);

  const whatsappText = `Assalam-o-Alaikum ${order.buyerName}, this is ${seller?.storeName}. Your order #${order.trackingToken.slice(0,6)} is confirmed! Total: Rs. ${order.total}.`;
  const waLink = `https://wa.me/92${seller?.whatsappNumber?.replace(/^0/, '')}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 pb-24">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Order Status</h1>
          <p className="text-gray-500">Order ID: #{order.trackingToken.slice(0,8).toUpperCase()}</p>
        </div>

        {order.status === 'rejected' ? (
          <div className="bg-red-50 text-alert p-6 rounded-2xl text-center mb-8">
            <h3 className="font-bold text-lg mb-2">Order Rejected</h3>
            <p className="text-sm">Reason: {order.rejectionReason || 'Seller could not fulfill this order.'}</p>
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
                  </div>
                </div>
              );
            })}
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
          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-dark">
            <span>Total</span>
            <span>Rs. {order.total}</span>
          </div>
        </div>

        <a href={waLink} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20bd5a] flex items-center justify-center gap-2">
          <MessageCircle size={20} /> Contact Seller on WhatsApp
        </a>
      </div>
    </div>
  );
}
