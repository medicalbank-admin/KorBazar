import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package } from 'lucide-react';

export default function TrackSearch() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let cleanToken = token.trim();

    // If the user pastes the full URL (e.g., https://.../track/uuid), extract just the UUID
    if (cleanToken.includes('/track/')) {
      cleanToken = cleanToken.split('/track/')[1];
    }
    
    // Remove any trailing slashes or spaces
    cleanToken = cleanToken.split('/')[0].split('?')[0];

    if (!cleanToken) {
      setError('Please enter a valid Order ID or Tracking Link.');
      return;
    }

    // Redirect to the tracking page
    navigate(`/track/${cleanToken}`);
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-cream">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand">
          <Package size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-dark mb-2">Track Your Order</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter your Order ID or paste the tracking link you received in your email/WhatsApp.
        </p>

        {error && (
          <div className="bg-red-50 text-alert p-3 rounded-xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none text-sm"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 shadow-md transition-colors"
          >
            Track Order
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Tip: You can find your Order ID in the confirmation email sent to you after placing the order, please spam folder if it takes more than 2 minutes to arrive.
          </p>
        </div>
      </div>
    </div>
  );
}
