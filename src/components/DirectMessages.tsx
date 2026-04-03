import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, MessageSquare, ChevronLeft } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: number;
  updatedAt: number;
}

interface DirectMessagesProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversations: Conversation[];
}

const DirectMessages: React.FC<DirectMessagesProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  activeConversationId, 
  setActiveConversationId,
  conversations 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setOtherUser(null);
      return;
    }

    const q = query(
      collection(db, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    // Fetch other user info
    const conv = conversations.find(c => c.id === activeConversationId);
    if (conv) {
      const otherId = conv.participants.find(p => p !== currentUser.id);
      if (otherId) {
        getDoc(doc(db, 'users', otherId)).then(snap => {
          if (snap.exists()) setOtherUser(snap.data());
        });
      }
    }

    return () => unsubscribe();
  }, [activeConversationId, conversations, currentUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, 'conversations', activeConversationId, 'messages'), {
        senderId: currentUser.id,
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'conversations', activeConversationId), {
        lastMessage: text,
        lastMessageAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#1C1B1B] border-l border-[#3A4A40]/30 z-[60] shadow-2xl flex flex-col"
      >
        <div className="p-4 border-b border-[#3A4A40]/20 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            {activeConversationId && (
              <button onClick={() => setActiveConversationId(null)} className="p-1 hover:bg-white/5 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-outline" />
              </button>
            )}
            <h2 className="font-headline font-bold text-primary tracking-tight">
              {activeConversationId ? (otherUser?.username || 'Chat') : 'Direct Messages'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-outline" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!activeConversationId ? (
            <div className="p-4 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center py-20 text-outline font-label text-sm uppercase tracking-widest opacity-50">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No conversations yet
                </div>
              ) : (
                conversations.map(conv => (
                  <ConversationItem 
                    key={conv.id} 
                    conv={conv} 
                    currentUserId={currentUser.id} 
                    onClick={() => setActiveConversationId(conv.id)} 
                  />
                ))
              )}
            </div>
          ) : (
            <div ref={scrollRef} className="p-4 space-y-4 h-full overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.senderId === currentUser.id 
                      ? 'bg-primary-container text-on-primary-container rounded-tr-none' 
                      : 'bg-surface-container-highest text-on-surface rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeConversationId && (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#3A4A40]/20 bg-[#141414]">
            <div className="flex gap-2">
              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-surface-container-lowest border border-[#3A4A40]/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary-container transition-all"
              />
              <button type="submit" className="p-2 bg-primary-container text-on-primary-container rounded-lg hover:brightness-110 transition-all active:scale-95">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

interface ConversationItemProps {
  conv: Conversation;
  currentUserId: string;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conv, currentUserId, onClick }) => {
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    const otherId = conv.participants.find(p => p !== currentUserId);
    if (otherId) {
      getDoc(doc(db, 'users', otherId)).then(snap => {
        if (snap.exists()) setOtherUser(snap.data());
      });
    }
  }, [conv, currentUserId]);

  return (
    <div 
      onClick={onClick}
      className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-[#3A4A40]/20 group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary-container/10 transition-colors">
          <User className="w-5 h-5 text-outline group-hover:text-primary-container" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h4 className="font-bold text-on-surface text-sm truncate">{otherUser?.username || 'Loading...'}</h4>
            <span className="text-[10px] text-outline font-mono">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
          <p className="text-xs text-outline truncate opacity-70">{conv.lastMessage || 'Start a conversation'}</p>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
