import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Shield, Store } from 'lucide-react';

export default function Profile() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (!currentUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-dark mb-4">You are not logged in</h2>
        <Link to="/login" className="bg-brand text-white px-8 py-3 rounded-full font-bold hover:bg-brand/90">Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 pb-24">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <User size={40} />
          </div>
          <h1 className="text-2xl font-bold">{currentUser.email?.split('@')[0]}</h1>
          <p className="text-brand-100">{currentUser.email}</p>
          <div className="inline-flex items-center gap-1 mt-3 bg-white/20 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider backdrop-blur-sm">
            {userRole === 'admin' && <Shield size={16} />}
            {userRole === 'seller' && <Store size={16} />}
            {userRole === 'buyer' && <User size={16} />}
            {userRole || 'Buyer'}
          </div>
        </div>

        {/* Links & Actions */}
        <div className="p-6 space-y-4">
          {userRole === 'seller' && (
             <Link to="/seller/dashboard" className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-semibold text-dark">
               Go to Seller Dashboard
             </Link>
          )}
          {userRole === 'admin' && (
             <Link to="/admin" className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors font-semibold text-dark">
               Go to Admin Panel
             </Link>
          )}
          
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-alert hover:bg-red-100 rounded-xl transition-colors font-bold">
            <LogOut size={20} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
            }
