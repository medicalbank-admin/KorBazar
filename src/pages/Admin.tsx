import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Admin() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingSellers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'sellers'), where('status', '==', 'pending_verification'));
      const querySnapshot = await getDocs(q);
      const sellersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSellers(sellersData);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSellers();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'sellers', id), { status: 'approved', verifiedAt: new Date().toISOString() });
    fetchPendingSellers();
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Enter rejection reason (e.g., 'Name doesn't match CNIC', 'Image unclear'):");
    if (reason) {
      await updateDoc(doc(db, 'sellers', id), { status: 'rejected', rejectionReason: reason });
      fetchPendingSellers();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-dark mb-8">Admin Dashboard</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-dark">Pending Seller Verifications</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading applications...</div>
        ) : sellers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No pending applications right now.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sellers.map((seller) => (
              <div key={seller.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-dark">{seller.storeName}</h3>
                  <p className="text-sm text-gray-600">Owner: {seller.fullName}</p>
                  <p className="text-sm text-gray-600">CNIC: {seller.cnicNumber} | DOB: {seller.dob}</p>
                  <p className="text-sm text-gray-600">Phone: {seller.phone} | Type: {seller.storeType}</p>
                  <p className="text-sm text-gray-600">Area: {seller.area}, {seller.city}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleReject(seller.id)} className="flex items-center gap-2 px-4 py-2 text-alert border border-alert rounded-xl font-semibold hover:bg-red-50 transition-colors">
                    <XCircle size={18} /> Reject
                  </button>
                  <button onClick={() => handleApprove(seller.id)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-semibold hover:bg-brand/90 transition-colors">
                    <CheckCircle size={18} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
                  }
