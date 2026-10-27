import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, Store, User, PlusCircle, CheckCircle, XCircle, MessageCircle, Truck, Facebook, Instagram, Globe, ShieldAlert, Star, CreditCard, Box, CheckSquare, X, MessageSquare, Plus, Trash2, FileText, RotateCcw, Sparkles, LayoutDashboard, Menu, Wallet, Banknote, History } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { uploadToCloudinary } from '../utils/Cloudinary';
import { generateAgreementPDF } from '../utils/generateAgreement';

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
  children?: CategoryNode[];
};

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'store' | 'subscription' | 'profile' | 'qa' | 'finances'>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'dispatched' | 'delivered' | 'returned' | 'cancelled'>('all');

  const [financeFilter, setFinanceFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const [showAgreement, setShowAgreement] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);

  const [storeBio, setStoreBio] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState('');
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', tiktok: '' });
  const [storeMsg, setStoreMsg] = useState('');
  const [acceptsCod, setAcceptsCod] = useState(true);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productDeliveryFee, setProductDeliveryFee] = useState('');
  const [category, setCategory] = useState('');
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [brand, setBrand] = useState('');
  const [material, setMaterial] = useState('');
  const [style, setStyle] = useState('');
  const [highlights, setHighlights] = useState('');
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [productImages, setProductImages] = useState<FileList | null>(null);
  const [productMsg, setProductMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);

  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const [dispatchModal, setDispatchModal] = useState({ isOpen: false, orderId: '', courier: 'TCS', tracking: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, productId: '', type: 'stock', value: '' });
  const [rejectOrderModal, setRejectOrderModal] = useState({ isOpen: false, orderId: '', reason: 'Out of stock' });

  const defaultCategories = [
    "Cakes & Bakes", "Handmade Jewelry", "Crafts & Decor", "Embroidered Items",
    "Candles", "Gift Hampers", "Customized Mugs & Photo Frames", "Resin Art & Keychains",
    "Wedding and Festive Sweets", "Home Decor", "Essential Oils & Natural Hair Care"
  ];

  const buildCategoryTree = (categories: CategoryNode[]): any[] => {
    const byId = new Map<string, any>();
    categories.forEach((cat) => {
      byId.set(cat.id, { ...cat, children: [] });
    });

    const roots: any[] = [];

    categories.forEach((cat) => {
      const node = byId.get(cat.id);
      if (!node) return;

      if (cat.parentId) {
        const parent = byId.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    const sortChildren = (items: any[]): any[] =>
      [...items]
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .map((item) => ({
          ...item,
          children: sortChildren(item.children || []),
        }));

    return sortChildren(roots);
  };

  const filteredOrdersForFinance = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      
      if (financeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      }
      if (financeFilter === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return orderDate >= monthAgo;
      }
      if (financeFilter === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return orderDate >= yearAgo;
      }
      return true;
    });
  }, [orders, financeFilter]);

  const financeStats = useMemo(() => {
    const deliveredOrders = filteredOrdersForFinance.filter(o => o.status === 'delivered');
    const totalCollected = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // FIXED: Total Pending now only counts dispatched orders
    const pendingOrders = filteredOrdersForFinance.filter(o => o.status === 'dispatched');
    const totalPending = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const returnedOrders = filteredOrdersForFinance.filter(o => o.status === 'returned');
    const totalReturned = returnedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    const totalToPay = deliveredOrders.length * 10;
    const totalPaid = store?.orderFeePaid || 0;

    return {
      totalCollected,
      totalPending,
      totalReturned,
      totalToPay,
      totalPaid,
      deliveredCount: deliveredOrders.length,
      pendingCount: pendingOrders.length,
      returnedCount: returnedOrders.length
    };
  }, [filteredOrdersForFinance, store]);
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
      setAcceptsCod(data.acceptsCod !== false);

      if (!data.agreementSigned) {
        setShowAgreement(true);
      }
    }

    const prodQ = query(collection(db, 'products'), where('sellerId', '==', currentUser.uid));
    const prodSnap = await getDocs(prodQ);
    const productsData = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    productsData.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setProducts(productsData);

    const orderQ = query(collection(db, 'orders'), where('sellerId', '==', currentUser.uid));
    const orderSnap = await getDocs(orderQ);
    const ordersData = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    ordersData.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setOrders(ordersData);

    const questionQ = query(collection(db, 'questions'), where('sellerId', '==', currentUser.uid));
    const questionSnap = await getDocs(questionQ);
    const questionsData = questionSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    questionsData.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setQuestions(questionsData);

    const catSnap = await getDocs(collection(db, 'categories'));
    const categoryDocs = catSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || 'Unnamed',
        parentId: data.parentId ?? null,
      };
    });

    const tree = buildCategoryTree(categoryDocs as CategoryNode[]);
    setCategoryTree(tree);

    if (categoryDocs.length > 0 && !category) {
      setCategory(categoryDocs[0].name);
    }

  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [currentUser]);

