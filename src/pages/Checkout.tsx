import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Ticket, X, Mail } from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function Checkout() {
  const { cart, cartTotal, cartDeliveryFee, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(true);

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

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, cartTotal + cartDeliveryFee - discountAmount);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const trackingToken = crypto.randomUUID();
      const trackingLink = `https://medicalbank-admin.github.io/KorBazar/#/track/${trackingToken}`;
      
      const orderData = {
        buyerUid: currentUser?.uid || 'guest',
        buyerName: formData.name,
        buyerEmail: formData.email,
        buyerPhone: formData.phone,
        buyerWhatsapp: formData.whatsapp,
        buyerAddress: formData.address,
        notes: formData.notes,
        sellerId: cart[0].sellerId,
        storeName: cart[0].storeName,
        items: cart.map(i => ({ 
          productId: i.productId, 
          title: i.title, 
          price: i.price, 
          qty: i.quantity, 
          deliveryFee: i.deliveryFee || 0 
        })),
        subtotal: cartTotal,
        deliveryFee: cartDeliveryFee,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: discountAmount,
        total: finalTotal,
        paymentMethod: paymentMethod,
        status: 'new',
        trackingToken: trackingToken,
        createdAt: new Date().toISOString()
      };

      // 1. Save Order to Firestore
      await addDoc(collection(db, 'orders'), orderData);

      // Trigger Notification for Seller
await addDoc(collection(db, 'notifications'), {
  userId: cart[0].sellerId,
  title: 'New Order Received! 🎉',
  message: `You have a new order for Rs. ${finalTotal} from ${formData.name}.`,
  type: 'order',
  link: '/seller/dashboard',
  isRead: false,
  createdAt: new Date().toISOString()
});

      // 2. Send Email Notification with your actual keys
      if (formData.email) {
        try {
          await emailjs.send(
            'service_q90wxjm',       
            'template_bu0a3in',      
            {
              to_name: formData.name,
              to_email: formData.email, 
              order_id: trackingToken.slice(0, 8).toUpperCase(),
              order_subtotal: cartTotal,          
              order_shipping: cartDeliveryFee,    
              order_total: finalTotal,
              payment_method: paymentMethod,
              tracking_link: trackingLink,
            },
            'yw7E81OSHpJ2l0jJm'        
          );
        } catch (emailError) {
          console.error("Email failed to send, but order was placed:", emailError);
        }
      }

      clearCart();
      navigate(`/track/${trackingToken}`);
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
      
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-dark mb-4 flex items-center gap-2"><Ticket size={20} className="text-brand"/> Have a Coupon?</h2>
          
          {!appliedCoupon ? (
            <div className="flex gap-2">
              <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter code" className="flex-grow px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none uppercase" />
              <button type="button" onClick={handleApplyCoupon} disabled={isApplying} className="bg-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors disabled:bg-gray-400">
                {isApplying ? '...' : 'Apply'}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-brand">{appliedCoupon.code}</p>
                <p className="text-sm text-green-700">You saved Rs. {appliedCoupon.discount}!</p>
              </div>
              <button type="button" onClick={handleRemoveCoupon} className="text-alert p-2 hover:bg-red-100 rounded-lg"><X size={20}/></button>
            </div>
          )}
          
          {couponError && <p className="text-alert text-sm mt-2 font-semibold">{couponError}</p>}
          {couponMsg && <p className="text-brand text-sm mt-2 font-semibold">{couponMsg}</p>}
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
              <span>Discount ({appliedCoupon.code})</span>
              <span>- Rs. {discountAmount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl text-dark border-t border-gray-100 pt-4 mt-2">
            <span>Total</span>
            <span>Rs. {finalTotal}</span>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-brand text-white font-bold py-4 rounded-xl hover:bg-brand/90 shadow-md disabled:bg-gray-400">
          {loading ? 'Placing Order...' : `Place Order (Rs. ${finalTotal})`}
        </button>
      </form>
    </div>
  );
          }
