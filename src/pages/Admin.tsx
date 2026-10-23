import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, ShieldAlert, Users, ShoppingBag, Package, LayoutDashboard, Star, Edit3, Trash2, CheckCircle, Save, ExternalLink } from 'lucide-react';

export default function Admin() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'promotions' | 'orders' | 'products' | 'verification'>('overview');
  const [viewImage, setViewImage] = useState<string | null>(null);

  // Edit Seller State
  const [editingSeller, setEditingSeller] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', storeName: '', bio: '', address: '' });
  const [saveMsg, setSaveMsg] = useState('');

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

  const handleDeleteStore = async (id: string) => {
    if(window.confirm("WARNING: This will permanently delete the store, their products, and their user profile. This cannot be undone. Are you sure?")) {
      try {
        // Delete Seller Doc
        await deleteDoc(doc(db, 'sellers', id));
        // Delete User Doc
        await deleteDoc(doc(db, 'users', id));
        // Note: In a real app, you would also batch delete all products by this seller here.
        fetchData();
        alert("Store deleted.");
      } catch (error) {
        console.error("Error deleting store:", error);
        alert("Failed to delete store.");
      }
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if(window.confirm("Are you sure you want to delete this product? It will be removed from the platform immediately.")) {
      await deleteDoc(doc(db, 'products', id));
      fetchData();
    }
  };

  const handleOpenEdit = (seller: any) => {
    setEditingSeller(seller);
    setEditForm({ 
      fullName: seller.fullName || '', 
      phone: seller.phone || '', 
      storeName: seller.storeName || '', 
      bio: seller.bio || '', 
      address: seller.storeAddress || '' 
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSeller) return;
    setSaveMsg('Saving...');
    try {
      await updateDoc(doc(db, 'sellers', editingSeller.id), {
        fullName: editForm.fullName,
        phone: editForm.phone,
        storeName: editForm.storeName,
        bio: editForm.bio,
        storeAddress: editForm.address
      });
      setSaveMsg('Saved successfully!');
      fetchData();
      setTimeout(() => { setSaveMsg(''); setEditingSeller(null); }, 1500);
    } catch (error) {
      setSaveMsg('Error saving.');
    }
  };

  const pendingSellers = sellers.filter(s => s.status === 'pending_verification');
  const approvedSellers = sellers.filter(s => s.status === 'approved');
  const premiumSellers = approvedSellers.filter(s => s.plan === 'premium');
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

      {/* Edit Seller Modal */}
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
                  <p className="text-3xl font-extrabold text-alert">Rs. {totalRevenue}</p>
                  <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Rev.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'promotions' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-2">Premium Promotions</h2>
              <p className="text-sm text-gray-500 mb-6">Toggle the plan to <strong>Premium</strong> for sellers who have paid. Their products will appear on the Homepage and Order Success pages.</p>
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
