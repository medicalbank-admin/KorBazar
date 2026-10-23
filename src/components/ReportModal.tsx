import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, ShieldAlert } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, targetId, targetType, targetName }: { isOpen: boolean, onClose: () => void, targetId: string, targetType: 'store' | 'product' | 'order', targetName: string }) {
  const [reason, setReason] = useState('Fake / Scam Store');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        targetId,
        targetType,
        targetName,
        reason,
        details,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); setDetails(''); }, 2000);
    } catch (error) {
      alert('Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-alert"><X size={24} /></button>
        
        <div className="flex items-center gap-2 mb-4 text-alert">
          <ShieldAlert size={28} />
          <h2 className="text-xl font-bold">Report {targetType}</h2>
        </div>
        
        {success ? (
          <div className="bg-green-50 text-brand p-4 rounded-xl text-center font-bold">
            Thank you. Your report has been submitted to the Admin for review.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">You are reporting: <strong>{targetName}</strong></p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for reporting</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none">
                <option>Fake / Scam Store</option>
                <option>Counterfeit Product</option>
                <option>Inappropriate Content</option>
                <option>Seller not responding</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details (Optional)</label>
              <textarea required value={details} onChange={e => setDetails(e.target.value)} rows={3} placeholder="Please explain what happened..." className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-alert text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:bg-gray-400">
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
              }
