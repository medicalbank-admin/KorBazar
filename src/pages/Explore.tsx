import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';

const allCategories = ["Cakes & Bakes", "Handmade Jewelry", "Crafts & Decor", "Embroidered Items", "Candles", "Gift Hampers"];

export default function Explore() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const sellersSnap = await getDocs(collection(db, 'sellers'));
        const activeSellerIds = sellersSnap.docs
          .filter(d => d.data().status === 'approved' && !d.data().isFrozen)
          .map(d => d.id);

        const activeProducts = allProducts.filter(p => activeSellerIds.includes(p.sellerId));
        setProducts(activeProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.storeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search products or stores..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm text-lg"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-dark">Categories</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="category" checked={selectedCategory === null} onChange={() => setSelectedCategory(null)} className="text-brand focus:ring-brand" />
                All Categories
              </label>
              {allCategories.map(cat => (
                <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="category" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} className="text-brand focus:ring-brand" />
                  {cat}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {loading ? (
             <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">No products found matching your search.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
