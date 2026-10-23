import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, Store, User, PlusCircle, CheckCircle, XCircle, MessageCircle, Truck, Facebook, Instagram, Globe, ShieldAlert } from 'lucide-react';

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
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'store' | 'profile'>('orders');
  
  // Store Edit State
  const [storeBio, setStoreBio] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState('');
  const [socialLinks, setSocialLinks] = useState({ facebook: '', instagram: '', tiktok: '' });
  const [storeMsg, setStoreMsg] = useState('');

  // Product Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Cakes & Bakes');
  const [productImages, setProductImages] = useState<FileList | null>(null);
  const [productMsg, setProductMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const docSnap = await getDoc(doc(db, 'sellers', currentUser.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStore(data);
        setStoreBio(data.bio || '');
        setStoreAddress(data.storeAddress || '');
        setDeliveryFee(data.deliveryFee || '0');
        setPaymentAccounts(data.paymentAccounts || '');
        setSocialLinks(data.socialLinks || { facebook: '', instagram: '', tiktok: '' });
      }

      const prodQ = query(collection(db, 'products'), where('sellerId', '==', currentUser.uid));
      const prodSnap = await getDocs(prodQ);
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const orderQ = query(collection(db, 'orders'), where('sellerId', '==', currentUser.uid));
      const orderSnap = await getDocs(orderQ);
      const ordersData = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ordersData);
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
      deliveryFee: Number(deliveryFee),
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
        sellerId: currentUser.uid, storeName: store.storeName,
        title, price: Number(price), category,
        isPremium: false, images: imageUrls, image: imageUrls[0],
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'products'), newProduct);
      setProducts([{ id: docRef.id, ...newProduct }, ...products]);
      setProductMsg('Product added successfully!');
      setTitle(''); setPrice(''); setProductImages(null);
      (document.getElementById('product-images') as HTMLInputElement).value = '';
      setTimeout(() => setProductMsg(''), 3000);
    } catch (error) {
      setProductMsg('Error adding product.');
    } finally {
      setUploading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, extraData = {}) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus, ...extraData });
    fetchData();
  };

  const handleWhatsAppNotify = (order: any) => {
    let paymentInstructions = "";
    if (order.paymentMethod !== 'COD') {
      paymentInstructions = `\nPlease send the payment via ${order.paymentMethod} to:\n${store.paymentAccounts || '[Seller needs to set account details]'}\n`;
    }

    const text = `Assalam-o-Alaikum ${order.buyerName},\n\nYour order from ${store.storeName} has been CONFIRMED ✅\n\nOrder ID: #${order.trackingToken.slice(0,8).toUpperCase()}\n\nSubtotal: Rs. ${order.subtotal || order.total}\nDelivery Fee: Rs. ${order.deliveryFee || 0}\n*Total Bill: Rs. ${order.total}*\n\nPayment Method: ${order.paymentMethod}\n${paymentInstructions}\nTrack your order here:\nhttps://medicalbank-admin.github.io/KorBazar/#/track/${order.trackingToken}\n\nThank you for supporting a local seller!\n— ${store.storeName} via KorBazar`;
    
    const cleanNumber = order.buyerWhatsapp.replace(/^0/, '');
    window.open(`https://wa.me/92${cleanNumber}?text=${encodeURIComponent(text)}`, '_blank');
    updateOrderStatus(order.id, 'accepted', { whatsappNotifiedAt: new Date().toISOString() });
  };

  if (loading) return <div className="p-8 text-center text-dark">Loading dashboard...</div>;
  if (!store) return <div className="p-8 text-center text-alert">You are not registered as a seller.</div>;

  if (store.isFrozen) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl text-center max-w-md">
          <ShieldAlert size={64} className="text-alert mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-alert mb-2">Store Frozen</h2>
          <p className="text-gray-700 mb-6">Your store has been temporarily frozen by the Admin. This is usually due to pending monthly fees. Please contact KorBazar support on WhatsApp to resolve this and unfreeze your store.</p>
          <a href="https://wa.me/923000000000" target="_blank" className="bg-alert text-white px-6 py-3 rounded-xl font-bold inline-block">Contact Admin</a>
        </div>
      </div>
    );
  }

  // Calculate Stats
  const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'accepted' || o.status === 'dispatched').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">{store.storeName}</h1>
          <p className="text-gray-500 font-medium">Professional Seller Dashboard</p>
        </div>
        {store.status === 'approved' && (
          <a href={`#/store/${currentUser?.uid}`} target="_blank" rel="noreferrer" className="bg-dark text-white px-6 py-2 rounded-xl font-semibold hover:bg-black transition-colors">View Public Store &rarr;</a>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-yellow-600">{pendingOrders}</span>
          <span className="text-xs font-bold text-yellow-700 uppercase mt-1">Pending</span>
        </div>
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-brand">{deliveredOrders}</span>
          <span className="text-xs font-bold text-brand uppercase mt-1">Delivered</span>
        </div>
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-alert">{cancelledOrders}</span>
          <span className="text-xs font-bold text-alert uppercase mt-1">Cancelled</span>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-8 border-b border-gray-200 pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'orders' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Package size={18}/> Orders</button>
        <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'products' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><PlusCircle size={18}/> Products</button>
        <button onClick={() => setActiveTab('store')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'store' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Store size={18}/> Settings</button>
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
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-2xl border border-gray-100 text-gray-500">No orders yet.</div>
              ) : orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-dark">Order #{order.trackingToken.slice(0,6).toUpperCase()}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${order.status === 'new' ? 'bg-yellow-100 text-yellow-700' : order.status === 'delivered' ? 'bg-green-100 text-brand' : order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-alert' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                    </div>
                    <p className="text-sm text-gray-600"><span className="font-semibold text-dark">Buyer:</span> {order.buyerName} ({order.buyerPhone})</p>
                    <p className="text-sm text-gray-600 mb-2"><span className="font-semibold text-dark">Address:</span> {order.buyerAddress}</p>
                    <div className="bg-gray-50 p-3 rounded-xl text-sm mb-2 border border-gray-100">
                      {order.items.map((i:any, idx:number) => <div key={idx}>{i.qty}x {i.title} - Rs. {i.price}</div>)}
                      <div className="mt-1 pt-1 border-t border-gray-200 text-gray-500 text-xs flex justify-between">
                        <span>Subtotal: Rs. {order.subtotal || order.total}</span>
                        <span>Delivery: Rs. {order.deliveryFee || 0}</span>
                      </div>
                      {order.notes && <div className="text-brand font-semibold mt-1">Note: {order.notes}</div>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-dark text-lg">Total: Rs. {order.total}</p>
                      <span className="text-xs font-bold uppercase bg-gray-200 px-2 py-1 rounded">{order.paymentMethod}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[200px] justify-center">
                    {order.status === 'new' && (
                      <>
                        <button onClick={() => handleWhatsAppNotify(order)} className="w-full bg-[#25D366] text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#20bd5a]"><MessageCircle size={18}/> Accept & Notify</button>
                        <button onClick={() => updateOrderStatus(order.id, 'rejected', { rejectionReason: 'Out of stock' })} className="w-full bg-red-50 text-alert font-bold py-2.5 rounded-xl border border-red-200 hover:bg-red-100 flex items-center justify-center gap-2"><XCircle size={18}/> Reject</button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <button onClick={() => updateOrderStatus(order.id, 'dispatched')} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700"><Truck size={18}/> Mark Dispatched</button>
                    )}
                    {order.status === 'dispatched' && (
                      <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full bg-brand text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-brand/90"><CheckCircle size={18}/> Mark Delivered</button>
                    )}
                  </div>
                </div>
              ))}
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
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Price (PKR)</label>
                     <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                     <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50">
                       <option>Cakes & Bakes</option>
                       <option>Handmade Jewelry</option>
                       <option>Crafts & Decor</option>
                       <option>Embroidered Items</option>
                       <option>Candles</option>
                       <option>Gift Hampers</option>
                     </select>
                   </div>
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
                       <p className="text-sm text-brand font-semibold">Rs. {p.price}</p>
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
                  <input ty
