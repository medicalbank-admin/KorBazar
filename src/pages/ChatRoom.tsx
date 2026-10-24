import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ChevronLeft, Send } from 'lucide-react';

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

    // 1. Fetch Chat details to get partner ID
    const fetchChatDetails = async () => {
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        const partnerId = chatData.participants.find((id: string) => id !== currentUser.uid);
        
        if (partnerId) {
          // Try seller first
          const sellerSnap = await getDoc(doc(db, 'sellers', partnerId));
          if (sellerSnap.exists()) {
            setPartner({ id: partnerId, name: sellerSnap.data().storeName });
          } else {
            // Fallback to user
            const userSnap = await getDoc(doc(db, 'users', partnerId));
            if (userSnap.exists()) {
              setPartner({ id: partnerId, name: userSnap.data().email.split('@')[0] });
            }
          }
        }

        // Mark messages as read for the current user
        await updateDoc(chatRef, {
          [`unreadCount.${currentUser.uid}`]: 0
        });
      }
      setLoading(false);
    };

    fetchChatDetails();

    // 2. Listen to messages in real-time
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
    setNewMessage(''); // Clear input immediately for fast UX

    try {
      // 1. Add the message to the subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text,
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      // 2. Update the main chat document
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
        // Increment unread count for the partner
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
          <h2 className="font-bold text-dark leading-tight">{partner?.name || 'Loading...'}</h2>
          <p className="text-xs text-brand font-semibold">Real-time Chat</p>
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
