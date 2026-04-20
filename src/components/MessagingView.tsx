import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Edit3, MoreHorizontal, User, Check, 
  Users as UsersIcon, Plus, ChevronLeft, Paperclip, 
  Smile, Mic, Send, MoreVertical, Phone, Video,
  CheckCheck, Clock, Archive, BellOff, Trash, 
  Flag, Ban, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, getDocs, doc, getDoc, 
  updateDoc, limit, setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  status: 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online?: boolean;
  status?: string;
  isGroup?: boolean;
  participants: string[];
  lastMessageAt?: any;
}

interface MessagingViewProps {
  currentUser: any;
  onNavigateToProfile: () => void;
  initialChatId?: string | null;
}

const MessagingView: React.FC<MessagingViewProps> = ({ currentUser, onNavigateToProfile, initialChatId }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Groups'>('All');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
    }
  }, [initialChatId]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [selectedChatOtherUser, setSelectedChatOtherUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

  // Search Users logic
  useEffect(() => {
    if (searchQuery.length < 2) {
      setUserSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('username', '>=', searchQuery),
          where('username', '<=', searchQuery + '\uf8ff'),
          limit(5)
        );
        const snap = await getDocs(q);
        const results = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.id !== currentUser?.id);
        setUserSearchResults(results);
      } catch (err) {
        console.error("User search error:", err);
      }
    };

    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser?.id]);

  // Fetch Conversations
  useEffect(() => {
    if (!currentUser?.id) return;

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList: Chat[] = [];
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.id);
        
        // Fetch other user info if not cached or available
        let otherUser = null;
        if (otherUserId) {
          const userSnap = await getDoc(doc(db, 'users', otherUserId));
          if (userSnap.exists()) {
            otherUser = userSnap.data();
          }
        }

        chatList.push({
          id: docSnapshot.id,
          name: otherUser?.username || 'Gigs User',
          avatar: otherUser?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          lastMessage: data.lastMessage || 'No messages yet',
          time: data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: 0, // Placeholder
          participants: data.participants,
          lastMessageAt: data.updatedAt
        });
      }
      
      setChats(chatList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Fetch Messages for active chat
  useEffect(() => {
    if (!selectedChatId) {
      setActiveMessages([]);
      setSelectedChatOtherUser(null);
      return;
    }

    const messagesRef = collection(db, 'conversations', selectedChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          status: 'read' // Default to read for now
        };
      });
      setActiveMessages(msgs);
    });

    // Get other user info for the header
    const activeChat = chats.find(c => c.id === selectedChatId);
    if (activeChat) {
      const otherId = activeChat.participants.find(p => p !== currentUser.id);
      if (otherId) {
        getDoc(doc(db, 'users', otherId)).then(snap => {
          if (snap.exists()) setSelectedChatOtherUser(snap.data());
        });
      }
    }

    return () => unsubscribe();
  }, [selectedChatId, chats, currentUser?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId || !currentUser?.id) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const messageRef = collection(db, 'conversations', selectedChatId, 'messages');
      await addDoc(messageRef, {
        senderId: currentUser.id,
        text,
        createdAt: serverTimestamp()
      });

      const convRef = doc(db, 'conversations', selectedChatId);
      await updateDoc(convRef, {
        lastMessage: text,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const startNewChat = async (otherUser: any) => {
    if (!currentUser?.id) return;

    // Check if conversation already exists
    const existingChat = chats.find(c => c.participants.includes(otherUser.id));
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      setSearchQuery('');
      return;
    }

    try {
      const convRef = await addDoc(collection(db, 'conversations'), {
        participants: [currentUser.id, otherUser.id],
        lastMessage: '',
        updatedAt: Date.now(),
        createdAt: serverTimestamp()
      });
      setSelectedChatId(convRef.id);
      setSearchQuery('');
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start new conversation");
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return chat.unreadCount > 0;
    if (activeTab === 'Groups') return chat.isGroup;
    return true;
  });

  return (
    <div className="flex w-full h-full md:h-screen lg:h-screen bg-surface overflow-hidden relative">
      {/* Sidebar - List of Chats */}
      <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-r border-outline-variant/10 bg-surface z-20 transition-all duration-300 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <header className="p-4 flex flex-col gap-4 bg-surface-container-low/30 backdrop-blur-md">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-headline font-black tracking-tighter text-on-surface">MESSAGES</h1>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors">
                <UsersIcon className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors">
                <Plus className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary-container transition-colors" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-container/30 transition-all font-sans"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['All', 'Unread', 'Groups'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeTab === tab 
                    ? 'bg-primary-container text-on-primary-fixed shadow-lg shadow-primary-container/20' 
                    : 'bg-surface-container text-outline hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col gap-4 p-4 mt-10">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-surface-container rounded-2xl" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-2 bg-surface-container rounded w-1/3" />
                    <div className="h-2 bg-surface-container rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* User Search Results */}
              {userSearchResults.length > 0 && (
                <div className="bg-primary-container/5 py-4 border-b border-outline-variant/10">
                  <div className="px-4 mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-container">Global Operatives</span>
                    <span className="text-[9px] text-outline">Search results</span>
                  </div>
                  {userSearchResults.map(u => (
                    <div 
                      key={u.id}
                      onClick={() => startNewChat(u)}
                      className="p-4 flex items-center gap-4 cursor-pointer hover:bg-primary-container/10 transition-all border-b border-outline-variant/10 group"
                    >
                      <img src={u.profileImage || `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100`} className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <h4 className="text-sm font-black group-hover:text-primary-container transition-colors">{u.username}</h4>
                        <p className="text-[10px] text-outline font-medium truncate uppercase tracking-tighter">{u.professional_bio || 'No bio available'}</p>
                      </div>
                      <Plus className="w-4 h-4 ml-auto text-primary-container opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}

              {filteredChats.map((chat) => (
                <div 
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-outline-variant/5 relative group ${selectedChatId === chat.id ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'}`}
                >
                  <div className="relative shrink-0">
                    <div className="relative w-12 h-12">
                      <img src={chat.avatar} className="w-full h-full rounded-2xl object-cover border border-outline-variant/10 shadow-sm" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`text-sm font-black tracking-tight truncate ${selectedChatId === chat.id ? 'text-primary-container' : 'text-on-surface'}`}>
                        {chat.name}
                      </h3>
                      <span className={`text-[9px] font-bold ${chat.unreadCount > 0 ? 'text-primary-container' : 'text-outline'} uppercase`}>
                        {chat.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate font-medium ${chat.unreadCount > 0 ? 'text-on-surface font-black' : 'text-outline/70'}`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredChats.length === 0 && (
                <div className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-outline opacity-20 mb-4" />
                  <p className="text-outline font-label text-xs uppercase tracking-widest opacity-50">No conversations found.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={`flex-1 flex flex-col bg-surface transition-all duration-300 ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        <AnimatePresence mode="wait">
          {!selectedChatId ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest/50"
            >
              <div className="w-24 h-24 mb-6 rounded-[2rem] bg-surface-container flex items-center justify-center border border-outline-variant/20 shadow-inner">
                <UsersIcon className="w-10 h-10 text-outline opacity-30" />
              </div>
              <h2 className="text-2xl font-headline font-black tracking-tighter text-on-surface mb-2">SELECT TERMINAL</h2>
              <p className="text-secondary max-w-sm text-xs font-label leading-relaxed uppercase tracking-widest opacity-60">
                Choose a professional operative or collective to initiate a high-fidelity communication link.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key={selectedChatId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* Chat Header */}
              <header className="p-4 flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-low/30 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChatId(null)} className="md:hidden p-2 -ml-2 hover:bg-surface-container rounded-full text-secondary">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="relative w-10 h-10">
                    <img src={selectedChatOtherUser?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'} className="w-full h-full rounded-xl object-cover border border-outline-variant/10 shadow-sm" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary-container border-2 border-surface rounded-full shadow-sm"></div>
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight text-on-surface">{selectedChatOtherUser?.username || 'Gigs Operative'}</h2>
                    <p className="text-[10px] text-primary-container font-black uppercase tracking-widest">ENCRYPTED LINK ACTIVE</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors"><Video className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors"><Phone className="w-4 h-4" /></button>
                  <button className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </header>

              {/* Chat Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed"
                style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              >
                <div className="flex justify-center mb-8">
                  <span className="px-4 py-1.5 rounded-full bg-surface-container-high/50 text-outline text-[9px] font-black uppercase tracking-[0.2em] border border-outline-variant/10 backdrop-blur-sm shadow-sm">
                    SECURE CHANNEL ESTABLISHED
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {activeMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                      >
                        <div className={`relative max-w-[85%] md:max-w-[70%] px-4 py-2 shadow-sm ${
                          isMe 
                            ? 'bg-primary-container text-on-primary-fixed rounded-2xl rounded-tr-none' 
                            : 'bg-surface-container-high text-on-surface rounded-2xl rounded-tl-none'
                        }`}>
                          <p className="text-xs md:text-sm leading-relaxed font-medium">{msg.text}</p>
                          <div className={`flex items-center justify-end gap-1.5 mt-1 opacity-70`}>
                            <span className="text-[9px] font-bold tracking-tighter">{msg.timestamp}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-blue-400" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Message Input Area */}
              <div className="p-4 bg-surface-container-low/30 backdrop-blur-md border-t border-outline-variant/10">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-5xl mx-auto">
                  <div className="flex gap-1 mb-2">
                    <button type="button" className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors"><Smile className="w-5 h-5" /></button>
                    <button type="button" className="p-2 hover:bg-surface-container rounded-full text-secondary transition-colors"><Paperclip className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="flex-1 relative">
                    <textarea 
                      rows={1}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Transmission protocol initialized..."
                      className="w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all font-sans resize-none custom-scrollbar"
                      style={{ minHeight: '48px', maxHeight: '150px' }}
                    />
                  </div>

                  <div className="mb-1">
                    {newMessage.trim() ? (
                      <motion.button 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        type="submit" 
                        className="w-12 h-12 bg-primary-container text-on-primary-fixed rounded-2xl flex items-center justify-center shadow-lg shadow-primary-container/30 hover:brightness-110 active:scale-90 transition-all"
                      >
                        <Send className="w-5 h-5 fill-current" />
                      </motion.button>
                    ) : (
                      <button type="button" className="w-12 h-12 bg-surface-container-high text-outline rounded-2xl flex items-center justify-center hover:text-on-surface transition-colors">
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MessagingView;
