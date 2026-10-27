import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, Clock, Package, Truck, MessageCircle, Star, Box, CheckSquare, RotateCcw, MapPin } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for missing default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Map
const sellerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const buyerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

export default function TrackOrder() {
  const { token } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [premiumProducts, setPremiumProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Map Coordinates State
  const [sellerCoords, setSellerCoords] = useState<[number, number] | null>(null);
  const [buyerCoords, setBuyerCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([34.1453, 71.7308]); // Default Charsadda

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Geocoding function to convert text address to Lat/Lng
  const getCoordinates = async (address: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Pakistan')}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number];
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    }
    return null;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      const q = query(collection(db, 'orders'), where('trackingToken', '==', token));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const orderData = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        setOrder(orderData);
        
        const sellerSnap = await getDoc(doc(db, 'sellers', orderData.sellerId));
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();
          setSeller(sellerData);

          // Fetch Seller Coordinates (using storeAddress or city)
          const sAddress = `${sellerData.storeAddress || ''} ${sellerData.city || 'Charsadda'}`;
          const sCoords = await getCoordinates(sAddress);
          if (sCoords) setSellerCoords(sCoords);

          // Fetch Buyer Coordinates
          const bCoords = await getCoordinates(orderData.buyerAddress);
          if (bCoords) setBuyerCoords(bCoords);

          // Set map center to midpoint if both exist
          if (sCoords && bCoords) {
            setMapCenter([(sCoords[0] + bCoords[0]) / 2, (sCoords[1] + bCoords[1]) / 2]);
          } else if (sCoords) {
            setMapCenter(sCoords);
          }
        }

        const reviewQ = query(collection(db, 'reviews'), where('orderId', '==', orderData.id));
        const reviewSnap = await getDocs(reviewQ);
        if (!reviewSnap.empty) setReviewSubmitted(true);
      }
      setLoading(false);
    };
    
    const fetchPremiumProducts = async () => {
      const sellersSnap = await getDocs(collection(db, 'sellers'));
      const premiumSellerIds = sellersSnap.docs
        .filter(d => d.data().status === 'approved' && d.data().plan === 'premium' && !d.data().isFrozen)
        .map(d => d.id);

      const prodSnap = await getDocs(collection(db, 'products'));
      const allProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      const promoProducts = allProducts.filter(p => premiumSellerIds.includes(p.sellerId));
      setPremiumProducts(promoProducts.sort(() => 0.5 - Math.random()).slice(0, 4));
    };

    fetchOrder();
    fetchPremiumProducts();
  }, [token]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a star rating.');
    setSubmittingReview(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        orderId: order.id,
        sellerId: order.sellerId,
        storeName: order.storeName,
        productIds: order.items.map((i: any) => i.productId),
        buyerName: order.buyerName,
        rating,
        text: reviewText,
        createdAt: new Date().toISOString()
      });
      setReviewSubmitted(true);
    } catch (error) {
      console.error(error);
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-dark font-bold">Loading order...</div>;
  if (!order) return <div className="p-12 text-center text-alert font-bold">Order not found. Please check your link.</div>;

  const steps = [
    { id: 'new', label: 'Order Placed', icon: Clock },
    { id: 'accepted', label: 'Confirmed by Seller', icon: CheckCircle2 },
    { id: 'dispatched', label: 'Out for Delivery', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Package },
  ];

  const isCancelled = order.status === 'rejected' || order.status === 'cancelled';
  const isReturned = order.status === 'returned';
  const currentStepIndex = isReturned ? 3 : steps.findIndex(s => s.id === order.status);

  const whatsappText = `Assalam-o-Alaikum ${order.buyerName}, this is ${seller?.storeName}. Your order #${order.trackingToken.slice(0,6)} is confirmed! Total: Rs. ${order.total}.`;
  const cleanNumber = seller?.whatsappNumber?.replace(/^0/, '');
  const waLink = `https://wa.me/92${cleanNumber}?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
      
      {/* --- LIVE MAP SECTION --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 mb-8">
        <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2 px-2">
          <MapPin className="text-brand" /> Live Tracking Map
        </h2>
        
        <div className="h-[350px] w-full rounded-2xl overflow-hidden relative z-0">
          {sellerCoords || buyerCoords ? (
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} className="w-full h-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Seller Marker */}
              {sellerCoords && (
                <Marker position={sellerCoords} icon={sellerIcon}>
                  <Popup>
                    <strong>Seller Store</strong><br/>
                    {seller?.storeName}<br/>
                    {seller?.storeAddress}
                  </Popup>
                </Marker>
              )}

              {/* Buyer Marker */}
              {buyerCoords && (
                <Marker position={buyerCoords} icon={buyerIcon}>
                  <Popup>
                    <strong>Delivery Address</strong><br/>
                    {order.buyerName}<br/>
                    {order.buyerAddress}
                  </Popup>
                </Marker>
              )}

              {/* Route Line connecting them */}
              {sellerCoords && buyerCoords && (
                <Polyline 
                  positions={[sellerCoords, buyerCoords]} 
                  color="#10b981" 
                  weight={4} 
                  dashArray="10, 10" 
                />
              )}
            </MapContainer>
          ) : (
            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-500">
              <MapPin size={48} className="mb-2 opacity-50" />
              <p>Map coordinates not available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ORDER STATUS TIMELINE --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Order Status</h1>
          <p className="text-gray-500">Order ID: #{order.trackingToken.slice(0,8).toUpperCase()}</p>
        </div>

        {isCancelled ? (
          <div className="bg-red-50 text-alert p-6 rounded-2xl text-center mb-8">
            <h3 className="font-bold text-lg mb-2">Order Cancelled</h3>
            <p className="text-sm">Reason: {order.rejectionReason || 'Order was cancelled.'}</p>
          </div>
        ) : (
          <>
            {isReturned && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-center mb-8 flex flex-col items-center justify-center gap-2">
                <RotateCcw size={28} className="text-orange-500" />
                <h3 className="font-bold text-lg">Order Returned</h3>
                <p className="text-sm">This order was marked as returned by the seller.</p>
              </div>
            )}

            <div className="relative mb-12">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStepIndex;
                return (
                  <div key={step.id} className="relative z-10 flex items-center gap-6 mb-8 last:mb-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? (isReturned && index === 3 ? 'bg-orange-500 text-white' : 'bg-brand text-white') : 'bg-gray-100 text-gray-400'}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className={`font-bold ${isActive ? 'text-dark' : 'text-gray-400'}`}>
                        {step.label} {isReturned && index === 3 && '(Returned)'}
                      </h3>
                      {step.id === 'accepted' && order.paymentVerified && (
                        <p className="text-xs text-brand font-semibold flex items-center gap-1 mt-1"><CheckSquare size={12}/> Payment Verified</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SMART COURIER TRACKING */}
        {order.trackingNumber && (() => {
          const courier = (order.courierName || 'Other').toLowerCase();
          let trackingUrl = '';
          
          if (courier.includes('tcs')) trackingUrl = `https://www.tcsexpress.com/track/${order.trackingNumber}`;
          else if (courier.includes('leopard')) trackingUrl = `https://www.leopardscourier.com/tracking/${order.trackingNumber}`;
          else if (courier.includes('m&p') || courier.includes('blueex')) trackingUrl = `https://www.mulphilog.com/tracking/${order.trackingNumber}`;
          else if (courier.includes('pakistan post')) trackingUrl = `https://www.pakpost.gov.pk/tracking.php?tracking_id=${order.trackingNumber}`;
          else if (courier.includes('postex')) trackingUrl = `https://postex.pk/tracking?tracking_number=${order.trackingNumber}`;
          else if (courier.includes('trax')) trackingUrl = `https://trax.pk/tracking/${order.trackingNumber}`;
          else if (courier.includes('call courier')) trackingUrl = `https://www.callcourier.com.pk/tracking/${order.trackingNumber}`;
          else if (courier.includes('doorway')) trackingUrl = `https://doorway.pk/tracking/${order.trackingNumber}`; 

          return (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Box size={24} />
                <div>
                  <p className="font-bold text-sm">Courier Service: {order.courierName || 'Standard Courier'}</p>
                  <p className="text-lg font-mono font-bold">{order.trackingNumber}</p>
                </div>
              </div>
              
              {trackingUrl && (
                <a href={trackingUrl} target="_blank" rel="noreferrer" className="w-full md:w-auto bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center shadow-sm">
                  Track Live on {order.courierName}
                </a>
              )}
            </div>
          );
        })()}

        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-dark mb-4">Order Summary</h3>
          <p className="text-sm text-gray-600 mb-2"><span className="font-semibold">Store:</span> {order.storeName}</p>
          
          <div className="space-y-2 mb-4">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                <div>
                  <span>{item.qty}x {item.title}</span>
                  {(item.selectedSize || item.selectedColor) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      {item.selectedSize && item.selectedColor && <span> | </span>}
                      {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                    </div>
                  )}
                  {item.customizationNote && (
                    <div className="text-xs text-brand font-semibold mt-1 bg-brand/5 p-1.5 rounded w-fit border border-brand/10">
                      Customization: "{item.customizationNote}"
                    </div>
                  )}
                </div>
                <span className="font-medium">Rs. {(item.finalPrice || item.price) * item.qty}</span>
              </div>
            ))}
          </div>
          
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-brand font-bold mb-2">
              <span>Discount ({order.couponCode})</span>
              <span>- Rs. {order.discountAmount}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-dark">
            <span>Total</span>
            <span>Rs. {order.total}</span>
          </div>
        </div>

        <a href={waLink} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20bd5a] flex items-center justify-center gap-2">
          <MessageCircle size={20} /> Contact Seller on WhatsApp
        </a>

        {/* ONLY SHOW REVIEW FORM IF DELIVERED */}
        {order.status === 'delivered' && (
          <div className="border-t border-gray-100 pt-8 mt-8">
            <h3 className="text-xl font-bold text-dark mb-4 text-center">Rate this order</h3>
            {reviewSubmitted ? (
              <div className="bg-green-50 text-brand p-4 rounded-xl text-center font-semibold">
                Thank you! Your review has been submitted.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                      <Star size={32} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                    </button>
                  ))}
                </div>
                <textarea 
                  placeholder="How was the quality, delivery, and service?" 
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none"
                  rows={3}
                />
                <button type="submit" disabled={submittingReview} className="w-full bg-dark text-white font-bold py-3 rounded-xl hover:bg-black transition-colors">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {premiumProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-bold text-dark mb-6 flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" /> Most Popular in Charsadda
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {premiumProducts.map(product => (
              <ProductCard key={product.id} product={product} isSellerPremium={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
                                                          }
