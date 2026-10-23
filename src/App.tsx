import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Register from './pages/Register';
import SellWithUs from './pages/SellWithUs';
import SellerPending from './pages/SellerPending';
import Admin from './pages/Admin';
import { AuthProvider } from './context/AuthContext';

const Placeholder = ({ title }: { title: string }) => (
  <div className="max-w-7xl mx-auto px-4 py-24 text-center pb-24">
    <h1 className="text-3xl font-bold text-dark mb-4">{title}</h1>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-cream">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/sell-with-us" element={<SellWithUs />} />
              <Route path="/sell-with-us/pending" element={<SellerPending />} />
              <Route path="/admin" element={<Admin />} />

              <Route path="/about" element={<Placeholder title="About KorBazar" />} />
              <Route path="/terms" element={<Placeholder title="Terms & Conditions" />} />
              <Route path="/privacy" element={<Placeholder title="Privacy Policy" />} />
              <Route path="/store/:id" element={<Placeholder title="Store Page" />} />
              <Route path="/product/:id" element={<Placeholder title="Product Details" />} />
              <Route path="/cart" element={<Placeholder title="Shopping Cart" />} />
              <Route path="/checkout" element={<Placeholder title="Checkout" />} />
              <Route path="/orders" element={<Placeholder title="My Orders" />} />
              <Route path="/profile" element={<Placeholder title="My Profile" />} />
              <Route path="/seller/dashboard" element={<Placeholder title="Seller Dashboard" />} />
              <Route path="/track/:token" element={<Placeholder title="Track Order" />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-100 py-8 text-center text-sm text-gray-500 pb-24 md:pb-8">
            <p className="font-semibold text-dark text-lg mb-2">KorBazar</p>
            <p className="mb-4">Khpal Kor, Khpal Bazar.</p>
            <div className="flex justify-center gap-6">
              <a href="#" className="hover:text-brand">Terms</a>
              <a href="#" className="hover:text-brand">Privacy</a>
              <a href="#" className="hover:text-brand">Contact</a>
            </div>
            <p className="mt-6 text-xs text-gray-400">© 2024 KorBazar. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}
