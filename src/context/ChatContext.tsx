import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

type ChatContextType = {
  unreadTotal: number;
};

const ChatContext = createContext<ChatContextType>({ unreadTotal: 0 });

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadTotal(0);
      return;
    }

    // Find all chats where the current user is a participant
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // If the unread count object exists for this user, add it to total
        if (data.unreadCount && data.unreadCount[currentUser.uid]) {
          total += data.unreadCount[currentUser.uid];
        }
      });
      setUnreadTotal(total);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <ChatContext.Provider value={{ unreadTotal }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
