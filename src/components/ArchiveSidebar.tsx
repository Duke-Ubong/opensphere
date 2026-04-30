import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, MessageSquare, Search, MoreVertical } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: number;
  updatedAt: number;
  unreadCounts?: { [userId: string]: number };
}

interface ArchiveSidebarProps {
  conversations: Conversation[];
  currentUserId: string;
  onConversationClick: (id: string) => void;
  activeConversationId?: string | null;
}

const ArchiveSidebar: React.FC<ArchiveSidebarProps> = ({ 
  conversations, 
  currentUserId, 
  onConversationClick,
  activeConversationId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
    // Ideally we'd search other user names here, but since we fetch names lazily in items,
    // we'll just filter by ID or last message for now, or just leave it for total list.
    return true; 
  });

  return (
    <div className="h-full flex flex-col bg-surface-container-low border-l border-outline-variant/10">
      <div className="p-4 border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline font-black text-xl text-primary tracking-tighter uppercase italic">Archives</h2>
          <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-outline transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline opacity-50" />
          <input 
            type="text" 
            placeholder="Search signals..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-highest/50 border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2 text-[11px] focus:outline-none focus:border-primary-container/50 transition-all font-body uppercase tracking-widest placeholder:text-outline/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-10 px-4 opacity-30 select-none">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-tighter">No active transmissions</p>
          </div>
        ) : (
          filteredConversations.map(conv => (
            <ArchiveItem 
              key={conv.id} 
              conv={conv} 
              currentUserId={currentUserId} 
              isActive={activeConversationId === conv.id}
              onClick={() => onConversationClick(conv.id)} 
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-outline-variant/10 bg-surface-container-lowest/30">
        <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em] opacity-40 text-center">Neural Sync Active / Protocol 09</p>
      </div>
    </div>
  );
};

const ArchiveItem: React.FC<{ conv: Conversation; currentUserId: string; isActive: boolean; onClick: () => void }> = ({ 
  conv, currentUserId, isActive, onClick 
}) => {
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    const otherId = conv.participants.find(p => p !== currentUserId);
    if (otherId) {
      getDoc(doc(db, 'users', otherId)).then(snap => {
        if (snap.exists()) setOtherUser(snap.data());
      });
    }
  }, [conv, currentUserId]);

  const unreadCount = conv.unreadCounts?.[currentUserId] || 0;

  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-2xl cursor-pointer transition-all border border-transparent flex items-center gap-3 group relative ${
        isActive 
          ? 'bg-primary-container/10 border-primary-container/30' 
          : 'hover:bg-surface-container shadow-sm hover:shadow-md'
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-xl overflow-hidden border transition-all ${isActive ? 'border-primary-container ring-2 ring-primary-container/20' : 'border-outline-variant/20'}`}>
          {otherUser?.profileImage ? (
            <img src={otherUser.profileImage} alt={otherUser.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <User className="w-5 h-5 text-outline" />
            </div>
          )}
        </div>
        {unreadCount > 0 ? (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-on-primary text-[9px] font-black flex items-center justify-center rounded-lg shadow-lg px-1 border border-surface">
            {unreadCount}
          </div>
        ) : (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-container rounded-full border-2 border-surface"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <h4 className={`text-xs font-black truncate uppercase tracking-tight ${isActive ? 'text-primary' : 'text-on-surface'}`}>
            {otherUser?.username || 'Syncing...'}
          </h4>
          <span className="text-[9px] font-mono text-outline opacity-60">
            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <p className="text-[10px] text-outline truncate opacity-70 group-hover:opacity-100 transition-opacity font-body">
          {conv.lastMessage || 'Signal waiting...'}
        </p>
      </div>

      {isActive && (
        <motion.div layoutId="activeDot" className="absolute left-1 w-1 h-6 bg-primary-container rounded-full" />
      )}
    </div>
  );
};

export default ArchiveSidebar;
