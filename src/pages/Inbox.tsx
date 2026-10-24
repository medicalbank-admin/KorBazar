import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { MessageSquare, ChevronRight } from 'lucide-react';

export default function Inbox() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to all chats where the current user is a participant
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatPromises = snapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        
        // Find the other participant's ID
        const partnerId = chatData.participants.find((id: string) => id !== currentUser.uid);
        
        let partnerName = "User";
        let partnerRole = "user";

        if (partnerId) {
          // Try to fetch as a seller first
          const sellerSnap = await getDoc(doc(db, 'sellers', partnerId));
          if (sellerSnap.exists()) {
            partnerName = sellerSnap.data().storeName;
            partnerRole = "seller";
          } else {
            // If not a seller, fetch as a user (buyer/admin)
            const userSnap = await getDoc(doc(db, 'users', partnerId));
            if (userSnap.exists()) {
              partnerName = userSnap.data().email.split('@')[0];
              partnerRole = userSnap.data().role;
            }
          }
        }

        return {
          id: chatDoc.id,
          partnerId,
          partnerName,
          partnerRole,
          lastMessage: chatData.lastMessage || "New conversation",
          updatedAt: chatData.updatedAt?.toDate() || new Date(),
          unread: chatData.unreadCount?.[currentUser.uid] || 0
        };
      });

      const resolvedChats = await Promise.all(chatPromises);
      
      // Sort by most recently updated
      resolvedChats.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      setChats(resolvedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) {
    return <div className="p-12 text-center text-dark font-bold">Please log in to view your inbox.</div>;
  }

  if (loading) {
    return <div className="p-12 text-center text-brand font-bold">Loading conversations...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-dark mb-6 flex items-center gap-2">
        <MessageSquare className="text-brand" /> My Inbox
      </h1>

      {chats.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">No messages yet</h2>
          <p className="text-gray-500 mb-6">When you start a conversation with a buyer or seller, it will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {chats.map((chat) => (
            <Link 
              key={chat.id} 
              to={`/chat/${chat.id}`}
              className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-14 h-14 bg-brand/10 text-brand rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                {chat.partnerName.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-dark truncate">{chat.partnerName}</h3>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {chat.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm truncate ${chat.unread > 0 ? 'font-bold text-dark' : 'text-gray-500'}`}>
                  {chat.lastMessage}
                </p>
              </div>

              {chat.unread > 0 && (
                <div className="bg-alert text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0">
                  {chat.unread}
                </div>
              )}
              
              {chat.unread === 0 && (
                <ChevronRight size={20} className="text-gray-300 flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
