import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail } from 'lucide-react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    try {
      await emailjs.send(
        'service_q90wxjm',
        'template_bu0a3in',
        { to_email: email, to_name: 'Subscriber', message: 'Welcome to KorBazar!' },
        'yw7E81OSHpJ2l0jJm'
      );
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-dark text-white rounded-3xl p-8 md:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
          <Mail size={26} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Get new arrivals in your inbox</h2>
        <p className="text-white/80 text-sm mb-6">Deals, new stores, and drops — no spam.</p>
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-grow px-4 py-3 rounded-xl text-dark bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="bg-brand font-bold px-6 py-3 rounded-xl hover:bg-brand/90 disabled:bg-gray-500"
          >
            {status === 'sending' ? 'Sending…' : 'Subscribe'}
          </button>
        </form>
        {status === 'done' && (
          <p className="text-green-300 text-sm mt-3">Subscribed! Check your email.</p>
        )}
        {status === 'error' && (
          <p className="text-red-300 text-sm mt-3">Something went wrong. Try again.</p>
        )}
      </div>
    </section>
  );
}
