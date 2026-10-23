import { Search } from 'lucide-react';
import { mockProducts } from '../mockData';
import ProductCard from '../components/ProductCard';

export default function Explore() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Search products, stores, or categories..." 
          className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm text-lg"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-dark">Filters</h3>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Category</h4>
              <div className="space-y-2">
                {['Cakes & Bakes', 'Handmade Jewelry', 'Crafts & Decor'].map(cat => (
                  <label key={cat} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand focus:ring-brand" />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-sm text-gray-500 uppercase tracking-wide">Price Range</h4>
              <input type="range" className="w-full accent-brand" />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Rs. 0</span>
                <span>Rs. 5000+</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-medium">
                <input type="checkbox" className="rounded text-brand focus:ring-brand" />
                Premium/Featured only
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-medium">
                <input type="checkbox" className="rounded text-brand focus:ring-brand" />
                Delivery Available
              </label>
            </div>
          </div>
        </aside>

        <main className="flex-grow">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:g-6">
            {mockProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
