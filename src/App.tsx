import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

// Icons for the Footer
import { Facebook, Instagram, MessageCircle, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';

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

                    {/* PROFESSIONAL FOOTER */}
                    <footer className="bg-[#0f172a] text-gray-300 pt-16 pb-24 md:pb-8 border-t border-gray-800">
                      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                        
                        {/* Column 1: Brand & About */}
                        <div>
                          <Link to="/" className="inline-block mb-4 bg-white p-2 rounded-xl">
                            <img 
                              src="./logo.png" 
                              alt="KorBazar" 
                              className="h-10 w-auto object-contain" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                            />
                          </Link>
                          <p className="text-sm leading-relaxed mb-6 text-gray-400">
                            Khpal Kor, Khpal Bazar. Discover authentic, handmade goods and support local creators from the heart of Pakistan.
                          </p>
                          <div className="flex items-center gap-3">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-brand hover:text-white transition-colors">
                              <Facebook size={18} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-brand hover:text-white transition-colors">
                              <Instagram size={18} />
                            </a>
                            <a href="https://wa.me/923390251147" target="_blank" rel="noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-brand hover:text-white transition-colors">
                              <MessageCircle size={18} />
                            </a>
                          </div>
                        </div>

                        {/* Column 2: Quick Links */}
                        <div>
                          <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
                          <ul className="space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-brand transition-colors">Home</Link></li>
                            <li><Link to="/explore" className="hover:text-brand transition-colors">Explore Products</Link></li>
                            <li><Link to="/track" className="hover:text-brand transition-colors">Track Your Order</Link></li>
                            <li><Link to="/favorites" className="hover:text-brand transition-colors">My Favorites</Link></li>
                            <li><Link to="/profile" className="hover:text-brand transition-colors">My Account</Link></li>
                          </ul>
                        </div>

                        {/* Column 3: For Sellers & Support */}
                        <div>
                          <h3 className="text-white font-bold text-lg mb-4">Sellers & Support</h3>
                          <ul className="space-y-3 text-sm">
                            <li><Link to="/sell-with-us" className="hover:text-brand transition-colors">Start Selling</Link></li>
                            <li><Link to="/seller/dashboard" className="hover:text-brand transition-colors">Seller Dashboard</Link></li>
                            <li><Link to="/inbox" className="hover:text-brand transition-colors">Message Inbox</Link></li>
                            <li><Link to="/about" className="hover:text-brand transition-colors">About Us</Link></li>
                            <li><Link to="/terms" className="hover:text-brand transition-colors">Terms of Service</Link></li>
                          </ul>
                        </div>

                        {/* Column 4: Contact & Payments */}
                        <div>
                          <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
                          <ul className="space-y-4 text-sm mb-6">
                            <li className="flex items-start gap-3">
                              <MapPin size={18} className="text-brand shrink-0 mt-0.5" />
                              <span>Charsadda, Khyber Pakhtunkhwa, Pakistan</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <Phone size={18} className="text-brand shrink-0" />
                              <span>+92 339 0251147</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <Mail size={18} className="text-brand shrink-0" />
                              <span>Korbazarofficial@gmail.com</span>
                            </li>
                          </ul>

                          <div>
                            <h4 className="text-white font-bold text-sm mb-3">Secure Payments</h4>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-1 bg-gray-800 rounded text-xs font-semibold border border-gray-700">JazzCash</span>
                              <span className="px-2 py-1 bg-gray-800 rounded text-xs font-semibold border border-gray-700">Easypaisa</span>
                              <span className="px-2 py-1 bg-gray-800 rounded text-xs font-semibold border border-gray-700">Bank Transfer</span>
                              <span className="px-2 py-1 bg-gray-800 rounded text-xs font-semibold border border-gray-700">COD</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Footer Bottom Bar */}
                      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-800 flex flex-col lg:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                        
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
                          <p>© {new Date().getFullYear()} KorBazar. All rights reserved.</p>
                          <span className="hidden md:inline text-gray-700">|</span>
                          <p>Made within Charsadda, KPK.</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-brand" />
                          <span>100% Secure & Trusted Marketplace</span>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                           <div className="flex gap-4">
                              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                              <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                           </div>
                           <span className="hidden md:inline text-gray-700">|</span>
                           <p>Developed by <span className="text-gray-300 font-bold">DoCoder</span></p>
                        </div>

                      </div>
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
