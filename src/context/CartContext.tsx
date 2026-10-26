import { createContext, useContext, useState, useEffect } from 'react';

export type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  sellerId: string;
  storeName: string;
  quantity: number;
  deliveryFee?: number;
  description?: string;
  selectedSize?: string;
  selectedColor?: string;
  customizationNote?: string; // <--- NEW: To store personalization details
  cartItemId: string;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartItemId'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartDeliveryFee: number;
  cartItemCount: number;
};

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('korbazar-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('korbazar-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'quantity' | 'cartItemId'>) => {
    setCart(prev => {
      // Create a unique ID based on product ID + size + color + customization note
      // We use encodeURIComponent for the note to ensure the ID string remains safe
      const safeNote = item.customizationNote ? encodeURIComponent(item.customizationNote) : 'nocustom';
      const uniqueId = `${item.productId}-${item.selectedSize || 'nosize'}-${item.selectedColor || 'nocolor'}-${safeNote}`;
      
      // Check if this exact variant AND customization is already in the cart
      const existing = prev.find(i => i.cartItemId === uniqueId);
      
      if (existing) {
        return prev.map(i => i.cartItemId === uniqueId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      
      // If it's a new item, add it
      return [...prev, { ...item, quantity: 1, cartItemId: uniqueId }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i));
  };

  const clearCart = () => setCart([]);
  
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartDeliveryFee = cart.reduce((sum, item) => sum + (item.deliveryFee || 0) * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartDeliveryFee, cartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
