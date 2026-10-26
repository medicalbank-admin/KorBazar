import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronRight } from 'lucide-react';

export default function HeroCarousel() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'ads'));
        const adsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAds(adsData.slice(0, 20));
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    };
    fetchAds();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000); // Rotates every 5 seconds
    return () => clearInterval(interval);
  }, [ads.length]);

  // Fallback if no ads exist
  if (ads.length === 0) {
    return (
      <div className="flex-grow bg-[#c2e8f8] rounded-2xl relative overflow-hidden flex items-center p-6 md:p-8">
        <div className="z-10 w-3/4 md:w-1/2">
          <h2 className="text-2xl md:text-4xl font-extrabold text-dark mb-2 leading-tight tracking-tight">
            Khpal Kor,<br /><span className="text-brand">Khpal Bazar.</span>
          </h2>
          <p className="text-sm text-gray-700 mb-4 hidden md:block">
            Discover unique, handmade goods from the talented creators of Charsadda.
          </p>
          <Link to="/explore" className="bg-brand text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-brand/90 inline-flex items-center gap-2 text-sm transition-all">
            Shop Now <ChevronRight size={16} />
          </Link>
        </div>
        <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800&auto=format&fit=crop" alt="Hero" className="absolute right-0 bottom-0 h-full object-cover opacity-40 hidden md:block" />
      </div>
    );
  }

  const currentAd = ads[currentIndex];

  return (
    <div className="flex-grow bg-gray-50 rounded-2xl relative overflow-hidden group shadow-sm border border-gray-100">
      <Link to={currentAd.link || '/explore'} className="block w-full h-full">
        <img 
          src={currentAd.imageBase64} 
          alt={currentAd.title} 
          className="w-full h-full object-cover transition-opacity duration-500" 
        />
      </Link>

      {/* Dots */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                idx === currentIndex ? 'bg-brand w-6' : 'bg-white/70 hover:bg-white w-2.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
