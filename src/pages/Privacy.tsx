export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 pb-24">
      <h1 className="text-3xl font-extrabold text-dark mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: October 2024</p>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-6 text-gray-700 leading-relaxed text-sm">
        
        <p>At <strong>KorBazar</strong>, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this policy carefully.</p>

        <h2 className="text-xl font-bold text-dark pt-4">1. Information We Collect</h2>
        <p>To provide a safe marketplace, we collect different types of information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Personal Identification Information:</strong> Name, Date of Birth, Email address, Phone number, and WhatsApp number.</li>
          <li><strong>Highly Sensitive Data (Sellers Only):</strong> To comply with security and anti-fraud measures, Sellers must upload their Computerized National Identity Card (CNIC) including front and back images, and the CNIC number.</li>
          <li><strong>Financial Data (Sellers Only):</strong> JazzCash or Easypaisa account details provided voluntarily by the Seller for receiving direct payments from Buyers.</li>
          <li><strong>Transaction Data:</strong> Details about the products you buy or sell, delivery addresses, and order history.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, and device information collected automatically via our platform (Firebase).</li>
        </ul>

        <h2 className="text-xl font-bold text-dark pt-4">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>To verify the identity of Sellers and prevent fraudulent activities.</li>
          <li>To facilitate the transaction between Buyers and Sellers (e.g., sharing the Buyer's delivery address with the Seller).</li>
          <li>To send order updates, tracking links, and administrative messages.</li>
          <li>To comply with legal obligations under the laws of Pakistan.</li>
          <li>To provide customer support and resolve disputes.</li>
        </ul>

        <h2 className="text-xl font-bold text-dark pt-4">3. How We Share Your Information</h2>
        <p>We do not sell your personal data. However, we share information in the following ways:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>With Sellers:</strong> When a Buyer places an order, we share the Buyer's name, phone number, WhatsApp number, and delivery address with the specific Seller to fulfill the order.</li>
          <li><strong>With Buyers:</strong> We display the Seller's Store Name, Bio, Area, and Social Media links publicly. We do <strong>not</strong> publicly display the Seller's CNIC or personal phone number on the storefront (WhatsApp links are masked/generated via wa.me).</li>
          <li><strong>Service Providers:</strong> We use <strong>Google Firebase</strong> for database hosting and authentication. They store data on secure servers. We also use WhatsApp for communication and order tracking.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or to protect the rights and safety of KorBazar, our users, or the public (e.g., investigating fraud under PECA 2016).</li>
        </ul>

        <h2 className="text-xl font-bold text-dark pt-4">4. Data Retention and Security</h2>
        <p>We retain your personal information, including CNIC images, for as long as your account is active or as needed to comply with legal obligations. We employ industry-standard security measures (via Google Cloud/Firebase) including encryption in transit. However, no electronic transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>

        <h2 className="text-xl font-bold text-dark pt-4">5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access the personal information we hold about you.</li>
          <li>Request corrections to inaccurate data (e.g., updating your address or phone number).</li>
          <li>Request the deletion of your account. Note that we may retain certain transaction records for legal and tax compliance purposes.</li>
        </ul>

        <h2 className="text-xl font-bold text-dark pt-4">6. Children's Privacy</h2>
        <p>Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we discover that a user is under 18, we will terminate their account.</p>

        <h2 className="text-xl font-bold text-dark pt-4">7. Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date.</p>

        <h2 className="text-xl font-bold text-dark pt-4">8. Contact Us</h2>
        <p>If you have questions or concerns about this Privacy Policy or how your data is handled, please contact our support team via the official KorBazar WhatsApp support number listed in the footer.</p>
      </div>
    </div>
  );
}
