import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from '../components/ProductCard';
import { useSearchParams } from 'react-router-dom';

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
  children?: CategoryNode[];
};

const buildCategoryTree = (categoryList: CategoryNode[]) => {
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

  const sortChildren = (items: Array<CategoryNode & { children: CategoryNode[] }>) =>
    [...items]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        ...item,
        children: sortChildren(item.children || []),
      }));

  return sortChildren(roots);
};

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('cat');

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [premiumSellerIds, setPremiumSellerIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCat);
  const [loading, setLoading] = useState(true);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  useEffect(() => {
    const fetchCategoriesAndSellers = async () => {
      try {
        const [catSnap, sellersSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'sellers')),
        ]);

        const categoryDocs = catSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          parentId: d.data().parentId ?? null,
        }));
        setCategories(categoryDocs);

        const premiumIds: string[] = [];
        sellersSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.plan === 'premium') premiumIds.push(d.id);
        });
        setPremiumSellerIds(premiumIds);

        const currentCat = searchParams.get('cat');
        if (currentCat) {
          setSelectedCategory(currentCat);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchCategoriesAndSellers();
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const sellersSnap = await getDocs(collection(db, 'sellers'));
        const activeSellerIds = sellersSnap.docs
          .filter((d) => d.data().status === 'approved' && !d.data().isFrozen)
          .map((d) => d.id);

        let productQuery;
        if (selectedCategory) {
          productQuery = query(collection(db, 'products'), where('category', '==', selectedCategory));
        } else {
          productQuery = collection(db, 'products');
        }

        const productsSnap = await getDocs(productQuery);

        const allProducts = productsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];

        const activeProducts = allProducts.filter((p) => activeSellerIds.includes(p.sellerId));
        setProducts(activeProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  const handleCategorySelect = (name: string | null) => {
    setSelectedCategory(name);

    const next = new URLSearchParams(searchParams);
    if (name) {
      next.set('cat', name);
    } else {
      next.delete('cat');
    }

    setSearchParams(next);
  };

  const filteredProducts = products.filter((p) => {
    const title = p.title?.toLowerCase?.() || '';
    const storeName = p.storeName?.toLowerCase?.() || '';

    const matchesSearch =
      title.includes(searchTerm.toLowerCase()) ||
      storeName.includes(searchTerm.toLowerCase());

    return matchesSearch;
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
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm text-lg"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-dark">Categories</h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCategorySelect(null)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg ${
                  selectedCategory === null ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700'
                }`}
              >
                All Categories
              </button>

              {categoryTree.map((main) => (
                <div key={main.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(main.name)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg ${
                      selectedCategory === main.name
                        ? 'bg-brand/10 text-brand font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {main.name}
                  </button>

                  {main.children && main.children.length > 0 && (
                    <div className="ml-4 space-y-1 border-l border-gray-200 pl-3">
                      {main.children.map((sub: any) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleCategorySelect(sub.name)}
                          className={`block w-full text-left text-xs px-2 py-1.5 rounded-md ${
                            selectedCategory === sub.name
                              ? 'bg-brand/10 text-brand font-bold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
              No products found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSellerPremium={premiumSellerIds.includes(product.sellerId)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
    }
