import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Admin() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'sellers'));
      const sellersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort newest first
      sellersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSellers(sellersData);
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'sellers', id), { status: 'approved', verifiedAt: new Date().toISOString() });
    fetchSellers();
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason) {
      await updateDoc(doc(db, 'sellers', id), { status: 'rejected', rejectionReason: reason });
      fetchSellers();
    }
  };

  const filteredSellers = sellers.filter(s => 
    activeTab === 'pending' ? s.status === 'pending_verification' : s.status !== 'pending_verification'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-dark mb-8">Admin Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-2 font-bold text-lg ${activeTab === 'pending' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
        >
          Pending Approvals ({sellers.filter(s => s.status === 'pending_verification').length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 font-bold text-lg ${activeTab === 'history' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
        >
          Application History
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading applications...</div>
        ) : filteredSellers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No applications found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSellers.map((seller) => (
              <div key={seller.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                {/* Seller Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl text-dark">{seller.storeName}</h3>
                    {seller.status === 'approved' && <span className="bg-green-100 text-brand text-xs font-bold px-2 py-1 rounded-full uppercase">Approved</span>}
                    {seller.status === 'rejected' && <span className="bg-red-100 text-alert text-xs font-bold px-2 py-1 rounded-full uppercase">Rejected</span>}
                    {seller.status === 'pending_verification' && <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1"><Clock size={12}/> Pending</span>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                    <p><span className="font-semibold text-dark">Owner:</span> {seller.fullName}</p>
                    <p><span className="font-semibold text-dark">CNIC:</span> {seller.cnicNumber}</p>
                    <p><span className="font-semibold text-dark">Phone:</span> {seller.phone}</p>
                    <p><span className="font-semibold text-dark">Type:</span> {seller.storeType}</p>
                    <p><span className="font-semibold text-dark">Area:</span> {seller.area}, {seller.city}</p>
                  </div>
                  {seller.rejectionReason && <p className="text-sm text-alert mt-2"><span className="font-semibold">Reason:</span> {seller.rejectionReason}</p>}
                </div>

                {/* CNIC Images & Actions */}
                <div className="flex flex-col gap-4 md:items-end">
                  <div className="flex gap-2">
                    {seller.cnicFrontUrl && (
                      <a href={seller.cnicFrontUrl} target="_blank" rel="noreferrer" className="text-sm bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200">View CNIC Front</a>
                    )}
                    {seller.cnicBackUrl && (
                      <a href={seller.cnicBackUrl} target="_blank" rel="noreferrer" className="text-sm bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200">View CNIC Back</a>
                    )}
                  </div>
                  
                  {seller.status === 'pending_verification' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleReject(seller.id)} className="flex items-center gap-2 px-4 py-2 text-alert border border-alert rounded-xl font-semibold hover:bg-red-50 transition-colors">
                        <XCircle size={18} /> Reject
                      </button>
                      <button onClick={() => handleApprove(seller.id)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-semibold hover:bg-brand/90 transition-colors">
                        <CheckCircle size={18} /> Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
                                  }
