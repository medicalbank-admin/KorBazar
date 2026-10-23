import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Package } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <>
      {/* Desktop Navbar */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <img src="/logo.png" alt="KorBazar" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="font-bold text-2xl text-brand">KorBazar</span>
        </Link>
        
        <nav className="flex gap-8 font-medium text-dark/80">
          <Link to="/" className="hover:text-brand transition-colors">Home</Link>
          <Link to="/explore" className="hover:text-brand transition-colors">Explore</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="font-semibold text-dark hover:text-brand transition-colors">Login</Link>
          <Link to="/sell-with-us" className="bg-brand text-white px-6 py-2.5 rounded-full font-semibold hover:bg-brand/90 transition-all shadow-sm">
            Sell with Us
          </Link>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-1">
          <img src="/logo.png" alt="KorBazar" className="h-10 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="font-bold text-xl text-brand">KorBazar</span>
        </Link>
        <Link to="/login" className="font-semibold text-brand">Login</Link>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center py-2 z-50 pb-safe">
        <Link to="/" className={`flex flex-col items-center p-2 ${location.pathname === '/' ? 'text-brand' : 'text-gray-500'}`}>
          <Home size={20} /> <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>
        <Link to="/explore" className={`flex flex-col items-center p-2 ${location.pathname === '/explore' ? 'text-brand' : 'text-gray-500'}`}>
          <Search size={20} /> <span className="text-[10px] mt-1 font-medium">Explore</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center p-2 ${location.pathname === '/cart' ? 'text-brand' : 'text-gray-500'}`}>
          <ShoppingCart size={20} /> <span className="text-[10px] mt-1 font-medium">Cart</span>
        </Link>
        <Link to="/orders" className={`flex flex-col items-center p-2 ${location.pathname === '/orders' ? 'text-brand' : 'text-gray-500'}`}>
          <Package size={20} /> <span className="text-[10px] mt-1 font-medium">Orders</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center p-2 ${location.pathname === '/profile' ? 'text-brand' : 'text-gray-500'}`}>
          <User size={20} /> <span className="text-[10px] mt-1 font-medium">Profile</span>
        </Link>
      </nav>
    </>
  );
}
