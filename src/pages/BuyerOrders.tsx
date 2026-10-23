import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, XCircle } from 'lucide-react';

export default function BuyerOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'orders'), where('buyerUid', '==', currentUser.uid));
        const snap = await getDocs(q);
        
        // Fetch seller info for each order to get their WhatsApp number
        const data = await Promise.all(snap.docs.map(async (d) => {
          const orderData = { id: d.id, ...d.data() } as any;
          if (orderData.sellerId) {
            const sellerSnap = await getDoc(doc(db, 'sellers', orderData.sellerId));
            if (sellerSnap.exists()) {
              orderData.sellerWhatsapp = sellerSnap.data().whatsappNumber;
            }
          }
          return orderData;
        }));

        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser]);
  
const handleCancelOrder = async (order: any) => {
  if(window.confirm('Are you sure you want to cancel this order? You will be redirected to WhatsApp to notify the seller.')) {
    try {
      // 1. Update status in Firestore
      await updateDoc(doc(db, 'orders', order.id), { 
        status: 'cancelled',
        cancelledBy: 'buyer',
        cancelledAt: new Date().toISOString()
      });

      // 2. Open WhatsApp to notify seller
      const text = `Assalam-o-Alaikum ${order.storeName},\n\nI would like to CANCEL my order #${order.trackingToken.slice(0,8).toUpperCase()} placed on KorBazar.\n\nReason: (Please type your reason here)\n\nThank you.`;
      const cleanNumber = order.sellerWhatsapp?.replace(/^0/, '') || '';
      window.open(`https://wa.me/92${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
      
      // 3. Refresh orders list to show updated status
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to update order status.");
    }
  }
};

  if (!currentUser) return <div className="p-12 text-center text-dark">Please log in to view your orders.</div>;
  if (loading) return <div className="p-12 text-center text-dark">Loading orders...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-dark mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't bought anything yet.</p>
          <Link to="/explore" className="bg-brand text-white px-8 py-3 rounded-xl font-bold hover:bg-brand/90 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-dark">Order #{order.trackingToken.slice(0,6).toUpperCase()}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  order.status === 'new' ? 'bg-yellow-100 text-yellow-700' : 
                  order.status === 'delivered' ? 'bg-green-100 text-brand' : 
                  order.status === 'rejected' || order.status === 'cancelled' ? 'bg-red-100 text-alert' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-dark text-base">{order.storeName}</span><br/>
                  {order.items.length} item(s) • <span className="font-semibold uppercase">{order.paymentMethod}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-dark">Rs. {order.total}</span>
                  <Link to={`/track/${order.trackingToken}`} className="bg-gray-100 text-dark px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 text-sm flex items-center gap-1">
                    Track <ChevronRight size={16} />
                  </Link>
                </div>
              </div>

              {order.status === 'new' && (
                <div className="border-t border-gray-100 pt-3">
                  <button 
                    onClick={() => handleCancelOrder(order)} 
                    className="flex items-center gap-1 text-alert font-semibold text-sm hover:underline"
                  >
                    <XCircle size={16} /> Cancel Order via WhatsApp
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
