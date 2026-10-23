import { Link } from 'react-router-dom';
import { CheckCircle2, Star } from 'lucide-react';

export default function ProductCard({ product }: { product: any }) {
  // Use the first image from the array, or a fallback
  const displayImage = product.images?.[0] || product.image || 'https://placehold.co/400x400?text=No+Image';

  return (
    <Link to={`/product/${product.id}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col border border-gray-100">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img src={displayImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {product.isPremium && (
          <span className="absolute top-3 left-3 bg-brand text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            Featured
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-dark line-clamp-1">{product.title}</h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 mb-2">
          <span className="truncate">{product.storeName}</span>
          <CheckCircle2 size={14} className="text-brand flex-shrink-0" />
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
