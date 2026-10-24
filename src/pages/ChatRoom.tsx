import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ChevronLeft, Send, CheckCircle2, Crown, ShieldCheck } from 'lucide-react';

export default function ChatRoom() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch partner info & listen to messages
  useEffect(() => {
    if (!currentUser || !chatId) return;

    const fetchChatDetails = async () => {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const partnerId = chatData.participants.find((id: string) => id !== currentUser.uid);
        
        if (partnerId) {
          // 1. Fetch user role
          const userSnap = await getDoc(doc(db, 'users', partnerId));
          const userData = userSnap.data();
          const role = userData?.role || 'buyer';
          
          let partnerName = "User";
          let partnerPlan = "standard";

          if (role === 'admin') {
            partnerName = "ADMIN";
          } else if (role === 'seller') {
            // Fetch seller store details
            const sellerSnap = await getDoc(doc(db, 'sellers', partnerId));
            if (sellerSnap.exists()) {
              partnerName = sellerSnap.data().storeName;
              partnerPlan = sellerSnap.data().plan || 'standard';
            }
          } else {
            // It's a buyer
            partnerName = userData?.email?.split('@')[0] || 'Buyer';
          }

          setPartner({ id: partnerId, name: partnerName, role, plan: partnerPlan });
        }

        // Mark messages as read for the current user
        await updateDoc(chatRef, {
          [`unreadCount.${currentUser.uid}`]: 0
        });
      }
      setLoading(false);
    };

    fetchChatDetails();

    // Listen to messages in real-time
    const messagesQ = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQ, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId || !partner) return;

    const text = newMessage.trim();
    setNewMessage(''); 

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        [`unreadCount.${partner.id}`]: increment(1)
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  if (loading) return <div className="p-12 text-center text-brand font-bold">Loading chat...</div>;
  if (!currentUser) return null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)] bg-gray-50 border-x border-gray-200 md:rounded-3xl md:border md:my-4 md:h-[80vh] overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/inbox" className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold text-lg">
          {partner?.name.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="font-bold text-dark leading-tight flex items-center gap-1.5">
            {partner?.name || 'Loading...'}
            
            {/* DYNAMIC BADGES */}
            {partner?.role === 'admin' && (
              <span title="Official Admin"><ShieldCheck size={18} className="text-brand fill-green-100" /></span>
            )}
            
            {partner?.role === 'seller' && partner?.plan === 'premium' && (
              <span title="Premium Seller"><Crown size={18} className="text-yellow-500 fill-yellow-100" /></span>
            )}
            
            {partner?.role === 'seller' && partner?.plan !== 'premium' && (
              <span title="Verified Seller"><CheckCircle2 size={16} className="text-brand" /></span>
            )}

          </h2>
          <p className="text-xs text-brand font-semibold">
            {partner?.role === 'admin' ? 'Support Team' : 'Real-time Chat'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#E5DDD5]/10">
        {messages.length === 0 ? (
          <div className="text-center mt-10">
            <p className="bg-white text-gray-500 text-sm px-4 py-2 rounded-lg inline-block shadow-sm">
              Say Assalam-o-Alaikum to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                  isMe 
                    ? 'bg-brand text-white rounded-br-none' 
                    : 'bg-white text-dark border border-gray-100 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex gap-2 sticky bottom-0 z-10">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow px-4 py-3 rounded-full border border-gray-300 bg-gray-50 focus:outline-none focus:border-brand text-sm"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="bg-brand text-white p-3 rounded-full hover:bg-brand/90 transition-colors disabled:opacity-50 flex-shrink-0 shadow-md"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
    }
