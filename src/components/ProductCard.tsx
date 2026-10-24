import { Link } from 'react-router-dom';
import { CheckCircle2, Star, Heart, Crown } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

export default function ProductCard({ product, isSellerPremium }: { product: any, isSellerPremium?: boolean }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const displayImage = product.images?.[0] || product.image || 'https://placehold.co/400x400?text=No+Image';
  
  // Check if stock is 0 or less
  const isOutOfStock = product.stock !== undefined && Number(product.stock) <= 0;

  return (
    <Link to={`/product/${product.id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col border border-gray-100 relative">
      <div className={`relative aspect-square overflow-hidden bg-gray-50 ${isOutOfStock ? 'opacity-70' : ''}`}>
        <img src={displayImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        
        {/* OUT OF STOCK OVERLAY */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-alert text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg rotate-[-10deg]">
              Out of Stock
            </span>
          </div>
        )}

        {isSellerPremium && !isOutOfStock && (
          <span className="absolute top-3 left-3 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 border border-yellow-200">
            <Crown size={12} className="fill-yellow-500 text-yellow-500" /> Premium
          </span>
        )}

        <button 
          onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white text-gray-500 hover:text-red-500 transition-colors shadow-sm z-10"
        >
          <Heart size={18} className={isFavorite(product.id) ? "fill-red-500 text-red-500" : ""} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-dark line-clamp-1">{product.title}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 mb-2">
          <span className="truncate">{product.storeName}</span>
          {isSellerPremium ? (
            <Crown size={14} className="text-yellow-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={14} className="text-brand flex-shrink-0" />
          )}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-lg text-dark">Rs. {product.price}</span>
          <div className="flex items-center gap-1 text-sm bg-gray-50 px-2 py-1 rounded-md">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{product.rating || 'New'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
