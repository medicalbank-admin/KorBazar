import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export default function AdSlideshow() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // Fetch Ads on mount
  useEffect(() => {
    const fetchAds = async () => {
      try {
        // Only fetch up to 5 ads
        const q = query(collection(db, 'ads'), limit(5));
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

  // Handle 5-second skip timer
  useEffect(() => {
    if (!isVisible) return;
    const skipTimer = setTimeout(() => setCanSkip(true), 5000);
    return () => clearTimeout(skipTimer);
  }, [isVisible]);

  // Handle 12-second ad rotation
  useEffect(() => {
    if (!isVisible || ads.length <= 1) return;

    const adTimer = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 12000); // 12 seconds

    return () => clearInterval(adTimer);
  }, [isVisible, ads.length]);

  if (!isVisible || ads.length === 0) return null;

  const currentAd = ads[currentAdIndex];

  return (
    <div className="relative w-full h-[300px] md:h-[400px] bg-dark overflow-hidden flex items-center justify-center">
      
      {/* Background Image */}
      <img 
        src={currentAd.imageBase64} 
        alt={currentAd.title} 
        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-1000"
      />

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"></div>

      {/* Content (Title & Button) */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto mt-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 shadow-sm drop-shadow-md">
          {currentAd.title}
        </h2>
        <Link 
          to={currentAd.productId ? `/product/${currentAd.productId}` : currentAd.link} 
          className="inline-block bg-brand text-white font-bold py-3 px-8 rounded-full hover:bg-brand/90 transition-all shadow-lg text-lg transform hover:scale-105"
        >
          Buy Now
        </Link>
      </div>

      {/* Ad Indicators (Dots) */}
      {ads.length > 1 && (
        <div className="absolute bottom-16 flex gap-2 z-20">
          {ads.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2 h-2 rounded-full transition-colors ${idx === currentAdIndex ? 'bg-brand' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}

      {/* Skip Button (Shows after 5 seconds) */}
      {canSkip && (
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 z-30 bg-black/50 hover:bg-black/80 text-white text-xs font-bold py-1.5 px-3 rounded-full flex items-center gap-1 backdrop-blur-sm transition-all"
        >
          Skip Ad <X size={14} />
        </button>
      )}

    </div>
  );
            }
