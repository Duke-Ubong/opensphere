import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Edit3, MoreHorizontal, User, Check, 
  Users as UsersIcon, Plus, ChevronLeft, Paperclip, 
  Smile, Mic, Send, MoreVertical, Phone, Video,
  CheckCheck, Clock, Archive, BellOff, Trash, 
  Flag, Ban, MessageSquare, ShieldCheck, Camera, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, getDocs, doc, getDoc, 
  updateDoc, limit, setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { CallSignals } from './CallManager';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [selectedChatOtherUser, setSelectedChatOtherUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  useEffect(() => {
    if (initialChatId) {
      setSelectedChatId(initialChatId);
    }
  }, [initialChatId]);

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
    }, (error) => {
      console.error("Error fetching messages:", error);
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

  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    e.preventDefault();
    const messageText = customText || newMessage.trim();
    if (!messageText || !selectedChatId || !currentUser?.id) return;

    if (!customText) setNewMessage('');

    try {
      const messageRef = collection(db, 'conversations', selectedChatId, 'messages');
      await addDoc(messageRef, {
        senderId: currentUser.id,
        text: messageText,
        createdAt: serverTimestamp()
      });

      const convRef = doc(db, 'conversations', selectedChatId);
      await updateDoc(convRef, {
        lastMessage: messageText,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      toast.success(`Attached ${file.name}`);
      handleSendMessage(e as any, `📎 Attached file: ${file.name}`);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSendMessage({ preventDefault: () => {} } as React.FormEvent, '🎤 Voice note (0:12s)');
    } else {
      setIsRecording(true);
      toast.info('Recording started. Tap square to send.', { duration: 2000 });
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
    <div className="flex w-full h-full bg-surface overflow-hidden relative font-headline">
      {/* Sidebar - List of Chats */}
      <div className={`w-full md:w-[360px] lg:w-[400px] flex flex-col border-r border-outline-variant/10 bg-surface z-20 transition-all duration-300 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <header className="px-4 py-4 flex flex-col gap-4 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-primary-container rounded-full"></div>
              <h1 className="text-2xl font-black tracking-tighter text-on-surface">TERMINAL</h1>
            </div>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-surface-container rounded-xl text-outline hover:text-primary-container transition-all active:scale-95">
                <UsersIcon className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-surface-container rounded-xl text-outline hover:text-primary-container transition-all active:scale-95">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative group px-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline group-focus-within:text-primary-container transition-all duration-300" />
            <input 
              type="text" 
              placeholder="Filter channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container/40 border border-outline-variant/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary-container/30 focus:bg-surface-container-low transition-all font-body placeholder:text-outline/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar">
            {(['All', 'Unread', 'Groups'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-primary-container text-on-primary shadow-[0_8px_20px_rgba(0,255,171,0.15)] scale-105' 
                    : 'text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
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
                  className={`mx-2 mb-1 p-3 flex items-center gap-4 cursor-pointer transition-all duration-200 rounded-2xl border border-transparent relative group ${selectedChatId === chat.id ? 'bg-surface-container-high border-outline-variant/20 shadow-sm' : 'hover:bg-surface-container-low hover:border-outline-variant/10'}`}
                >
                  <div className="relative shrink-0">
                    <div className="relative w-14 h-14">
                      <img src={chat.avatar} className="w-full h-full rounded-2xl object-cover border border-outline-variant/10 shadow-md group-hover:scale-105 transition-transform duration-300" />
                      {chat.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-container text-on-primary text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className={`text-sm font-black tracking-tight truncate ${selectedChatId === chat.id ? 'text-primary-container' : 'text-on-surface'}`}>
                        {chat.name}
                      </h3>
                      <span className={`text-[9px] font-black tracking-widest ${chat.unreadCount > 0 ? 'text-primary-container' : 'text-outline/40'} uppercase`}>
                        {chat.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate font-medium leading-relaxed ${chat.unreadCount > 0 ? 'text-on-surface font-black' : 'text-outline/60'}`}>
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
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* Chat Header */}
              <header className="px-4 py-3 flex items-center justify-between border-b border-outline-variant/10 bg-surface/80 backdrop-blur-xl z-10 shrink-0 mb-[-3px] pb-[10px]">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChatId(null)} className="md:hidden p-1 -ml-1.5 hover:bg-surface-container rounded-lg text-outline transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="relative group cursor-pointer" onClick={onNavigateToProfile}>
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-outline-variant/20 shadow-md transform group-hover:scale-105 transition-all duration-300">
                      <img src={selectedChatOtherUser?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary-container border-[2px] border-surface rounded-full shadow-lg"></div>
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight text-on-surface leading-tight hover:text-primary-container cursor-pointer transition-colors" onClick={onNavigateToProfile}>
                      {selectedChatOtherUser?.username || 'Gigs Operative'}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-primary-container rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,171,0.5)]"></div>
                      <p className="text-[8px] text-primary-container font-black uppercase tracking-[0.1em]">Signal Active</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2.5 hover:bg-surface-container rounded-xl text-outline hover:text-primary-container transition-all active:scale-90"><MoreHorizontal className="w-4.5 h-4.5" /></button>
                </div>
              </header>

              {/* Chat Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar bg-surface/30 relative"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,171,0.03),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(0,255,171,0.02),transparent_40%)] pointer-events-none"></div>
                
                <div className="flex justify-center mb-10">
                  <div className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-surface-container/30 border border-outline-variant/10 backdrop-blur-md shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-container opacity-60" />
                    <span className="text-secondary text-[9px] font-black uppercase tracking-[0.2em]">
                      End-to-End Encryption Protocol Engaged
                    </span>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {activeMessages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const prevMsg = activeMessages[idx - 1];
                    const isSameUserAsPrev = prevMsg?.senderId === msg.senderId;

                    return (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameUserAsPrev ? 'mt-1' : 'mt-6'}`}
                      >
                        <div className={`relative max-w-[80%] md:max-w-[65%] group`}>
                          <div className={`px-5 py-3 shadow-md transition-all duration-300 ${
                            isMe 
                              ? 'bg-primary-container text-on-primary rounded-[24px_24px_4px_24px] shadow-primary-container/10' 
                              : 'bg-surface-container border border-outline-variant/10 text-on-surface rounded-[24px_24px_24px_4px]'
                          }`}>
                            <p className="text-sm md:text-base leading-relaxed font-medium selection:bg-surface selection:text-primary-container">{msg.text}</p>
                            <div className={`flex items-center justify-end gap-2 mt-2 transition-opacity duration-300 ${isSameUserAsPrev ? 'opacity-0 group-hover:opacity-100' : 'opacity-60'}`}>
                              <span className="text-[9px] font-black tracking-widest uppercase">{msg.timestamp}</span>
                              {isMe && <CheckCheck className="w-3.5 h-3.5 text-primary-container" />}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Message Input Area */}
              <div className="px-3 py-3 md:px-6 md:py-6 bg-surface border-t border-outline-variant/10 h-[85.6914px] w-[376.891px] mb-0 pb-[8px]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-6xl mx-auto" style={{ marginLeft: '-11px' }}>
                  {/* The Capsule */}
                  <div 
                    className="flex-1 flex items-center bg-surface-container-high border border-outline-variant/10 rounded-[28px] py-1 shadow-inner group-focus-within:border-primary-container/30 transition-all duration-300"
                    style={{ 
                      paddingTop: '-4px', 
                      paddingBottom: '4px', 
                      paddingRight: '20px', 
                      marginLeft: '12px', 
                      marginTop: '-3px', 
                      marginRight: '-5px', 
                      marginBottom: '5px', 
                      width: '100px' 
                    }}
                  >
                    <button 
                      type="button" 
                      onClick={() => toast.success('Emoji picker activated', { duration: 1000 })}
                      className="p-2.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-all active:scale-90 flex-shrink-0"
                    >
                      <Smile className="w-6 h-6" />
                    </button>
                    
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
                      placeholder="Message"
                      className="flex-1 bg-transparent border-none px-3 py-3 text-base focus:outline-none transition-all font-body resize-none custom-scrollbar placeholder:text-outline/50"
                      style={{ minHeight: '48px', maxHeight: '150px' }}
                    />

                    <div className="flex items-center gap-0.5 pr-1">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                      <input type="file" ref={cameraInputRef} onChange={handleFileUpload} accept="image/*,video/*" capture="environment" className="hidden" />
                      
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-all active:scale-90"
                      >
                        <Paperclip className="w-5 h-5 -rotate-45" />
                      </button>
                      {!newMessage.trim() && (
                        <button 
                          type="button" 
                          onClick={() => cameraInputRef.current?.click()}
                          className="p-2.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-all active:scale-90"
                        >
                          <Camera className="w-5 h-5 transition-all" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Send/Mic Circular Button */}
                  <div className="shrink-0">
                    {newMessage.trim() ? (
                      <motion.button 
                        initial={{ scale: 0.8, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        type="submit" 
                        className="w-[52px] h-[52px] bg-primary-container text-on-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-primary-container/20 hover:brightness-105 active:scale-90 transition-all duration-200"
                      >
                        <Send className="w-6 h-6 fill-current ml-0.5" />
                      </motion.button>
                    ) : (
                      <button 
                        type="button"
                        onClick={toggleRecording}
                        className={`w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all duration-200 ${
                          isRecording 
                            ? 'bg-error text-on-error animate-pulse hover:shadow-error/20' 
                            : 'bg-primary-container text-on-primary hover:shadow-primary-container/20 hover:brightness-105'
                        }`}
                      >
                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-6 h-6" />}
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
