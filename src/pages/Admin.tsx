import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, ShieldAlert, Users, ShoppingBag, Package, LayoutDashboard, Star } from 'lucide-react';

export default function Admin() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'promotions' | 'orders' | 'products' | 'verification'>('overview');
  const [viewImage, setViewImage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const sellersData = sellersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      sellersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSellers(sellersData);

      const productsSnap = await getDocs(collection(db, 'products'));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'sellers', id), { status: 'approved', verifiedAt: new Date().toISOString() });
    fetchData();
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason) {
      await updateDoc(doc(db, 'sellers', id), { status: 'rejected', rejectionReason: reason });
      fetchData();
    }
  };

  const toggleFreeze = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Unfreeze' : 'Freeze';
    if(window.confirm(`Are you sure you want to ${action} this store?`)) {
      await updateDoc(doc(db, 'sellers', id), { isFrozen: !currentStatus });
      fetchData();
    }
  };

  const toggleFeeStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await updateDoc(doc(db, 'sellers', id), { feeStatus: newStatus });
    fetchData();
  };

  const toggleSubscription = async (id: string, currentPlan: string) => {
    const newPlan = currentPlan === 'premium' ? 'standard' : 'premium';
    await updateDoc(doc(db, 'sellers', id), { plan: newPlan });
    fetchData();
  };

  const pendingSellers = sellers.filter(s => s.status === 'pending_verification');
  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  
    return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 relative">
      <h1 className="text-3xl font-bold text-dark mb-8">Admin Master Control</h1>
      
      {viewImage && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full">
            <button onClick={() => setViewImage(null)} className="absolute -top-12 right-0 text-white bg-red-500 rounded-full p-2"><X size={24} /></button>
            <img src={viewImage} alt="Full Size" className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 border-b border-gray-200 pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'overview' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutDashboard size={18}/> Overview</button>
        <button onClick={() => setActiveTab('sellers')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'sellers' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Users size={18}/> Manage Sellers</button>
        <button onClick={() => setActiveTab('promotions')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'promotions' ? 'bg-yellow-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Star size={18}/> Promotions</button>
        <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'orders' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><ShoppingBag size={18}/> All Orders</button>
        <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'products' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Package size={18}/> All Products</button>
        <button onClick={() => setActiveTab('verification')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'verification' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'}`}><ShieldAlert size={18}/> Pending ({pendingSellers.length})</button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading platform data...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-6">Platform Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                  <p className="text-3xl font-extrabold text-dark">{sellers.length}</p>
                  <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Sellers</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                  <p className="text-3xl font-extrabold text-brand">{products.length}</p>
                  <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Products</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                  <p className="text-3xl font-extrabold text-blue-600">{orders.length}</p>
                  <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Orders</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                  <p className="text-3xl font-extrabold text-alert">Rs. {totalRevenue}</p>
                  <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Rev.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sellers' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4">Manage Sellers</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-sm text-gray-500">
                      <th className="p-3">Store</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Fee</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.filter(s => s.status === 'approved').map(seller => (
                      <tr key={seller.id} className="border-b border-gray-100">
                        <td className="p-3 font-semibold text-dark">{seller.storeName}<br/><span className="text-xs font-normal text-gray-500">{seller.fullName}</span></td>
                        <td className="p-3">
                          {seller.isFrozen ? <span className="text-alert font-bold text-xs bg-red-50 px-2 py-1 rounded">FROZEN</span> : <span className="text-brand font-bold text-xs bg-green-50 px-2 py-1 rounded">ACTIVE</span>}
                        </td>
                        <td className="p-3">
                          <button onClick={() => toggleFeeStatus(seller.id, seller.feeStatus)} className={`px-3 py-1 rounded-lg text-xs font-bold border ${seller.feeStatus === 'paid' ? 'border-brand text-brand bg-green-50' : 'border-yellow-500 text-yellow-600 bg-yellow-50'}`}>
                            {seller.feeStatus === 'paid' ? 'PAID' : 'PENDING'}
                          </button>
                        </td>
                        <td className="p-3">
                          <button onClick={() => toggleFreeze(seller.id, seller.isFrozen)} className={`px-4 py-1.5 rounded-lg font-bold text-sm text-white ${seller.isFrozen ? 'bg-brand' : 'bg-alert'}`}>
                            {seller.isFrozen ? 'Unfreeze' : 'Freeze'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NEW PROMOTIONS TAB */}
          {activeTab === 'promotions' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-2">Premium Promotions</h2>
              <p className="text-sm text-gray-500 mb-6">Toggle the plan to <strong>Premium</strong> for sellers who have paid for promotion. Their products will appear on the Homepage and Order Success pages.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {sellers.filter(s => s.status === 'approved').map(seller => (
                  <div key={seller.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <div>
                      <h3 className="font-bold text-dark">{seller.storeName}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${seller.plan === 'premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                        {seller.plan === 'premium' ? 'PREMIUM' : 'STANDARD'}
                      </span>
                    </div>
                    <button onClick={() => toggleSubscription(seller.id, seller.plan)} className={`px-4 py-2 rounded-xl font-bold text-sm text-white ${seller.plan === 'premium' ? 'bg-gray-400 hover:bg-gray-500' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                      {seller.plan === 'premium' ? 'Remove Premium' : 'Make Premium'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4">Global Orders Log</h2>
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-bold text-dark">#{order.trackingToken.slice(0,6).toUpperCase()} - {order.storeName}</p>
                      <p className="text-sm text-gray-500">{order.buyerName} | {order.status.toUpperCase()} | {order.paymentMethod}</p>
                    </div>
                    <p className="font-bold text-brand">Rs. {order.total}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4">All Products</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {products.map(p => {
                  const seller = sellers.find(s => s.id === p.sellerId);
                  const isPremiumSeller = seller?.plan === 'premium';
                  return (
                    <div key={p.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <img src={p.image} alt={p.title} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-dark">{p.title}</h4>
                        <p className="text-xs text-gray-500">{p.storeName} | Rs. {p.price}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${isPremiumSeller ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}`}>
                        {isPremiumSeller ? 'Premium Store' : 'Standard Store'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4">Pending Sellers</h2>
              {pendingSellers.length === 0 ? <p className="text-gray-500">No pending applications.</p> : pendingSellers.map(seller => (
                <div key={seller.id} className="p-4 border border-gray-100 rounded-xl mb-4 flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-dark">{seller.storeName}</h3>
                    <p className="text-sm text-gray-600">Owner: {seller.fullName} | CNIC: {seller.cnicNumber}</p>
                    <div className="flex gap-2 mt-2">
                      {seller.cnicFrontUrl && <button onClick={() => setViewImage(seller.cnicFrontUrl)} className="text-xs bg-gray-200 px-3 py-1 rounded font-bold">View CNIC Front</button>}
                      {seller.cnicBackUrl && <button onClick={() => setViewImage(seller.cnicBackUrl)} className="text-xs bg-gray-200 px-3 py-1 rounded font-bold">View CNIC Back</button>}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => handleReject(seller.id)} className="px-4 py-2 text-alert border border-alert rounded-xl font-bold hover:bg-red-50">Reject</button>
                    <button onClick={() => handleApprove(seller.id)} className="px-4 py-2 bg-brand text-white rounded-xl font-bold hover:bg-brand/90">Approve</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
  }
