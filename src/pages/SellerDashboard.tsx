import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, Store, User, PlusCircle, CheckCircle, XCircle, MessageCircle, Truck, Facebook, Instagram, Globe, ShieldAlert, Star, CreditCard, Box, CheckSquare, X, MessageSquare, Plus, Trash2 } from 'lucide-react';
import emailjs from '@emailjs/browser';

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'store' | 'subscription' | 'profile'>('orders');
  
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'dispatched' | 'delivered' | 'cancelled'>('all');

  const [storeBio, setStoreBio] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState('');
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', tiktok: '' });
  const [storeMsg, setStoreMsg] = useState('');

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState(''); 
  const [discountPercent, setDiscountPercent] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productDeliveryFee, setProductDeliveryFee] = useState('');
  const [category, setCategory] = useState('');
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<FileList | null>(null);
  const [productMsg, setProductMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const [variants, setVariants] = useState<any[]>([]);
  const [dispatchModal, setDispatchModal] = useState({ isOpen: false, orderId: '', courier: 'TCS', tracking: '' });

  // NEW: Custom Edit Modal State for Stock & Discount
  const [editModal, setEditModal] = useState({ isOpen: false, productId: '', type: 'stock', value: '' });

  const defaultCategories = [
    "Cakes & Bakes", "Handmade Jewelry", "Crafts & Decor", "Embroidered Items", 
    "Candles", "Gift Hampers", "Customized Mugs & Photo Frames", "Resin Art & Keychains", 
    "Wedding and Festive Sweets", "Home Decor", "Essential Oils & Natural Hair Care"
  ];

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const docSnap = await getDoc(doc(db, 'sellers', currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStore(data);
        setStoreBio(data.bio || '');
        setStoreAddress(data.storeAddress || '');
        setPaymentAccounts(data.paymentAccounts || '');
        setSocialLinks(data.socialLinks || { facebook: '', instagram: '', tiktok: '' });
      }

      const prodQ = query(collection(db, 'products'), where('sellerId', '==', currentUser.uid));
      const prodSnap = await getDocs(prodQ);
      const productsData = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      productsData.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setProducts(productsData);

      const orderQ = query(collection(db, 'orders'), where('sellerId', '==', currentUser.uid));
      const orderSnap = await getDocs(orderQ);
      const ordersData = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ordersData);

      const catSnap = await getDocs(collection(db, 'categories'));
      const cats = catSnap.docs.map(d => d.data().name);
      const finalCats = cats.length > 0 ? cats : defaultCategories;
      
      setAvailableCategories(finalCats);
      // Force select the first one to prevent mobile dropdown crash
      if (finalCats.length > 0 && !category) setCategory(finalCats[0]);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

const handleUpdateStore = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentUser) return;
  setStoreMsg('Saving...');
  await updateDoc(doc(db, 'sellers', currentUser.uid), {
    bio: storeBio,
    storeAddress: storeAddress,
    paymentAccounts: paymentAccounts,
    socialLinks: socialLinks
  });
  setStoreMsg('Store updated successfully!');
  fetchData();
  setTimeout(() => setStoreMsg(''), 3000);
};

const handleAddProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentUser || !store) return;
  if (!productImages || productImages.length === 0) return setProductMsg('Please select at least 1 image.');

  setUploading(true);
  try {
    const imageUrls: string[] = [];
    for (let i = 0; i < productImages.length; i++) {
      const base64 = await compressImage(productImages[i]);
      imageUrls.push(base64);
    }

    const newProduct = {
      sellerId: currentUser.uid, 
      storeName: store.storeName,
      title, 
      description: productDescription,
      price: Number(price), 
      stock: Number(stock),
      discountPercent: Number(discountPercent) || 0,
      deliveryFee: Number(productDeliveryFee) || 0,
      category,
      isPremium: false, 
      images: imageUrls, 
      image: imageUrls[0],
      variants: variants,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'products'), newProduct);
    setProducts([{ id: docRef.id, ...newProduct }, ...products]);
    setProductMsg('Product added successfully!');
    setTitle(''); setPrice(''); setStock(''); setDiscountPercent(''); setProductDescription(''); setProductDeliveryFee(''); setProductImages(null); setVariants([]);
    (document.getElementById('product-images') as HTMLInputElement).value = '';
    setTimeout(() => setProductMsg(''), 3000);
  } catch (error) {
    setProductMsg('Error adding product.');
  } finally {
    setUploading(false);
  }
};

