import { useState, useEffect, useMemo } from 'react';
import { 
  Search, ChevronLeft, Shirt, Utensils, Home as HomeIcon, Sparkles, 
  ShoppingBag, Gem, Heart, Baby, Footprints, Menu, Smartphone, Laptop, 
  Coffee, BookOpen, Palette, Dog, Dumbbell, Car, Briefcase, 
  Watch, Glasses, Flower, Gift, Cake, Gamepad2, Music, Camera, 
  Scissors, Wrench, PenTool, Droplet, Leaf 
} from 'lucide-react';
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

// SMART DYNAMIC ICON MAPPER
const getCategoryIcon = (name: string, size = 24) => {
  const n = name.toLowerCase();

  // 1. Fashion & Apparel
  if (n.match(/cloth|wear|suit|shirt|pant|trouser|jean|dress|skirt|jacket|coat|fashion/)) return <Shirt size={size} />;
  
  // 2. Shoes & Footwear
  if (n.match(/shoe|footwear|sandal|sneaker|boot|heel|chappal/)) return <Footprints size={size} />;
  
  // 3. Food, Sweets & Drinks
  if (n.match(/food|sweet|cake|bak|snack|dessert|candy|chocolate|pizza|burger/)) return <Cake size={size} />;
  if (n.match(/drink|beverage|tea|coffee|juice|water/)) return <Coffee size={size} />;
  
  // 4. Technology & Electronics
  if (n.match(/phone|mobile|smart|tablet|gadget|tech/)) return <Smartphone size={size} />;
  if (n.match(/computer|laptop|pc|mac|screen|monitor/)) return <Laptop size={size} />;
  if (n.match(/camera|photo|video|lens/)) return <Camera size={size} />;
  if (n.match(/audio|music|speaker|headphone|sound/)) return <Music size={size} />;
  
  // 5. Jewelry & Accessories
  if (n.match(/jewel|ring|necklace|bracelet|earring|gold|silver|gem|diamond/)) return <Gem size={size} />;
  if (n.match(/watch|clock|time/)) return <Watch size={size} />;
  if (n.match(/glass|sunglass|eyewear/)) return <Glasses size={size} />;
  
  // 6. Home, Decor & Furniture
  if (n.match(/home|decor|furniture|house|kitchen|bed|pillow|lamp|interior/)) return <HomeIcon size={size} />;
  if (n.match(/flower|plant|garden|leaf|nature|botanical/)) return <Flower size={size} />;
  
  // 7. Beauty, Health & Care
  if (n.match(/beauty|cosmetic|makeup|skin|hair|perfume|fragrance|care|spa/)) return <Sparkles size={size} />;
  if (n.match(/health|medical|pill|doctor|pharmacy/)) return <Droplet size={size} />;
  if (n.match(/soap|wash|clean/)) return <Leaf size={size} />;
  
  // 8. Kids, Toys & Games
  if (n.match(/kid|baby|child|infant|toddler/)) return <Baby size={size} />;
  if (n.match(/toy|play|game|puzzle|gamepad/)) return <Gamepad2 size={size} />;
  
  // 9. Arts, Crafts & Stationery
  if (n.match(/art|craft|paint|draw|brush|handmade/)) return <Palette size={size} />;
  if (n.match(/book|read|note|pen|paper|stationery|diary/)) return <BookOpen size={size} />;
  if (n.match(/pen|write|pencil/)) return <PenTool size={size} />;
  if (n.match(/scissor|cut|tailor/)) return <Scissors size={size} />;
  
  // 10. Gifts & Occasions
  if (n.match(/gift|hamper|present|souvenir|wedding|birthday/)) return <Gift size={size} />;
  
  // 11. Pets & Animals
  if (n.match(/pet|dog|cat|animal|bird/)) return <Dog size={size} />;
  
  // 12. Sports, Fitness & Outdoors
  if (n.match(/sport|gym|fitness|exercise|workout|yoga/)) return <Dumbbell size={size} />;
  
  // 13. Automotive & Tools
  if (n.match(/car|auto|vehicle|bike|motor/)) return <Car size={size} />;
  if (n.match(/tool|hardware|fix|repair|hammer/)) return <Wrench size={size} />;
  
  // 14. Business & Services
  if (n.match(/office|business|work|service|corporate/)) return <Briefcase size={size} />;

  // Fallback if no keywords match
  return <ShoppingBag size={size} />;
};

