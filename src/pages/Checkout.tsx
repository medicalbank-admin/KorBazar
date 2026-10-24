import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Ticket, X, Mail, Gift, CheckCircle } from 'lucide-react';

export default function Checkout() {
  const { cart, cartTotal, cartDeliveryFee, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', whatsapp: '', address: '', notes: '', email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Referral State
  const [referralCode, setReferralCode] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<any>(null);
  const [referralMsg, setReferralMsg] = useState('');
  const [referralError, setReferralError] = useState('');
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);

  const REFERRAL_DISCOUNT = 100;

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const referralDiscount = appliedReferral ? REFERRAL_DISCOUNT : 0;
  const finalTotal = Math.max(0, cartTotal + cartDeliveryFee - discountAmount - referralDiscount);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) { setFetchingAddress(false); return; }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData(prev => ({
            ...prev,
            email: currentUser.email || '',
            phone: data.mobile || '',
            whatsapp: data.whatsapp || data.mobile || '',
            address: data.defaultAddress || ''
          }));
        }
      } catch (error) { console.error(error); } 
      finally { setFetchingAddress(false); }
    };
    fetchUserData();
  }, [currentUser]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setCouponError('');
    setCouponMsg('');

    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setCouponError('Invalid coupon code.');
      } else {
        const couponData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        
        if (couponData.minAmount && cartTotal < couponData.minAmount) {
          setCouponError(`Minimum order for this coupon is Rs. ${couponData.minAmount}`);
        } else {
          setAppliedCoupon(couponData);
          setCouponMsg(`Coupon applied! Rs. ${couponData.discount} off.`);
          setCouponCode('');
        }
      }
    } catch (error) {
      setCouponError('Failed to apply coupon.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg('');
    setCouponError('');
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim() || !currentUser) return;
    setIsApplyingReferral(true);
    setReferralError('');
    setReferralMsg('');

    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', referralCode.toUpperCase().trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setReferralError('Invalid referral code.');
      } else {
        const referrerDoc = snap.docs[0];
        
        if (referrerDoc.id === currentUser.uid) {
          setReferralError('You cannot use your own referral code.');
        } else {
          setAppliedReferral({ id: referrerDoc.id, name: referrerDoc.data().email });
          setReferralMsg(`Referral applied! Rs. ${REFERRAL_DISCOUNT} off.`);
          setReferralCode('');
        }
      }
    } catch (error) {
      setReferralError('Failed to apply referral.');
    } finally {
      setIsApplyingReferral(false);
    }
  };

  const handleRemoveReferral = () => {
    setAppliedReferral(null);
    setReferralMsg('');
    setReferralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const groupedBySeller = cart.reduce((acc: any, item) => {
        if (!acc[item.sellerId]) acc[item.sellerId] = [];
        acc[item.sellerId].push(item);
        return acc;
      }, {});

      const sellerIds = Object.keys(groupedBySeller);
      const generatedTokens: string[] = [];

      for (const sellerId of sellerIds) {
        const sellerItems = groupedBySeller[sellerId];
        const sellerStoreName = sellerItems[0].storeName;
        
        const sellerSubtotal = sellerItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
        const sellerDelivery = sellerItems.reduce((sum: number, i: any) => sum + ((i.deliveryFee || 0) * i.quantity), 0);
        
        const proportion = cartTotal > 0 ? (sellerSubtotal / cartTotal) : 0;
        const sellerCouponDiscount = discountAmount * proportion;
        const sellerReferralDiscount = referralDiscount * proportion;
        
        const sellerTotal = Math.max(0, sellerSubtotal + sellerDelivery - sellerCouponDiscount - sellerReferralDiscount);
        
        const trackingToken = crypto.randomUUID();
        generatedTokens.push(trackingToken);

        const orderData = {
          buyerUid: currentUser?.uid || 'guest',
          buyerName: formData.name,
          buyerEmail: formData.email,
          buyerPhone: formData.phone,
          buyerWhatsapp: formData.whatsapp,
          buyerAddress: formData.address,
          notes: formData.notes,
          sellerId: sellerId,
          storeName: sellerStoreName,
          items: sellerItems.map((i: any) => ({ 
            productId: i.productId, 
            title: i.title, 
            price: i.price, 
            qty: i.quantity, 
            deliveryFee: i.deliveryFee || 0,
            selectedSize: i.selectedSize || null,
            selectedColor: i.selectedColor || null
          })),
          subtotal: sellerSubtotal,
          deliveryFee: sellerDelivery,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          discountAmount: sellerCouponDiscount,
          referredBy: appliedReferral ? appliedReferral.id : null,
          referralDiscount: sellerReferralDiscount,
          total: sellerTotal,
          paymentMethod: paymentMethod,
          status: 'new',
          trackingToken: trackingToken,
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'orders'), orderData);
        
        await addDoc(collection(db, 'notifications'), {
          userId: sellerId,
          title: 'New Order Received! 🎉',
          message: `You have a new order for Rs. ${sellerTotal} from ${formData.name}.`,
          type: 'order',
          link: '/seller/dashboard',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
      
      clearCart();
      navigate(`/track/${generatedTokens[0]}`);
    } catch (error) {
      console.error(error);
      alert('Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return null;
  if (fetchingAddress) return <div className="p-12 text-center text-brand font-bold">Loading details...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-dark mb-6">Checkout</h1>

      {/* GUEST LOGIN PROMPT */}
      {!currentUser && (
        <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm font-semibold text-brand">Already have an account? Login for a faster checkout.</p>
          <button type="button" onClick={() => navigate('/login')} className="bg-brand text-white px-6 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-brand/90 transition-colors">
            Login
          </button>
        </div>
      )}
      
      <form onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-lg text-dark mb-2">Delivery Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (For Receipt)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" placeholder="you@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input type="tel" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" placeholder="House #, Street, Area..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
            <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Cake message, instructions, etc." className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-dark mb-4">Payment Method</h2>
          <div className="space-y-3">
            {['COD', 'JazzCash', 'Easypaisa'].map(method => (
              <label key={method} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${paymentMethod === method ? 'border-brand bg-brand/5' : 'border-gray-200'}`}>
                <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="text-brand focus:ring-brand" />
                <span className="font-semibold text-dark">{method === 'COD' ? 'Cash on Delivery' : method}</span>
              </label>
            ))}
          </div>
        </div>

        {/* PROMO CODES SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-lg text-dark mb-2 flex items-center gap-2"><Ticket size={20} className="text-brand"/> Have a Coupon or Referral?</h2>
          
          <div>
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="flex-grow px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none uppercase" />
                <button type="button" onClick={handleApplyCoupon} disabled={isApplying} className="bg-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:bg-gray-400">Apply</button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-brand text-sm">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-700">You saved Rs. {appliedCoupon.discount}!</p>
                </div>
                <button type="button" onClick={handleRemoveCoupon} className="text-alert p-1 hover:bg-red-100 rounded-lg"><X size={18}/></button>
              </div>
            )}
            {couponError && <p className="text-alert text-xs mt-1 font-semibold">{couponError}</p>}
            {couponMsg && <p className="text-brand text-xs mt-1 font-semibold">{couponMsg}</p>}
          </div>

          {currentUser && (
            <div className="pt-2 border-t border-gray-100">
              {!appliedReferral ? (
                <div className="flex gap-2">
                  <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Enter friend's referral code" className="flex-grow px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none uppercase" />
                  <button type="button" onClick={handleApplyReferral} disabled={isApplyingReferral} className="bg-brand/10 text-brand px-6 py-3 rounded-xl font-bold hover:bg-brand/20 transition-colors disabled:bg-gray-400">Apply</button>
                </div>
              ) : (
                <div className="bg-brand/5 border border-brand/20 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-brand text-sm flex items-center gap-1"><Gift size={14}/> Referral Applied</p>
                    <p className="text-xs text-brand/80">You saved Rs. {REFERRAL_DISCOUNT}!</p>
                  </div>
                  <button type="button" onClick={handleRemoveReferral} className="text-alert p-1 hover:bg-red-100 rounded-lg"><X size={18}/></button>
                </div>
              )}
              {referralError && <p className="text-alert text-xs mt-1 font-semibold">{referralError}</p>}
              {referralMsg && <p className="text-brand text-xs mt-1 font-semibold">{referralMsg}</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Subtotal</span>
            <span>Rs. {cartTotal}</span>
          </div>
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Delivery Fees</span>
            <span>Rs. {cartDeliveryFee}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-brand font-bold mb-2">
              <span>Coupon Discount</span>
              <span>- Rs. {discountAmount}</span>
            </div>
          )}
          {appliedReferral && (
            <div className="flex justify-between text-brand font-bold mb-2">
              <span>Referral Discount</span>
              <span>- Rs. {referralDiscount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl text-dark border-t border-gray-100 pt-4 mt-2">
            <span>Total</span>
            <span>Rs. {finalTotal}</span>
          </div>
        </div>

        <button type="submit" className="w-full bg-brand text-white font-bold py-4 rounded-xl hover:bg-brand/90 shadow-md">
          Review & Place Order
        </button>
      </form>

      {/* FINAL ORDER CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-dark mb-4 text-center">Confirm Your Order</h2>
            
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-3 text-sm border border-gray-100">
              <div>
                <p className="font-semibold text-dark">Delivery To:</p>
                <p className="text-gray-600">{formData.name}</p>
                <p className="text-gray-600">{formData.phone}</p>
                <p className="text-gray-600">{formData.address}</p>
              </div>
              
              {appliedCoupon && (
                <div className="text-brand font-semibold">
                  Coupon Applied: {appliedCoupon.code} (- Rs. {discountAmount})
                </div>
              )}
              {appliedReferral && (
                <div className="text-brand font-semibold">
                  Referral Applied (- Rs. {referralDiscount})
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-dark">
                <span>Total to Pay:</span>
                <span>Rs. {finalTotal}</span>
              </div>
              <div className="text-xs text-right text-gray-500 uppercase font-bold">
                Payment: {paymentMethod}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="w-1/3 bg-gray-100 text-dark font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  setShowConfirmModal(false);
                  handleSubmit(e as any); 
                }} 
                disabled={loading}
                className="w-2/3 bg-brand text-white font-bold py-3 rounded-xl hover:bg-brand/90 shadow-md disabled:bg-gray-400 flex justify-center items-center gap-2"
              >
                {loading ? 'Placing Order...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
                              }
