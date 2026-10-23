import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle, XCircle, Clock, X, Package } from 'lucide-react';

export default function Admin() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'products'>('pending');
  const [viewImage, setViewImage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const sellersData = sellersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      sellersData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSellers(sellersData);

      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      productsData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'sellers', id), { status: 'approved', verifiedAt: new Date().toISOString() });
    fetchData();
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason) {
      await updateDoc(doc(db, 'sellers', id), { status: 'rejected', rejectionReason: reason });
      fetchData();
    }
  };

  const filteredSellers = sellers.filter(s => 
    activeTab === 'pending' ? s.status === 'pending_verification' : s.status !== 'pending_verification'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 relative">
      <h1 className="text-3xl font-bold text-dark mb-8">Admin Dashboard</h1>
      
      {viewImage && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full">
            <button onClick={() => setViewImage(null)} className="absolute -top-12 right-0 text-white bg-red-500 rounded-full p-2"><X size={24} /></button>
            <img src={viewImage} alt="Full Size" className="w-full h-auto rounded-xl" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-4 mb-6 border-b border-gray-200 scrollbar-hide">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-2 font-bold text-lg whitespace-nowrap ${activeTab === 'pending' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
        >
          Pending Sellers ({sellers.filter(s => s.status === 'pending_verification').length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 font-bold text-lg whitespace-nowrap ${activeTab === 'history' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
        >
          Seller History
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-2 font-bold text-lg whitespace-nowrap ${activeTab === 'products' ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}
        >
          Platform Products ({products.length})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading data...</div>
      ) : activeTab === 'products' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <img src={p.image} alt={p.title} className="w-16 h-16 object-cover rounded-lg" />
                <div>
                  <h4 className="font-bold text-dark">{p.title}</h4>
                  <p className="text-xs text-gray-500">{p.storeName}</p>
                  <p className="text-sm text-brand font-semibold">Rs. {p.price}</p>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-gray-500">No products listed on the platform yet.</p>}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredSellers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No applications found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSellers.map((seller) => (
                <div key={seller.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
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
                    </div>
                    {seller.rejectionReason && <p className="text-sm text-alert mt-2"><span className="font-semibold">Reason:</span> {seller.rejectionReason}</p>}
                  </div>

                  <div className="flex flex-col gap-4 md:items-end">
                    <div className="flex gap-2">
                      {seller.cnicFrontUrl && <button onClick={() => setViewImage(seller.cnicFrontUrl)} className="text-sm bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200 font-semibold text-dark">View CNIC Front</button>}
                      {seller.cnicBackUrl && <button onClick={() => setViewImage(seller.cnicBackUrl)} className="text-sm bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200 font-semibold text-dark">View CNIC Back</button>}
                    </div>
                    {seller.status === 'pending_verification' && (
                      <div className="flex gap-3">
                        <button onClick={() => handleReject(seller.id)} className="flex items-center gap-2 px-4 py-2 text-alert border border-alert rounded-xl font-semibold hover:bg-red-50 transition-colors"><XCircle size={18} /> Reject</button>
                        <button onClick={() => handleApprove(seller.id)} className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl font-semibold hover:bg-brand/90 transition-colors"><CheckCircle size={18} /> Approve</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
                      }
