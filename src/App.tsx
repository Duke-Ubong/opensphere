import React, { useState, useEffect } from 'react';
import { Edit2, MessageSquare, RefreshCw, Heart, Monitor, Zap, Lightbulb, User, BarChart2, DollarSign, Settings, HelpCircle, LogOut, Grid, Plus, Menu, X, Shield, ChevronLeft, ChevronRight, Search, Bell, Database, CheckCircle2, Radio, Briefcase, Store, ShieldCheck, Trash2, Send } from 'lucide-react';
import GigsRepo from './components/GigsRepo';
import CreatePostModal from './components/CreatePostModal';
import LoungeView from './components/LoungeView';
import CreateBountyModal from './components/CreateBountyModal';
import WelcomeScreen from './components/WelcomeScreen';
import DirectMessages from './components/DirectMessages';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster, toast } from 'sonner';

// Firebase imports
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, getDoc, deleteDoc, where, limit, setDoc } from 'firebase/firestore';

// Types
interface UserData {
  id: string;
  username: string;
  email: string;
  professional_bio: string;
  is_verified: boolean;
  exposure_dial: number;
  nodes: number;
  trust_score: number;
  following: string[];
  credentials: Array<{ id: string; title: string; issuer: string; date: string }>;
  documents: Array<{ id: string; title: string; category: string; date: string; status: string; tags: string[] }>;
}

import { seedDatabase } from './seed';

interface Post {
  id: string;
  authorId?: string;
  type: 'VIBE' | 'GIG' | 'SYSTEM';
  isUncensored?: boolean;
  // VIBE fields
  authorName?: string;
  author?: string;
  time?: string;
  content?: string;
  tag?: string;
  intensityScore?: number;
  stats?: { comments?: number; reVibes?: number; likes?: number; nodes?: number };
  // GIG fields
  title?: string;
  description?: string;
  category?: string;
  readTime?: string;
  image?: string;
  createdAt?: number;
}

