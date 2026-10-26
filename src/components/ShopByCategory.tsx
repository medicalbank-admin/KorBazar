import { Link } from 'react-router-dom';

const FEATURED_CATEGORIES = [
  { name: 'Handmade Jewelry', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&auto=format&fit=crop' },
  { name: 'Home Decor', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&auto=format&fit=crop' },
  { name: 'Customized Mugs', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=200&auto=format&fit=crop' },
  { name: 'Traditional Sweets', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&auto=format&fit=crop' },
  { name: 'Embroidered Suits', image: 'https://images.unsplash.com/photo-1610030469983-98e550d615ef?w=200&auto=format&fit=crop' },
  { name: 'Candles & Scents', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=200&auto=format&fit=crop' },
];

export default function ShopByCategory() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-dark">Shop by Category</h2>
        <Link to="/explore" className="text-brand font-bold text-xs hover:underline">
          View All
        </Link>
      </div>

      {/* Compact horizontal scroll */}
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
        {FEATURED_CATEGORIES.map((cat, index) => (
          <Link 
            key={index} 
            to={`/explore?cat=${encodeURIComponent(cat.name)}`}
            className="flex flex-col items-center group shrink-0 w-16 md:w-20"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden mb-1.5 border border-gray-100 group-hover:border-brand transition-all shadow-sm bg-gray-50">
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
              />
            </div>
            
            <span className="text-[10px] md:text-xs font-semibold text-dark text-center group-hover:text-brand transition-colors w-full leading-tight line-clamp-1">
              {cat.name.split(' ')[0]} {/* Show only first word to save space */}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
