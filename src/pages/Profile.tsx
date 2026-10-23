import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useHistory } from '../context/HistoryContext';
import { auth, db } from '../firebase';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { LogOut, User, Shield, Store, ShoppingBag, Heart, Phone, Mail, ChevronRight, Edit3, Check, HelpCircle, LayoutDashboard, MapPin, Lock, TrendingUp, Package, Users, Wallet, Bell, ShieldAlert, Truck, XCircle, RotateCcw, FileText } from 'lucide-react';

export default function Profile() {
  const { currentUser, userRole } = useAuth();
  const { favorites } = useFavorites();
  const { history } = useHistory();
  const navigate = useNavigate();

  const [userData, setUserData] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  
  const [msg, setMsg] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser || !userRole) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setMobile(data.mobile || '');
          setWhatsapp(data.whatsapp || '');
          setDefaultAddress(data.defaultAddress || '');
          setReceiveUpdates(data.receiveUpdates !== false);
        }

        if (userRole === 'seller') {
          const storeDoc = await getDoc(doc(db, 'sellers', currentUser.uid));
          if (storeDoc.exists()) setStoreData(storeDoc.data());
        } else if (userRole === 'buyer') {
          // Fetch all orders for this buyer to calculate statuses
          const q = query(collection(db, 'orders'), where('buyerUid', '==', currentUser.uid));
          const snap = await getDocs(q);
          const ordersData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          ordersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBuyerOrders(ordersData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser, userRole]);

  const handleSaveContact = async () => {
    if (!currentUser) return;
    setMsg('Saving...');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { mobile, whatsapp });
      setMsg('Contact updated!');
      setIsEditingContact(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (error) { setMsg('Failed to update.'); }
  };

  const handleSaveAddress = async () => {
    if (!currentUser) return;
    setMsg('Saving address...');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { defaultAddress });
      setMsg('Address saved!');
      setIsEditingAddress(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (error) { setMsg('Failed to update.'); }
  };

  const handleToggleUpdates = async () => {
    if (!currentUser) return;
    const newVal = !receiveUpdates;
    setReceiveUpdates(newVal);
    await updateDoc(doc(db, 'users', currentUser.uid), { receiveUpdates: newVal });
  };

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setResetMsg('Reset link sent to your email!');
      setTimeout(() => setResetMsg(''), 5000);
    } catch (error) { setResetMsg('Failed to send email.'); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const initial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U';
  const displayName = currentUser?.email?.split('@')[0] || 'User';
  
  // Calculate Buyer Order Counts
  const pendingOrders = buyerOrders.filter(o => o.status === 'new').length;
  const shippedOrders = buyerOrders.filter(o => o.status === 'accepted' || o.status === 'dispatched').length;
  const deliveredOrders = buyerOrders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = buyerOrders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length;
  if (loading) return <div className="p-12 text-center text-brand font-bold">Loading account...</div>;
  if (!currentUser) return <div className="p-12 text-center text-alert font-bold">Please log in.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-brand text-white rounded-full flex items-center justify-center text-4xl font-extrabold shadow-sm">
            {initial}
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-extrabold text-dark capitalize">{displayName}</h1>
            <p className="text-sm text-gray-500">{currentUser.email}</p>
            <span className="inline-block bg-brand/10 text-brand px-3 py-0.5 rounded-full text-xs font-bold uppercase mt-2">
              {userRole} Account
            </span>
          </div>
        </div>
        
        {/* Daraz-style quick stats */}
        {userRole === 'buyer' && (
          <div className="flex items-center justify-center gap-4 md:gap-8 text-sm font-semibold text-gray-600 border-t border-gray-100 pt-4">
            <Link to="/favorites" className="hover:text-brand flex flex-col items-center">
              <span className="text-dark text-lg font-bold">{favorites.length}</span>
              Wishlist
            </Link>
            <div className="w-px h-8 bg-gray-200"></div>
            <Link to="/orders" className="hover:text-brand flex flex-col items-center">
              <span className="text-dark text-lg font-bold">{buyerOrders.length}</span>
              Total Orders
            </Link>
            <div className="w-px h-8 bg-gray-200"></div>
            <Link to="/explore" className="hover:text-brand flex flex-col items-center">
              <span className="text-dark text-lg font-bold">0</span>
              Followed Stores
            </Link>
          </div>
        )}
      </div>

      {msg && <div className="bg-green-50 text-brand p-3 rounded-xl text-center font-bold mb-6">{msg}</div>}

      {/* BUYER DASHBOARD */}
      {userRole === 'buyer' && (
        <>
          {/* My Orders Grid */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-dark">My Orders</h2>
              <Link to="/orders" className="text-sm font-semibold text-gray-500 hover:text-brand flex items-center">
                View All <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-cols-5 gap-2 text-center">
              <Link to="/orders" className="flex flex-col items-center hover:opacity-80 transition-opacity">
                <div className="relative mb-2">
                  <Wallet size={28} className="text-brand" />
                  {pendingOrders > 0 && <span className="absolute -top-2 -right-2 bg-alert text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{pendingOrders}</span>}
                </div>
                <span className="text-[11px] md:text-xs font-medium text-gray-600">To Pay /<br/>Pending</span>
              </Link>
              
              <Link to="/orders" className="flex flex-col items-center hover:opacity-80 transition-opacity">
                <div className="relative mb-2">
                  <Package size={28} className="text-brand" />
                  {shippedOrders > 0 && <span className="absolute -top-2 -right-2 bg-alert text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{shippedOrders}</span>}
                </div>
                <span className="text-[11px] md:text-xs font-medium text-gray-600">To Ship /<br/>Receive</span>
              </Link>
              
              <Link to="/orders" className="flex flex-col items-center hover:opacity-80 transition-opacity">
                <div className="relative mb-2">
                  <FileText size={28} className="text-brand" />
                  {deliveredOrders > 0 && <span className="absolute -top-2 -right-2 bg-alert text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{deliveredOrders}</span>}
                </div>
                <span className="text-[11px] md:text-xs font-medium text-gray-600">To<br/>Review</span>
              </Link>
              
              <Link to="/orders" className="flex flex-col items-center hover:opacity-80 transition-opacity">
                <div className="relative mb-2">
                  <Truck size={28} className="text-brand" />
                </div>
                <span className="text-[11px] md:text-xs font-medium text-gray-600">Delivered</span>
              </Link>
              
              <Link to="/orders" className="flex flex-col items-center hover:opacity-80 transition-opacity">
                <div className="relative mb-2">
                  <RotateCcw size={28} className="text-brand" />
                  {cancelledOrders > 0 && <span className="absolute -top-2 -right-2 bg-alert text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{cancelledOrders}</span>}
                </div>
                <span className="text-[11px] md:text-xs font-medium text-gray-600">Returns &<br/>Cancel</span>
              </Link>
            </div>
          </div>

          {/* Recently Viewed */}
          {history.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark">Recently Viewed</h2>
                <Link to="/explore" className="text-sm font-semibold text-gray-500 hover:text-brand flex items-center">
                  View More <ChevronRight size={16} />
                </Link>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                {history.map((product: any) => (
                  <Link to={`/product/${product.id}`} key={product.id} className="w-32 flex-shrink-0 group">
                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-50 mb-2">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <h4 className="font-semibold text-xs text-dark truncate">{product.title}</h4>
                    <p className="text-brand font-bold text-sm">Rs. {product.price}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Saved Address */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-dark flex items-center gap-2"><MapPin className="text-brand" size={20}/> Default Delivery Address</h2>
              {!isEditingAddress ? (
                <button onClick={() => setIsEditingAddress(true)} className="text-brand text-sm font-bold flex items-center gap-1 hover:underline">
                  <Edit3 size={14} /> Edit
                </button>
              ) : (
                <button onClick={handleSaveAddress} className="text-brand text-sm font-bold flex items-center gap-1 hover:underline">
                  <Check size={14} /> Save
                </button>
              )}
            </div>
            {isEditingAddress ? (
              <textarea value={defaultAddress} onChange={e => setDefaultAddress(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" placeholder="Enter your complete home address for faster checkout..." />
            ) : (
              <p className="text-gray-600 text-sm">{defaultAddress || "No default address saved. You will need to type it during checkout."}</p>
            )}
          </div>
        </>
      )}

      {/* SELLER DASHBOARD PREVIEW */}
      {userRole === 'seller' && storeData && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-dark flex items-center gap-2"><Store className="text-brand"/> My Store</h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${storeData.status === 'approved' ? 'bg-green-100 text-brand' : 'bg-yellow-100 text-yellow-700'}`}>
              {storeData.status.replace('_', ' ')}
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-brand mb-1">{storeData.storeName}</h3>
          <p className="text-sm text-gray-500 mb-6">Plan: <span className="font-bold text-dark capitalize">{storeData.plan || 'Standard'}</span></p>
          
          <Link to="/seller/dashboard" className="w-full flex items-center justify-center gap-2 p-3.5 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors font-bold shadow-sm">
            <LayoutDashboard size={18} /> Open Professional Dashboard
          </Link>
        </div>
      )}

      {/* ADMIN DASHBOARD PREVIEW */}
      {userRole === 'admin' && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2"><Shield className="text-dark"/> Admin Access</h2>
          <Link to="/admin" className="w-full flex items-center justify-center gap-2 p-4 bg-dark text-white rounded-xl hover:bg-black transition-colors font-bold shadow-md">
            <Shield size={18} /> Open Master Control Panel
          </Link>
        </div>
      )}

      {/* SETTINGS & SECURITY GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Contact Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-dark">Contact Info</h2>
            {!isEditingContact ? (
              <button onClick={() => setIsEditingContact(true)} className="text-brand text-sm font-bold flex items-center gap-1 hover:underline">
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <button onClick={handleSaveContact} className="text-brand text-sm font-bold flex items-center gap-1 hover:underline">
                <Check size={14} /> Save
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mobile Number</label>
              {isEditingContact ? (
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" placeholder="03XX XXXXXXX" />
              ) : (
                <p className="text-dark font-medium flex items-center gap-2"><Phone size={16} className="text-gray-400"/> {userData?.mobile || 'Not provided'}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp Number</label>
              {isEditingContact ? (
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" placeholder="03XX XXXXXXX" />
              ) : (
                <p className="text-dark font-medium flex items-center gap-2"><Phone size={16} className="text-green-500"/> {userData?.whatsapp || userData?.mobile || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Preferences & Security */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-dark mb-4 flex items-center gap-2"><Bell size={18} className="text-gray-400"/> Preferences</h2>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-semibold text-dark text-sm">WhatsApp Updates</p>
              <p className="text-xs text-gray-500">Order status & confirmations</p>
            </div>
            <button onClick={handleToggleUpdates} className={`w-12 h-6 rounded-full transition-colors relative ${receiveUpdates ? 'bg-brand' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${receiveUpdates ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <h2 className="text-lg font-bold text-dark mb-3 flex items-center gap-2 border-t border-gray-100 pt-4"><Lock size={18} className="text-gray-400"/> Security</h2>
          
          {resetMsg && <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-sm mb-3 text-center font-semibold">{resetMsg}</div>}

          <button onClick={handleResetPassword} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-semibold text-dark border border-gray-100 mb-3 text-sm">
            <span>Change Password</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-alert hover:bg-red-100 rounded-xl transition-colors font-bold border border-red-100">
            <LogOut size={18} /> Log Out
          </button>
        </div>
      </div>

      {/* Support Box */}
      <div className="bg-brand/5 border border-brand/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
        <div>
          <h2 className="text-lg font-bold text-dark mb-1 flex items-center gap-2"><HelpCircle size={20} className="text-brand" /> Need Help?</h2>
          <p className="text-sm text-gray-600">Our support team is available for account or order issues.</p>
        </div>
        <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="bg-[#25D366] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-[#20bd5a] transition-colors text-sm shadow-sm whitespace-nowrap">
          Chat on WhatsApp
        </a>
      </div>

    </div>
  );
}
