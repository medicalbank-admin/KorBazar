import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ChevronLeft, Plus, Minus, Sparkles, Tag, ArrowRight } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartItemCount } = useCart();
  const navigate = useNavigate();

  // State to track selected items (defaults to all items selected)
  const [selectedItems, setSelectedItems] = useState<string[]>(cart.map(i => i.cartItemId));

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-dark mb-4">Your cart is empty</h2>
        <Link to="/explore" className="bg-brand text-white px-8 py-3 rounded-full font-bold hover:bg-brand/90">Browse Products</Link>
      </div>
    );
  }

  // Toggle selection of a single item
  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle all items
  const toggleAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]); // Deselect all
    } else {
      setSelectedItems(cart.map(i => i.cartItemId)); // Select all
    }
  };

  // Calculate totals ONLY for selected items
  const { subtotal, totalDiscount, deliveryFee, finalTotal } = useMemo(() => {
    let subTotal = 0;
    let discountTotal = 0;
    let delivery = 0;

    cart.forEach(item => {
      if (selectedItems.includes(item.cartItemId)) {
        const discount = Number(item.discountPercent) || 0;
        const originalPrice = Number(item.price);
        const finalPrice = discount > 0 ? Math.round(originalPrice - (originalPrice * (discount / 100))) : originalPrice;
        
        subTotal += finalPrice * item.quantity;
        if (discount > 0) discountTotal += (originalPrice - finalPrice) * item.quantity;
        
        delivery += (item.deliveryFee || 0) * item.quantity;
      }
    });

    return {
      subtotal: subTotal,
      totalDiscount: discountTotal,
      deliveryFee: delivery,
      finalTotal: subTotal + delivery
    };
  }, [cart, selectedItems]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <Link to="/explore" className="inline-flex items-center text-gray-500 hover:text-brand mb-4 font-medium text-sm">
        <ChevronLeft size={16} /> Continue Shopping
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-dark">YOUR CART</h1>
        <p className="text-sm text-gray-500 font-medium">{cartItemCount} items in cart</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CART ITEMS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            
            {/* Select All Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <input 
                type="checkbox" 
                checked={selectedItems.length === cart.length && cart.length > 0} 
                onChange={toggleAll}
                className="w-5 h-5 text-brand rounded border-gray-300 focus:ring-brand cursor-pointer"
              />
              <span className="text-sm font-semibold text-dark">Select All Items</span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-gray-100">
              {cart.map((item: any) => {
                const discount = Number(item.discountPercent) || 0;
                const originalPrice = Number(item.price);
                const finalPrice = discount > 0 ? Math.round(originalPrice - (originalPrice * (discount / 100))) : originalPrice;
                const isSelected = selectedItems.includes(item.cartItemId);

                return (
                  <div key={item.cartItemId} className={`p-4 md:p-6 flex gap-4 transition-colors ${isSelected ? 'bg-white' : 'bg-gray-50/50 opacity-70'}`}>
                    
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => toggleSelection(item.cartItemId)}
                        className="w-5 h-5 text-brand rounded border-gray-300 focus:ring-brand cursor-pointer"
                      />
                    </div>

                    {/* Image */}
                    <div className="relative shrink-0">
                      <img src={item.image} alt={item.title} className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-2xl border border-gray-100" />
                      {discount > 0 && (
                        <span className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                          -{discount}%
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-bold text-dark text-base md:text-lg leading-tight mb-1">{item.title}</h3>
                            <p className="text-xs text-gray-500">{item.storeName}</p>
                            
                            {/* Variants */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.selectedSize && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Size: {item.selectedSize}</span>}
                              {item.selectedColor && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">Color: {item.selectedColor}</span>}
                            </div>

                            {/* Customization Note */}
                            {item.customizationNote && (
                              <p className="text-xs font-semibold text-brand mt-2 bg-brand/5 inline-flex items-center gap-1 px-2 py-1 rounded">
                                <Sparkles size={12} /> "{item.customizationNote}"
                              </p>
                            )}
                          </div>
                          
                          <button onClick={() => removeFromCart(item.cartItemId)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Price & Quantity Row */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-4 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xl text-dark">Rs. {finalPrice}</span>
                          {discount > 0 && <span className="text-sm text-gray-400 line-through">Rs. {originalPrice}</span>}
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="p-2 text-gray-500 hover:text-brand disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-8 text-center font-bold text-sm text-dark">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="p-2 text-gray-500 hover:text-brand"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold text-dark mb-6">Order Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-dark">Rs. {subtotal}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="flex justify-between text-red-500 font-semibold">
                  <span>Discount</span>
                  <span>- Rs. {totalDiscount}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600 pb-4 border-b border-gray-100">
                <span>Delivery Fee</span>
                <span className="font-semibold text-dark">Rs. {deliveryFee}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-dark">Total</span>
                <span className="text-2xl font-extrabold text-dark">Rs. {finalTotal}</span>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="mt-6">
              <div className="relative flex items-center">
                <Tag size={18} className="absolute left-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Add promo code" 
                  className="w-full pl-10 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand"
                />
                <button className="absolute right-1 top-1 bottom-1 bg-dark text-white px-4 rounded-lg text-xs font-bold hover:bg-black transition-colors">
                  Apply
                </button>
              </div>
            </div>

            <button 
              onClick={() => navigate('/checkout')} 
              disabled={selectedItems.length === 0}
              className="w-full mt-6 bg-brand text-white font-bold py-4 rounded-xl hover:bg-brand/90 shadow-md flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              Go to Checkout <ArrowRight size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
          }
