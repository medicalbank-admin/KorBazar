import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Checkout() {
  const { cart, cartTotal, cartDeliveryFee, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(true);

  const [formData, setFormData] = useState({
    name: '', phone: '', whatsapp: '', address: '', notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // MOVED THIS HERE SO THE JSX CAN SEE IT
  const finalTotal = cartTotal + cartDeliveryFee;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setFetchingAddress(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData(prev => ({
            ...prev,
            phone: data.mobile || '',
            whatsapp: data.whatsapp || data.mobile || '',
            address: data.defaultAddress || ''
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetchingAddress(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const trackingToken = crypto.randomUUID();
      
      const orderData = {
        buyerUid: currentUser?.uid || 'guest',
        buyerName: formData.name,
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
        total: finalTotal,
        paymentMethod: paymentMethod,
        status: 'new',
        trackingToken: trackingToken,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'orders'), orderData);
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
          {paymentMethod !== 'COD' && (
            <p className="text-sm text-gray-500 mt-3">You will receive payment instructions on WhatsApp after the seller confirms your order.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Subtotal</span>
            <span>Rs. {cartTotal}</span>
          </div>
          <div className="flex justify-between text-gray-600 mb-4">
            <span>Delivery Fees</span>
            <span>Rs. {cartDeliveryFee}</span>
          </div>
          <div className="flex justify-between font-bold text-xl text-dark border-t border-gray-100 pt-4">
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
