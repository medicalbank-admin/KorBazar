import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Helper to compress image and convert to Base64 text
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; // Resize to save space in Firestore
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress to 60% quality
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function SellWithUs() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    agreeTerms: false,
    email: '', password: '', confirmPassword: '', mobile: '', whatsapp: '',
    fullName: '', dob: '', cnicNumber: '',
    storeName: '', storeType: 'online_only', storeAddress: '', city: 'Charsadda', area: '', bio: ''
  });

  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.agreeTerms) return setError('You must agree to the Terms & Conditions.');
      if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    }
    if (step === 2) {
      if (!cnicFront || !cnicBack) return setError('Please upload both CNIC front and back images.');
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // 2. Compress and Convert CNIC to Base64 Strings
      let frontBase64 = '';
      let backBase64 = '';
      
      if (cnicFront && cnicBack) {
        frontBase64 = await compressImage(cnicFront);
        backBase64 = await compressImage(cnicBack);
      }

      // 3. Save to users collection
      await setDoc(doc(db, 'users', uid), {
        email: formData.email, mobile: formData.mobile, role: 'seller', createdAt: new Date().toISOString()
      });

      // 4. Save to sellers collection with Base64 strings
      await setDoc(doc(db, 'sellers', uid), {
        fullName: formData.fullName, dob: formData.dob, phone: formData.mobile, whatsappNumber: formData.whatsapp,
        cnicNumber: formData.cnicNumber, cnicFrontUrl: frontBase64, cnicBackUrl: backBase64,
        storeName: formData.storeName, storeType: formData.storeType, storeAddress: formData.storeAddress,
        city: formData.city, area: formData.area, bio: formData.bio,
        status: 'pending_verification', createdAt: new Date().toISOString()
      });

      navigate('/sell-with-us/pending');
    } catch (err: any) {
      setError(err.message || 'Failed to register. Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-dark mb-2">Sell with KorBazar</h2>
          <p className="text-gray-500 text-sm">Apna hunar, apni dukaan.</p>
          <div className="flex justify-center items-center gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-2 w-12 rounded-full ${step >= s ? 'bg-brand' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 text-alert p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {step === 1 && (
            <div className="space-y-4">
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input type="checkbox" checked={formData.agreeTerms} onChange={e => setFormData({...formData, agreeTerms: e.target.checked})} className="mt-1 rounded text-brand focus:ring-brand" />
                <span>I agree to KorBazar's <Link to="/terms" className="text-brand font-semibold hover:underline">Terms & Conditions</Link> and <Link to="/privacy" className="text-brand font-semibold hover:underline">Privacy Policy</Link>.</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input type="tel" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input type="tel" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <button type="button" onClick={handleNext} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 mt-2">Next</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (as on CNIC)</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" required value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Number</label>
                <input type="text" required placeholder="xxxxx-xxxxxxx-x" value={formData.cnicNumber} onChange={e => setFormData({...formData, cnicNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Front Image</label>
                  <input type="file" accept="image/*" required onChange={e => setCnicFront(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Back Image</label>
                  <input type="file" accept="image/*" required onChange={e => setCnicBack(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20" />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-100 text-dark font-bold py-3.5 rounded-xl hover:bg-gray-200">Back</button>
                <button type="button" onClick={handleNext} className="w-2/3 bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input type="text" required value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Type</label>
                <select value={formData.storeType} onChange={e => setFormData({...formData, storeType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none">
                  <option value="online_only">Online Only</option>
                  <option value="physical">Physical Shop</option>
                </select>
              </div>
              {formData.storeType === 'physical' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                  <input type="text" value={formData.storeAddress} onChange={e => setFormData({...formData, storeAddress: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                <input type="text" required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand focus:outline-none" rows={3} />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setStep(2)} className="w-1/3 bg-gray-100 text-dark font-bold py-3.5 rounded-xl hover:bg-gray-200">Back</button>
                <button type="submit" disabled={loading} className="w-2/3 bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90">{loading ? 'Compressing & Submitting...' : 'Submit Application'}</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
                }
