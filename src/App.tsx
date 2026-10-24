import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Register from './pages/Register';
import SellWithUs from './pages/SellWithUs';
import SellerPending from './pages/SellerPending';
import Admin from './pages/Admin';
import SellerDashboard from './pages/SellerDashboard';
import ProductDetails from './pages/ProductDetails'; 
import StorePage from './pages/StorePage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import TrackOrder from './pages/TrackOrder';
import BuyerOrders from './pages/BuyerOrders';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Inbox from './pages/Inbox';
import ChatRoom from './pages/ChatRoom';
import TrackSearch from './pages/TrackSearch';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import { HistoryProvider } from './context/HistoryContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <HistoryProvider>
            <FavoritesProvider>
              <CartProvider>
                <Router>
                  <div className="min-h-screen flex flex-col bg-cream">
                    <Navbar />
                    <main className="flex-grow">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/product/:id" element={<ProductDetails />} />
                        <Route path="/store/:id" element={<StorePage />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/track/:token" element={<TrackOrder />} />
                        <Route path="/track" element={<TrackSearch />} />
                        <Route path="/favorites" element={<Favorites />} />
                        
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/sell-with-us" element={<SellWithUs />} />
                        <Route path="/sell-with-us/pending" element={<SellerPending />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/seller/dashboard" element={<SellerDashboard />} />

                        <Route path="/orders" element={<BuyerOrders />} />
                        <Route path="/profile" element={<Profile />} />
                        
                        {/* CHAT ROUTES */}
                        <Route path="/inbox" element={<Inbox />} />
                        <Route path="/chat/:chatId" element={<ChatRoom />} />

                        <Route path="/about" element={<About />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                      </Routes>
                    </main>
                    <footer className="bg-white border-t border-gray-100 py-8 text-center text-sm text-gray-500 pb-24 md:pb-8">
                      <img 
                        src="./logo.png" 
                        alt="KorBazar" 
                        className="h-14 w-auto object-contain mx-auto mb-2" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      />
                      <p className="mb-4">Khpal Kor, Khpal Bazar.</p>
                      <div className="flex justify-center gap-6">
                        <a href="#/terms" className="hover:text-brand">Terms</a>
                        <a href="#/privacy" className="hover:text-brand">Privacy</a>
                        <a href="#/about" className="hover:text-brand">About</a>
                      </div>
                      <p className="mt-6 text-xs text-gray-400">© 2024 KorBazar. All rights reserved.</p>
                    </footer>
                  </div>
                </Router>
              </CartProvider>
            </FavoritesProvider>
          </HistoryProvider>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
