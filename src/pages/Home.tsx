import { Link } from 'react-router-dom';
import { mockProducts, categories } from '../mockData';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const premiumProducts = mockProducts.filter(p => p.isPremium);
  const standardProducts = mockProducts.filter(p => !p.isPremium);

  return (
    <div className="pb-24 md:pb-12">
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

      <section className="px-4 max-w-7xl mx-auto mb-12">
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
          {categories.map((cat, i) => (
            <button key={i} className="whitespace-nowrap px-5 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium hover:border-brand hover:text-brand transition-colors">
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 max-w-7xl mx-auto mb-16">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-dark">Featured Shops & Products</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {premiumProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="px-4 max-w-7xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-dark mb-6">More from Charsadda</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {standardProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/explore" className="inline-block w-full md:w-auto bg-dark text-white px-12 py-4 rounded-full font-bold text-lg hover:bg-black transition-all">
            Explore All Shops & Products
          </Link>
        </div>
      </section>
    </div>
  );
}
