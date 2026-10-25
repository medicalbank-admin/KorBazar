import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import AdSlideshow from '../components/AdSlideshow';
import TrustBadges from '../components/TrustBadges';
import TrendingProducts from '../components/TrendingProducts';
import DiscountDeals from '../components/DiscountDeals';
import NewArrivals from '../components/NewArrivals';
import ShopByCategory from '../components/ShopByCategory';
import FeaturedStores from '../components/FeaturedStores';
import SellerCTA from '../components/SellerCTA';
import RecentlyViewed from '../components/RecentlyViewed';
import NewsletterSignup from '../components/NewsletterSignup';
import FAQ from '../components/FAQ';
import { Menu, ChevronRight } from 'lucide-react';

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
  children?: CategoryNode[];
};

const buildCategoryTree = (categoryList: CategoryNode[]): CategoryNode[] => {
  const byId = new Map<string, CategoryNode & { children: CategoryNode[] }>();
  categoryList.forEach((cat) => {
    byId.set(cat.id, { ...cat, children: [] });
  });

  const roots: Array<CategoryNode & { children: CategoryNode[] }> = [];

  categoryList.forEach((cat) => {
    const node = byId.get(cat.id);
    if (!node) return;

    if (cat.parentId) {
      const parent = byId.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (
    items: Array<CategoryNode & { children: CategoryNode[] }>
  ): Array<CategoryNode & { children: CategoryNode[] }> =>
    [...items]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        ...item,
        children: sortChildren(item.children ?? []),
      }));

  return sortChildren(roots);
};

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [premiumSellerIds, setPremiumSellerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const categoryTree = useMemo(() => buildCategoryTree(categories as CategoryNode[]), [categories]);

  const fetchData = async () => {
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      const categoryDocs: any[] = catSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        parentId: d.data().parentId ?? null,
      }));
      setCategories(categoryDocs);

      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const activeSellerIds: string[] = [];
      const premiumIds: string[] = [];

      sellersSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.status === 'approved' && !data.isFrozen) {
          activeSellerIds.push(d.id);
          if (data.plan === 'premium') premiumIds.push(d.id);
        }
      });

      setPremiumSellerIds(premiumIds);

      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(20));
      const querySnapshot = await getDocs(q);

      const allProducts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];
      const activeProducts = allProducts.filter((p) => activeSellerIds.includes(p.sellerId));

      setProducts(activeProducts);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 20);
    } catch (error) {
      console.error('Error fetching data:', error);
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

      const newProducts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];

      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const activeSellerIds = sellersSnap.docs
        .filter((d) => d.data().status === 'approved' && !d.data().isFrozen)
        .map((d) => d.id);

      const filteredNewProducts = newProducts.filter((p) => activeSellerIds.includes(p.sellerId));

      setProducts((prev) => [...prev, ...filteredNewProducts]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 20);
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const premiumProducts = products.filter((p) => premiumSellerIds.includes(p.sellerId)).slice(0, 8);
  const standardProducts = products.filter((p) => !premiumSellerIds.includes(p.sellerId));

  return (
    <div className="bg-[#f4f5f7] min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-0 md:px-4 pt-0 md:pt-6">
        <div className="md:hidden mb-4">
          <AdSlideshow />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="hidden md:block w-64 bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-max shrink-0">
            <h3 className="font-bold text-dark mb-4 px-2">All Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/explore"
                  className="flex items-center gap-3 px-3 py-2 text-brand bg-brand/5 rounded-lg font-bold text-sm transition-colors"
                >
                  <Menu size={16} /> All Categories
                </Link>
              </li>

              {categoryTree.map((main: any) => (
                <li key={main.id}>
                  <div className="flex items-center gap-3 px-3 py-2 text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    <Link
                      to={`/explore?cat=${encodeURIComponent(main.name)}`}
                      className="font-medium text-sm hover:text-brand"
                    >
                      {main.name}
                    </Link>
                  </div>

                  {main.children && main.children.length > 0 && (
                    <ul className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-3">
                      {main.children.map((sub: any) => (
                        <li key={sub.id}>
                          <Link
                            to={`/explore?cat=${encodeURIComponent(sub.name)}`}
                            className="block px-2 py-1 text-xs text-gray-600 hover:text-brand"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}

              <li>
                <Link
                  to="/explore"
                  className="flex items-center justify-between px-3 py-2 text-brand hover:bg-brand/5 rounded-lg font-bold text-sm mt-2"
                >
                  More category <ChevronRight size={16} />
                </Link>
              </li>
            </ul>
          </div>

          <div className="w-full flex flex-col md:flex-row gap-4 h-[250px] md:h-[350px] px-4 md:px-0">
            <div className="flex-grow bg-[#c2e8f8] rounded-2xl relative overflow-hidden flex items-center p-6 md:p-8">
              <div className="z-10 w-3/4 md:w-1/2">
                <h2 className="text-2xl md:text-4xl font-extrabold text-dark mb-2 leading-tight tracking-tight">
                  Khpal Kor,<br />
                  <span className="text-brand">Khpal Bazar.</span>
                </h2>
                <p className="text-sm text-gray-700 mb-4 hidden md:block">
                  Discover unique, handmade goods from the talented creators of Charsadda.
                </p>
                <Link
                  to="/explore"
                  className="bg-brand text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-brand/90 inline-flex items-center gap-2 text-sm transition-all"
                >
                  Shop Now <ChevronRight size={16} />
                </Link>
              </div>

              <img
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop"
                alt="Hero"
                className="absolute right-0 bottom-0 h-full object-cover opacity-40 hidden md:block"
                style={{
                  maskImage: 'linear-gradient(to right, transparent, black 40%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)',
                }}
              />
            </div>

            <div className="w-72 bg-dark rounded-2xl relative overflow-hidden hidden md:flex flex-col justify-center p-6 text-white border border-gray-800">
              <h3 className="font-bold text-xl mb-2 leading-tight z-10">Become a Seller today</h3>
              <p className="text-xs text-gray-300 mb-4 z-10">Join the community and start earning.</p>
              <Link
                to="/sell-with-us"
                className="border border-white text-white px-4 py-2 rounded-lg font-bold text-xs w-max hover:bg-white hover:text-dark transition-colors z-10"
              >
                Sell with Us
              </Link>
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=300&auto=format&fit=crop"
                alt="Promo"
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <TrustBadges />
          <section className="px-4 mb-6">
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {categoryTree.map((main: any) => (
                <Link
                  to={`/explore?cat=${encodeURIComponent(main.name)}`}
                  key={main.id}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700"
                >
                  {main.name}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="px-4 md:px-0">
          <TrendingProducts />
          <DiscountDeals />
          <ShopByCategory />
        </div>

        <div className="px-4 md:px-0 space-y-6 md:space-y-8 mt-6">
          {premiumProducts.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row p-4">
              <div className="w-full md:w-56 shrink-0 md:border-r border-gray-100 md:pr-6 mb-4 md:mb-0 flex flex-col justify-center bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/60 to-orange-100/30"></div>
                <h2 className="text-xl font-bold text-dark relative z-10">Featured Shops</h2>
                <p className="text-gray-500 text-xs mt-1 mb-4 relative z-10">Top rated premium sellers</p>
                <Link to="/explore" className="text-brand font-bold text-sm w-max relative z-10 hover:underline">
                  Explore all &rarr;
                </Link>
              </div>
              <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4">
                {premiumProducts.map((product) => (
                  <ProductCard key={product.id} product={product} isSellerPremium={true} />
                ))}
              </div>
            </section>
          )}

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row p-4">
            <div className="w-full md:w-56 shrink-0 md:border-r border-gray-100 md:pr-6 mb-4 md:mb-0 flex flex-col justify-center bg-gray-50 rounded-xl p-6 relative overflow-hidden">
              <h2 className="text-xl font-bold text-dark relative z-10">Fresh from the Oven</h2>
              <p className="text-gray-500 text-xs mt-1 mb-4 relative z-10">Latest products from local creators</p>
              <Link to="/explore" className="text-brand font-bold text-sm w-max relative z-10 hover:underline">
                View all &rarr;
              </Link>
            </div>
            <div className="flex-grow">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading products...</div>
              ) : standardProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No products listed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {standardProducts.map((product) => (
                    <ProductCard key={product.id} product={product} isSellerPremium={false} />
                  ))}
                </div>
              )}

              {hasMore && !loading && (
                <div className="mt-8 text-center border-t border-gray-100 pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-block w-full md:w-auto bg-white border-2 border-brand text-brand px-10 py-3 rounded-full font-bold hover:bg-brand hover:text-white transition-all disabled:opacity-60"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Products'}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="px-4 md:px-0">
          <NewArrivals />
          <FeaturedStores />
          <SellerCTA />
          <RecentlyViewed />
          <NewsletterSignup />
          <FAQ />
        </div>
      </div>
    </div>
  );
    }
