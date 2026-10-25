import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import AdSlideshow from '../components/AdSlideshow';
import TrustBadges from '../components/TrustBadges';
import TrendingProducts from '../components/TrendingProducts';
import DiscountDeals from '../components/DiscountDeals';
import NewArrivals from '../components/NewArrivals';
import FeaturedStores from '../components/FeaturedStores';
import SellerCTA from '../components/SellerCTA';
import RecentlyViewed from '../components/RecentlyViewed';
import NewsletterSignup from '../components/NewsletterSignup';
import FAQ from '../components/FAQ';

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [premiumSellerIds, setPremiumSellerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async () => {
    try {
      // 1. Fetch Categories
      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 2. Fetch Sellers
      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const activeSellerIds: string[] = [];
      const premiumIds: string[] = [];
      
      sellersSnap.docs.forEach(d => {
        const data = d.data();
        if (data.status === 'approved' && !data.isFrozen) {
          activeSellerIds.push(d.id);
          if (data.plan === 'premium') premiumIds.push(d.id);
        }
      });
      setPremiumSellerIds(premiumIds);

      // 3. Fetch Initial 20 Products (Sorted by Newest)
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);
      
      const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const activeProducts = allProducts.filter(p => activeSellerIds.includes(p.sellerId));
      
      setProducts(activeProducts);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 20); // If we got less than 20, there are no more
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);

    try {
      const q = query(
        collection(db, 'products'), 
        orderBy('createdAt', 'desc'), 
        startAfter(lastDoc), 
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      
      const newProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // Filter based on active sellers (we need to re-fetch active sellers or store them in state if we want to be perfectly accurate, but for simplicity, we'll assume the active list is the same)
      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const activeSellerIds = sellersSnap.docs
        .filter(d => d.data().status === 'approved' && !d.data().isFrozen)
        .map(d => d.id);
        
      const filteredNewProducts = newProducts.filter(p => activeSellerIds.includes(p.sellerId));

      setProducts(prev => [...prev, ...filteredNewProducts]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 20);

    } catch (error) {
      console.error("Error loading more:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const premiumProducts = products.filter(p => premiumSellerIds.includes(p.sellerId)).slice(0, 8);
  const standardProducts = products.filter(p => !premiumSellerIds.includes(p.sellerId));

  return (
    <div className="pb-24 md:pb-12">
      <AdSlideshow />

      <section className="px-4 py-16 md:py-24 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-dark mb-6 tracking-tight">
          Khpal Kor, <span className="text-brand">Khpal Bazar.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover unique, handmade goods and homemade treats from the talented creators of Charsadda.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link to="/explore" className="bg-brand text-white px-8 py-3 rounded-full font-semibold hover:bg-brand/90 transition-all shadow-md">
            Explore Products
          </Link>
          <Link to="/sell-with-us" className="bg-white text-dark border border-gray-200 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all">
            Sell with Us
          </Link>
        </div>
      </section>

      <TrustBadges />

      <section className="px-4 max-w-7xl mx-auto mb-12">
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <Link to={`/explore?cat=${encodeURIComponent(cat.name)}`} key={cat.id} className="whitespace-nowrap px-5 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium hover:border-brand hover:text-brand transition-colors">
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <TrendingProducts />
      <DiscountDeals />

      {/* FEATURED PREMIUM PRODUCTS */}
      {premiumProducts.length > 0 && (
        <section className="px-4 max-w-7xl mx-auto mb-16">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-dark">Featured Shops & Products</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {premiumProducts.map(product => (
              <ProductCard key={product.id} product={product} isSellerPremium={true} />
            ))}
          </div>
        </section>
      )}

      {/* STANDARD PRODUCTS */}
      <section className="px-4 max-w-7xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-dark mb-6">Fresh from the Oven & Studio</h2>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : standardProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 mb-4">No standard products listed yet.</p>
            <Link to="/sell-with-us" className="bg-brand text-white px-6 py-2 rounded-xl font-semibold">Start Selling</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {standardProducts.map(product => (
              <ProductCard key={product.id} product={product} isSellerPremium={false} />
            ))}
          </div>
        )}
        
        {/* LOAD MORE BUTTON */}
        {hasMore && !loading && (
          <div className="mt-12 text-center">
            <button 
              onClick={handleLoadMore} 
              disabled={loadingMore}
              className="inline-block w-full md:w-auto bg-gray-200 text-dark px-12 py-4 rounded-full font-bold text-lg hover:bg-gray-300 transition-all disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load More Products'}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/explore" className="inline-block w-full md:w-auto bg-dark text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-black transition-all">
            Explore All Shops & Products
          </Link>
        </div>
      </section>

      <NewArrivals />
      <FeaturedStores />
      <SellerCTA />
      <RecentlyViewed />
      <NewsletterSignup />
      <FAQ />

    </div>
  );
        }
