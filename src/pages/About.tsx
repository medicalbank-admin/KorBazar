import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-dark mb-4">About KorBazar</h1>
        <p className="text-xl text-brand font-semibold">Khpal Kor, Khpal Bazar.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-6 text-gray-700 leading-relaxed">
        <p>
          <strong>KorBazar</strong> was born from a simple observation: the small cities of Pakistan are filled with incredible talent, but the creators lack a trusted digital platform to sell their goods.
        </p>
        <p>
          We saw brilliant women in Charsadda baking stunning cakes, creating beautiful handmade jewelry, and embroidering traditional crafts, yet they were restricted to selling only to their immediate neighbors or relying on chaotic WhatsApp groups.
        </p>
        
        <h2 className="text-2xl font-bold text-dark pt-4">Our Mission</h2>
        <p>
          Our mission is to empower home-based sellers and small shop owners by providing them with a modern, professional storefront. We want to give them the tools to reach buyers across their city securely.
        </p>

        <h2 className="text-2xl font-bold text-dark pt-4">Why Trust Us?</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>CNIC Verified:</strong> We manually verify every single seller using their National Identity Card before they can list a product.</li>
          <li><strong>Direct Communication:</strong> Buyers can chat directly with sellers on WhatsApp for custom orders or questions.</li>
          <li><strong>Local Focus:</strong> We are starting city-by-city, ensuring delivery is fast and relationships are local.</li>
        </ul>

        <div className="pt-8 text-center">
          <Link to="/sell-with-us" className="inline-block bg-brand text-white font-bold py-3 px-8 rounded-xl hover:bg-brand/90 transition-colors">
            Join as a Seller Today
          </Link>
        </div>
      </div>
    </div>
  );
}
