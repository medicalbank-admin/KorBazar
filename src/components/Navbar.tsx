import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Package, LayoutDashboard, ShieldCheck, Heart, MessageSquare, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const location = useLocation();
  const { currentUser, userRole } = useAuth();
  const { unreadTotal } = useChat();
  const { cartItemCount } = useCart();

  return (
    <>
      {/* Desktop Navbar */}
      <header className="hidden md:flex items-center justify-between px-8 py-6 bg-white shadow-sm sticky top-0 z-50">
        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
          <img src="./logo.png" alt="KorBazar" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </Link>
        
        <nav className="flex gap-8 font-medium text-dark/80">
          <Link to="/" className="hover:text-brand transition-colors">Home</Link>
          <Link to="/explore" className="hover:text-brand transition-colors">Explore</Link>
          <Link to="/track" className="hover:text-brand transition-colors">Track Order</Link>
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
              
              {/* CART ICON FOR DESKTOP */}
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand transition-colors">
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-alert text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* INBOX ICON FOR DESKTOP */}
              <Link to="/inbox" className="relative p-2 text-gray-600 hover:text-brand transition-colors">
                <MessageSquare size={24} />
                {unreadTotal > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {unreadTotal}
                  </span>
                )}
              </Link>

              <NotificationBell />
              <Link to="/profile" className="font-semibold text-dark hover:text-brand transition-colors">Profile</Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-1">
          <img src="./logo.png" alt="KorBazar" className="h-12 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </Link>
        
        <div className="flex items-center gap-2">
          {/* TRACK ORDER ICON FOR MOBILE */}
          <Link to="/track" className="p-2 text-gray-600 hover:text-brand transition-colors">
            <MapPin size={22} />
          </Link>

          {/* CART ICON FOR MOBILE TOP BAR */}
          {currentUser && (
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand transition-colors">
              <ShoppingCart size={22} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-alert text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}

          {/* INBOX ICON FOR MOBILE */}
          {currentUser && (
            <Link to="/inbox" className="relative p-2 text-gray-600 hover:text-brand transition-colors">
              <MessageSquare size={22} />
              {unreadTotal > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {unreadTotal}
                </span>
              )}
            </Link>
          )}

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
            {/* TRACK ORDER FOR GUESTS & BUYERS */}
            <Link to="/track" className={`flex flex-col items-center p-2 ${location.pathname === '/track' ? 'text-brand' : 'text-gray-500'}`}>
              <MapPin size={20} /> <span className="text-[10px] mt-1 font-medium">Track</span>
            </Link>
            <Link to="/cart" className={`flex flex-col items-center p-2 ${location.pathname === '/cart' ? 'text-brand' : 'text-gray-500'}`}>
              <div className="relative">
                <ShoppingCart size={20} /> 
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-alert text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">Cart</span>
            </Link>
            <Link to="/favorites" className={`flex flex-col items-center p-2 ${location.pathname === '/favorites' ? 'text-brand' : 'text-gray-500'}`}>
              <Heart size={20} /> <span className="text-[10px] mt-1 font-medium">Saved</span>
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
