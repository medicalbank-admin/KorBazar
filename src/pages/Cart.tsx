import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ChevronLeft, Plus, Minus, Sparkles } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartDeliveryFee, cartItemCount } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-dark mb-4">Your cart is empty</h2>
        <Link to="/explore" className="bg-brand text-white px-8 py-3 rounded-full font-bold hover:bg-brand/90">Browse Products</Link>
      </div>
    );
  }

  // Recalculate subtotal & total savings based on item discounts
  let totalDiscount = 0;
  const calculatedSubtotal = cart.reduce((sum: number, item: any) => {
    const discount = Number(item.discountPercent) || 0;
    const originalPrice = Number(item.price);
    const finalPrice = discount > 0 ? Math.round(originalPrice - (originalPrice * (discount / 100))) : originalPrice;
    
    if (discount > 0) {
      totalDiscount += (originalPrice - finalPrice) * item.quantity;
    }
    
    return sum + (finalPrice * item.quantity);
  }, 0);

  const finalTotal = calculatedSubtotal + cartDeliveryFee;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <Link to="/explore" className="inline-flex items-center text-gray-500 hover:text-brand mb-6 font-medium">
        <ChevronLeft size={20} /> Continue Shopping
      </Link>
      <h1 className="text-3xl font-bold text-dark mb-6">Your Cart ({cartItemCount} items)</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {cart.map((item: any) => {
          const discount = Number(item.discountPercent) || 0;
          const originalPrice = Number(item.price);
          const finalPrice = discount > 0 ? Math.round(originalPrice - (originalPrice * (discount / 100))) : originalPrice;

          return (
            <div key={item.cartItemId} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-4 flex-grow">
                {/* Image with Discount Badge */}
                <div className="relative shrink-0">
                  <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-xl" />
                  {discount > 0 && (
                    <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                      -{discount}%
                    </span>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-bold text-dark leading-tight">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.storeName}</p>
                  
                  {/* SHOW SELECTED VARIANTS */}
                  {(item.selectedSize || item.selectedColor) && (
                    <p className="text-xs font-semibold text-gray-600 mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded mr-2">
                      {item.selectedSize && `Size: ${item.selectedSize}`}
                      {item.selectedSize && item.selectedColor && ` | `}
                      {item.selectedColor && `Color: ${item.selectedColor}`}
                    </p>
                  )}

                  {/* SHOW CUSTOMIZATION NOTE */}
                  {item.customizationNote && (
                    <p className="text-xs font-bold text-brand mt-1 bg-brand/5 border border-brand/20 inline-flex items-center gap-1 px-2 py-1 rounded max-w-full truncate">
                      <Sparkles size={12} className="flex-shrink-0" />
                      Note: "{item.customizationNote}"
                    </p>
                  )}
                  
                  {/* Price Display */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-brand text-lg block">Rs. {finalPrice}</span>
                    {discount > 0 && (
                      <span className="text-xs text-gray-400 line-through">Rs. {originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0 w-full md:w-auto">
                {/* QUANTITY SELECTOR */}
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="p-2 text-gray-600 hover:text-brand disabled:opacity-50"
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-bold text-dark">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="p-2 text-gray-600 hover:text-brand"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button onClick={() => removeFromCart(item.cartItemId)} className="text-alert p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ORDER SUMMARY */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center mb-2 text-gray-600">
          <span>Subtotal</span>
          <span>Rs. {calculatedSubtotal}</span>
        </div>
        
        {totalDiscount > 0 && (
          <div className="flex justify-between items-center mb-2 text-red-500 font-semibold">
            <span>Total Savings</span>
            <span>- Rs. {totalDiscount}</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 text-gray-600 border-b border-gray-100 pb-4">
          <span>Delivery Fees</span>
          <span>Rs. {cartDeliveryFee}</span>
        </div>
        
        <div className="flex justify-between items-center font-bold text-xl text-dark pt-2">
          <span>Total</span>
          <span>Rs. {finalTotal}</span>
        </div>
      </div>

      <button onClick={() => navigate('/checkout')} className="w-full bg-brand text-white font-bold py-4 rounded-xl hover:bg-brand/90 shadow-md">
        Proceed to Checkout
      </button>
    </div>
  );
}
