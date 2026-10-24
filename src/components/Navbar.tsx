import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Package, LayoutDashboard, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const location = useLocation();
  const { currentUser, userRole } = useAuth();

  return (
    <>
      {/* Desktop Navbar */}
      <header className="hidden md:flex items-center justify-between px-8 py-6 bg-white shadow-sm sticky top-0 z-50">
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <img src="./logo.png" alt="KorBazar" className="h-20 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="font-bold text-2xl text-brand">KorBazar</span>
        </Link>
        
        <nav className="flex gap-8 font-medium text-dark/80">
          <Link to="/" className="hover:text-brand transition-colors">Home</Link>
          <Link to="/explore" className="hover:text-brand transition-colors">Explore</Link>
          {userRole === 'admin' && <Link to="/admin" className="text-brand font-bold">Admin Panel</Link>}
          {userRole === 'seller' && <Link to="/seller/dashboard" className="text-brand font-bold">Seller Dashboard</Link>}
        </nav>

        <div className="flex items-center gap-4">
          {!currentUser ? (
            <>
              <Link to="/login" className="font-semibold text-dark hover:text-brand transition-colors">Login</Link>
              <Link to="/sell-with-us" className="bg-brand text-white px-6 py-2.5 rounded-full font-semibold hover:bg-brand/90 transition-all shadow-sm">
                Sell with Us
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-brand uppercase bg-brand/10 px-3 py-1 rounded-full">{userRole || 'buyer'}</span>
              <NotificationBell />
              <Link to="/profile" className="font-semibold text-dark hover:text-brand transition-colors">Profile</Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-1">
          <img src="./logo.png" alt="KorBazar" className="h-14 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="font-bold text-xl text-brand">KorBazar</span>
        </Link>
        
        <div className="flex items-center gap-2">
          {currentUser && <NotificationBell />}
          {!currentUser ? (
            <Link to="/login" className="font-semibold text-brand">Login</Link>
          ) : (
            <Link to={userRole === 'seller' ? '/seller/dashboard' : userRole === 'admin' ? '/admin' : '/profile'} className="font-semibold text-brand flex items-center gap-1 uppercase text-sm bg-brand/10 px-3 py-1.5 rounded-full">
              <User size={14}/> {userRole || 'buyer'}
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center py-2 z-50 pb-safe">
        <Link to="/" className={`flex flex-col items-center p-2 ${location.pathname === '/' ? 'text-brand' : 'text-gray-500'}`}>
          <Home size={20} /> <span className="text-[10px] mt-1 font-medium">Home</span>
        </Link>
        <Link to="/explore" className={`flex flex-col items-center p-2 ${location.pathname === '/explore' ? 'text-brand' : 'text-gray-500'}`}>
          <Search size={20} /> <span className="text-[10px] mt-1 font-medium">Explore</span>
        </Link>

        {userRole === 'seller' ? (
          <>
            <Link to="/seller/dashboard" className={`flex flex-col items-center p-2 ${location.pathname === '/seller/dashboard' ? 'text-brand' : 'text-gray-500'}`}>
              <LayoutDashboard size={20} /> <span className="text-[10px] mt-1 font-medium">Dashboard</span>
            </Link>
            <Link to="/orders" className={`flex flex-col items-center p-2 ${location.pathname === '/orders' ? 'text-brand' : 'text-gray-500'}`}>
              <Package size={20} /> <span className="text-[10px] mt-1 font-medium">Orders</span>
            </Link>
            <Link to="/profile" className={`flex flex-col items-center p-2 ${location.pathname === '/profile' ? 'text-brand' : 'text-gray-500'}`}>
              <User size={20} /> <span className="text-[10px] mt-1 font-medium">Profile</span>
            </Link>
          </>
        ) : userRole === 'admin' ? (
          <>
            <Link to="/admin" className={`flex flex-col items-center p-2 ${location.pathname === '/admin' ? 'text-brand' : 'text-gray-500'}`}>
              <ShieldCheck size={20} /> <span className="text-[10px] mt-1 font-medium">Admin</span>
            </Link>
            <Link to="/profile" className={`flex flex-col items-center p-2 ${location.pathname === '/profile' ? 'text-brand' : 'text-gray-500'}`}>
              <User size={20} /> <span className="text-[10px] mt-1 font-medium">Profile</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/cart" className={`flex flex-col items-center p-2 ${location.pathname === '/cart' ? 'text-brand' : 'text-gray-500'}`}>
              <ShoppingCart size={20} /> <span className="text-[10px] mt-1 font-medium">Cart</span>
            </Link>
            <Link to="/favorites" className={`flex flex-col items-center p-2 ${location.pathname === '/favorites' ? 'text-brand' : 'text-gray-500'}`}>
              <Heart size={20} /> <span className="text-[10px] mt-1 font-medium">Saved</span>
            </Link>
            <Link to="/orders" className={`flex flex-col items-center p-2 ${location.pathname === '/orders' ? 'text-brand' : 'text-gray-500'}`}>
              <Package size={20} /> <span className="text-[10px] mt-1 font-medium">Orders</span>
            </Link>
            <Link to="/profile" className={`flex flex-col items-center p-2 ${location.pathname === '/profile' ? 'text-brand' : 'text-gray-500'}`}>
              <User size={20} /> <span className="text-[10px] mt-1 font-medium">Profile</span>
            </Link>
          </>
        )}
      </nav>
    </>
  );
}