const handleUpdateStore = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentUser) return;
  setStoreMsg('Saving...');
  await updateDoc(doc(db, 'sellers', currentUser.uid), {
    bio: storeBio,
    storeAddress: storeAddress,
    paymentAccounts: paymentAccounts,
    socialLinks: socialLinks,
    acceptsCod: acceptsCod
  });
  setStoreMsg('Store updated successfully!');
  fetchData();
  setTimeout(() => setStoreMsg(''), 3000);
};

const handleSignAgreement = async () => {
  if (!hasAgreed) return alert("Please check the box to agree to the terms.");
  if (!currentUser) return;
  
  try {
    await updateDoc(doc(db, 'sellers', currentUser.uid), { 
      agreementSigned: true,
      agreementSignedAt: new Date().toISOString()
    });
    setShowAgreement(false);
  } catch (error) {
    alert("Failed to save agreement.");
  }
};

const handleAnswerSubmit = async (questionId: string) => {
  if (!answerText.trim()) return alert('Please type an answer.');
  try {
    await updateDoc(doc(db, 'questions', questionId), { answer: answerText });
    setAnswerText('');
    setAnsweringId(null);
    fetchData();
  } catch (error) {
    alert('Failed to submit answer.');
  }
};

const handleAddProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentUser || !store) return;
  if (!productImages || productImages.length === 0) return setProductMsg('Please select at least 1 image.');

  setUploading(true);
  try {
    const imageUrls: string[] = [];
    for (let i = 0; i < productImages.length; i++) {
      const url = await uploadToCloudinary(productImages[i]);
      imageUrls.push(url);
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
      isCustomizable: isCustomizable,
      brand: brand || 'No Brand',
      material: material || 'Standard',
      style: style || 'Modern',
      highlights: highlights || '',
      images: imageUrls,
      image: imageUrls[0],
      variants: variants,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'products'), newProduct);
    setProducts([{ id: docRef.id, ...newProduct }, ...products]);
    setProductMsg('Product added successfully!');
    
    setTitle(''); setPrice(''); setStock(''); setDiscountPercent(''); setProductDescription(''); setProductDeliveryFee('');
    setIsCustomizable(false); setBrand(''); setMaterial(''); setStyle(''); setHighlights('');
    setProductImages(null); setVariants([]);
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

const handleOpenRejectOrder = (orderId: string) => {
  setRejectOrderModal({ isOpen: true, orderId, reason: 'Out of stock' });
};

const handleConfirmRejectOrder = async () => {
  if (!rejectOrderModal.reason.trim()) return alert('Please select a reason.');
  await updateOrderStatus(rejectOrderModal.orderId, 'rejected', { rejectionReason: rejectOrderModal.reason });
  setRejectOrderModal({ isOpen: false, orderId: '', reason: 'Out of stock' });
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
  if (orderFilter === 'returned') return order.status === 'returned';
  if (orderFilter === 'cancelled') return order.status === 'cancelled' || order.status === 'rejected';
  return true;
});

const NavItem = ({ icon: Icon, label, tab, badge }: any) => {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
        isActive 
          ? 'bg-brand text-white shadow-md shadow-brand/20' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-dark'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
        {label}
      </div>
      {badge > 0 && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-brand' : 'bg-red-500 text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  );
};

