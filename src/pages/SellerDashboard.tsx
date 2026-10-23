import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Product form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Cakes & Bakes');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      getDoc(doc(db, 'sellers', currentUser.uid)).then(docSnap => {
        if (docSnap.exists()) {
          setStore(docSnap.data());
        }
        setLoading(false);
      });
    }
  }, [currentUser]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !store) return;
    
    try {
      await addDoc(collection(db, 'products'), {
        sellerId: currentUser.uid,
        storeName: store.storeName,
        title,
        price: Number(price),
        category,
        isPremium: false,
        image: `https://placehold.co/400x400/E8F5E9/118A36?text=${encodeURIComponent(title)}`,
        createdAt: new Date().toISOString()
      });
      
      setMsg('Product added successfully!');
      setTitle('');
      setPrice('');
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      console.error(error);
      setMsg('Error adding product.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!store) return <div className="p-8 text-center">Store profile not found. Please register as a seller.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark">{store.storeName}</h1>
          <p className="text-gray-500">Status: <span className={`font-semibold uppercase ${store.status === 'approved' ? 'text-brand' : 'text-yellow-500'}`}>{store.status.replace('_', ' ')}</span></p>
        </div>
        {store.status === 'approved' && (
          <Link to={`/store/${currentUser?.uid}`} className="text-brand font-semibold hover:underline">View Public Store &rarr;</Link>
        )}
      </div>

      {store.status === 'approved' ? (
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Add Product Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-dark mb-4">Add New Product</h2>
            {msg && <div className="bg-green-50 text-brand p-3 rounded-lg text-sm mb-4">{msg}</div>}
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" placeholder="e.g. Handmade Locket" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (PKR)</label>
                <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" placeholder="1200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50">
                  <option>Cakes & Bakes</option>
                  <option>Handmade Jewelry</option>
                  <option>Crafts & Decor</option>
                  <option>Embroidered Items</option>
                  <option>Candles</option>
                  <option>Gift Hampers</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 shadow-md">Save Product</button>
            </form>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center text-center">
             <h2 className="text-xl font-bold text-dark mb-2">Your Store is Live!</h2>
             <p className="text-gray-500 mb-6 text-sm">You can now start adding products. Buyers can find your store on the Explore page.</p>
             <Link to={`/store/${currentUser?.uid}`} className="bg-gray-100 text-dark px-8 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Go to Public Store</Link>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 text-yellow-800 p-8 rounded-2xl border border-yellow-200 text-center">
          <h2 className="text-xl font-bold mb-2">Account Pending Approval</h2>
          <p>Your account is currently under review. You will be able to add products once your CNIC is verified by the Admin.</p>
        </div>
      )}
    </div>
  );
          }