const openEditModal = (productId: string, type: 'stock' | 'discount', currentValue: number | undefined) => {
  setEditModal({ isOpen: true, productId, type, value: (currentValue || 0).toString() });
};

const handleEditSubmit = async () => {
  if (!editModal.productId || editModal.value === '') return;
  const val = Number(editModal.value);
  if (isNaN(val)) return alert("Please enter a valid number.");

  if (editModal.type === 'stock') {
    await updateDoc(doc(db, 'products', editModal.productId), { stock: Math.max(0, val) });
  } else {
    await updateDoc(doc(db, 'products', editModal.productId), { discountPercent: Math.min(100, Math.max(0, val)) });
  }
  
  setEditModal({ isOpen: false, productId: '', type: 'stock', value: '' });
  fetchData();
};

const updateOrderStatus = async (orderId: string, newStatus: string, extraData = {}) => {
  await updateDoc(doc(db, 'orders', orderId), { status: newStatus, ...extraData });

  if (newStatus === 'delivered') {
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
      if (order.items) {
        for (const item of order.items) {
          try {
            const productRef = doc(db, 'products', item.productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              const productData = productSnap.data();
              const currentStock = Number(productData.stock) || 0;
              const newStock = Math.max(0, currentStock - item.qty); 
              
              let updatedVariants = productData.variants || [];
              if (item.selectedSize || item.selectedColor) {
                updatedVariants = updatedVariants.map((v: any) => {
                  if (v.size === item.selectedSize && v.color === item.selectedColor) {
                    return { ...v, qty: Math.max(0, v.qty - item.qty) };
                  }
                  return v;
                });
              }
              await updateDoc(productRef, { stock: newStock, variants: updatedVariants });
            }
          } catch (err) { console.error("Stock update failed", err); }
        }
      }

      if (order.referredBy && !order.referralPaid) {
        try {
          const referrerRef = doc(db, 'users', order.referredBy);
          const referrerSnap = await getDoc(referrerRef);
          if (referrerSnap.exists()) {
            const currentBalance = referrerSnap.data().walletBalance || 0;
            await updateDoc(referrerRef, { walletBalance: currentBalance + 100 });
            await updateDoc(doc(db, 'orders', orderId), { referralPaid: true });
          }
        } catch (err) { console.error("Failed to pay referrer:", err); }
      }
    }
  }
  fetchData();
};

const handlePaymentReceived = async (orderId: string) => {
  await updateOrderStatus(orderId, 'accepted', { paymentVerified: true });
};

const openDispatchModal = (orderId: string) => {
  setDispatchModal({ isOpen: true, orderId, courier: 'TCS', tracking: '' });
};

const handleDispatchSubmit = async () => {
  if (!dispatchModal.tracking.trim()) return alert('Please enter a tracking number.');
  await updateOrderStatus(dispatchModal.orderId, 'dispatched', { 
    courierName: dispatchModal.courier, 
    trackingNumber: dispatchModal.tracking 
  });
  setDispatchModal({ isOpen: false, orderId: '', courier: 'TCS', tracking: '' });
};

