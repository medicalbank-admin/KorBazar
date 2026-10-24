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
  selectedSize?: string;  // NEW
  selectedColor?: string; // NEW
  cartItemId: string;     // NEW: Unique ID for this specific variant in the cart
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartItemId'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartDeliveryFee: number;
  cartItemCount: number; // NEW: For the Navbar badge
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
      // Create a unique ID based on product ID + size + color
      const uniqueId = `${item.productId}-${item.selectedSize || 'nosize'}-${item.selectedColor || 'nocolor'}`;
      
      // Check if this exact variant is already in the cart
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
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0); // Total physical items

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartDeliveryFee, cartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
