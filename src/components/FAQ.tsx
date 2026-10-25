import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  { q: 'How do I place an order on KorBazar?', a: 'Browse a product, choose size/color if available, add it to your cart, and follow checkout. You\'ll receive a tracking link once the seller accepts.' },
  { q: 'How do I pay?', a: 'We support Cash on Delivery and direct wallet transfers (JazzCash, EasyPaisa) to the seller. Payment details are shown after the seller confirms your order.' },
  { q: 'Can I return an item?', a: 'Yes, per the seller\'s return policy. If the item is damaged or wrong, contact the seller via WhatsApp or the in-app chat within 48 hours of delivery.' },
  { q: 'How do I open my own store?', a: 'Click "Start Selling", complete the short registration with your CNIC and store name, sign the seller agreement, and you\'re live once approved.' },
  { q: 'Is KorBazar safe?', a: 'All sellers are CNIC-verified. We recommend transacting only through the platform so both buyer and seller are protected.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-center gap-2 mb-6">
        <HelpCircle className="text-brand" size={24} />
        <h2 className="text-2xl font-bold text-dark">Frequently Asked Questions</h2>
      </div>
      <div className="space-y-2">
        {FAQS.map((f, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full px-4 py-3 flex justify-between items-center text-left font-semibold text-dark hover:bg-gray-50">
              {f.q}
              <ChevronDown size={18} className={`transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-gray-600">{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
      }