const handleContactAdmin = async () => {
  if (!currentUser) return;
  try {
    const adminQ = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminSnap = await getDocs(adminQ);
    if (adminSnap.empty) return alert("Admin account not found.");
    
    const adminId = adminSnap.docs[0].id;
    const chatId = [currentUser.uid, adminId].sort().join('_');
    
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants: [currentUser.uid, adminId],
        lastMessage: "Started a conversation with Admin Support",
        updatedAt: serverTimestamp(),
        unreadCount: { [currentUser.uid]: 0, [adminId]: 0 }
      });
    }
    navigate(`/chat/${chatId}`);
  } catch (error) {
    console.error(error);
    alert("Failed to connect to Admin.");
  }
};

const handleWhatsAppNotify = (order: any) => {
  let paymentInstructions = "";
  if (order.paymentMethod !== 'COD') {
    paymentInstructions = `\nPlease send the payment via ${order.paymentMethod} to:\n${store.paymentAccounts || '[Seller needs to set account details]'}\n`;
  }

  const text = `Assalam-o-Alaikum ${order.buyerName},\n\nYour order from ${store.storeName} has been CONFIRMED.\n\nOrder ID: #${order.trackingToken.slice(0,8).toUpperCase()}\n\nSubtotal: Rs. ${order.subtotal || order.total}\nDelivery Fees: Rs. ${order.deliveryFee || 0}\nTotal Bill: Rs. ${order.total}\n\nPayment Method: ${order.paymentMethod}\n${paymentInstructions}\nTrack your order here:\nhttps://medicalbank-admin.github.io/KorBazar/#/track/${order.trackingToken}\n\nThank you for supporting a local seller!\n- ${store.storeName} via KorBazar`;
  
  const cleanNumber = order.buyerWhatsapp.replace(/^0/, '');
  window.open(`https://wa.me/92${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
  
  updateOrderStatus(order.id, 'accepted', { whatsappNotifiedAt: new Date().toISOString() });

  if (order.buyerEmail) {
    emailjs.send(
      'service_q90wxjm',       
      'template_bu0a3in',      
      {
        to_name: order.buyerName,
        to_email: order.buyerEmail, 
        order_id: order.trackingToken.slice(0, 8).toUpperCase(),
        order_subtotal: order.subtotal || order.total,          
        order_shipping: order.deliveryFee || 0,    
        order_total: order.total,
        payment_method: order.paymentMethod,
        tracking_link: `https://medicalbank-admin.github.io/KorBazar/#/track/${order.trackingToken}`,
      },
      'yw7E81OSHpJ2l0jJm'        
    ).catch(err => console.error("Email failed:", err));
  }
};

if (loading) return <div className="p-8 text-center text-dark">Loading dashboard...</div>;
if (!store) return <div className="p-8 text-center text-alert">You are not registered as a seller.</div>;

if (store.isFrozen) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="bg-red-50 border border-red-200 p-8 rounded-3xl text-center max-w-md">
        <ShieldAlert size={64} className="text-alert mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-alert mb-2">Store Frozen</h2>
        <p className="text-gray-700 mb-6">Your store has been temporarily frozen by the Admin. Please contact support on WhatsApp.</p>
        <a href="https://wa.me/923390251147" target="_blank" rel="noreferrer" className="bg-alert text-white px-6 py-3 rounded-xl font-bold inline-block">Contact Admin</a>
      </div>
    </div>
  );
}

const pendingCount = orders.filter(o => o.status === 'new' || (o.status === 'accepted' && !o.paymentVerified && o.paymentMethod !== 'COD')).length;
const dispatchedCount = orders.filter(o => o.status === 'dispatched').length;
const deliveredCount = orders.filter(o => o.status === 'delivered').length;
const cancelledCount = orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length;

