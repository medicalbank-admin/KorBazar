import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

import { X, ShieldAlert, Users, ShoppingBag, Package, LayoutDashboard, Star, Edit3, Trash2, CheckCircle, Save, ExternalLink, Tag, Plus, Ticket, TrendingUp, Banknote, Settings, Flag, Megaphone, ArrowLeft, History, Wallet } from 'lucide-react';

export default function Admin() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  
const [selectedSeller, setSelectedSeller] = useState<any>(null);
const [sellerOrders, setSellerOrders] = useState<any[]>([]);
const [sellerPaymentHistory, setSellerPaymentHistory] = useState<any[]>([]);
const [paymentModal, setPaymentModal] = useState({ isOpen: false, amount: '', type: 'order_fee' });
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'sellers' | 'promotions' | 'orders' | 'products' | 'categories' | 'coupons' | 'verification' | 'finance' | 'reports' | 'ads'>('overview');
  
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [editingSeller, setEditingSeller] = useState<any>(null);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', storeName: '', bio: '', address: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', minAmount: '' });
  const [couponMsg, setCouponMsg] = useState('');
  
  const [newAd, setNewAd] = useState({ title: '', productId: '', imageBase64: '', link: '/explore' });
  const [isUploadingAd, setIsUploadingAd] = useState(false);

  const [fees, setFees] = useState({ standard: 1000, premium: 2000 });
  const [isSavingFees, setIsSavingFees] = useState(false);
  // NEW: Custom Reject Modal State
const [rejectModal, setRejectModal] = useState({ isOpen: false, sellerId: '', reason: '' });

  const fetchData = async () => {
    setLoading(true);
    // 1. Fetch ALL data in parallel to make it super fast
const [
  sellersSnap,
  productsSnap,
  ordersSnap,
  catSnap,
  couponSnap,
  reportSnap,
  adsSnap,
  settingsSnap
] = await Promise.all([
  getDocs(collection(db, 'sellers')),
  // LIMIT: Only load the 200 newest products
  getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(200))),
  // LIMIT: Only load the 200 newest orders
  getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(200))),
  getDocs(collection(db, 'categories')),
  getDocs(collection(db, 'coupons')),
  getDocs(collection(db, 'reports')),
  getDocs(collection(db, 'ads')),
  getDoc(doc(db, 'settings', 'platform'))
]);

const sellersData: any[] = sellersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

// --- Monthly fees logic (kept exactly as you had it) ---
const today = new Date();
if (today.getDate() === 1) {
  for (const seller of sellersData) {
    if (seller.feeStatus === 'paid') {
      const lastPaid = seller.lastFeePaidDate ? new Date(seller.lastFeePaidDate) : null;
      if (!lastPaid || lastPaid.getMonth() !== today.getMonth()) {
        await updateDoc(doc(db, 'sellers', seller.id), { feeStatus: 'pending' });
        seller.feeStatus = 'pending'; 
      }
    }
  }
}

sellersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
setSellers(sellersData);

// Set the rest of the data (no need to sort products/orders in JS anymore, Firestore did it)
setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
setCoupons(couponSnap.docs.map(d => ({ id: d.id, ...d.data() })));
setReports(reportSnap.docs.map(d => ({ id: d.id, ...d.data() })));
setAds(adsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    if (settingsSnap.exists()) {
      setFees(settingsSnap.data() as any);
    }
  }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchData(); }, []);

  const handleSaveFees = async () => {
    setIsSavingFees(true);
    try {
      await setDoc(doc(db, 'settings', 'platform'), { 
        standard: Number(fees.standard), 
        premium: Number(fees.premium) 
      });
      alert("Platform fees updated successfully!");
    } catch (error) {
      alert("Failed to update fees.");
    } finally {
      setIsSavingFees(false);
    }
  };

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'sellers', id), { status: 'approved', verifiedAt: new Date().toISOString() });
    fetchData();
  };

  const handleReject = (id: string) => {
  setRejectModal({ isOpen: true, sellerId: id, reason: '' });
};

