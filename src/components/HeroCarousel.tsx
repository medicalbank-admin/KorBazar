import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronRight } from 'lucide-react';

export default function HeroCarousel() {
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ads'));
        const adsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAds(adsData.slice(0, 20)); // Get up to 20 ads
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };
    fetchAds();
  }, []);

  // Fallback if no ads exist
  if (ads.length === 0) {
    return (
      <>
        <div className="flex-grow bg-[#c2e8f8] rounded-2xl relative overflow-hidden flex items-center p-6 md:p-8">
          <div className="z-10 w-3/4 md:w-1/2">
            <h2 className="text-2xl md:text-4xl font-extrabold text-dark mb-2 leading-tight tracking-tight">
              Khpal Kor,<br /><span className="text-brand">Khpal Bazar.</span>
            </h2>
            <Link to="/explore" className="bg-brand text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-brand/90 inline-flex items-center gap-2 text-sm transition-all">
              Shop Now <ChevronRight size={16} />
            </Link>
          </div>
        </div>
        <div className="w-72 bg-dark rounded-2xl relative overflow-hidden hidden md:flex flex-col justify-center p-6 text-white border border-gray-800">
          <h3 className="font-bold text-xl mb-2 leading-tight z-10">Become a Seller today</h3>
          <Link to="/sell-with-us" className="border border-white text-white px-4 py-2 rounded-lg font-bold text-xs w-max hover:bg-white hover:text-dark transition-colors z-10">Sell with Us</Link>
        </div>
      </>
    );
  }

  // Main Ad (Left)
  const mainAd = ads[0];
  // Secondary Ad (Right) - if it exists
  const secondaryAd = ads.length > 1 ? ads[1] : null;

  return (
    <>
      {/* LEFT AD (Main) */}
      <div className="flex-grow rounded-2xl relative overflow-hidden shadow-sm border border-gray-100 h-[250px] md:h-full">
        <Link to={mainAd.link || '/explore'} className="block w-full h-full">
          <img 
            src={mainAd.imageBase64} 
            alt={mainAd.title} 
            className="w-full h-full object-cover" 
          />
        </Link>
      </div>

      {/* RIGHT AD (Secondary) - Desktop Only */}
      {secondaryAd ? (
        <div className="w-72 rounded-2xl relative overflow-hidden shadow-sm border border-gray-100 hidden md:block">
          <Link to={secondaryAd.link || '/explore'} className="block w-full h-full">
            <img 
              src={secondaryAd.imageBase64} 
              alt={secondaryAd.title} 
              className="w-full h-full object-cover" 
            />
          </Link>
        </div>
      ) : (
        <div className="w-72 bg-dark rounded-2xl relative overflow-hidden hidden md:flex flex-col justify-center p-6 text-white border border-gray-800">
          <h3 className="font-bold text-xl mb-2 leading-tight z-10">Become a Seller today</h3>
          <p className="text-xs text-gray-300 mb-4 z-10">Join the community and start earning.</p>
          <Link to="/sell-with-us" className="border border-white text-white px-4 py-2 rounded-lg font-bold text-xs w-max hover:bg-white hover:text-dark transition-colors z-10">Sell with Us</Link>
        </div>
      )}
    </>
  );
}
