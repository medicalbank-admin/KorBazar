import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

export default function AdSlideshow() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // 1. Fetch Ads on mount (Limit increased to 8)
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const q = query(
          collection(db, 'ads'), 
          orderBy('createdAt', 'desc'), // Shows newest ads first
          limit(8) // Fetch up to 8 ads
        );
        const snap = await getDocs(q);
        const adsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        if (adsData.length > 0) {
          setAds(adsData);
          setIsVisible(true);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };
    fetchAds();
  }, []);

  // 2. Handle 5-second skip timer
  useEffect(() => {
    if (!isVisible) return;
    const skipTimer = setTimeout(() => setCanSkip(true), 5000);
    return () => clearTimeout(skipTimer);
  }, [isVisible]);

  // 3. Handle 12-second ad rotation with infinite loop
  useEffect(() => {
    if (!isVisible || ads.length <= 1) return;

    const adTimer = setInterval(() => {
      // The modulo operator (%) loops back to 0 when it reaches ads.length
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 12000); // 12 seconds

    return () => clearInterval(adTimer);
  }, [isVisible, ads.length]);

  if (!isVisible || ads.length === 0) return null;

  const currentAd = ads[currentAdIndex];

  return (
    <div className="relative w-full bg-white border-b border-gray-100 pb-6">
      
      {/* Skip Button (Shows after 5 seconds) */}
      {canSkip && (
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 z-30 bg-black/60 hover:bg-black/80 text-white text-xs font-bold py-1.5 px-3 rounded-full flex items-center gap-1 backdrop-blur-sm transition-all shadow-md"
        >
          Skip Ad <X size={14} />
        </button>
      )}

      {/* Image Container - Clean, No Overlay */}
      <div className="w-full flex justify-center bg-gray-50">
        <img 
          key={currentAd.id} // Key forces React to re-render for fade animation
          src={currentAd.imageBase64} 
          alt={currentAd.title} 
          className="w-full max-w-5xl h-auto object-contain animate-fade-in"
        />
      </div>

      {/* Text & Button Below the Image */}
      <div className="text-center px-4 mt-6 max-w-2xl mx-auto">
        <h2 
          key={`${currentAd.id}-title`} 
          className="text-2xl md:text-3xl font-extrabold text-dark mb-3 animate-fade-in"
        >
          {currentAd.title}
        </h2>
        <Link 
          to={currentAd.productId ? `/product/${currentAd.productId}` : currentAd.link} 
          className="inline-block bg-brand text-white font-bold py-3 px-10 rounded-full hover:bg-brand/90 transition-all shadow-md text-lg transform hover:scale-105"
        >
          Buy Now
        </Link>
      </div>

      {/* Ad Indicators (Dots for up to 8 ads) */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {ads.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentAdIndex ? 'bg-brand' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
