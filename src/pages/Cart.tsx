import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ChevronLeft } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-dark mb-4">Your cart is empty</h2>
        <Link to="/explore" className="bg-brand text-white px-8 py-3 rounded-full font-bold hover:bg-brand/90">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <Link to="/explore" className="inline-flex items-center text-gray-500 hover:text-brand mb-6 font-medium">
        <ChevronLeft size={20} /> Continue Shopping
      </Link>
      <h1 className="text-3xl font-bold text-dark mb-6">Your Cart</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {cart.map(item => (
          <div key={item.productId} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
            <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-xl" />
            <div className="flex-grow">
              <h3 className="font-bold text-dark">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.storeName}</p>
              <p className="font-semibold text-brand">Rs. {item.price}</p>
            </div>
            <button onClick={() => removeFromCart(item.productId)} className="text-alert p-2 hover:bg-red-50 rounded-lg">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-2 text-gray-600">
          <span>Subtotal</span>
          <span>Rs. {cartTotal}</span>
        </div>
        <div className="flex justify-between items-center mb-4 text-gray-600">
          <span>Delivery</span>
          <span className="text-sm">Arranged by seller</span>
        </div>
        <div className="flex justify-between items-center font-bold text-xl text-dark border-t border-gray-100 pt-4">
          <span>Total</span>
          <span>Rs. {cartTotal}</span>
        </div>
      </div>

      <button onClick={() => navigate('/checkout')} className="w-full bg-brand text-white font-bold py-4 rounded-xl hover:bg-brand/90 shadow-md">
        Proceed to Checkout
      </button>
    </div>
  );
            }
