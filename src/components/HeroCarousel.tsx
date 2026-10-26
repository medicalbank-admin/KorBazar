import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronRight } from 'lucide-react';

export default function HeroCarousel() {
  const [mainAds, setMainAds] = useState<any[]>([]);
  const [sideAds, setSideAds] = useState<any[]>([]);
  
  const [mainIndex, setMainIndex] = useState(0);
  const [sideIndex, setSideIndex] = useState(0);

  // Fetch Ads and split them by position
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ads'));
        const allAds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        const mains = allAds.filter(ad => ad.position === 'Main Banner' || !ad.position);
        const sides = allAds.filter(ad => ad.position === 'Side Banner');

        setMainAds(mains);
        setSideAds(sides);
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };
    fetchAds();
  }, []);

  // Main Ad Timer (3 seconds)
  useEffect(() => {
    if (mainAds.length <= 1) return;
    const interval = setInterval(() => {
      setMainIndex((prev) => (prev + 1) % mainAds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [mainAds.length]);

  // Side Ad Timer (3 seconds)
  useEffect(() => {
    if (sideAds.length <= 1) return;
    const interval = setInterval(() => {
      setSideIndex((prev) => (prev + 1) % sideAds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sideAds.length]);

  // Fallback if no ads exist
  if (mainAds.length === 0 && sideAds.length === 0) {
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

  const activeMainAd = mainAds.length > 0 ? mainAds[mainIndex] : null;
  const activeSideAd = sideAds.length > 0 ? sideAds[sideIndex] : null;

  return (
    <>
      {/* --- LEFT MAIN AD CAROUSEL --- */}
      <div className="flex-grow rounded-2xl relative overflow-hidden shadow-sm border border-gray-100 h-[250px] md:h-full group">
        {activeMainAd ? (
          <Link to={activeMainAd.link || '/explore'} className="block w-full h-full">
            <img 
              src={activeMainAd.imageBase64} 
              alt={activeMainAd.title} 
              className="w-full h-full object-cover transition-opacity duration-500" 
            />
          </Link>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Main Ad</div>
        )}

        {/* Dots for Main Ads */}
        {mainAds.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
            {mainAds.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setMainIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === mainIndex ? 'bg-brand w-6' : 'bg-white/70 hover:bg-white w-2.5'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* --- RIGHT SIDE AD CAROUSEL (Desktop Only) --- */}
      {activeSideAd ? (
        <div className="w-72 rounded-2xl relative overflow-hidden shadow-sm border border-gray-100 hidden md:block group">
          <Link to={activeSideAd.link || '/explore'} className="block w-full h-full">
            <img 
              src={activeSideAd.imageBase64} 
              alt={activeSideAd.title} 
              className="w-full h-full object-cover transition-opacity duration-500" 
            />
          </Link>

          {/* Dots for Side Ads */}
          {sideAds.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
              {sideAds.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSideIndex(idx)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === sideIndex ? 'bg-brand w-4' : 'bg-white/70 hover:bg-white w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Fallback to "Become a Seller" if no Side Ads exist */
        <div className="w-72 bg-dark rounded-2xl relative overflow-hidden hidden md:flex flex-col justify-center p-6 text-white border border-gray-800">
          <h3 className="font-bold text-xl mb-2 leading-tight z-10">Become a Seller today</h3>
          <p className="text-xs text-gray-300 mb-4 z-10">Join the community and start earning.</p>
          <Link to="/sell-with-us" className="border border-white text-white px-4 py-2 rounded-lg font-bold text-xs w-max hover:bg-white hover:text-dark transition-colors z-10">Sell with Us</Link>
        </div>
      )}
    </>
  );
}
