import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/ProductCard';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const { favorites } = useFavorites();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(collection(db, 'products'));
      const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(allProducts.filter(p => favorites.includes(p.id)));
      setLoading(false);
    };
    fetchProducts();
  }, [favorites]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-dark mb-8 flex items-center gap-2">
        <Heart className="text-red-500 fill-red-500" /> My Favorites
      </h1>
      
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 mb-4">You haven't saved any items yet.</p>
          <Link to="/explore" className="bg-brand text-white px-6 py-2 rounded-xl font-semibold">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