return (
  <div className="min-h-screen bg-[#f4f5f7] flex relative font-sans">
    
    {isSidebarOpen && (
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
        onClick={() => setIsSidebarOpen(false)} 
      />
    )}

    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl
        md:relative md:translate-x-0 md:shadow-sm md:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      
      <div className="p-5 border-b border-gray-100 flex flex-col items-start justify-center bg-white relative">
        <button 
          onClick={() => setIsSidebarOpen(false)} 
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:text-dark md:hidden"
        >
          <X size={20} />
        </button>
        
        <h1 className="text-2xl font-extrabold text-dark tracking-tight">Seller Center</h1>
        <span className="text-[10px] font-extrabold text-brand tracking-wider uppercase bg-brand/10 px-2 py-0.5 rounded-md mt-1">
          KorBazar
        </span>
      </div>

      <div className="p-3 flex-grow overflow-y-auto space-y-1">
        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Manage Store</p>
        <NavItem icon={LayoutDashboard} label="Orders" tab="orders" badge={pendingCount} />
        <NavItem icon={PlusCircle} label="Products" tab="products" />
        <NavItem icon={MessageSquare} label="Q&A Support" tab="qa" badge={questions.filter(q => !q.answer).length} />
        
        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Finances</p>
        <NavItem icon={Wallet} label="My Finances" tab="finances" />

        <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Settings</p>
        <NavItem icon={Store} label="Store Profile" tab="store" />
        <NavItem icon={Star} label="Subscription" tab="subscription" />
        <NavItem icon={User} label="My Account" tab="profile" />

        <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
          <button onClick={() => navigate('/inbox')} className="w-full flex items-center gap-2 text-gray-600 px-4 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-sm">
            <MessageSquare size={20} className="text-gray-400" /> My Inbox
          </button>
          <a href={`#/store/${currentUser?.uid}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-dark text-white px-4 py-3 rounded-xl font-semibold hover:bg-black transition-colors text-sm">
            View Storefront
          </a>
        </div>
      </div>
    </aside>
    <main className="flex-grow p-4 md:p-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto overflow-hidden">
  
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setIsSidebarOpen(true)} 
        className="md:hidden p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 text-dark hover:bg-gray-50 transition-colors"
      >
        <Menu size={24} />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-dark">{store.storeName}</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back to your seller dashboard.</p>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
       <button 
         onClick={() => generateAgreementPDF(store)} 
         className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
       >
         <FileText size={18} /> Guide & Agreement
       </button>
    </div>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-brand transition-colors" onClick={() => { setActiveTab('orders'); setOrderFilter('pending'); }}>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Action Needed</p>
        <p className="text-2xl font-extrabold text-yellow-600">{pendingCount}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600"><Package size={20} /></div>
    </div>

    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-brand transition-colors" onClick={() => { setActiveTab('orders'); setOrderFilter('dispatched'); }}>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Dispatched</p>
        <p className="text-2xl font-extrabold text-blue-600">{dispatchedCount}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Truck size={20} /></div>
    </div>

    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-brand transition-colors" onClick={() => { setActiveTab('orders'); setOrderFilter('delivered'); }}>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Delivered</p>
        <p className="text-2xl font-extrabold text-brand">{deliveredCount}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-brand"><CheckCircle size={20} /></div>
    </div>

    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-brand transition-colors" onClick={() => { setActiveTab('orders'); setOrderFilter('cancelled'); }}>
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Cancelled</p>
        <p className="text-2xl font-extrabold text-alert">{cancelledCount}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-alert"><XCircle size={20} /></div>
    </div>
  </div>

  {store.status !== 'approved' ? (
    <div className="bg-white text-yellow-800 p-8 rounded-2xl border border-yellow-200 text-center shadow-sm">
      <ShieldAlert size={48} className="mx-auto mb-4 text-yellow-500" />
      <h2 className="text-xl font-bold mb-2">Account Pending Approval</h2>
      <p className="text-sm">Your account is under review. Once approved, you can add products and manage your store.</p>
    </div>
  ) : (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 min-h-[500px]">
      
      {activeTab === 'finances' && (
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
            <h2 className="text-xl font-bold text-dark flex items-center gap-2">
              <Wallet className="text-brand" /> My Finances
            </h2>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['all', 'week', 'month', 'year'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFinanceFilter(filter as any)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                    financeFilter === filter 
                      ? 'bg-white text-dark shadow-sm' 
                      : 'text-gray-500 hover:text-dark'
                  }`}
                >
                  {filter === 'all' ? 'All Time' : `This ${filter}`}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg text-brand shadow-sm"><Banknote size={20} /></div>
                <p className="text-sm font-semibold text-gray-600">Total Amount Collected</p>
              </div>
              <p className="text-3xl font-extrabold text-brand">Rs. {financeStats.totalCollected}</p>
              <p className="text-xs text-gray-500 mt-1">From {financeStats.deliveredCount} delivered orders</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg text-yellow-600 shadow-sm"><History size={20} /></div>
                <p className="text-sm font-semibold text-gray-600">Total Amount Pending</p>
              </div>
              <p className="text-3xl font-extrabold text-yellow-600">Rs. {financeStats.totalPending}</p>
              <p className="text-xs text-gray-500 mt-1">From {financeStats.pendingCount} dispatched orders</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-2xl border border-red-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg text-alert shadow-sm"><RotateCcw size={20} /></div>
                <p className="text-sm font-semibold text-gray-600">Total Amount Returned</p>
              </div>
              <p className="text-3xl font-extrabold text-alert">Rs. {financeStats.totalReturned}</p>
              <p className="text-xs text-gray-500 mt-1">From {financeStats.returnedCount} returned orders</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><CreditCard size={20} /></div>
                <p className="text-sm font-semibold text-gray-600">Total Amount to Pay</p>
              </div>
              <p className="text-3xl font-extrabold text-blue-600">Rs. {financeStats.totalToPay}</p>
              <p className="text-xs text-gray-500 mt-1">Platform fee (Rs. 10 x {financeStats.deliveredCount} orders)</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-gray-600 shadow-sm"><CheckSquare size={20} /></div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Total Amount Paid to Platform</p>
                  <p className="text-3xl font-extrabold text-dark">Rs. {financeStats.totalPaid}</p>
                </div>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 text-center">
                <p className="text-xs text-gray-500 font-semibold mb-1">Outstanding Balance</p>
                <p className={`text-xl font-bold ${financeStats.totalToPay - financeStats.totalPaid > 0 ? 'text-alert' : 'text-brand'}`}>
                  Rs. {Math.max(0, financeStats.totalToPay - financeStats.totalPaid)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'orders' && (
  <div className="animate-in fade-in duration-300">
    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
      <h2 className="text-xl font-bold text-dark">Manage Orders</h2>
    </div>
    
    <div className="flex overflow-x-auto gap-2 mb-6 scrollbar-hide">
      {['all', 'pending', 'dispatched', 'delivered', 'returned', 'cancelled'].map(tab => (
        <button key={tab} onClick={() => setOrderFilter(tab as any)} className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap capitalize transition-colors ${orderFilter === tab ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {tab === 'all' ? 'All Orders' : tab}
        </button>
      ))}
    </div>

    <div className="space-y-4">
      {filteredOrders.length === 0 ? (
        <div className="bg-gray-50 p-12 text-center rounded-2xl border border-gray-100 text-gray-500">No {orderFilter} orders found.</div>
      ) : filteredOrders.map(order => (
        <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg text-dark">Order #{order.trackingToken?.slice(0,6).toUpperCase()}</h3>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${order.status === 'new' ? 'bg-yellow-100 text-yellow-700' : order.status === 'delivered' ? 'bg-green-100 text-brand' : order.status === 'returned' ? 'bg-orange-100 text-orange-700' : order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-alert' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
              {order.paymentVerified && <span className="text-[10px] font-bold text-brand bg-green-50 px-2 py-1 rounded-full border border-green-200">PAID</span>}
            </div>
            <p className="text-sm text-gray-600"><span className="font-semibold text-dark">Buyer:</span> {order.buyerName} ({order.buyerPhone})</p>
            <p className="text-sm text-gray-600 mb-3"><span className="font-semibold text-dark">Address:</span> {order.buyerAddress}</p>
            
            <div className="bg-gray-50 p-4 rounded-xl text-sm mb-3 border border-gray-100">
              {order.items?.map((i:any, idx:number) => (
                <div key={idx} className="mb-1 last:mb-0">
                  {i.qty}x {i.title} - Rs. {i.price}
                  {(i.selectedSize || i.selectedColor) && (
                    <span className="text-xs text-gray-500 ml-1">({i.selectedSize} {i.selectedColor})</span>
                  )}
                  {i.customizationNote && <div className="text-xs text-brand mt-0.5 font-medium">Customization: {i.customizationNote}</div>}
                </div>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500 text-xs flex justify-between">
                <span>Subtotal: Rs. {order.subtotal || order.total}</span>
                <span>Delivery: Rs. {order.deliveryFee || 0}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="mt-1 text-brand font-bold text-xs flex justify-between">
                  <span>Discount ({order.couponCode})</span>
                  <span>- Rs. {order.discountAmount}</span>
                </div>
              )}
              {order.notes && <div className="text-brand font-semibold mt-1 text-xs">Note: {order.notes}</div>}
            </div>
            
            <div className="flex flex-wrap gap-4 md:gap-6 mt-4 border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Buyer Pays</p>
                <p className="font-bold text-dark text-sm">Rs. {order.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Platform Fee</p>
                <p className="font-bold text-alert text-sm">- Rs. 10</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Your Net Payout</p>
                <p className="font-bold text-brand text-base">Rs. {order.total - 10}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 min-w-[220px] justify-center md:border-l border-gray-100 md:pl-6 mt-4 md:mt-0">
            {order.status === 'new' && (
              <>
                <button onClick={() => handleWhatsAppNotify(order)} className="w-full bg-[#25D366] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors shadow-sm text-sm"><MessageCircle size={18}/> Accept & Notify</button>
                <button onClick={() => handleOpenRejectOrder(order.id)} className="w-full bg-white text-alert font-bold py-2.5 rounded-xl border border-red-200 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors text-sm"><XCircle size={18}/> Reject</button>
              </>
            )}
            {order.status === 'accepted' && (
              <>
                {order.paymentMethod !== 'COD' && !order.paymentVerified && (
                  <button onClick={() => handlePaymentReceived(order.id)} className="w-full bg-green-50 text-brand font-bold py-2.5 rounded-xl border border-green-200 hover:bg-green-100 flex items-center justify-center gap-2 mb-2 transition-colors text-sm">
                    <CheckSquare size={18}/> Mark Payment Received
                  </button>
                )}
                <button onClick={() => openDispatchModal(order.id)} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm text-sm"><Truck size={18}/> Mark Dispatched</button>
              </>
            )}
            {order.status === 'dispatched' && (
              <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full bg-brand text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand/90 transition-colors shadow-sm text-sm"><CheckCircle size={18}/> Mark Delivered</button>
            )}
            {order.status === 'delivered' && (
              <button onClick={() => updateOrderStatus(order.id, 'returned')} className="w-full bg-orange-50 text-orange-700 font-bold py-2.5 rounded-xl border border-orange-200 hover:bg-orange-100 flex items-center justify-center gap-2 transition-colors text-sm">
                <RotateCcw size={18}/> Mark Returned
              </button>
            )}
            {order.trackingNumber && (
              <div className="mt-2 bg-gray-50 text-gray-700 text-xs p-2 rounded-lg border border-gray-200 text-center">
                <span className="font-semibold block mb-0.5">{order.courierName || 'Courier'}</span>
                <span className="font-mono">{order.trackingNumber}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{activeTab === 'products' && (
  <div className="animate-in fade-in duration-300 grid lg:grid-cols-2 gap-8">
    <div>
      <h2 className="text-xl font-bold text-dark mb-6 border-b border-gray-100 pb-4">Add New Product</h2>
      {productMsg && <div className={`p-3 rounded-lg text-sm mb-4 ${productMsg.includes('Error') ? 'bg-red-50 text-alert' : 'bg-green-50 text-brand'}`}>{productMsg}</div>}
      
      <form onSubmit={handleAddProduct} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" placeholder="e.g. Handmade Candle" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea required value={productDescription} onChange={e => setProductDescription(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" placeholder="Describe the item..." />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (Rs.)</label>
            <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock</label>
            <input type="number" required value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount (%)</label>
            <input type="number" min="0" max="100" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Delivery Fee</label>
            <input type="number" required value={productDeliveryFee} onChange={e => setProductDeliveryFee(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all">
              {categoryTree.length === 0 ? (
                defaultCategories.map((catName) => <option key={catName} value={catName}>{catName}</option>)
              ) : (
                categoryTree.map((main: any) => {
                  if (main.children && main.children.length > 0) {
                    return (
                      <optgroup key={main.id} label={main.name}>
                        {main.children.map((sub: any) => <option key={sub.id} value={sub.name}>{sub.name}</option>)}
                      </optgroup>
                    );
                  }
                  return <option key={main.id} value={main.name}>{main.name}</option>;
                })
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. No Brand" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Material</label>
            <input type="text" value={material} onChange={e => setMaterial(e.target.value)} placeholder="e.g. Wood" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Style</label>
            <input type="text" value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g. Modern" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Highlights (One per line)</label>
          <textarea value={highlights} onChange={e => setHighlights(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" placeholder="3D design adds depth&#10;Stylish gift" />
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-dark text-sm flex items-center gap-2"><Sparkles size={16} className="text-brand" /> Product Customization</h3>
            <p className="text-xs text-gray-600 mt-1">Allow buyers to request personalization.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input type="checkbox" checked={isCustomizable} onChange={(e) => setIsCustomizable(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
          </label>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-dark">Variants (Sizes/Colors)</label>
            <button type="button" onClick={() => setVariants([...variants, { size: '', color: '', qty: 1 }])} className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-1"><Plus size={14} /> Add</button>
          </div>
          
          {variants.length === 0 ? (
            <p className="text-xs text-gray-500">No variants added.</p>
          ) : variants.map((v, index) => (
            <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-center mb-2">
              <input type="text" placeholder="Size (M)" value={v.size} onChange={(e) => { const newV = [...variants]; newV[index].size = e.target.value; setVariants(newV); }} className="flex-1 min-w-[80px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand focus:outline-none" />
              <input type="text" placeholder="Color (Red)" value={v.color} onChange={(e) => { const newV = [...variants]; newV[index].color = e.target.value; setVariants(newV); }} className="flex-1 min-w-[80px] px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand focus:outline-none" />
              <input type="number" placeholder="Qty" value={v.qty} onChange={(e) => { const newV = [...variants]; newV[index].qty = Number(e.target.value); setVariants(newV); }} className="w-20 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:border-brand focus:outline-none" />
              <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="p-2 text-alert hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Images (Max 3)</label>
          <input id="product-images" type="file" multiple accept="image/*" required onChange={e => setProductImages(e.target.files)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 transition-colors cursor-pointer" />
        </div>
        
        <button type="submit" disabled={uploading} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 shadow-md disabled:bg-gray-400 transition-colors">
          {uploading ? 'Saving...' : 'Save Product'}
        </button>
      </form>
    </div>

    <div>
      <h2 className="text-xl font-bold text-dark mb-6 border-b border-gray-100 pb-4">Your Products ({products.length})</h2>
      <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
        {products.length === 0 ? <p className="text-gray-500 text-sm text-center py-8">No products listed yet.</p> : products.map(p => (
          <div key={p.id} className="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <img src={p.image} alt={p.title} className="w-20 h-20 object-cover rounded-lg border border-gray-100" />
            <div className="flex-grow">
              <h4 className="font-bold text-dark text-sm line-clamp-1">{p.title}</h4>
              <p className="text-sm text-brand font-semibold mt-0.5">Rs. {p.price} <span className="text-gray-400 text-xs font-normal">+ Rs. {p.deliveryFee || 0} Delivery</span></p>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(p.stock) > 0 ? 'bg-green-100 text-brand' : 'bg-red-100 text-alert'}`}>
                  Stock: {p.stock !== undefined ? p.stock : 'N/A'}
                </span>
                <button onClick={() => openEditModal(p.id, 'stock', p.stock)} className="text-blue-600 text-[10px] font-bold hover:underline">Edit Stock</button>
                
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  Disc: {p.discountPercent || 0}%
                </span>
                <button onClick={() => openEditModal(p.id, 'discount', p.discountPercent)} className="text-blue-600 text-[10px] font-bold hover:underline">Edit Disc</button>

                {p.isCustomizable && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1"><Sparkles size={10} /> Custom</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
                  {activeTab === 'qa' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-dark mb-6 border-b border-gray-100 pb-4">Customer Questions</h2>
                
                {questions.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">No questions asked yet.</div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div key={q.id} className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
                        <p className="text-xs text-brand font-bold mb-1">Product: {q.productTitle || 'Unknown Product'}</p>
                        <p className="font-bold text-dark text-base mb-1">Q: {q.question}</p>
                        <p className="text-xs text-gray-500 mb-4">Asked by {q.buyerName}</p>
                        
                        {q.answer ? (
                          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <p className="text-sm text-brand font-medium"><span className="font-bold">A:</span> {q.answer}</p>
                          </div>
                        ) : (
                          <div>
                            {answeringId === q.id ? (
                              <div className="space-y-3 mt-2">
                                <textarea 
                                  value={answerText} 
                                  onChange={e => setAnswerText(e.target.value)} 
                                  rows={3} 
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none text-sm" 
                                  placeholder="Type your answer here..."
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleAnswerSubmit(q.id)} className="bg-brand text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-brand/90 transition-colors">Submit Answer</button>
                                  <button onClick={() => { setAnsweringId(null); setAnswerText(''); }} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setAnsweringId(q.id)} className="text-[#1da1f2] text-sm font-bold hover:underline flex items-center gap-1"><MessageSquare size={14}/> Answer this question</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'store' && (
              <div className="animate-in fade-in duration-300 max-w-2xl">
                <h2 className="text-xl font-bold text-dark mb-6 border-b border-gray-100 pb-4">Store Settings</h2>
                {storeMsg && <div className="bg-green-50 text-brand p-3 rounded-lg text-sm mb-6 border border-green-100 font-medium">{storeMsg}</div>}
                
                <form onSubmit={handleUpdateStore} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Name (Locked)</label>
                    <input type="text" disabled value={store.storeName} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Address</label>
                    <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Store Bio</label>
                    <textarea value={storeBio} onChange={e => setStoreBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Accounts</label>
                    <input type="text" value={paymentAccounts} onChange={e => setPaymentAccounts(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none bg-white transition-all" placeholder="e.g. JazzCash: 03001234567" />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-dark text-sm">Accept Cash on Delivery (COD)</h3>
                      <p className="text-xs text-gray-500 mt-1">Allow buyers to pay when they receive the item.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" checked={acceptsCod} onChange={(e) => setAcceptsCod(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-semibold text-dark mb-4">Social Media Links</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Facebook size={20} className="text-blue-600" />
                        <input type="url" placeholder="Facebook URL" value={socialLinks.facebook} onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})} className="flex-grow px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none text-sm transition-all" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Instagram size={20} className="text-pink-600" />
                        <input type="url" placeholder="Instagram URL" value={socialLinks.instagram} onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})} className="flex-grow px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none text-sm transition-all" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe size={20} className="text-dark" />
                        <input type="url" placeholder="TikTok URL" value={socialLinks.tiktok} onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})} className="flex-grow px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none text-sm transition-all" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="bg-brand text-white font-bold py-3.5 px-8 rounded-xl hover:bg-brand/90 shadow-md mt-6">Save Settings</button>
                </form>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="animate-in fade-in duration-300 max-w-2xl">
                <h2 className="text-xl font-bold text-dark mb-6 border-b border-gray-100 pb-4">Subscription Plan</h2>
                <div className={`border rounded-2xl p-6 ${store.plan === 'premium' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Star size={28} className={store.plan === 'premium' ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                    <h3 className="text-2xl font-bold text-dark capitalize">{store.plan || 'standard'} Plan</h3>
                  </div>
                  {store.plan === 'premium' ? (
                    <div className="mt-4">
                      <p className="text-gray-700 text-sm mb-4">Your store is currently featured on the Homepage. Keep providing great service!</p>
                      <span className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm">Active Premium Status</span>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-gray-700 text-sm mb-4">Upgrade to Premium to feature your products on the Homepage and get more visibility!</p>
                      <a href={`https://wa.me/923390251147?text=${encodeURIComponent(`Assalam-o-Alaikum, I want to upgrade my store "${store.storeName}" to the Premium plan on KorBazar.`)}`} target="_blank" rel="noreferrer" className="inline-block bg-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors shadow-md">Contact Admin to Upgrade</a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-300 max-w-2xl">
                <h2 className="text-xl font-bold text-dark mb-6 border-b border-gray-100 pb-4">My Profile</h2>
                <div className="space-y-4 text-gray-700">
                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="font-semibold text-dark w-32">Full Name:</span>
                    <span>{store.fullName}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="font-semibold text-dark w-32">CNIC:</span>
                    <span>{store.cnicNumber}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="font-semibold text-dark w-32">Phone:</span>
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex border-b border-gray-100 pb-3">
                    <span className="font-semibold text-dark w-32">City:</span>
                    <span>{store.city}, {store.area}</span>
                  </div>
                  
                  <div className="pt-6 mt-2">
                    <button onClick={handleContactAdmin} className="w-full bg-dark text-white font-bold py-3.5 rounded-xl hover:bg-black shadow-md flex items-center justify-center gap-2 transition-colors">
                      <MessageSquare size={20} /> Chat with Admin Support
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        )}
      </main>

      {showAgreement && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 relative">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={40} />
              </div>
              <h2 className="text-2xl font-bold text-dark mb-2">Welcome to KorBazar!</h2>
              <p className="text-gray-600">Before you start selling, you must review and sign the official Seller Agreement.</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-600">
              <p className="mb-2">This document contains:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your store details (CNIC & Store Name)</li>
                <li>Platform fees & commissions</li>
                <li>Returns & Refunds Policy</li>
                <li>Terms of Service & Privacy Policy</li>
              </ul>
            </div>

            <button 
              onClick={() => generateAgreementPDF(store)}
              className="w-full bg-dark text-white font-bold py-3 rounded-xl hover:bg-black transition-colors mb-4 flex items-center justify-center gap-2"
            >
              <FileText size={18} /> Download Agreement PDF
            </button>

            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 mb-6">
              <input 
                type="checkbox" 
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-brand rounded focus:ring-brand" 
              />
              <span className="text-sm text-gray-700 font-medium">
                I have downloaded and read the agreement. I confirm that I agree to the Terms, Privacy Policy, Fees, and Commissions of KorBazar.
              </span>
            </label>

            <button 
              onClick={handleSignAgreement}
              disabled={!hasAgreed}
              className={`w-full font-bold py-3.5 rounded-xl transition-colors ${hasAgreed ? 'bg-brand text-white hover:bg-brand/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Agree & Enter Dashboard
            </button>
          </div>
        </div>
      )}

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

      {rejectOrderModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 relative">
            <button onClick={() => setRejectOrderModal({ ...rejectOrderModal, isOpen: false })} className="absolute top-4 right-4 text-gray-400 hover:text-alert"><X size={24} /></button>
            <h2 className="text-xl font-bold text-dark mb-4">Reject Order</h2>
            <p className="text-sm text-gray-500 mb-4">Please select a reason. The buyer will see this on their tracking page.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection</label>
                <select 
                  value={rejectOrderModal.reason} 
                  onChange={e => setRejectOrderModal({...rejectOrderModal, reason: e.target.value})} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50"
                >
                  <option value="Out of stock">Out of stock</option>
                  <option value="Cannot deliver to this area">Cannot deliver to this area</option>
                  <option value="Personalization not possible">Personalization not possible</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <button onClick={handleConfirmRejectOrder} className="w-full bg-alert text-white font-bold py-3 rounded-xl hover:bg-red-700 shadow-md flex items-center justify-center gap-2">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
                }