const PostCard: React.FC<{ 
  post: Post, 
  currentUser: UserData | null, 
  onFollowToggle: (targetId: string) => void,
  onDelete: (postId: string) => void,
  onStartDM: (userId: string) => void
}> = ({ post, currentUser, onFollowToggle, onDelete, onStartDM }) => {
  const isVibe = post.type === 'VIBE';
  const isSystem = post.type === 'SYSTEM';
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.stats?.likes || 0);
  const [isReVibed, setIsReVibed] = useState(false);
  const [reVibesCount, setReVibesCount] = useState(post.stats?.reVibes || 0);
  const [isExpanded, setIsExpanded] = useState(false);

  const isFollowing = currentUser?.following?.includes(post.authorId || '');
  const isMe = currentUser?.id === post.authorId;

  const handleLike = () => {
    if (isLiked) {
      setLikesCount(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const handleReVibe = () => {
    if (isReVibed) {
      setReVibesCount(prev => prev - 1);
      setIsReVibed(false);
    } else {
      setReVibesCount(prev => prev + 1);
      setIsReVibed(true);
    }
  };

  if (isSystem) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-surface-container-lowest p-4 rounded-xl mb-4 border-l-4 border-primary-container"
      >
        <div className="flex items-center gap-2 text-primary-container text-xs font-bold mb-3 tracking-widest uppercase">
          <Monitor className="w-4 h-4" /> SYSTEM BROADCAST
        </div>
        <h3 className="text-on-surface font-bold text-lg mb-2">{post.title}</h3>
        <div className="font-mono text-primary-container text-xs space-y-1 mb-4">
          {post.content?.split('\n').map((line: string, i: number) => <div key={i}>&gt; {line}</div>)}
        </div>
        <button onClick={() => toast('System details coming soon')} className="bg-primary-container text-on-primary-container px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all">VIEW DETAILS</button>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-container-lowest p-4 rounded-xl mb-4 border border-outline-variant/20 transition-all hover:border-outline-variant/40"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <div 
            onClick={() => !isMe && post.authorId && onStartDM(post.authorId)}
            className={`w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 ${!isMe ? 'cursor-pointer hover:brightness-110 transition-all' : ''}`}
          >
            {isVibe ? <Zap className="w-5 h-5 text-primary-container" /> : <Lightbulb className="w-5 h-5 text-primary-container" />}
          </div>
          <div>
            <div className="font-bold text-on-surface text-sm flex items-center gap-2">
              <span 
                onClick={() => !isMe && post.authorId && onStartDM(post.authorId)}
                className={!isMe ? 'cursor-pointer hover:text-primary-container transition-colors' : ''}
              >
                {post.authorName || 'User'}
              </span>
              {!isMe && !isSystem && post.authorId && (
                <button 
                  onClick={() => onFollowToggle(post.authorId!)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${isFollowing ? 'border-primary-container text-primary-container' : 'border-outline text-outline hover:border-primary-container hover:text-primary-container'}`}
                >
                  {isFollowing ? 'FOLLOWING' : '+ FOLLOW'}
                </button>
              )}
            </div>
            <div className="text-xs text-outline">{post.author || '@user'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-outline">{post.time || 'Just now'}</div>
          {isMe && (
            <button 
              onClick={() => onDelete(post.id)}
              className="text-outline hover:text-[#FF3B30] transition-colors p-1 rounded-full hover:bg-[#FF3B30]/10"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {post.title && <h3 className="font-bold text-on-surface text-lg mb-2">{post.title}</h3>}
      <p className="text-on-surface-variant text-sm mb-3">
        {isVibe ? post.content : (isExpanded ? (post.content || post.description + " [Full content expanded...]") : post.description)}
      </p>
      
      {post.image && (
        <div className="mb-3 rounded-xl overflow-hidden border border-outline-variant/20">
          <img src={post.image} alt="Post attachment" className="w-full max-h-[300px] object-cover" />
        </div>
      )}
      
      {post.tag && (
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-block px-2 py-0.5 bg-primary-container/10 text-primary-container text-xs font-mono rounded">
            {post.tag}
          </div>
          {post.intensityScore !== undefined && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-outline" title="Exposure Dial Intensity">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: post.intensityScore > 75 ? '#FF3B30' : post.intensityScore > 40 ? '#FF9500' : '#00FFAB' }}></span>
              INTENSITY: {post.intensityScore}/100
            </div>
          )}
        </div>
      )}
      
      {isVibe ? (
        <div className="flex gap-6 text-secondary-fixed-dim text-xs">
          <span 
            onClick={() => toast('Reply interface coming soon')}
            className="flex items-center gap-1.5 cursor-pointer hover:text-primary-container transition-all active:scale-90 group"
          >
            <div className="p-1.5 rounded-full group-hover:bg-primary-container/10 transition-colors">
              <MessageSquare className="w-4 h-4"/>
            </div>
            {post.stats?.comments || 0}
          </span>
          <span 
            onClick={handleReVibe} 
            className={`flex items-center gap-1.5 cursor-pointer transition-all active:scale-90 group ${isReVibed ? 'text-[#00FFAB] drop-shadow-[0_0_8px_rgba(0,255,171,0.5)]' : 'hover:text-[#00FFAB]'}`}
          >
            <div className={`p-1.5 rounded-full group-hover:bg-[#00FFAB]/10 transition-colors ${isReVibed ? 'bg-[#00FFAB]/10' : ''}`}>
              <RefreshCw className={`w-4 h-4 ${isReVibed ? 'animate-spin-slow' : ''}`}/>
            </div>
            {reVibesCount}
          </span>
          <span 
            onClick={handleLike} 
            className={`flex items-center gap-1.5 cursor-pointer transition-all active:scale-90 group ${isLiked ? 'text-[#FF3B30] drop-shadow-[0_0_12px_rgba(255,59,48,0.8)]' : 'hover:text-[#FF3B30]'}`}
          >
            <div className={`p-1.5 rounded-full group-hover:bg-[#FF3B30]/10 transition-colors ${isLiked ? 'bg-[#FF3B30]/10' : ''}`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}/>
            </div>
            {likesCount}
          </span>
        </div>
      ) : (
        <div className="flex justify-between items-center text-xs text-secondary-fixed-dim font-mono uppercase">
          <span>{post.readTime || '5 MIN READ'}</span>
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-primary-container hover:text-on-surface transition-colors font-bold">
            {isExpanded ? 'Show Less <-' : 'Read More ->'}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showUncensored, setShowUncensored] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');

  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editIsVerified, setEditIsVerified] = useState(false);

  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'dashboard' | 'bounties' | 'gigs'>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Bounties State
  const [isBountyModalOpen, setIsBountyModalOpen] = useState(false);
  const [bounties, setBounties] = useState<any[]>([]);

  const handleBountyCreated = async (bounty: any) => {
    try {
      await addDoc(collection(db, 'bounties'), {
        ...bounty,
        createdAt: Date.now()
      });
      toast.success('Bounty posted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to post bounty');
    }
  };

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;

    const checkLocalAuth = () => {
      const localUserId = localStorage.getItem('test_user_id');
      if (localUserId) {
        seedDatabase(); // Ensure mock data exists
        unsubscribeUser = onSnapshot(doc(db, 'users', localUserId), (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserData);
          } else {
            // Fallback to mock user if not found in db but logged in (test login)
            getDoc(doc(db, 'users', 'user-1')).then(mockUserDoc => {
              if (mockUserDoc.exists()) {
                setUser(mockUserDoc.data() as UserData);
              }
            });
          }
        }, (error) => {
          console.error("Error fetching user:", error);
        });
      } else {
        setUser(null);
        setShowWelcome(true);
      }
    };

    checkLocalAuth();

    return () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const qPosts = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
    }, (error) => {
      console.error("Error fetching posts:", error);
    });

    const qBounties = query(collection(db, 'bounties'), orderBy('createdAt', 'desc'));
    const unsubscribeBounties = onSnapshot(qBounties, (snapshot) => {
      const bountiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBounties(bountiesData);
    }, (error) => {
      console.error("Error fetching bounties:", error);
    });

    return () => {
      unsubscribePosts();
      unsubscribeBounties();
    };
  }, [user]);

  const openEditProfile = () => {
    if (user) {
      setEditUsername(user.username);
      setEditBio(user.professional_bio);
      setEditIsVerified(user.is_verified);
      setIsEditProfileOpen(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        username: editUsername,
        professional_bio: editBio,
        is_verified: editIsVerified
      });
      setUser({ ...user, username: editUsername, professional_bio: editBio, is_verified: editIsVerified });
      setIsEditProfileOpen(false);
      toast.success('Profile updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    }
  };

  const handleFollowToggle = async (targetId: string) => {
    if (!user) return;
    const isFollowing = user.following?.includes(targetId);
    try {
      const userRef = doc(db, 'users', user.id);
      if (isFollowing) {
        await updateDoc(userRef, {
          following: arrayRemove(targetId)
        });
        setUser({ ...user, following: user.following.filter(id => id !== targetId) });
        toast.success('Unfollowed user');
      } else {
        await updateDoc(userRef, {
          following: arrayUnion(targetId)
        });
        setUser({ ...user, following: [...(user.following || []), targetId] });
        toast.success('Following user');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update follow status');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success('Post deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete post');
    }
  };

  const [isDMOpen, setIsDMOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  const handleStartDM = async (otherUserId: string) => {
    if (!user) return;
    if (user.id === otherUserId) return;

    // Check if conversation already exists
    const existing = conversations.find(c => c.participants.includes(otherUserId));
    if (existing) {
      setActiveConversationId(existing.id);
      setIsDMOpen(true);
      return;
    }

    try {
      const convId = [user.id, otherUserId].sort().join('_');
      const convRef = doc(db, 'conversations', convId);
      const convSnap = await getDoc(convRef);
      
      if (!convSnap.exists()) {
        await setDoc(convRef, {
          id: convId,
          participants: [user.id, otherUserId],
          updatedAt: Date.now(),
          lastMessage: '',
          lastMessageAt: 0
        });
      }
      setActiveConversationId(convId);
      setIsDMOpen(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to start conversation');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('test_user_id');
    setUser(null);
    setShowWelcome(true);
  };

  // Filtering logic:
  // Gigs are always visible. Vibe posts are filtered based on uncensored toggle and feed type.
  const visiblePosts = posts.filter(post => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        post.content?.toLowerCase().includes(query) || 
        post.title?.toLowerCase().includes(query) || 
        post.authorName?.toLowerCase().includes(query) ||
        post.tag?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    if (post.type === 'GIG') return true;
    if (post.isUncensored && !showUncensored) return false;
    if (feedType === 'following' && post.authorId !== 'system' && post.authorId !== user?.id && !user?.following?.includes(post.authorId || '')) return false;
    return true;
  });

  const vibePosts = visiblePosts.filter(p => p.type === 'VIBE');
  const gigPosts = visiblePosts.filter(p => p.type === 'GIG');

  return (
    <AnimatePresence mode="wait">
      <Toaster theme="dark" position="top-right" />
      {showWelcome ? (
        <motion.div key="welcome" exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} transition={{ duration: 0.8, ease: "easeInOut" }}>
          <WelcomeScreen onInitialize={() => setShowWelcome(false)} />
        </motion.div>
      ) : (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.2 }} className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-fixed flex flex-col">
          {/* TopNavBar */}
      <nav className="flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50 bg-[#131313]">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black text-[#F6FFF6] tracking-tighter font-headline">OpenSphere</span>
          <div className="hidden md:flex gap-6 items-center">
            <button onClick={() => setCurrentView('home')} className={`font-headline font-bold tracking-tight py-1 transition-all active:scale-95 duration-100 ${currentView === 'home' ? 'text-[#00FFAB] border-b-2 border-[#00FFAB]' : 'text-[#E5E2E1] hover:text-[#00FFAB]'}`}>Vibe</button>
            <button onClick={() => setCurrentView('gigs')} className={`font-headline font-bold tracking-tight py-1 transition-all active:scale-95 duration-100 ${currentView === 'gigs' ? 'text-[#00FFAB] border-b-2 border-[#00FFAB]' : 'text-[#E5E2E1] hover:text-[#00FFAB]'}`}>Gigs</button>
            <button onClick={() => setCurrentView('bounties')} className={`font-headline font-bold tracking-tight py-1 transition-all active:scale-95 duration-100 ${currentView === 'bounties' ? 'text-[#00FFAB] border-b-2 border-[#00FFAB]' : 'text-[#E5E2E1] hover:text-[#00FFAB]'}`}>Bounties</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-surface-container-lowest px-3 py-1.5 rounded-lg border-b border-primary-container/30">
            <Search className="w-4 h-4 text-outline mr-2" />
            <input 
              className="bg-transparent border-none focus:outline-none text-sm font-label uppercase tracking-widest text-on-surface-variant placeholder:text-outline/50 w-48" 
              placeholder="Search Terminal..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 text-[#E5E2E1]">
            <Search onClick={() => {
              const searchBar = document.querySelector('input[placeholder="Search Terminal..."]') as HTMLInputElement;
              if (searchBar) {
                searchBar.parentElement?.classList.toggle('hidden');
                searchBar.focus();
              }
            }} className="w-5 h-5 sm:hidden hover:text-[#00FFAB] cursor-pointer transition-colors" />
            <Bell onClick={() => toast('No new notifications')} className="w-5 h-5 hover:text-[#00FFAB] cursor-pointer transition-colors" />
            <MessageSquare onClick={() => setIsDMOpen(true)} className="w-5 h-5 hover:text-[#00FFAB] cursor-pointer transition-colors" />
            <User onClick={() => setCurrentView('profile')} className="w-5 h-5 hover:text-[#00FFAB] cursor-pointer transition-colors" />
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* SideNavBar */}
        {currentView !== 'gigs' && (
        <aside className={`hidden lg:flex flex-col h-[calc(100vh-60px)] fixed left-0 top-[60px] pt-8 bg-[#1C1B1B] border-r border-[#3A4A40]/15 z-40 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <div className="p-6 flex-1 flex flex-col">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3 mb-8">
                <img alt="User Avatar" className="w-10 h-10 rounded-full border border-primary-container/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCOWJ5vZEovondagcWGriDKF5gytHqkiFpqOXiKOfy1Tni5G8a7lVjfW-EWggSDJuumPqN2dAQga2N-YT6gA4CrP-qX_I52u-0woFdq9dDLfhsk1HshhH6v0GZAyBnysdTlHjZwoCxuBIzAP2EqND_q8lGS7tXREUaBg-QcLs8m3nkAOa-a254ival6t9EfDvrwrH5oeD_mfOsYwf5vg_zmYgQ2Z5ivEwNu1nTbfFpMj50Yt_es5P2aVYFq5LhuowjdJUxBNGHEaUB" />
                <div>
                  <p className="font-label uppercase tracking-widest text-[10px] text-primary-container font-bold">Executive Terminal</p>
                  <p className="font-label text-[10px] text-secondary">Kinetic Status: Active</p>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center mb-8">
                <img alt="User Avatar" className="w-10 h-10 rounded-full border border-primary-container/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCOWJ5vZEovondagcWGriDKF5gytHqkiFpqOXiKOfy1Tni5G8a7lVjfW-EWggSDJuumPqN2dAQga2N-YT6gA4CrP-qX_I52u-0woFdq9dDLfhsk1HshhH6v0GZAyBnysdTlHjZwoCxuBIzAP2EqND_q8lGS7tXREUaBg-QcLs8m3nkAOa-a254ival6t9EfDvrwrH5oeD_mfOsYwf5vg_zmYgQ2Z5ivEwNu1nTbfFpMj50Yt_es5P2aVYFq5LhuowjdJUxBNGHEaUB" />
              </div>
            )}
            <nav className="space-y-1">
              <button onClick={() => setCurrentView('home')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'home' ? 'bg-[#2A2A2A] text-[#00FFAB] shadow-[0_0_15px_rgba(0,255,171,0.2)]' : 'text-[#B5C8DF] hover:bg-[#201F1F] hover:text-[#00FFAB]'}`}>
                <Grid className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Home</span>}
              </button>
              <button onClick={() => setCurrentView('profile')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'profile' ? 'bg-[#2A2A2A] text-[#00FFAB] shadow-[0_0_15px_rgba(0,255,171,0.2)]' : 'text-[#B5C8DF] hover:bg-[#201F1F] hover:text-[#00FFAB]'}`}>
                <User className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Profile</span>}
              </button>
              <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'dashboard' ? 'bg-[#2A2A2A] text-[#00FFAB] shadow-[0_0_15px_rgba(0,255,171,0.2)]' : 'text-[#B5C8DF] hover:bg-[#201F1F] hover:text-[#00FFAB]'}`}>
                <BarChart2 className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Dashboard</span>}
              </button>
              <button onClick={() => setCurrentView('bounties')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'bounties' ? 'bg-[#2A2A2A] text-[#00FFAB] shadow-[0_0_15px_rgba(0,255,171,0.2)]' : 'text-[#B5C8DF] hover:bg-[#201F1F] hover:text-[#00FFAB]'}`}>
                <DollarSign className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Bounty Board</span>}
              </button>
              <button onClick={() => setIsLoungeOpen(true)} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-transparent hover:border-[#D4AF37]/30`}>
                <Shield className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">The Lounge</span>}
              </button>
              <button onClick={() => setIsDMOpen(true)} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all text-[#00FFAB] hover:bg-[#00FFAB]/10 border border-transparent hover:border-[#00FFAB]/30`}>
                <MessageSquare className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Direct Messages</span>}
              </button>
            </nav>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`w-full mt-8 bg-primary-container text-on-primary-fixed py-3 rounded font-label uppercase tracking-widest text-[10px] font-bold hover:bg-primary-fixed-dim transition-colors flex items-center justify-center ${isSidebarCollapsed ? 'px-0' : 'px-4'}`}
            >
              {isSidebarCollapsed ? <Edit2 className="w-4 h-4" /> : 'Create Post'}
            </button>
          </div>
          <div className="mt-auto p-6 space-y-1">
            <button onClick={() => toast('Settings panel coming soon')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-[#B5C8DF] hover:text-[#00FFAB] transition-all`}>
              <Settings className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Settings</span>}
            </button>
            <button onClick={() => toast('Support center coming soon')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-[#B5C8DF] hover:text-[#00FFAB] transition-all`}>
              <HelpCircle className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Support</span>}
            </button>
            <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-[#FF3B30] hover:text-[#FF3B30]/80 transition-all`}>
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Log Out</span>}
            </button>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 mt-4 text-[#B5C8DF] hover:text-[#00FFAB] transition-all border-t border-[#3A4A40]/15 pt-4`}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Collapse</span>}
            </button>
          </div>
        </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 w-full bg-surface transition-all duration-300 ease-in-out ${currentView === 'gigs' ? 'lg:ml-0' : (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')}`}>
          <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 xl:grid-cols-2 min-h-[calc(100vh-60px)]">
              
              {/* Left Column: The Vibe (Raw Feed) */}
            <section className="hidden xl:block border-r border-outline-variant/10 bg-surface-container-low p-4 lg:p-6 overflow-y-auto">
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="font-headline text-2xl font-black text-primary tracking-tighter">VIBES</h2>
                  <div className="flex gap-4 mt-1">
                    <button 
                      onClick={() => setFeedType('all')}
                      className={`font-label text-[10px] uppercase tracking-widest transition-colors ${feedType === 'all' ? 'text-[#00FFAB]' : 'text-primary-container hover:text-[#00FFAB]'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFeedType('following')}
                      className={`font-label text-[10px] uppercase tracking-widest transition-colors ${feedType === 'following' ? 'text-[#00FFAB]' : 'text-primary-container hover:text-[#00FFAB]'}`}
                    >
                      Following
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary">Uncensored</span>
                  <button 
                    onClick={() => setShowUncensored(!showUncensored)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${showUncensored ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-surface absolute top-1 transition-transform ${showUncensored ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </header>
              <div className="space-y-4">
                <AnimatePresence>
                {vibePosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={user} 
                    onFollowToggle={handleFollowToggle} 
                    onDelete={handleDeletePost}
                    onStartDM={handleStartDM}
                  />
                ))}
                </AnimatePresence>
                {vibePosts.length === 0 && (
                  <div className="text-center p-8 text-outline font-label text-sm">
                    No vibes found.
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: The Vault (Deep Dives) */}
            <section className="hidden xl:block bg-surface p-4 lg:p-6 overflow-y-auto pb-32">
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="font-headline text-2xl font-black text-primary tracking-tighter">GIGS</h2>
                  <p className="font-label text-xs text-secondary-fixed-dim tracking-widest uppercase">Professional // Documentation</p>
                </div>
                <Database className="w-6 h-6 text-secondary-fixed-dim" />
              </header>
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                {gigPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={user} 
                    onFollowToggle={handleFollowToggle} 
                    onDelete={handleDeletePost}
                    onStartDM={handleStartDM}
                  />
                ))}
                </AnimatePresence>
              </div>
            </section>

            {/* Mobile Unified Feed */}
            <section className="xl:hidden bg-surface p-4 pb-[100px] overflow-y-auto w-full">
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="font-headline text-2xl font-black text-primary tracking-tighter">FEED</h2>
                  <p className="font-label text-xs text-primary-container tracking-widest uppercase">Unified Stream</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-label text-[10px] uppercase tracking-widest text-secondary">Uncensored</span>
                  <button 
                    onClick={() => setShowUncensored(!showUncensored)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${showUncensored ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-surface absolute top-1 transition-transform ${showUncensored ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </header>
              <div className="space-y-4">
                <AnimatePresence>
                {visiblePosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={user} 
                    onFollowToggle={handleFollowToggle} 
                    onDelete={handleDeletePost}
                    onStartDM={handleStartDM}
                  />
                ))}
                </AnimatePresence>
                {visiblePosts.length === 0 && (
                  <div className="text-center p-8 text-outline font-label text-sm">
                    No posts found.
                  </div>
                )}
              </div>
            </section>
            </motion.div>
          )}

          {currentView === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="p-4 lg:p-10 max-w-4xl mx-auto w-full min-h-[calc(100vh-60px)] pb-[100px]">
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 lg:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img alt="User Avatar" className="w-24 h-24 rounded-full border-2 border-primary-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCOWJ5vZEovondagcWGriDKF5gytHqkiFpqOXiKOfy1Tni5G8a7lVjfW-EWggSDJuumPqN2dAQga2N-YT6gA4CrP-qX_I52u-0woFdq9dDLfhsk1HshhH6v0GZAyBnysdTlHjZwoCxuBIzAP2EqND_q8lGS7tXREUaBg-QcLs8m3nkAOa-a254ival6t9EfDvrwrH5oeD_mfOsYwf5vg_zmYgQ2Z5ivEwNu1nTbfFpMj50Yt_es5P2aVYFq5LhuowjdJUxBNGHEaUB" />
                    <div className="absolute -bottom-2 -right-2 bg-[#00FFAB] text-black text-[8px] font-black px-2 py-1 rounded-full shadow-[0_0_10px_rgba(0,255,171,0.5)]">PRO</div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black font-headline text-primary tracking-tighter flex items-center gap-3">
                      {user?.username || 'Loading...'}
                      {user?.is_verified && <CheckCircle2 className="w-6 h-6 text-primary-container" />}
                    </h1>
                    <p className="text-secondary font-label tracking-widest uppercase mt-2">{user?.professional_bio}</p>
                    
                    <div className="flex gap-4 mt-4">
                      <div className="bg-surface-container px-3 py-1 rounded border border-outline-variant/10">
                        <span className="text-[10px] text-outline uppercase tracking-widest mr-2">Nodes</span>
                        <span className="text-sm font-black text-[#00FFAB]">{user?.nodes?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="bg-surface-container px-3 py-1 rounded border border-outline-variant/10">
                        <span className="text-[10px] text-outline uppercase tracking-widest mr-2">Trust</span>
                        <span className="text-sm font-black text-[#00FFAB]">{user?.trust_score || '0'}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={openEditProfile} className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded text-xs font-bold font-label uppercase tracking-widest text-secondary hover:text-primary hover:bg-surface-container-high transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="font-headline text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <Radio className="w-5 h-5 text-primary-container" />
                    Your Transmissions
                  </h3>
                  <div className="space-y-4">
                    {posts.filter(p => p.author === user?.username || (p.type === 'GIG' && user?.username === '0x_founder')).length === 0 ? (
                      <div className="text-center p-8 text-outline font-label text-sm bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                        No transmissions found.
                      </div>
                    ) : (
                      posts.filter(p => p.author === user?.username || (p.type === 'GIG' && user?.username === '0x_founder')).map(post => (
                        <div key={post.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/20 hover:border-primary-container/30 transition-all group">
                          {post.type === 'VIBE' ? (
                            <>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-label text-xs font-bold text-primary-container">{post.author}</span>
                                  <span className="text-xs text-outline">• {post.time}</span>
                                </div>
                                <span className="font-label text-[10px] uppercase tracking-widest text-secondary bg-surface-container px-2 py-1 rounded group-hover:bg-primary-container/10 group-hover:text-primary-container transition-colors">Vibe</span>
                              </div>
                              <p className="font-body text-sm text-on-surface leading-relaxed">{post.content}</p>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-3">
                                <span className="font-label text-[10px] uppercase tracking-widest text-secondary bg-surface-container px-2 py-1 rounded group-hover:bg-primary-container/10 group-hover:text-primary-container transition-colors">Gig</span>
                                <span className="text-xs text-outline">{post.readTime}</span>
                              </div>
                              <h3 className="font-headline font-bold text-lg text-primary mb-2">{post.title}</h3>
                              <p className="font-body text-sm text-secondary mb-4">{post.description}</p>
                              <span className="text-xs font-label uppercase tracking-widest text-primary-container">{post.category}</span>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-headline text-xl font-bold text-primary mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#00FFAB]" />
                    Verified Credentials
                  </h3>
                  <div className="space-y-3">
                    {user?.documents?.map(cred => (
                      <div key={cred.id} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10 hover:border-[#00FFAB]/30 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[8px] font-mono text-outline tracking-widest uppercase">{cred.id}</span>
                          <CheckCircle2 className="w-3 h-3 text-[#00FFAB]" />
                        </div>
                        <p className="text-xs font-bold text-white mb-1">{cred.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{cred.category}</p>
                      </div>
                    ))}
                    {(!user?.documents || user.documents.length === 0) && (
                      <div className="text-center p-4 text-outline font-label text-[10px] uppercase tracking-widest border border-dashed border-outline-variant/20 rounded-xl">
                        No credentials yet
                      </div>
                    )}
                    <button 
                      onClick={() => setCurrentView('gigs')}
                      className="w-full py-3 border border-dashed border-outline-variant/30 rounded-xl text-[10px] font-bold text-outline uppercase tracking-widest hover:border-[#00FFAB]/50 hover:text-[#00FFAB] transition-all"
                    >
                      View Full Repository
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'dashboard' && (() => {
            const userPosts = posts.filter(p => p.author === user?.username || (p.type === 'GIG' && user?.username === '0x_founder'));
            const totalTransmissions = userPosts.length;
            const totalEngagement = userPosts.reduce((acc, post) => {
              return acc + (post.stats?.comments || 0) + (post.stats?.reVibes || 0) + (post.stats?.likes || 0);
            }, 0);

            return (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="p-4 lg:p-10 max-w-5xl mx-auto w-full min-h-[calc(100vh-60px)] pb-[100px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 lg:mb-10 gap-4">
                  <div>
                    <h2 className="font-headline text-3xl font-black text-primary tracking-tighter">Overview</h2>
                    <p className="font-label text-xs text-secondary tracking-widest uppercase mt-1">Essential Metrics</p>
                  </div>
                  
                  {/* Search/Filter Bar matching user's requested dimensions */}
                  <div className="relative" style={{ height: '50px', width: '100%', maxWidth: '342.354px' }}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-outline" />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter metrics..."
                      className="block w-full h-full pl-11 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface placeholder-outline focus:outline-none focus:border-primary-container transition-colors font-body text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 flex items-center gap-6 hover:border-primary-container/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-8 h-8 text-primary-container" />
                    </div>
                    <div>
                      <p className="font-label text-xs text-secondary uppercase tracking-widest mb-1">Total Transmissions</p>
                      <p className="text-5xl font-black font-headline text-primary">{totalTransmissions}</p>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 flex items-center gap-6 hover:border-[#00FFAB]/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-[#00FFAB]/10 flex items-center justify-center shrink-0">
                      <Heart className="w-8 h-8 text-[#00FFAB]" />
                    </div>
                    <div>
                      <p className="font-label text-xs text-secondary uppercase tracking-widest mb-1">Total Engagement</p>
                      <p className="text-5xl font-black font-headline text-[#00FFAB]">{totalEngagement}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest">
                    <h3 className="font-headline text-lg font-bold text-primary">Recent Activity</h3>
                  </div>
                  <div className="divide-y divide-outline-variant/10">
                    {userPosts.slice(0, 5).map(post => (
                      <div key={post.id} className="p-6 hover:bg-surface-container-highest/50 transition-colors flex justify-between items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-headline font-bold text-primary truncate">{post.title || post.content}</p>
                          <p className="font-label text-[10px] text-secondary uppercase tracking-widest mt-1">{post.time} • {post.type}</p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="flex items-center gap-1.5 text-xs text-secondary font-mono"><MessageSquare className="w-3 h-3"/> {post.stats?.comments || 0}</span>
                          <span className="flex items-center gap-1.5 text-xs text-[#00FFAB] font-mono"><Heart className="w-3 h-3"/> {post.stats?.likes || 0}</span>
                        </div>
                      </div>
                    ))}
                    {userPosts.length === 0 && (
                      <div className="p-8 text-center text-secondary font-label text-sm uppercase tracking-widest">
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {currentView === 'gigs' && (
            <motion.div key="gigs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <GigsRepo />
            </motion.div>
          )}

          {currentView === 'bounties' && (
            <motion.div key="bounties" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="p-4 lg:p-10 max-w-6xl mx-auto w-full min-h-[calc(100vh-60px)] pb-[100px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                <div>
                  <h2 className="font-headline text-3xl font-black text-primary tracking-tighter">Bounty Board</h2>
                  <p className="font-label text-xs text-secondary tracking-widest uppercase mt-2">Open contracts and gigs</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[300px]" style={{ height: '44px' }}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <input 
                      type="text" 
                      placeholder="Search bounties..." 
                      className="w-full h-full bg-surface-container-low border border-outline-variant/30 rounded-xl pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors"
                    />
                  </div>
                  <button onClick={() => setIsBountyModalOpen(true)} className="bg-primary-container text-on-primary-fixed px-6 h-[44px] rounded font-label uppercase tracking-widest text-xs font-bold hover:bg-primary-fixed-dim transition-colors shadow-[0_0_15px_rgba(0,255,171,0.2)] shrink-0">
                    Post Bounty
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                {bounties.map((bounty, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary-container/50 transition-colors cursor-pointer"
                  >
                    <div>
                      <h3 className="font-headline font-bold text-lg text-primary">{bounty.title}</h3>
                      <p className="text-sm text-secondary mt-1">{bounty.desc}</p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <p className="font-headline font-black text-xl text-[#00FFAB]">{bounty.price}</p>
                      <p className="font-label text-[10px] text-secondary uppercase tracking-widest mt-1">{bounty.currency}</p>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </main>
      </div>

      {/* BottomNavBar (Mobile Only) */}
      <div className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-2 lg:hidden bg-[#131313]/90 backdrop-blur-xl border-t border-[#3A4A40]/15 z-50" style={{ height: '72px' }}>
        <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center justify-center rounded-md py-2 px-2 active:scale-90 duration-150 ${currentView === 'home' ? 'text-[#00FFAB]' : 'text-[#B5C8DF] hover:text-[#00FFAB]'}`}>
          <Radio className="w-5 h-5" />
          <span className="font-label text-[10px] font-medium mt-1 tracking-widest uppercase">Vibe</span>
        </button>
        <button onClick={() => setCurrentView('gigs')} className={`flex flex-col items-center justify-center rounded-md py-2 px-2 active:scale-90 duration-150 ${currentView === 'gigs' ? 'text-[#00FFAB]' : 'text-[#B5C8DF] hover:text-[#00FFAB]'}`}>
          <Briefcase className="w-5 h-5" />
          <span className="font-label text-[10px] font-medium mt-1 tracking-widest uppercase">Gigs</span>
        </button>
        <button onClick={() => setCurrentView('bounties')} className={`flex flex-col items-center justify-center rounded-md py-2 px-2 active:scale-90 duration-150 ${currentView === 'bounties' ? 'text-[#00FFAB]' : 'text-[#B5C8DF] hover:text-[#00FFAB]'}`}>
          <Store className="w-5 h-5" />
          <span className="font-label text-[10px] font-medium mt-1 tracking-widest uppercase">Market</span>
        </button>
        <button onClick={() => setIsLoungeOpen(true)} className={`flex flex-col items-center justify-center rounded-md py-2 px-2 active:scale-90 duration-150 text-[#D4AF37] hover:text-[#D4AF37]/80`}>
          <Shield className="w-5 h-5" />
          <span className="font-label text-[10px] font-medium mt-1 tracking-widest uppercase">Lounge</span>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center justify-center rounded-md py-2 px-2 active:scale-90 duration-150 ${currentView === 'profile' ? 'text-[#00FFAB]' : 'text-[#B5C8DF] hover:text-[#00FFAB]'}`}>
          <User className="w-5 h-5" />
          <span className="font-label text-[10px] font-medium mt-1 tracking-widest uppercase">Profile</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/20 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
              <h3 className="font-headline font-bold text-lg text-primary tracking-tight">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-secondary hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-4 space-y-4">
              <div>
                <label className="block font-label text-[10px] text-secondary uppercase tracking-widest mb-2">Username</label>
                <input 
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-surface-container p-3 rounded border border-outline-variant/20 text-on-surface font-body text-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              
              <div>
                <label className="block font-label text-[10px] text-secondary uppercase tracking-widest mb-2">Professional Bio</label>
                <textarea 
                  required
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-surface-container p-3 rounded border border-outline-variant/20 text-on-surface font-body text-sm focus:outline-none focus:border-primary-container min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-3 bg-surface-container p-3 rounded border border-outline-variant/20">
                <input 
                  type="checkbox" 
                  id="verified-check"
                  checked={editIsVerified}
                  onChange={(e) => setEditIsVerified(e.target.checked)}
                  className="w-4 h-4 accent-primary-container cursor-pointer"
                />
                <label htmlFor="verified-check" className="font-label text-xs text-on-surface cursor-pointer">
                  Verified Status
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-3 rounded font-label uppercase tracking-widest text-xs font-bold bg-surface-container text-secondary hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 rounded font-label uppercase tracking-widest text-xs font-bold bg-primary-container text-on-primary-container hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,255,170,0.2)]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile FAB for Creating Posts */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-[0_0_20px_rgba(0,255,171,0.4)] flex items-center justify-center z-40 hover:scale-105 transition-transform"
      >
        <Edit2 className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPostCreated={() => {}}
        user={user}
      />

      {isLoungeOpen && (
        <LoungeView user={user} onClose={() => setIsLoungeOpen(false)} />
      )}

        <CreateBountyModal
          isOpen={isBountyModalOpen}
          onClose={() => setIsBountyModalOpen(false)}
          onBountyCreated={handleBountyCreated}
        />

        <DirectMessages 
          isOpen={isDMOpen} 
          onClose={() => setIsDMOpen(false)} 
          currentUser={user} 
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          conversations={conversations}
        />

        <Toaster position="bottom-right" theme="dark" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
