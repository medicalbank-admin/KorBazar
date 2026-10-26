import { Link } from 'react-router-dom';

const FEATURED_CATEGORIES = [
  { name: 'Handmade Jewelry', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&auto=format&fit=crop' },
  { name: 'Home Decor', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&auto=format&fit=crop' },
  { name: 'Customized Mugs', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&auto=format&fit=crop' },
  { name: 'Traditional Sweets', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop' },
  { name: 'Embroidered Suits', image: 'https://images.unsplash.com/photo-1610030469983-98e550d615ef?w=500&auto=format&fit=crop' },
  { name: 'Candles & Scents', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop' },
];

export default function ShopByCategory() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-dark">Shop by Category</h2>
          <p className="text-sm text-gray-500">Find exactly what you're looking for</p>
        </div>
        <Link to="/explore" className="text-brand font-bold text-sm hover:underline hidden md:block">
          View All Categories
        </Link>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-x-2 gap-y-6 md:gap-6">
        {FEATURED_CATEGORIES.map((cat, index) => (
          <Link 
            key={index} 
            to={`/explore?cat=${encodeURIComponent(cat.name)}`}
            className="flex flex-col items-center group w-full"
          >
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-brand transition-all shadow-sm group-hover:shadow-md shrink-0 bg-gray-100">
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
              />
            </div>
            
            <span className="text-xs md:text-sm font-semibold text-dark text-center group-hover:text-brand transition-colors w-full px-1 leading-tight line-clamp-2">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
