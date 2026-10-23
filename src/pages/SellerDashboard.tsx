import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Package, Store, User, PlusCircle } from 'lucide-react';

// Helper to compress multiple images
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5)); // Compress heavily to save DB space
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function SellerDashboard() {
  const { currentUser } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'store' | 'profile'>('orders');
  
  // Store Edit State
  const [storeBio, setStoreBio] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeMsg, setStoreMsg] = useState('');

  // Product Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Cakes & Bakes');
  const [productImages, setProductImages] = useState<FileList | null>(null);
  const [productMsg, setProductMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      // Fetch Store Data
      getDoc(doc(db, 'sellers', currentUser.uid)).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStore(data);
          setStoreBio(data.bio || '');
          setStoreAddress(data.storeAddress || '');
        }
      });

      // Fetch Seller's Products
      const q = query(collection(db, 'products'), where('sellerId', '==', currentUser.uid));
      getDocs(q).then(snapshot => {
        setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    }
  }, [currentUser]);

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setStoreMsg('Saving...');
    await updateDoc(doc(db, 'sellers', currentUser.uid), {
      bio: storeBio,
      storeAddress: storeAddress
    });
    setStoreMsg('Store updated successfully!');
    setTimeout(() => setStoreMsg(''), 3000);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !store) return;
    if (!productImages || productImages.length === 0) return setProductMsg('Please select at least 1 image.');
    if (productImages.length > 3) return setProductMsg('Maximum 3 images allowed.');

    setUploading(true);
    setProductMsg('Compressing and uploading images...');

    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < productImages.length; i++) {
        const base64 = await compressImage(productImages[i]);
        imageUrls.push(base64);
      }

      const newProduct = {
        sellerId: currentUser.uid,
        storeName: store.storeName,
        title,
        price: Number(price),
        category,
        isPremium: false,
        images: imageUrls,
        image: imageUrls[0], // Fallback for older components
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'products'), newProduct);
      setProducts([{ id: docRef.id, ...newProduct }, ...products]);
      
      setProductMsg('Product added successfully!');
      setTitle(''); setPrice(''); setProductImages(null);
      // Reset file input
      (document.getElementById('product-images') as HTMLInputElement).value = '';
      setTimeout(() => setProductMsg(''), 3000);
    } catch (error) {
      console.error(error);
      setProductMsg('Error adding product.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!store) return <div className="p-8 text-center">Store profile not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark">{store.storeName}</h1>
          <p className="text-gray-500">Status: <span className={`font-semibold uppercase ${store.status === 'approved' ? 'text-brand' : 'text-yellow-500'}`}>{store.status.replace('_', ' ')}</span></p>
        </div>
        {store.status === 'approved' && (
          <a href={`#/store/${currentUser?.uid}`} target="_blank" rel="noreferrer" className="bg-dark text-white px-6 py-2 rounded-xl font-semibold hover:bg-black transition-colors">View Public Store &rarr;</a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-8 border-b border-gray-200 pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'orders' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Package size={18}/> Orders & Products</button>
        <button onClick={() => setActiveTab('store')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'store' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Store size={18}/> My Store</button>
        <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeTab === 'profile' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><User size={18}/> My Profile</button>
      </div>

      {store.status !== 'approved' ? (
        <div className="bg-yellow-50 text-yellow-800 p-8 rounded-2xl border border-yellow-200 text-center">
          <h2 className="text-xl font-bold mb-2">Account Pending Approval</h2>
          <p>Your account is under review. Once approved, you can add products and manage your store.</p>
        </div>
      ) : (
        <div>
          {activeTab === 'orders' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Add Product Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2"><PlusCircle size={20}/> Add New Product</h2>
                {productMsg && <div className={`p-3 rounded-lg text-sm mb-4 ${productMsg.includes('Error') ? 'bg-red-50 text-alert' : 'bg-green-50 text-brand'}`}>{productMsg}</div>}
                
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (PKR)</label>
                      <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (Max 3)</label>
                    <input id="product-images" type="file" multiple accept="image/*" required onChange={e => setProductImages(e.target.files)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20" />
                  </div>
                  <button type="submit" disabled={uploading} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 shadow-md disabled:bg-gray-400">
                    {uploading ? 'Saving...' : 'Save Product'}
                  </button>
                </form>
              </div>

              {/* Product List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-dark mb-4">Your Listed Products ({products.length})</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {products.length === 0 ? <p className="text-gray-500 text-sm">No products listed yet.</p> : products.map(p => (
                    <div key={p.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <img src={p.image} alt={p.title} className="w-16 h-16 object-cover rounded-lg" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-dark">{p.title}</h4>
                        <p className="text-sm text-brand font-semibold">Rs. {p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
              <h2 className="text-xl font-bold text-dark mb-4">Edit Store Information</h2>
              {storeMsg && <div className="bg-green-50 text-brand p-3 rounded-lg text-sm mb-4">{storeMsg}</div>}
              <form onSubmit={handleUpdateStore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name (Cannot be changed)</label>
                  <input type="text" disabled value={store.storeName} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Bio</label>
                  <textarea value={storeBio} onChange={e => setStoreBio(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand focus:outline-none bg-gray-50" />
                </div>
                <button type="submit" className="bg-brand text-white font-bold py-3.5 px-8 rounded-xl hover:bg-brand/90 shadow-md">Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
              <h2 className="text-xl font-bold text-dark mb-4">My Profile</h2>
              <div className="space-y-4 text-gray-700">
                <p><span className="font-semibold text-dark">Full Name:</span> {store.fullName}</p>
                <p><span className="font-semibold text-dark">CNIC:</span> {store.cnicNumber}</p>
                <p><span className="font-semibold text-dark">Date of Birth:</span> {store.dob}</p>
                <p><span className="font-semibold text-dark">Phone:</span> {store.phone}</p>
                <p><span className="font-semibold text-dark">WhatsApp:</span> {store.whatsappNumber}</p>
                <p><span className="font-semibold text-dark">City:</span> {store.city}, {store.area}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
    }