const handleConfirmReject = async () => {
  if (!rejectModal.reason.trim()) return alert('Please enter a rejection reason.');
  await updateDoc(doc(db, 'sellers', rejectModal.sellerId), { 
    status: 'rejected', 
    rejectionReason: rejectModal.reason 
  });
  setRejectModal({ isOpen: false, sellerId: '', reason: '' });
  fetchData();
};
  
  const toggleFreeze = async (id: string, currentStatus: boolean) => {
    if(window.confirm(`Are you sure you want to ${currentStatus ? 'Unfreeze' : 'Freeze'} this store?`)) {
      await updateDoc(doc(db, 'sellers', id), { isFrozen: !currentStatus });
      fetchData();
    }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAd({ ...newAd, imageBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title || !newAd.imageBase64) return alert("Please provide a title and image.");
    setIsUploadingAd(true);
    try {
      await addDoc(collection(db, 'ads'), {
        title: newAd.title,
        productId: newAd.productId,
        imageBase64: newAd.imageBase64,
        link: newAd.link,
        createdAt: new Date().toISOString()
      });
      setNewAd({ title: '', productId: '', imageBase64: '', link: '/explore' });
      fetchData();
      alert("Ad created successfully!");
    } catch (error) {
      alert("Failed to create ad.");
    } finally {
      setIsUploadingAd(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if(window.confirm("Delete this ad?")) {
      await deleteDoc(doc(db, 'ads', id));
      fetchData();
    }
  };

  const handleOpenEdit = (seller: any) => {
    setEditingSeller(seller);
    setEditForm({ fullName: seller.fullName || '', phone: seller.phone || '', storeName: seller.storeName || '', bio: seller.bio || '', address: seller.storeAddress || '' });
  };

  const handleOpenSeller = (seller: any) => {
  setSelectedSeller(seller);
  // Filter orders for this seller
  const sOrders = orders.filter(o => o.sellerId === seller.id);
  setSellerOrders(sOrders);
  
  // Fetch payment history for this seller
  const fetchPayments = async () => {
    try {
      const q = query(collection(db, 'payment_history'), where('sellerId', '==', seller.id));
      const snap = await getDocs(q);
      const history: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSellerPaymentHistory(history);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };
  fetchPayments();
};
  const handleProcessPayment = async () => {
  if (!selectedSeller || !paymentModal.amount) return alert("Please enter an amount.");
  const amountPaid = Number(paymentModal.amount);
  if (amountPaid <= 0) return alert("Amount must be greater than 0.");

  try {
    if (paymentModal.type === 'order_fee') {
      const currentPaid = selectedSeller.orderFeePaid || 0;
      const newPaid = currentPaid + amountPaid;
      
      // 1. Update Seller Document
      await updateDoc(doc(db, 'sellers', selectedSeller.id), { 
        orderFeePaid: newPaid 
      });
      
      // 2. Log to Payment History with details
      await addDoc(collection(db, 'payment_history'), {
        sellerId: selectedSeller.id,
        amount: amountPaid,
        type: 'Order Fee Payment',
        details: `Paid Rs. ${amountPaid} towards order fees.`,
        date: new Date().toISOString()
      });
      
      // 3. Update local state to show instantly
      setSelectedSeller({ ...selectedSeller, orderFeePaid: newPaid });
      
      // 4. Refresh history
      const q = query(collection(db, 'payment_history'), where('sellerId', '==', selectedSeller.id));
      const snap = await getDocs(q);
      const history: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSellerPaymentHistory(history);

    } else if (paymentModal.type === 'monthly_fee') {
      const subAmount = selectedSeller.plan === 'premium' ? fees.premium : fees.standard;
      
      // 1. Update Seller Document
      await updateDoc(doc(db, 'sellers', selectedSeller.id), { 
        feeStatus: 'paid', 
        lastFeePaidDate: new Date().toISOString() 
      });
      
      // 2. Log to Payment History with details
      await addDoc(collection(db, 'payment_history'), {
        sellerId: selectedSeller.id,
        amount: subAmount,
        type: 'Monthly Subscription',
        details: `Paid Rs. ${subAmount} for ${selectedSeller.plan || 'standard'} plan subscription.`,
        date: new Date().toISOString()
      });
      
      // 3. Update local state
      setSelectedSeller({ ...selectedSeller, feeStatus: 'paid', lastFeePaidDate: new Date().toISOString() });
      
      // 4. Refresh history
      const q = query(collection(db, 'payment_history'), where('sellerId', '==', selectedSeller.id));
      const snap = await getDocs(q);
      const history: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSellerPaymentHistory(history);
      
      // 5. Refresh main data so the list reflects the new fee status
      fetchData(); 
    }
    
    // Close modal
    setPaymentModal({ isOpen: false, amount: '', type: 'order_fee' });
    alert("Payment recorded successfully!");

  } catch (error) {
    console.error("Payment Error:", error);
    alert("Failed to record payment. Please try again.");
  }
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
  const standardSellers = approvedSellers.filter(s => s.plan !== 'premium');
  
  const paidStandardCount = standardSellers.filter(s => s.feeStatus === 'paid').length;
const paidPremiumCount = premiumSellers.filter(s => s.feeStatus === 'paid').length;

// 1. Calculate total platform fees FIRST
const totalPlatformFees = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.platformFee || 10), 0);

// 2. NOW calculate the total revenue
const actualEarnedRevenue = (paidStandardCount * fees.standard) + (paidPremiumCount * fees.premium) + totalPlatformFees;

const expectedMonthlyRevenue = (standardSellers.length * fees.standard) + (premiumSellers.length * fees.premium);
const paidSellersCount = approvedSellers.filter(s => s.feeStatus === 'paid').length;
const unpaidSellersCount = approvedSellers.length - paidSellersCount;
  
  return (
  <div className="max-w-7xl mx-auto px-4 py-8 pb-24 relative">
    <h1 className="text-3xl font-bold text-dark mb-8">Admin Master Control</h1>
    
    {/* SELLER DETAILS SCREEN */}
{selectedSeller && (
  <div className="fixed inset-0 bg-cream z-[80] overflow-y-auto">
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      
      {/* Header */}
      <button onClick={() => setSelectedSeller(null)} className="flex items-center gap-2 text-gray-500 hover:text-brand font-bold mb-6">
        <ArrowLeft size={20} /> Back to Admin Panel
      </button>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark">{selectedSeller.storeName}</h1>
          <p className="text-gray-500">Owner: {selectedSeller.fullName} | CNIC: {selectedSeller.cnicNumber}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${selectedSeller.isFrozen ? 'bg-red-100 text-alert' : 'bg-green-100 text-brand'}`}>
          {selectedSeller.isFrozen ? 'Frozen' : 'Active'}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
          <p className="text-2xl font-extrabold text-dark">{sellerOrders.length}</p>
          <p className="text-xs font-bold text-gray-500 uppercase">Total Orders</p>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
          <p className="text-2xl font-extrabold text-brand">{sellerOrders.filter(o => o.status === 'delivered').length}</p>
          <p className="text-xs font-bold text-brand uppercase">Delivered</p>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
          <p className="text-2xl font-extrabold text-alert">{sellerOrders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length}</p>
          <p className="text-xs font-bold text-alert uppercase">Cancelled/Rejected</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
          <p className="text-2xl font-extrabold text-blue-600">{sellerOrders.filter(o => o.status === 'new' || o.status === 'accepted' || o.status === 'dispatched').length}</p>
          <p className="text-xs font-bold text-gray-500 uppercase">Pending/Active</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* FINANCIALS */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2"><Wallet size={20}/> Financials</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Monthly Subscription ({selectedSeller.plan === 'premium' ? 'Premium' : 'Standard'})</span>
              <span className={`font-bold ${selectedSeller.feeStatus === 'paid' ? 'text-brand' : 'text-alert'}`}>{selectedSeller.feeStatus === 'paid' ? 'PAID' : 'PENDING'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Total Order Fees Owed (Rs. 10/order)</span>
              <span className="font-bold text-dark">Rs. {sellerOrders.filter(o => o.status === 'delivered').length * 10}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-gray-600">Amount Already Paid</span>
              <span className="font-bold text-brand">Rs. {selectedSeller.orderFeePaid || 0}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaymentModal({ isOpen: true, amount: '', type: 'order_fee' })} className="flex-1 bg-dark text-white font-bold py-2.5 rounded-xl hover:bg-black transition-colors text-sm">
              Pay Order Fees
            </button>
            {selectedSeller.feeStatus !== 'paid' && (
              <button onClick={() => setPaymentModal({ isOpen: true, amount: '', type: 'monthly_fee' })} className="flex-1 bg-brand text-white font-bold py-2.5 rounded-xl hover:bg-brand/90 transition-colors text-sm">
                Mark Sub Paid
              </button>
            )}
          </div>
        </div>

        {/* PAYMENT HISTORY */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2"><History size={20}/> Payment History</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {sellerPaymentHistory.length === 0 ? (
  <p className="text-gray-500 text-sm">No payments recorded yet.</p>
) : sellerPaymentHistory.map(pay => (
  <div key={pay.id} className="flex flex-col p-3 bg-gray-50 rounded-xl border border-gray-100 mb-2">
    <div className="flex justify-between items-center mb-1">
      <p className="font-bold text-dark text-sm">{pay.type}</p>
      <p className="font-bold text-brand">Rs. {pay.amount}</p>
    </div>
    <p className="text-xs text-gray-600 mb-1">{pay.details || 'Payment recorded'}</p>
    <p className="text-[10px] text-gray-400 text-right">{new Date(pay.date).toLocaleString()}</p>
  </div>
))}
          </div>
        </div>

      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-8">
        <h2 className="text-xl font-bold text-dark mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="p-2">Order ID</th>
                <th className="p-2">Date</th>
                <th className="p-2">Buyer</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sellerOrders.slice(0, 10).map(order => (
                <tr key={order.id} className="border-b border-gray-100">
                  <td className="p-2 text-sm font-bold text-dark">#{order.trackingToken.slice(0,6).toUpperCase()}</td>
                  <td className="p-2 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-sm text-gray-600">{order.buyerName}</td>
                  <td className="p-2"><span className="text-xs font-bold uppercase bg-gray-100 px-2 py-1 rounded">{order.status}</span></td>
                  <td className="p-2 text-sm font-bold text-right text-dark">Rs. {order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
)}

    {/* PAYMENT INPUT MODAL */}
{paymentModal.isOpen && (
  <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 relative">
      <button onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} className="absolute top-4 right-4 text-gray-400 hover:text-alert"><X size={24} /></button>
      <h2 className="text-xl font-bold text-dark mb-2">
        {paymentModal.type === 'order_fee' ? 'Record Order Fee Payment' : 'Mark Subscription Paid'}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {paymentModal.type === 'order_fee' 
          ? 'Enter the amount the seller has paid towards their accumulated order fees.' 
          : 'This will mark the current month subscription as PAID and log it in history.'}
      </p>

      <div className="space-y-4">
        {paymentModal.type === 'order_fee' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (Rs.)</label>
            <input 
              type="number" 
              value={paymentModal.amount} 
              onChange={e => setPaymentModal({...paymentModal, amount: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" 
              placeholder="e.g. 500"
            />
          </div>
        )}

        {paymentModal.type === 'monthly_fee' && (
          <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-sm text-dark">
            <p>Subscription Fee: <strong>Rs. {selectedSeller?.plan === 'premium' ? fees.premium : fees.standard}</strong></p>
          </div>
        )}
        
        <button onClick={handleProcessPayment} className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 shadow-md">
          Confirm Payment
        </button>
      </div>
    </div>
  </div>
)}
    {viewImage && (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
        <div className="relative max-w-2xl w-full">
          <button onClick={() => setViewImage(null)} className="absolute -top-12 right-0 text-white bg-red-500 rounded-full p-2"><X size={24} /></button>
          <img src={viewImage} alt="Full Size" className="w-full h-auto rounded-xl" />
        </div>
      </div>
    )}

    {/* CUSTOM REJECT MODAL */}
{rejectModal.isOpen && (
  <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 relative">
      <button onClick={() => setRejectModal({ ...rejectModal, isOpen: false })} className="absolute top-4 right-4 text-gray-400 hover:text-alert"><X size={24} /></button>
      <h2 className="text-xl font-bold text-dark mb-4">Reject Application</h2>
      <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this seller. The seller will see this reason on their dashboard.</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
          <select 
            value={rejectModal.reason} 
            onChange={e => setRejectModal({...rejectModal, reason: e.target.value})} 
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50 mb-2"
          >
            <option value="">Select a reason...</option>
            <option value="Name does not match CNIC">Name does not match CNIC</option>
            <option value="CNIC image is unclear">CNIC image is unclear</option>
            <option value="Age is below 18">Age is below 18</option>
            <option value="Store name is already taken">Store name is already taken</option>
            <option value="Other">Other</option>
          </select>
          
          {rejectModal.reason === 'Other' && (
            <input 
              type="text" 
              placeholder="Type custom reason here..." 
              onChange={e => setRejectModal({...rejectModal, reason: e.target.value})} 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50 mt-2" 
            />
          )}
        </div>
        
        <button onClick={handleConfirmReject} className="w-full bg-alert text-white font-bold py-3 rounded-xl hover:bg-red-700 shadow-md flex items-center justify-center gap-2">
          Confirm Rejection
        </button>
      </div>
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
      <button onClick={() => setActiveTab('ads')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'ads' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Megaphone size={18}/> Ads Manager</button>
      <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'categories' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Tag size={18}/> Categories</button>
      <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'orders' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><ShoppingBag size={18}/> Orders</button>
      <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'products' ? 'bg-dark text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Package size={18}/> Products</button>
      <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold whitespace-nowrap ${activeTab === 'reports' ? 'bg-alert text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Flag size={18}/> Reports ({reports.length})</button>
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
                <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Premium Stores</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                <p className="text-3xl font-extrabold text-blue-600">{orders.length}</p>
                <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Total Orders</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                <p className="text-3xl font-extrabold text-brand">Rs. {actualEarnedRevenue}</p>
                <p className="text-sm font-semibold text-gray-500 uppercase mt-1">Earned Revenue</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div>
            <h2 className="text-xl font-bold text-dark mb-6 flex items-center gap-2"><Settings size={24}/> Financial Dashboard & Settings</h2>
            
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-8 flex flex-col md:flex-row items-end gap-4 max-w-3xl">
              <div className="flex-grow">
                <label className="block text-xs font-bold text-gray-500 mb-1">Standard Monthly Fee (Rs.)</label>
                <input type="number" value={fees.standard} onChange={e => setFees({...fees, standard: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:outline-none" />
              </div>
              <div className="flex-grow">
                <label className="block text-xs font-bold text-gray-500 mb-1">Premium Monthly Fee (Rs.)</label>
                <input type="number" value={fees.premium} onChange={e => setFees({...fees, premium: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:outline-none" />
              </div>
              <button onClick={handleSaveFees} disabled={isSavingFees} className="bg-dark text-white font-bold py-2.5 px-6 rounded-xl hover:bg-black shadow-md whitespace-nowrap">
                {isSavingFees ? 'Saving...' : 'Update Fees'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-brand to-green-700 text-white p-6 rounded-3xl shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-green-100 font-semibold uppercase text-xs tracking-wider mb-1">Platform Earned Revenue</p>
                    <h3 className="text-4xl font-extrabold">Rs. {actualEarnedRevenue}</h3>
                  </div>
                  <Banknote size={32} className="text-green-200 opacity-50" />
                </div>
                <p className="text-sm text-green-100 mb-4">Money collected from subscriptions AND per-order fees.</p>
<div className="bg-white/20 p-3 rounded-xl text-xs space-y-1">
  <div className="flex justify-between border-b border-green-600/50 pb-1 mb-1">
    <span>Standard Subs:</span>
    <span>{paidStandardCount} x Rs. {fees.standard}</span>
  </div>
  <div className="flex justify-between border-b border-green-600/50 pb-1 mb-1">
    <span>Premium Subs:</span>
    <span>{paidPremiumCount} x Rs. {fees.premium}</span>
  </div>
  <div className="flex justify-between font-bold">
    <span>Order Fees (Delivered):</span>
    <span>Rs. {totalPlatformFees}</span>
  </div>
</div>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 font-semibold uppercase text-xs tracking-wider mb-1">Expected Monthly Revenue</p>
                    <h3 className="text-3xl font-extrabold text-dark">Rs. {expectedMonthlyRevenue}</h3>
                  </div>
                  <TrendingUp size={32} className="text-brand opacity-30" />
                </div>
                <p className="text-sm text-gray-600 mb-4">Total potential revenue if all active sellers pay their monthly fee.</p>
                
                <div className="bg-white border border-gray-200 p-3 rounded-xl text-sm flex justify-between mb-4">
                  <div>
                    <p className="font-bold text-dark">{paidSellersCount} / {approvedSellers.length}</p>
                    <p className="text-xs text-gray-500">Sellers Paid</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-alert">{unpaidSellersCount}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
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

        {activeTab === 'ads' && (
          <div>
            <h2 className="text-xl font-bold text-dark mb-6">Manage Advertisements</h2>
            
            <form onSubmit={handleAddAd} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 max-w-3xl">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ad Title (Internal)</label>
                  <input type="text" required value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} placeholder="e.g. Eid Sale - Premium Cakes" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Link to Product ID (Optional)</label>
                  <input type="text" value={newAd.productId} onChange={e => setNewAd({...newAd, productId: e.target.value})} placeholder="e.g. prod-123" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand focus:outline-none" />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 mb-1">Upload Ad Banner Image (Required)</label>
                <input type="file" accept="image/*" required onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20" />
                {newAd.imageBase64 && <img src={newAd.imageBase64} alt="Preview" className="mt-3 h-32 object-contain rounded-lg border" />}
              </div>

              <button type="submit" disabled={isUploadingAd} className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 shadow-md flex items-center justify-center gap-2">
                <Megaphone size={18} /> {isUploadingAd ? 'Publishing Ad...' : 'Create Advertisement'}
              </button>
            </form>

            <h3 className="font-bold text-lg text-dark mb-4 border-t border-gray-100 pt-6">Active Ads ({ads.length}/5)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {ads.length === 0 ? (
                <p className="text-gray-500 col-span-full">No ads created yet.</p>
              ) : ads.map(ad => (
                <div key={ad.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative">
                  <img src={ad.imageBase64} alt={ad.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                  <p className="font-bold text-dark">{ad.title}</p>
                  <p className="text-xs text-gray-500 mb-3">Product ID: {ad.productId || 'General Link'}</p>
                  <button onClick={() => handleDeleteAd(ad.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
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

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2"><Flag className="text-alert"/> Buyer Reports</h2>
              
              {reports.filter(r => r.status !== 'resolved').length === 0 ? (
                <div className="bg-green-50 text-brand p-6 rounded-xl border border-green-200 text-center font-bold mb-8">
                  No active reports. The platform is safe!
                </div>
              ) : (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-500 uppercase text-sm mb-3">Action Needed ({reports.filter(r => r.status !== 'resolved').length})</h3>
                  <div className="space-y-4">
                    {reports.filter(r => r.status !== 'resolved').map(report => (
                      <div key={report.id} className="p-4 border border-red-100 bg-red-50 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-lg text-alert">{report.reason}</h3>
                          <p className="text-sm text-gray-700">Target: <strong>{report.targetName}</strong> ({report.targetType})</p>
                          <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded-lg border border-red-100">"{report.details}"</p>
                          <p className="text-xs text-gray-500 mt-1">Reported on: {new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={async () => {
                            await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
                            fetchData();
                          }} className="px-4 py-2 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand/90 shadow-sm">
                            Mark Resolved
                          </button>
                          <button onClick={async () => {
                            if(window.confirm("Delete this report permanently?")) {
                              await deleteDoc(doc(db, 'reports', report.id));
                              fetchData();
                            }
                          }} className="p-2 bg-white text-alert rounded-lg border border-red-200 hover:bg-red-50">
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reports.filter(r => r.status === 'resolved').length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-500 uppercase text-sm mb-3">Resolved History</h3>
                  <div className="space-y-2">
                    {reports.filter(r => r.status === 'resolved').map(report => (
                      <div key={report.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center opacity-70">
                        <div>
                          <p className="text-sm font-bold text-gray-600 line-through">{report.reason}</p>
                          <p className="text-xs text-gray-500">{report.targetName}</p>
                        </div>
                        <span className="text-xs font-bold text-brand bg-green-100 px-2 py-1 rounded">RESOLVED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            <tr key={seller.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleOpenSeller(seller)}>
              <td className="p-3">
                <p className="font-bold text-dark">{seller.storeName}</p>
                <p className="text-xs text-gray-500">{seller.fullName} | {seller.phone}</p>
              </td>
              <td className="p-3 flex flex-col gap-2 items-start">
                {seller.isFrozen ? <span className="text-alert font-bold text-xs bg-red-50 px-2 py-1 rounded">FROZEN</span> : <span className="text-brand font-bold text-xs bg-green-50 px-2 py-1 rounded">ACTIVE</span>}
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${seller.feeStatus === 'paid' ? 'border-brand text-brand bg-green-50' : 'border-yellow-500 text-yellow-600 bg-yellow-50'}`}>
                  Fee: {seller.feeStatus === 'paid' ? 'PAID' : 'PENDING'}
                </span>
              </td>
              <td className="p-3 text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleOpenEdit(seller)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Edit Store"><Edit3 size={16} /></button>
                <button onClick={() => window.open(`#/store/${seller.id}`, '_blank')} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="View Store"><ExternalLink size={16} /></button>
                <button onClick={() => toggleFreeze(seller.id, seller.isFrozen)} className={`p-2 rounded-lg text-white ${seller.isFrozen ? 'bg-brand' : 'bg-yellow-500'}`} title="Freeze/Unfreeze">
                  {seller.isFrozen ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
                </button>
                <button onClick={() => handleDeleteStore(seller.id)} className="p-2 bg-red-50 text-alert rounded-lg hover:bg-red-100" title="Delete Store"><Trash2 size={16} /></button>
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
