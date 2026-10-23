import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';

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
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            <Link key={order.id} to={`/track/${order.trackingToken}`} className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg text-dark">Order #{order.trackingToken.slice(0,6).toUpperCase()}</h3>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  order.status === 'new' ? 'bg-yellow-100 text-yellow-700' : 
                  order.status === 'delivered' ? 'bg-green-100 text-brand' : 
                  order.status === 'rejected' ? 'bg-red-100 text-alert' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-dark">{order.storeName}</span><br/>
                  {order.items.length} item(s)
                </div>
                <div className="flex items-center gap-2 font-bold text-dark">
                  Rs. {order.total} <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
