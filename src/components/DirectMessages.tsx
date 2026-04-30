import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, MessageSquare, ChevronLeft, Smile, Paperclip, Camera, Mic, Phone, Video, Check, CheckCheck, Square } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { toast } from 'sonner';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { CallSignals } from './CallManager';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  status?: 'sent' | 'delivered' | 'read';
  audioData?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: number;
  updatedAt: number;
  unreadCounts?: { [userId: string]: number };
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [otherUserTyping, setOtherUserTyping] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const otherTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

      // Mark messages as read when they arrive and drawer is active
      if (activeConversationId && currentUser?.id) {
        // Reset unread count for current user
        const convRef = doc(db, 'conversations', activeConversationId);
        updateDoc(convRef, {
          [`unreadCounts.${currentUser.id}`]: 0
        }).catch(err => console.error("Error resetting unread count:", err));

        // Mark incoming messages from other user as read
        snapshot.docs.forEach(d => {
          const data = d.data();
          if (data.senderId !== currentUser.id && data.status !== 'read') {
            updateDoc(doc(db, 'conversations', activeConversationId, 'messages', d.id), {
              status: 'read'
            }).catch(err => console.error("Error marking message as read:", err));
          }
        });
      }
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    // Fetch other user info
    const conv = conversations.find(c => c.id === activeConversationId);
    if (conv && currentUser) {
      const otherId = conv.participants.find(p => p !== currentUser.id);
      if (otherId) {
        getDoc(doc(db, 'users', otherId)).then(snap => {
          if (snap.exists()) setOtherUser(snap.data());
        });
      }
    }

    return () => unsubscribe();
  }, [activeConversationId, conversations, currentUser?.id]);

  // WebSocket for typing indicator
  useEffect(() => {
    if (!isOpen || !currentUser?.id) {
      if (wsRef.current) wsRef.current.close();
      return;
    }

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws-messaging?userId=${currentUser.id}&username=${encodeURIComponent(currentUser.username)}`;
      
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'private-typing') {
            if (otherUser && data.from === otherUser.id) {
              setOtherUserTyping(data.isTyping);
              
              if (data.isTyping) {
                if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
                otherTypingTimeoutRef.current = setTimeout(() => {
                  setOtherUserTyping(false);
                }, 5000);
              }
            }
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [isOpen, currentUser?.id, otherUser]);

  const sendTypingStatus = (typing: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && otherUser?.id) {
      wsRef.current.send(JSON.stringify({
        type: 'private-typing',
        to: otherUser.id,
        isTyping: typing
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingStatus(false);
    }, 2000);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    const text = newMessage;
    setNewMessage('');
    setIsTyping(false);
    sendTypingStatus(false);
    setShowEmojiPicker(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const otherId = otherUser?.id;
      await addDoc(collection(db, 'conversations', activeConversationId, 'messages'), {
        senderId: currentUser?.id,
        text,
        createdAt: serverTimestamp(),
        status: 'sent'
      });

      await updateDoc(doc(db, 'conversations', activeConversationId), {
        lastMessage: text,
        lastMessageAt: Date.now(),
        updatedAt: Date.now(),
        [`unreadCounts.${otherId}`]: (conversations.find(c => c.id === activeConversationId)?.unreadCounts?.[otherId] || 0) + 1
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message');
    }
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingDuration(0);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const durationFormatted = formatDuration(recordingDuration);
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            if (base64Audio.length > 800000) {
              toast.error("Voice note too long.");
              return;
            }

            try {
              const otherId = otherUser?.id;
              if (!activeConversationId || !otherId) return;

              await addDoc(collection(db, 'conversations', activeConversationId, 'messages'), {
                senderId: currentUser?.id,
                text: `🎤 Voice note (${durationFormatted})`,
                audioData: base64Audio,
                createdAt: serverTimestamp(),
                status: 'sent'
              });

              await updateDoc(doc(db, 'conversations', activeConversationId), {
                lastMessage: `🎤 Voice note (${durationFormatted})`,
                lastMessageAt: Date.now(),
                updatedAt: Date.now(),
                [`unreadCounts.${otherId}`]: increment(1)
              });
              
              toast.success('Voice note sent');
            } catch (err) {
              console.error(err);
              toast.error('Failed to send voice note');
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingDuration(0);
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error(err);
        toast.error('Could not access microphone');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 sm:left-auto h-[100dvh] w-full sm:w-[400px] bg-[#1C1B1B] sm:border-l border-[#3A4A40]/30 z-[100] shadow-2xl flex flex-col"
      >
        <div className="px-3 md:px-4 py-3 border-b border-[#3A4A40]/20 flex items-center justify-between bg-[#141414] gap-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 min-w-0">
            {activeConversationId && (
              <button onClick={() => setActiveConversationId(null)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5 text-outline" />
              </button>
            )}
            <h2 className="font-headline font-black text-primary tracking-tight text-base uppercase flex flex-col min-w-0">
              <span className="truncate">{activeConversationId ? (otherUser?.username || 'Signal') : 'Archives'}</span>
              {activeConversationId && otherUser && (
                <div className="h-4 -mt-0.5 truncate">
                  {otherUserTyping ? (
                    <div className="flex items-center gap-1">
                      <span className="flex gap-0.5 shrink-0">
                        <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-0.5 h-0.5 bg-primary rounded-full animate-bounce"></span>
                      </span>
                      <span className="text-[7px] text-primary font-black tracking-widest lowercase opacity-70 truncate">typing...</span>
                    </div>
                  ) : (
                    <span className="text-[7px] text-outline/40 font-mono tracking-widest lowercase truncate">secure link active</span>
                  )}
                </div>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {activeConversationId && otherUser && (
              <>
                <button 
                  onClick={() => CallSignals.triggerCall(otherUser.id, 'audio')}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-outline hover:text-primary"
                  title="Audio Link"
                >
                  <Phone className="w-4.5 h-4.5" />
                </button>
                <button 
                  onClick={() => CallSignals.triggerCall(otherUser.id, 'video')}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-outline hover:text-primary"
                  title="Video Link"
                >
                  <Video className="w-4.5 h-4.5" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5 text-outline" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!activeConversationId ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
                    currentUserId={currentUser?.id} 
                    onClick={() => setActiveConversationId(conv.id)} 
                  />
                ))
              )}
            </div>
          ) : (
            <div 
              ref={scrollRef} 
              className="flex-1 p-3 md:p-4 space-y-3 h-full overflow-y-auto bg-surface/30 custom-scrollbar"
            >
              {messages.map(msg => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isMe && (
                      otherUser?.profileImage ? (
                        <img src={otherUser.profileImage} alt={otherUser.username} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-outline" />
                        </div>
                      )
                    )}
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm break-words relative overflow-hidden ${
                      isMe 
                        ? 'bg-[#0A1F15] border border-primary-container/40 text-[#E0F8EC] rounded-tr-none shadow-[0_2px_10px_rgba(0,255,170,0.15)]' 
                        : 'bg-surface-container-high border border-outline-variant/20 text-on-surface rounded-tl-none shadow-sm'
                    }`}>
                      {isMe && <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>}
                      <span className="relative z-10">{msg.text}</span>
                      {msg.audioData && (
                        <div className="mt-2 py-1 relative z-10">
                          <audio 
                            src={msg.audioData} 
                            controls 
                            className={`h-7 w-full max-w-[200px] opacity-80 hover:opacity-100 transition-opacity ${isMe ? 'invert' : ''}`} 
                          />
                        </div>
                      )}
                      {isMe && (
                        <div className="flex justify-end mt-1 text-[8px] opacity-80 relative z-10" title={`Status: ${msg.status || 'sent'}`}>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#00E5FF] drop-shadow-[0_0_5px_rgba(0,229,255,0.6)]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-on-primary-container/80" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-on-primary-container/50" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activeConversationId && (
          <div className="px-3 py-3 border-t border-[#3A4A40]/20 bg-[#141414] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-xl mx-auto">
              <div className="flex-1 flex items-center bg-surface-container-high border border-outline-variant/10 rounded-full px-2 py-1 shadow-inner relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-4 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden scale-90 sm:scale-100 origin-bottom-left">
                    <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)}></div>
                    <div className="relative">
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.DARK}
                        width={280}
                        height={350}
                        skinTonesDisabled
                        searchPlaceHolder="Search..."
                      />
                    </div>
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1.5 transition-all ${showEmojiPicker ? 'text-primary' : 'text-outline hover:text-on-surface'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input 
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Message"
                  className="flex-1 bg-transparent border-none px-2 py-2 text-xs focus:outline-none transition-all font-body placeholder:text-outline/40"
                />
                <div className="flex items-center gap-0.5">
                  <button type="button" className="p-1.5 text-outline hover:text-on-surface transition-all">
                    <Paperclip className="w-5 h-5 -rotate-45" />
                  </button>
                  {!newMessage.trim() && (
                    <button type="button" className="p-1.5 text-outline hover:text-on-surface transition-all">
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {isRecording && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[10px] font-mono font-bold text-error animate-pulse"
                  >
                    {formatDuration(recordingDuration)}
                  </motion.span>
                )}
                {newMessage.trim() ? (
                  <button 
                    type="submit" 
                    className="w-10 h-10 bg-primary-container text-on-primary rounded-full flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Send className="w-4.5 h-4.5 fill-current ml-0.5" />
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={toggleRecording}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
                      isRecording ? 'bg-error text-white animate-pulse' : 'bg-primary-container text-on-primary hover:brightness-110'
                    }`}
                  >
                    {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4.5 h-4.5" />}
                  </button>
                )}
              </div>
            </form>
          </div>
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
  const unreadCount = conv.unreadCounts?.[currentUserId] || 0;

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
      className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-[#3A4A40]/20 group relative"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {otherUser?.profileImage ? (
            <img src={otherUser.profileImage} alt={otherUser.username} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary-container/10 transition-colors">
              <User className="w-5 h-5 text-outline group-hover:text-primary-container" />
            </div>
          )}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-on-primary text-[8px] font-black flex items-center justify-center rounded-md animate-pulse">
              {unreadCount}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <h4 className={`font-bold text-sm truncate ${unreadCount > 0 ? 'text-primary' : 'text-on-surface'}`}>
              {otherUser?.username || 'Loading...'}
            </h4>
            <span className={`text-[10px] font-mono ${unreadCount > 0 ? 'text-primary' : 'text-outline'}`}>
              {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          <p className={`text-xs truncate ${unreadCount > 0 ? 'text-on-surface font-bold' : 'text-outline opacity-70'}`}>
            {conv.lastMessage || 'Start a conversation'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