const buildCategoryTree = (categoryList: CategoryNode[]): any[] => {
  const byId = new Map<string, any>();
  categoryList.forEach((cat) => {
    byId.set(cat.id, { ...cat, children: [] });
  });

  const roots: any[] = [];

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

  const sortChildren = (items: any[]): any[] =>
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
  
  // State to track what is selected
  const [selectedMainCat, setSelectedMainCat] = useState<any>(null); 
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(initialCat); 
  
  const [loading, setLoading] = useState(true);

  const categoryTree = useMemo(() => buildCategoryTree(categories as CategoryNode[]), [categories]);

  // Fetch Categories & Sellers
  useEffect(() => {
    const fetchCategoriesAndSellers = async () => {
      try {
        const [catSnap, sellersSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'sellers')),
        ]);

        const categoryDocs = catSnap.docs.map((d: any) => ({
          id: d.id,
          name: d.data().name || '',
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

        // Handle URL params (if someone visits ?cat=Women's Wear)
        const currentCat = searchParams.get('cat');
        if (currentCat) {
          const catObj = categoryDocs.find(c => c.name === currentCat);
          if (catObj) {
            setSelectedSubCat(currentCat);
            if (catObj.parentId) {
              const parent = categoryDocs.find(c => c.id === catObj.parentId);
              setSelectedMainCat(parent);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchCategoriesAndSellers();
  }, [searchParams]);

  // Fetch Products (Only runs if a Sub-category is selected)
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedSubCat) {
        setProducts([]);
        return; 
      }

      setLoading(true);
      try {
        const sellersSnap = await getDocs(collection(db, 'sellers'));
        const activeSellerIds = sellersSnap.docs
          .filter((d) => d.data().status === 'approved' && !d.data().isFrozen)
          .map((d) => d.id);

        const productQuery = query(collection(db, 'products'), where('category', '==', selectedSubCat));
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
  }, [selectedSubCat]);

  const handleMainCategoryClick = (mainCat: any) => {
    setSelectedMainCat(mainCat);
    setSelectedSubCat(null); 
    setSearchParams({}); 
  };

  const handleSubCategoryClick = (subCatName: string) => {
    setSelectedSubCat(subCatName);
    const next = new URLSearchParams(searchParams);
    next.set('cat', subCatName);
    setSearchParams(next);
  };

  const handleGoBack = () => {
    setSelectedSubCat(null);
    const next = new URLSearchParams(searchParams);
    next.delete('cat');
    setSearchParams(next);
  };

  const filteredProducts = products.filter((p) => {
    const title = p.title?.toLowerCase?.() || '';
    const storeName = p.storeName?.toLowerCase?.() || '';
    return title.includes(searchTerm.toLowerCase()) || storeName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      
      {/* Search Bar */}
      <div className="relative mb-8 max-w-3xl mx-auto">
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

      <div className="flex flex-col md:flex-row gap-6 bg-white md:bg-transparent rounded-2xl overflow-hidden">
        
        {/* LEFT SIDEBAR (Main Categories) */}
        <aside className="w-full md:w-64 flex-shrink-0 bg-gray-50 md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100">
          <div className="p-4">
            <h3 className="font-bold text-lg mb-4 px-2 text-dark hidden md:block">Categories</h3>

            <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 md:gap-0 md:space-y-1 pb-2 md:pb-0 scrollbar-hide">
              <button
                type="button"
                onClick={() => { setSelectedMainCat(null); setSelectedSubCat(null); setSearchParams({}); }}
                className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center gap-3 text-left text-sm px-4 py-3 md:px-3 md:py-2 rounded-lg transition-colors ${
                  !selectedMainCat && !selectedSubCat ? 'bg-brand text-white md:bg-brand/10 md:text-brand font-bold' : 'text-gray-700 hover:bg-gray-200 md:hover:bg-gray-50'
                }`}
              >
                <Menu size={16} className={!selectedMainCat && !selectedSubCat ? 'text-white md:text-brand' : 'text-gray-400'} /> 
                All Categories
              </button>

              {categoryTree.map((main: any) => {
                const isActive = selectedMainCat?.id === main.id || (selectedSubCat && main.children.some((c: any) => c.name === selectedSubCat));

                return (
                  <button
                    key={main.id}
                    type="button"
                    onClick={() => handleMainCategoryClick(main)}
                    className={`whitespace-nowrap flex-shrink-0 md:w-full flex items-center justify-between text-sm px-4 py-3 md:px-3 md:py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-brand text-white md:bg-brand/10 md:text-brand font-bold' : 'text-gray-700 hover:bg-gray-200 md:hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={isActive ? 'text-white md:text-brand' : 'text-gray-400'}>
                        {getCategoryIcon(main.name, 16)}
                      </span>
                      <span className="truncate">{main.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT AREA */}
        <main className="flex-grow bg-white md:bg-transparent md:rounded-2xl min-h-[500px]">
          
          {/* VIEW 1: SUB-CATEGORY GRID (When a Main Category is clicked) */}
          {selectedMainCat && !selectedSubCat && (
            <div className="p-4 md:p-6 md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 bg-brand/10 text-brand rounded-xl">
                  {getCategoryIcon(selectedMainCat.name, 28)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dark">{selectedMainCat.name}</h2>
                  <p className="text-sm text-gray-500">Select a sub-category to view products</p>
                </div>
              </div>

              {selectedMainCat.children && selectedMainCat.children.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedMainCat.children.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubCategoryClick(sub.name)}
                      className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:border-brand hover:shadow-md transition-all group"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <span className="text-brand">
                          {getCategoryIcon(sub.name, 28)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-dark text-center line-clamp-2">{sub.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No sub-categories found for {selectedMainCat.name}.</p>
                  <button onClick={() => handleSubCategoryClick(selectedMainCat.name)} className="bg-brand text-white px-6 py-2 rounded-xl font-bold">
                    View All {selectedMainCat.name} Products
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: PRODUCT GRID (When a Sub-category is selected) */}
          {selectedSubCat && (
            <div className="p-4 md:p-6 md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <button onClick={handleGoBack} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <ChevronLeft size={20} className="text-dark" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-dark">{selectedSubCat}</h2>
                  <p className="text-sm text-gray-500">{filteredProducts.length} products found</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                  No products found in {selectedSubCat}.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSellerPremium={premiumSellerIds.includes(product.sellerId)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: EMPTY STATE (When nothing is selected) */}
          {!selectedMainCat && !selectedSubCat && (
            <div className="flex flex-col items-center justify-center py-20 md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 px-4 text-center">
               <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <ShoppingBag size={48} className="text-gray-300" />
               </div>
               <h2 className="text-xl font-bold text-dark mb-2">Browse Categories</h2>
               <p className="text-gray-500 max-w-sm">Select a main category from the left sidebar to explore its sub-categories.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
