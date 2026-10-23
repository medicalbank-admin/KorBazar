import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function SellerPending() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Application Received!</h2>
        <p className="text-gray-600 mb-8">
          Thank you for applying to sell on KorBazar. Your shop is currently under review. We will notify you on WhatsApp once your CNIC is verified and your shop is live.
        </p>
        <Link to="/" className="inline-block bg-brand text-white font-bold py-3 px-8 rounded-xl hover:bg-brand/90 transition-all">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
