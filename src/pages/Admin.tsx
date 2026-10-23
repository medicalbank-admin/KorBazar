import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, ShieldAlert, Users, ShoppingBag, Package, LayoutDashboard, Star, Edit3, Trash2, CheckCircle, Save, ExternalLink, Tag, Plus, Ticket, TrendingUp, Banknote, PieChart } from 'lucide-react';

export default function Admin() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'promotions' | 'orders' | 'products' | 'categories' | 'coupons' | 'verification' | 'finance'>('overview');
  
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [editingSeller, setEditingSeller] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', storeName: '', bio: '', address: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', minAmount: '' });
  const [couponMsg, setCouponMsg] = useState('');

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

      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const couponSnap = await getDocs(collection(db, 'coupons'));
      setCoupons(couponSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if(window.confirm(`Are you sure you want to ${currentStatus ? 'Unfreeze' : 'Freeze'} this store?`)) {
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

  const updateOrderStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, 'orders', id), { status: newStatus });
    fetchData();
  };

  const handleDeleteStore = async (id: string) => {
    if(window.confirm("WARNING: This will permanently delete the store. Are you sure?")) {
      try {
        await deleteDoc(doc(db, 'sellers', id));
        await deleteDoc(doc(db, 'users', id));
        fetchData();
      } catch (error) { alert("Failed to delete store."); }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if(window.confirm("Are you sure you want to delete this product?")) {
      await deleteDoc(doc(db, 'products', id));
      fetchData();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), { name: newCategoryName.trim(), createdAt: new Date().toISOString() });
      setNewCategoryName('');
      fetchData();
    } catch (error) { alert("Failed to add category."); }
  };

  const handleDeleteCategory = async (id: string) => {
    if(window.confirm("Are you sure?")) {
      await deleteDoc(doc(db, 'categories', id));
      fetchData();
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount) return;
    setCouponMsg('Creating...');
    try {
      await addDoc(collection(db, 'coupons'), { 
        code: newCoupon.code.toUpperCase().trim(), 
        discount: Number(newCoupon.discount),
        minAmount: Number(newCoupon.minAmount) || 0,
        createdAt: new Date().toISOString() 
      });
      setNewCoupon({ code: '', discount: '', minAmount: '' });
      setCouponMsg('Coupon created successfully!');
      fetchData();
      setTimeout(() => setCouponMsg(''), 3000);
    } catch (error) { setCouponMsg("Failed to create coupon."); }
  };

  const handleDeleteCoupon = async (id: string) => {
    if(window.confirm("Delete this coupon?")) {
      await deleteDoc(doc(db, 'coupons', id));
      fetchData();
    }
  };

  const handleOpenEdit = (seller: any) => {
    setEditingSeller(seller);
    setEditForm({ fullName: seller.fullName || '', phone: seller.phone || '', storeName: seller.storeName || '', bio: seller.bio || '', address: seller.storeAddress || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingSeller) return;
    setSaveMsg('Saving...');
    try {
      await updateDoc(doc(db, 'sellers', editingSeller.id), {
        fullName: editForm.fullName, phone: editForm.phone, storeName: editForm.storeName, bio: editForm.bio, storeAddress: editForm.address
      });
      setSaveMsg('Saved successfully!');
      fetchData();
      setTimeout(() => { setSaveMsg(''); setEditingSeller(null); }, 1500);
    } catch (error) { setSaveMsg('Error saving.'); }
  };

  const pendingSellers = sellers.filter(s => s.status === 'pending_verification');
  const approvedSellers = sellers.filter(s => s.status === 'approved');
  const premiumSellers = approvedSellers.filter(s => s.plan === 'premium');
  
  const totalGMV = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const paidSellersCount = approvedSellers.filter(s => s.feeStatus === 'paid').length;
  const unpaidSellersCount = approvedSellers.filter(s => s.feeStatus !== 'paid').length;
  
  const STANDARD_FEE = 1000;
  const PREMIUM_FEE = 2000;
  const monthlySubRevenue = (approvedSellers.length - premiumSellers.length) * STANDARD_FEE;
  const premiumSubRevenue = premiumSellers.length * PREMIUM_FEE;
  const totalExpectedRevenue = monthlySubRevenue + premiumSubRevenue;
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

    {editingSeller && (
      <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative">
          <button onClick={() => setEditingSeller(null)} className="absolute top-4 right-4 text-gray-400 hover:text-alert"><X size={24} /></button>
          <h2 className="text-xl font-bold text-dark mb-4">Edit Store Details</h2>
          {saveMsg && <div className="bg-green-50 text-brand p-2 rounded-lg text-sm mb-4 text-center font-bold">{saveMsg}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Store Name</label>
              <input type="text" value={editForm.storeName} onChange={e => setEditForm({...editForm, storeName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Owner Full Name</label>
              <input type="text" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
              <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Store Address</label>
              <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Store Bio</label>
              <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>
            <button onClick={handleSaveEdit} className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 shadow-md flex items-center justify-center gap-2">
              <Save size={18} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="flex overflow-x-auto gap-2 mb-6 border-b border-gray-200 pb-2 scrollbar-hide">
      <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'overview' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutDashboard size={18}/> Overview</button>
      <button onClick={() => setActiveTab('finance')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'finance' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Banknote size={18}/> Finance</button>
      <button onClick={() => setActiveTab('sellers')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'sellers' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Users size={18}/> Sellers</button>
      <button onClick={() => setActiveTab('promotions')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'promotions' ? 'bg-yellow-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Star size={18}/> Premium</button>
      <button onClick={() => setActiveTab('coupons')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'coupons' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Ticket size={18}/> Coupons</button>
      <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'categories' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Tag size={18}/> Categories</button>
      <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'orders' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><ShoppingBag size={18}/> Orders</button>
      <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'products' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Package size={18}/> Products</button>
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
                <p className="text-3xl font-extrabold text-dark">{approvedSellers.length}</p>
                <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Active Stores</p>
              </div>
              <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 text-center">
                <p className="text-3xl font-extrabold text-yellow-600">{premiumSellers.length}</p>
                <p className="text-sm font-semibold text-yellow-700 uppercase mt-1">Premium Stores</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                <p className="text-3xl font-extrabold text-blue-600">{orders.length}</p>
                <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Orders</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                <p className="text-3xl font-extrabold text-alert">Rs. {totalGMV}</p>
                <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Delivered Rev.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div>
            <h2 className="text-xl font-bold text-dark mb-6">Financial Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-brand to-green-700 text-white p-6 rounded-3xl shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-green-100 font-semibold uppercase text-xs tracking-wider mb-1">Platform Revenue</p>
                    <h3 className="text-3xl font-extrabold">Rs. {totalExpectedRevenue}</h3>
                  </div>
                  <Banknote size={32} className="text-green-200 opacity-50" />
                </div>
                <p className="text-sm text-green-100 mb-4">Expected monthly revenue from subscriptions.</p>
                <div className="bg-white/20 p-3 rounded-xl text-sm flex justify-between">
                  <span>Standard: {approvedSellers.length - premiumSellers.length} x Rs. {STANDARD_FEE}</span>
                  <span>Premium: {premiumSellers.length} x Rs. {PREMIUM_FEE}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Total GMV (Delivered)</p>
                    <h3 className="text-3xl font-extrabold text-dark">Rs. {totalGMV}</h3>
                  </div>
                  <TrendingUp size={32} className="text-brand opacity-30" />
                </div>
                <p className="text-sm text-gray-600">Total money transacted on the platform from {deliveredOrdersCount} delivered orders.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Fee Collection Status</p>
                    <h3 className="text-3xl font-extrabold text-dark">{paidSellersCount} <span className="text-lg text-gray-400">/ {approvedSellers.length}</span></h3>
                  </div>
                  <PieChart size={32} className="text-yellow-500 opacity-50" />
                </div>
                <p className="text-sm text-gray-600 mb-4">Sellers who have paid their fee this month.</p>
                {unpaidSellersCount > 0 ? (
                  <div className="bg-red-50 text-alert text-sm font-bold p-2 rounded-lg text-center">{unpaidSellersCount} sellers have pending fees!</div>
                ) : (
                  <div className="bg-green-50 text-brand text-sm font-bold p-2 rounded-lg text-center">All fees are up to date!</div>
                )}
              </div>
            </div>
            <h3 className="font-bold text-lg text-dark mb-4 border-t border-gray-100 pt-6">Recent Delivered Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-500">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Store</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => o.status === 'delivered').slice(0, 10).map(order => (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="p-3 text-sm font-bold text-dark">#{order.trackingToken.slice(0,6).toUpperCase()}</td>
                      <td className="p-3 text-sm text-gray-600">{order.storeName}</td>
                      <td className="p-3"><span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded">{order.paymentMethod}</span></td>
                      <td className="p-3 text-right font-bold text-brand">Rs. {order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div>
            <h2 className="text-xl font-bold text-dark mb-6">Manage Coupons</h2>
            {couponMsg && <div className="bg-green-50 text-brand p-3 rounded-lg text-sm mb-4 max-w-2xl font-bold">{couponMsg}</div>}
            
            <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 max-w-4xl bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Coupon Code</label>
                <input type="text" required value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="E.g. EID2024" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:outline-none uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Discount (Rs.)</label>
                <input type="number" required value={newCoupon.discount} onChange={e => setNewCoupon({...newCoupon, discount: e.target.value})} placeholder="100" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Min Order (Rs.)</label>
                <input type="number" value={newCoupon.minAmount} onChange={e => setNewCoupon({...newCoupon, minAmount: e.target.value})} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:outline-none" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-brand text-white font-bold py-2.5 rounded-xl hover:bg-brand/90 shadow-sm flex items-center justify-center gap-2">
                  <Plus size={18} /> Create
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map(coupon => (
                <div key={coupon.id} className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div>
                    <p className="font-bold text-dark text-lg uppercase">{coupon.code}</p>
                    <p className="text-sm text-brand font-bold">Rs. {coupon.discount} OFF</p>
                    {coupon.minAmount > 0 && <p className="text-xs text-gray-500">Min order: Rs. {coupon.minAmount}</p>}
                  </div>
                  <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-alert p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'promotions' && (
          <div>
            <h2 className="text-xl font-bold text-dark mb-2">Premium Promotions</h2>
            <p className="text-sm text-gray-500 mb-6">Toggle the plan to <strong>Premium</strong> for sellers who have paid.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {approvedSellers.map(seller => (
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

                  {activeTab === 'categories' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-6">Manage Categories</h2>
              <form onSubmit={handleAddCategory} className="flex gap-3 mb-8 max-w-lg">
                <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="e.g. Home Decor, Sweets, etc." className="flex-grow px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
                <button type="submit" className="bg-brand text-white font-bold py-3 px-6 rounded-xl hover:bg-brand/90 shadow-md flex items-center gap-2"><Plus size={18} /> Add</button>
              </form>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-xl">
                    <span className="font-bold text-dark">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-alert p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </div>
                ))}
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

          {activeTab === 'sellers' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4">Manage Sellers</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-sm text-gray-500">
                      <th className="p-3">Store Info</th>
                      <th className="p-3">Status & Fee</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedSellers.map(seller => (
                      <tr key={seller.id} className="border-b border-gray-100">
                        <td className="p-3">
                          <p className="font-bold text-dark">{seller.storeName}</p>
                          <p className="text-xs text-gray-500">{seller.fullName} | {seller.phone}</p>
                        </td>
                        <td className="p-3 flex flex-col gap-2 items-start">
                          {seller.isFrozen ? <span className="text-alert font-bold text-xs bg-red-50 px-2 py-1 rounded">FROZEN</span> : <span className="text-brand font-bold text-xs bg-green-50 px-2 py-1 rounded">ACTIVE</span>}
                          <button onClick={() => toggleFeeStatus(seller.id, seller.feeStatus)} className={`px-3 py-1 rounded-lg text-xs font-bold border ${seller.feeStatus === 'paid' ? 'border-brand text-brand bg-green-50' : 'border-yellow-500 text-yellow-600 bg-yellow-50'}`}>
                            Fee: {seller.feeStatus === 'paid' ? 'PAID' : 'PENDING'}
                          </button>
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleOpenEdit(seller)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit3 size={16} /></button>
                          <button onClick={() => window.open(`#/store/${seller.id}`, '_blank')} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><ExternalLink size={16} /></button>
                          <button onClick={() => toggleFreeze(seller.id, seller.isFrozen)} className={`p-2 rounded-lg text-white ${seller.isFrozen ? 'bg-brand' : 'bg-yellow-500'}`}>
                            {seller.isFrozen ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                          </button>
                          <button onClick={() => handleDeleteStore(seller.id)} className="p-2 bg-red-50 text-alert rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4">Global Orders Log</h2>
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-100 rounded-xl bg-gray-50 gap-4">
                    <div>
                      <p className="font-bold text-dark">#{order.trackingToken.slice(0,6).toUpperCase()} - {order.storeName}</p>
                      <p className="text-sm text-gray-500">{order.buyerName} | {order.buyerPhone} | {order.paymentMethod}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-brand">Rs. {order.total}</p>
                      <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:border-brand">
                        <option value="new">New</option>
                        <option value="accepted">Accepted</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4">All Platform Products</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => {
                  const seller = sellers.find(s => s.id === p.sellerId);
                  const isPremiumSeller = seller?.plan === 'premium';
                  return (
                    <div key={p.id} className="flex flex-col bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={p.image} alt={p.title} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-grow">
                          <h4 className="font-bold text-dark line-clamp-1">{p.title}</h4>
                          <p className="text-xs text-gray-500 truncate">{p.storeName}</p>
                          <p className="text-sm font-bold text-brand mt-1">Rs. {p.price}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-auto border-t border-gray-200 pt-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${isPremiumSeller ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                          {isPremiumSeller ? 'Premium Store' : 'Standard Store'}
                        </span>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-alert p-1.5 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
        }