const filteredOrders = orders.filter(order => {
  if (orderFilter === 'all') return true;
  if (orderFilter === 'pending') return order.status === 'new' || (order.status === 'accepted' && !order.paymentVerified && order.paymentMethod !== 'COD');
  if (orderFilter === 'dispatched') return order.status === 'dispatched';
  if (orderFilter === 'delivered') return order.status === 'delivered';
  if (orderFilter === 'cancelled') return order.status === 'cancelled' || order.status === 'rejected';
  return true;
});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      
      {/* EDIT MODAL (Stock / Discount) */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="absolute top-4 right-4 text-gray-400 hover:text-alert"><X size={24} /></button>
            <h2 className="text-xl font-bold text-dark mb-4 capitalize">Update {editModal.type}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editModal.type === 'stock' ? 'New Stock Quantity' : 'Discount Percentage (0-100)'}
                </label>
                <input 
                  type="number" 
                  value={editModal.value} 
                  onChange={e => setEditModal({...editModal, value: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" 
                />
              </div>
              <button onClick={handleEditSubmit} className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 shadow-md">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {dispatchModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setDispatchModal({ ...dispatchModal, isOpen: false })} className="absolute top-4 right-4 text-gray-400 hover:text-alert"><X size={24} /></button>
            <h2 className="text-xl font-bold text-dark mb-4">Dispatch Order</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courier Service</label>
                <select value={dispatchModal.courier} onChange={e => setDispatchModal({...dispatchModal, courier: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50">
                  <option value="TCS">TCS</option>
                  <option value="Leopards">Leopards Courier</option>
                  <option value="M&P">M&P (BlueEx)</option>
                  <option value="Pakistan Post">Pakistan Post</option>
                  <option value="PostEx">PostEx</option>
                  <option value="Trax">Trax</option>
                  <option value="Call Courier">Call Courier</option>
                  <option value="Doorway">Doorway Delivery Service</option>
                  <option value="Local Rider">Local Rider</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                <input type="text" value={dispatchModal.tracking} onChange={e => setDispatchModal({...dispatchModal, tracking: e.target.value})} placeholder="e.g. TC123456789" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
              </div>
              <button onClick={handleDispatchSubmit} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-md flex items-center justify-center gap-2">
                <Truck size={18} /> Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">{store.storeName}</h1>
          <p className="text-gray-500 font-medium">Professional Seller Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/inbox')} className="bg-brand/10 text-brand px-4 py-2 rounded-xl font-semibold hover:bg-brand/20 transition-colors flex items-center gap-2">
            <MessageSquare size={18} /> My Inbox
          </button>
          <a href={`#/store/${currentUser?.uid}`} target="_blank" rel="noreferrer" className="bg-dark text-white px-6 py-2 rounded-xl font-semibold hover:bg-black transition-colors">View Store</a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-yellow-600">{pendingCount}</span>
          <span className="text-xs font-bold text-yellow-700 uppercase mt-1">Action Needed</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-blue-600">{dispatchedCount}</span>
          <span className="text-xs font-bold text-blue-700 uppercase mt-1">Dispatched</span>
        </div>
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-brand">{deliveredCount}</span>
          <span className="text-xs font-bold text-brand uppercase mt-1">Delivered</span>
        </div>
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-alert">{cancelledCount}</span>
          <span className="text-xs font-bold text-alert uppercase mt-1">Cancelled</span>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-8 border-b border-gray-200 pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'orders' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Package size={18}/> Orders</button>
        <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'products' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><PlusCircle size={18}/> Products</button>
        <button onClick={() => setActiveTab('store')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'store' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Store size={18}/> Settings</button>
        <button onClick={() => setActiveTab('subscription')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'subscription' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Star size={18}/> Subscription</button>
        <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'profile' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><User size={18}/> Profile</button>
      </div>

      {store.status !== 'approved' ? (
        <div className="bg-yellow-50 text-yellow-800 p-8 rounded-2xl border border-yellow-200 text-center">
          <h2 className="text-xl font-bold mb-2">Account Pending Approval</h2>
          <p>Your account is under review. Once approved, you can add products and manage your store.</p>
        </div>
      ) : (
        <div>
          {activeTab === 'orders' && (
            <div>
              <div className="flex overflow-x-auto gap-2 mb-6 scrollbar-hide">
                {['all', 'pending', 'dispatched', 'delivered', 'cancelled'].map(tab => (
                  <button key={tab} onClick={() => setOrderFilter(tab as any)} className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap capitalize transition-colors ${orderFilter === tab ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {tab === 'all' ? 'All Orders' : tab}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-2xl border border-gray-100 text-gray-500">No {orderFilter} orders found.</div>
                ) : filteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-dark">Order #{order.trackingToken.slice(0,6).toUpperCase()}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${order.status === 'new' ? 'bg-yellow-100 text-yellow-700' : order.status === 'delivered' ? 'bg-green-100 text-brand' : order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-alert' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                        {order.paymentVerified && <span className="text-xs font-bold text-brand bg-green-50 px-2 py-1 rounded-full">PAID</span>}
                      </div>
                      <p className="text-sm text-gray-600"><span className="font-semibold text-dark">Buyer:</span> {order.buyerName} ({order.buyerPhone})</p>
                      <p className="text-sm text-gray-600 mb-2"><span className="font-semibold text-dark">Address:</span> {order.buyerAddress}</p>
                      <div className="bg-gray-50 p-3 rounded-xl text-sm mb-2 border border-gray-100">
                        {order.items.map((i:any, idx:number) => (
                          <div key={idx}>
                            {i.qty}x {i.title} - Rs. {i.price}
                            {(i.selectedSize || i.selectedColor) && (
                              <span className="text-xs text-gray-500 ml-1">({i.selectedSize} {i.selectedColor})</span>
                            )}
                          </div>
                        ))}
                        <div className="mt-1 pt-1 border-t border-gray-200 text-gray-500 text-xs flex justify-between">
                          <span>Subtotal: Rs. {order.subtotal || order.total}</span>
                          <span>Delivery: Rs. {order.deliveryFee || 0}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="mt-1 pt-1 border-t border-gray-200 text-brand font-bold text-xs flex justify-between">
                            <span>Discount ({order.couponCode})</span>
                            <span>- Rs. {order.discountAmount}</span>
                          </div>
                        )}
                        {order.notes && <div className="text-brand font-semibold mt-1">Note: {order.notes}</div>}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-dark text-lg">Total: Rs. {order.total}</p>
                        <span className="text-xs font-bold uppercase bg-gray-200 px-2 py-1 rounded">{order.paymentMethod}</span>
                      </div>
                      {order.trackingNumber && (
                        <div className="mt-3 bg-blue-50 text-blue-800 text-xs p-2 rounded-lg border border-blue-200 font-semibold flex items-center gap-2">
                          <Box size={14} /> {order.courierName || 'Courier'}: {order.trackingNumber}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[200px] justify-center">
                      {order.status === 'new' && (
                        <>
                          <button onClick={() => handleWhatsAppNotify(order)} className="w-full bg-[#25D366] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#20bd5a]"><MessageCircle size={18}/> Accept & Notify</button>
                          <button onClick={() => updateOrderStatus(order.id, 'rejected', { rejectionReason: 'Out of stock' })} className="w-full bg-red-50 text-alert font-bold py-2.5 rounded-xl border border-red-200 hover:bg-red-100 flex items-center justify-center gap-2"><XCircle size={18}/> Reject</button>
                        </>
                      )}
                      {order.status === 'accepted' && (
                        <>
                          {order.paymentMethod !== 'COD' && !order.paymentVerified && (
                            <button onClick={() => handlePaymentReceived(order.id)} className="w-full bg-green-100 text-brand font-bold py-2.5 rounded-xl border border-green-200 hover:bg-green-200 flex items-center justify-center gap-2 mb-2">
                              <CheckSquare size={18}/> Mark Payment Received
                            </button>
                          )}
                          <button onClick={() => openDispatchModal(order.id)} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700"><Truck size={18}/> Mark Dispatched</button>
                        </>
                      )}
                      {order.status === 'dispatched' && (
                        <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full bg-brand text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand/90"><CheckCircle size={18}/> Mark Delivered</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
             <div className="grid lg:grid-cols-2 gap-8">
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                 <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2"><PlusCircle size={20}/> Add New Product</h2>
                 {productMsg && <div className={`p-3 rounded-lg text-sm mb-4 ${productMsg.includes('Error') ? 'bg-red-50 text-alert' : 'bg-green-50 text-brand'}`}>{productMsg}</div>}
                 
                 <form onSubmit={handleAddProduct} className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                     <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                     <textarea required value={productDescription} onChange={e => setProductDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" placeholder="Describe the item..." />
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs.)</label>
                       <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                       <input type="number" required value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" placeholder="e.g. 5" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                       <input type="number" min="0" max="100" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" placeholder="e.g. 10" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (Rs.)</label>
                       <input type="number" required value={productDeliveryFee} onChange={e => setProductDeliveryFee(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                       <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50">
                         {availableCategories.map(catName => (
                           <option key={catName} value={catName}>{catName}</option>
                         ))}
                       </select>
                     </div>
                   </div>

                                      {/* VARIANTS SECTION */}
                   <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                     <div className="flex justify-between items-center mb-3">
                       <label className="block text-sm font-bold text-dark">Product Variants (Sizes/Colors)</label>
                       <button 
                         type="button" 
                         onClick={() => setVariants([...variants, { size: '', color: '', qty: 1 }])}
                         className="text-xs bg-brand/10 text-brand px-3 py-1.5 rounded-lg font-bold hover:bg-brand/20 transition-colors flex items-center gap-1"
                       >
                         <Plus size={14} /> Add Variant
                       </button>
                     </div>
                     
                     {variants.length === 0 ? (
                       <p className="text-xs text-gray-500">No variants added. If this product has sizes or colors, add them here.</p>
                     ) : variants.map((v, index) => (
                       <div key={index} className="flex gap-2 items-center mb-2">
                         <input 
                           type="text" 
                           placeholder="Size (e.g. M, 42)" 
                           value={v.size} 
                           onChange={(e) => {
                             const newV = [...variants]; newV[index].size = e.target.value; setVariants(newV);
                           }} 
                           className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand focus:outline-none" 
                         />
                         <input 
                           type="text" 
                           placeholder="Color (e.g. Red)" 
                           value={v.color} 
                           onChange={(e) => {
                             const newV = [...variants]; newV[index].color = e.target.value; setVariants(newV);
                           }} 
                           className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand focus:outline-none" 
                         />
                         <input 
                           type="number" 
                           placeholder="Qty" 
                           value={v.qty} 
                           onChange={(e) => {
                             const newV = [...variants]; newV[index].qty = Number(e.target.value); setVariants(newV);
                           }} 
                           className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand focus:outline-none" 
                         />
                         <button 
                           type="button" 
                           onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                           className="p-2 text-alert hover:bg-red-50 rounded-lg"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     ))}
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (Max 3)</label>
                     <input id="product-images" type="file" multiple accept="image/*" required onChange={e => setProductImages(e.target.files)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20" />
                   </div>
                   <button type="submit" disabled={uploading} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 shadow-md disabled:bg-gray-400">
                     {uploading ? 'Saving...' : 'Save Product'}
                   </button>
                 </form>
               </div>

               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                 <h2 className="text-xl font-bold text-dark mb-4">Your Listed Products ({products.length})</h2>
                 <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                   {products.length === 0 ? <p className="text-gray-500 text-sm">No products listed yet.</p> : products.map(p => (
                     <div key={p.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <img src={p.image} alt={p.title} className="w-16 h-16 object-cover rounded-lg" />
                       <div className="flex-grow">
                         <h4 className="font-bold text-dark">{p.title}</h4>
                         <p className="text-sm text-brand font-semibold">Rs. {p.price} <span className="text-gray-400 text-xs ml-2">+ Rs. {p.deliveryFee || 0} Delivery</span></p>
                         
                         <div className="flex flex-wrap items-center gap-2 mt-1">
                           <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(p.stock) > 0 ? 'bg-green-100 text-brand' : 'bg-red-100 text-alert'}`}>
                             Stock: {p.stock !== undefined ? p.stock : 'N/A'}
                           </span>
                           <button onClick={() => openEditModal(p.id, 'stock', p.stock)} className="text-blue-600 text-xs font-bold hover:underline mr-2">Edit</button>
                           
                           <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                             Disc: {p.discountPercent || 0}%
                           </span>
                           <button onClick={() => openEditModal(p.id, 'discount', p.discountPercent)} className="text-blue-600 text-xs font-bold hover:underline">Edit</button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'store' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
              <h2 className="text-xl font-bold text-dark mb-4">Store Settings</h2>
              {storeMsg && <div className="bg-green-50 text-brand p-3 rounded-lg text-sm mb-4">{storeMsg}</div>}
              <form onSubmit={handleUpdateStore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name (Locked)</label>
                  <input type="text" disabled value={store.storeName} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Bio</label>
                  <textarea value={storeBio} onChange={e => setStoreBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Accounts</label>
                  <input type="text" value={paymentAccounts} onChange={e => setPaymentAccounts(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" placeholder="e.g. JazzCash: 03001234567" />
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="font-semibold text-dark mb-3">Social Media Links</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Facebook size={20} className="text-blue-600" />
                      <input type="url" placeholder="Facebook URL" value={socialLinks.facebook} onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})} className="flex-grow px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Instagram size={20} className="text-pink-600" />
                      <input type="url" placeholder="Instagram URL" value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} className="flex-grow px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={20} className="text-dark" />
                      <input type="url" placeholder="TikTok URL" value={socialLinks.tiktok} onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})} className="flex-grow px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none text-sm" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="bg-brand text-white font-bold py-3.5 px-8 rounded-xl hover:bg-brand/90 shadow-md mt-4">Save Settings</button>
              </form>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
              <h2 className="text-xl font-bold text-dark mb-6 flex items-center gap-2"><CreditCard /> Subscription Plan</h2>
              <div className={`border rounded-2xl p-6 ${store.plan === 'premium' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Star size={28} className={store.plan === 'premium' ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                  <h3 className="text-2xl font-bold text-dark capitalize">{store.plan || 'standard'} Plan</h3>
                </div>
                {store.plan === 'premium' ? (
                  <div className="mt-4">
                    <p className="text-gray-700 text-sm mb-4">Your store is currently featured on the Homepage. Keep providing great service!</p>
                    <span className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Active Premium Status</span>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-gray-700 text-sm mb-4">Upgrade to Premium to feature your products on the Homepage and get more visibility!</p>
                    <a href={`https://wa.me/923390251147?text=${encodeURIComponent(`Assalam-o-Alaikum, I want to upgrade my store "${store.storeName}" to the Premium plan on KorBazar.`)}`} target="_blank" rel="noreferrer" className="inline-block bg-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors">Contact Admin to Upgrade</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
              <h2 className="text-xl font-bold text-dark mb-4">My Profile</h2>
              <div className="space-y-4 text-gray-700">
                <p><span className="font-semibold text-dark">Full Name:</span> {store.fullName}</p>
                <p><span className="font-semibold text-dark">CNIC:</span> {store.cnicNumber}</p>
                <p><span className="font-semibold text-dark">Phone:</span> {store.phone}</p>
                <p><span className="font-semibold text-dark">City:</span> {store.city}, {store.area}</p>
                
                <div className="pt-4 border-t border-gray-100 mt-4">
                  <button onClick={handleContactAdmin} className="w-full bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 shadow-md flex items-center justify-center gap-2">
                    <MessageSquare size={20} /> Chat with Admin Support
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
                                      }
