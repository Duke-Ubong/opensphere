import React, { useState, useEffect, useRef } from 'react';
import { Edit2, MessageSquare, RefreshCw, Heart, Monitor, Zap, Lightbulb, User, BarChart2, DollarSign, Settings, HelpCircle, LogOut, Grid, Plus, Menu, X, Shield, ChevronLeft, ChevronRight, Search, Bell, Database, CheckCircle2, Radio, Briefcase, Store, ShieldCheck, Trash2, Send, FileText, Sun, Moon, Home, Users, Mail, MapPin, Globe, Globe2, Camera } from 'lucide-react';
import GigsRepo from './components/GigsRepo';
import CreatePostModal from './components/CreatePostModal';
import LoungeView from './components/LoungeView';
import CreateBountyModal from './components/CreateBountyModal';
import WelcomeScreen from './components/WelcomeScreen';
import DirectMessages from './components/DirectMessages';
import ArchiveSidebar from './components/ArchiveSidebar';
import { CallManager, CallSignals } from './components/CallManager';
import SearchView from './components/SearchView';
import NetworkView from './components/NetworkView';
import ActivityView from './components/ActivityView';
import MessagingView from './components/MessagingView';
import ProfileView from './components/ProfileView';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster, toast } from 'sonner';

// Firebase imports
import { db, handleFirestoreError } from './firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, getDoc, deleteDoc, where, limit, setDoc, increment, getDocs } from 'firebase/firestore';

// Types
interface UserData {
  id: string;
  username: string;
  handle?: string;
  email: string;
  professional_bio: string;
  is_verified: boolean;
  nodes: number;
  following: string[];
  followers: string[];
  profileImage?: string;
  bannerImage?: string;
  location?: string;
  website?: string;
  competencies?: string[];
  credentials: Array<{ id: string; title: string; issuer: string; date: string }>;
  documents: Array<{ id: string; title: string; category: string; date: string; status: string; tags: string[] }>;
}

import { seedDatabase } from './seed';

interface Post {
  id: string;
  authorId?: string;
  type: 'VIBE' | 'GIG' | 'SYSTEM' | 'RE_VIBE';
  // VIBE fields
  authorName?: string;
  author?: string;
  time?: string;
  content?: string;
  tag?: string;
  stats?: { comments?: number; reVibes?: number; likes?: number; nodes?: number };
  likedBy?: string[];
  reVibedBy?: string[];
  // GIG fields
  title?: string;
  description?: string;
  category?: string;
  readTime?: string;
  image?: string;
  createdAt?: number;
  // RE_VIBE fields
  originalPostId?: string;
  originalAuthorName?: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
  likedBy?: string[];
}

const PostCard: React.FC<{ 
  post: Post, 
  currentUser: UserData | null, 
  authorProfileImage?: string,
  onFollowToggle: (targetId: string) => void,
  onDelete: (postId: string) => void,
  onStartDM: (userId: string) => void,
  onReVibe: (post: Post) => void,
  onLike: (postId: string, isLiked: boolean) => void,
  onComment: (postId: string, content: string) => void,
  onViewProfile?: (user: any) => void
}> = ({ post, currentUser, authorProfileImage, onFollowToggle, onDelete, onStartDM, onReVibe, onLike, onComment, onViewProfile }) => {
  const isVibe = post.type === 'VIBE' || post.type === 'RE_VIBE';
  const isSystem = post.type === 'SYSTEM';
  
  const [isLiked, setIsLiked] = useState(post.likedBy?.includes(currentUser?.id || '') || false);
  const [likesCount, setLikesCount] = useState(post.stats?.likes || post.likedBy?.length || 0);
  const [isReVibed, setIsReVibed] = useState(post.reVibedBy?.includes(currentUser?.id || '') || false);
  const [reVibesCount, setReVibesCount] = useState(post.stats?.reVibes || post.reVibedBy?.length || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    setIsLiked(post.likedBy?.includes(currentUser?.id || '') || false);
    setLikesCount(post.stats?.likes || post.likedBy?.length || 0);
    setIsReVibed(post.reVibedBy?.includes(currentUser?.id || '') || false);
    setReVibesCount(post.stats?.reVibes || post.reVibedBy?.length || 0);
  }, [post.likedBy, post.reVibedBy, post.stats, currentUser?.id]);

  useEffect(() => {
    if (showComments) {
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
      }, (error) => {
        console.error("Error in comments snapshot:", error);
      });
      return () => unsubscribe();
    }
  }, [showComments, post.id]);

  const isFollowing = currentUser?.following?.includes(post.authorId || '');
  const isMe = currentUser?.id === post.authorId;

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    onLike(post.id, newLiked);
  };

  const handleReVibe = () => {
    if (isReVibed) return; // Only allow one re-vibe for now
    setIsReVibed(true);
    setReVibesCount(prev => prev + 1);
    onReVibe(post);
  };

  const handleLikeComment = async (commentId: string, currentLikedBy: string[] = []) => {
    if (!currentUser) return;
    const isCommentLiked = currentLikedBy.includes(currentUser.id);
    try {
      const commentRef = doc(db, 'posts', post.id, 'comments', commentId);
      await updateDoc(commentRef, {
        likedBy: isCommentLiked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
      });
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(post.id, commentText);
    setCommentText('');
  };

  if (isSystem) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="bg-surface-container p-4 rounded-xl mb-4 border-l-4 border-primary-container shadow-sm"
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
      className="bg-surface-container p-4 rounded-xl mb-4 border border-outline-variant/20 transition-all hover:border-outline-variant/40 shadow-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <div 
            onClick={() => !isMe && post.authorId && onViewProfile?.({ 
              id: post.authorId, 
              username: post.authorName || post.author, 
              profileImage: authorProfileImage,
              professional_bio: post.content ? post.content.substring(0, 100) : post.description
            })}
            className={`w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 overflow-hidden ${!isMe ? 'cursor-pointer hover:brightness-110 transition-all' : ''}`}
          >
            {authorProfileImage ? (
              <img src={authorProfileImage} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              isVibe ? <Zap className="w-5 h-5 text-primary-container" /> : <Lightbulb className="w-5 h-5 text-primary-container" />
            )}
          </div>
          <div>
            <div className="font-bold text-on-surface text-sm flex items-center gap-2">
              <span 
                onClick={() => !isMe && post.authorId && onViewProfile?.({ 
                  id: post.authorId, 
                  username: post.authorName || post.author, 
                  profileImage: authorProfileImage,
                  professional_bio: post.content ? post.content.substring(0, 100) : post.description
                })}
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
      
      {post.type === 'RE_VIBE' && (
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-primary-container uppercase tracking-widest">
          <RefreshCw className="w-3 h-3" /> Re-vibed from {post.originalAuthorName}
        </div>
      )}
      
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
        </div>
      )}
      
      {isVibe ? (
        <div className="space-y-4">
          <div className="flex gap-6 text-secondary-fixed-dim text-xs">
            <span 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 cursor-pointer transition-all active:scale-90 group ${showComments ? 'text-primary-container' : 'hover:text-primary-container'}`}
            >
              <div className={`p-1.5 rounded-full group-hover:bg-primary-container/10 transition-colors ${showComments ? 'bg-primary-container/10' : ''}`}>
                <MessageSquare className="w-4 h-4"/>
              </div>
              {post.stats?.comments || 0}
            </span>
            <span 
              onClick={handleReVibe} 
              className={`flex items-center gap-1.5 cursor-pointer transition-all active:scale-90 group ${isReVibed ? 'text-primary-container drop-shadow-[0_0_8px_rgba(var(--primary-container-rgb),0.5)]' : 'hover:text-primary-container'}`}
            >
              <div className={`p-1.5 rounded-full group-hover:bg-primary-container/10 transition-colors ${isReVibed ? 'bg-primary-container/10' : ''}`}>
                <RefreshCw className={`w-4 h-4 ${isReVibed ? 'animate-spin-slow' : ''}`}/>
              </div>
              {reVibesCount}
            </span>
            <span 
              onClick={handleLike} 
              className={`flex items-center gap-1.5 cursor-pointer transition-all active:scale-90 group ${isLiked ? 'text-error drop-shadow-[0_0_12px_rgba(var(--error-rgb),0.8)]' : 'hover:text-error'}`}
            >
              <div className={`p-1.5 rounded-full group-hover:bg-error/10 transition-colors ${isLiked ? 'bg-error/10' : ''}`}>
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}/>
              </div>
              {likesCount}
            </span>
            <span 
              onClick={() => !isMe && post.authorId && onStartDM(post.authorId)}
              className={`flex items-center gap-1.5 cursor-pointer transition-all active:scale-90 group ${!isMe ? 'hover:text-primary-container' : 'opacity-30 cursor-not-allowed'}`}
              title={isMe ? "You cannot transmit to yourself" : "Direct Transmission"}
            >
              <div className="p-1.5 rounded-full group-hover:bg-primary-container/10 transition-colors">
                <Send className="w-4 h-4"/>
              </div>
            </span>
            <span className="flex items-center gap-1.5 group cursor-default transition-colors hover:text-primary-container">
              <div className="p-1.5 rounded-full group-hover:bg-primary-container/10 transition-colors">
                <BarChart2 className="w-4 h-4"/>
              </div>
              {((likesCount || 0) * 42 + (post.stats?.comments || 0) * 76 + 56).toLocaleString()}
            </span>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-2 border-t border-outline-variant/10"
              >
                <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
                  <input 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-container transition-all"
                  />
                  <button type="submit" className="p-1.5 bg-primary-container text-on-primary-container rounded-lg hover:brightness-110 transition-all">
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {comments.map(comment => {
                    const isCommentLiked = comment.likedBy?.includes(currentUser?.id || '');
                    return (
                      <div key={comment.id} className="flex gap-2 group">
                        <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-outline" />
                        </div>
                        <div className="flex-1 bg-surface-container-low p-2 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-primary-container">{comment.authorName}</span>
                            <span className="text-[8px] text-outline">{comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString() : 'Just now'}</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant">{comment.content}</p>
                        </div>
                        <button 
                          onClick={() => handleLikeComment(comment.id, comment.likedBy)}
                          className={`flex items-center gap-1 text-[10px] transition-colors p-1 rounded hover:bg-surface-container-highest ${isCommentLiked ? 'text-[#FF3B30]' : 'text-outline hover:text-[#FF3B30]'}`}
                        >
                          <Heart className={`w-3 h-3 ${isCommentLiked ? 'fill-current' : ''}`} />
                          {comment.likedBy?.length || 0}
                        </button>
                      </div>
                    );
                  })}
                  {comments.length === 0 && (
                    <div className="text-center py-4 text-[10px] text-outline uppercase tracking-widest opacity-50">
                      No comments yet
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');

  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editProfileImage, setEditProfileImage] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editCompetencies, setEditCompetencies] = useState<string>('');

  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'dashboard' | 'bounties' | 'gigs' | 'search' | 'network' | 'activity' | 'messaging'>('home');
  const [profileSubject, setProfileSubject] = useState<any>(null); // State for viewing someone else's profile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle viewing a specific user profile
  const handleViewProfile = (targetUser: any) => {
    setProfileSubject(targetUser);
    setCurrentView('profile');
    setIsNavVisible(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Scroll direction state for dynamic UI behaviour
  const [isNavVisible, setIsNavVisible] = useState(true);
  const elementScrollMap = useRef(new Map<HTMLElement, number>());
  const lastActiveTarget = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleGlobalScroll = (e: any) => {
      let target = e.target;
      // Handle the case where document or window is the scroll target
      if (target === document) target = document.documentElement;
      if (!(target instanceof HTMLElement)) return;
      
      const currentScrollY = target.scrollTop;
      
      // If we switch to a different scrollable container, update our reference
      if (lastActiveTarget.current !== target) {
        elementScrollMap.current.set(target, currentScrollY);
        lastActiveTarget.current = target;
        return;
      }

      const lastScroll = elementScrollMap.current.get(target) || 0;
      const diff = currentScrollY - lastScroll;

      // Threshold to ignore micro-scrolls and jitter
      if (Math.abs(diff) < 10) return;

      if (diff > 0 && currentScrollY > 80) {
        // Scrolling Down: Hide Navs
        if (isNavVisible) setIsNavVisible(false);
      } else if (diff < -20 || currentScrollY < 40) {
        // Scrolling Up or near the top: Show Navs
        if (!isNavVisible) setIsNavVisible(true);
      }
      
      elementScrollMap.current.set(target, currentScrollY);
    };

    // Use capturing phase to ensure we catch scroll events from any nested container
    window.addEventListener('scroll', handleGlobalScroll, true);
    return () => window.removeEventListener('scroll', handleGlobalScroll, true);
  }, [isNavVisible]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    // No longer strictly necessary but kept for manual triggers if needed
  };

  // Bounties State
  const [isBountyModalOpen, setIsBountyModalOpen] = useState(false);
  const [bounties, setBounties] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  const handleBountyCreated = async (bounty: any) => {
    try {
      await addDoc(collection(db, 'bounties'), {
        ...bounty,
        createdAt: Date.now()
      });
      toast.success('Bounty posted successfully');
    } catch (error: any) {
      handleFirestoreError(error, 'create', 'bounties');
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
            }).catch(err => {
              console.error("Critical: Could not fetch fallback user from server.", err);
              toast.error("Connectivity issue: Could not fetch user data from server.");
            });
          }
        }, (error) => {
          console.error("Error fetching user:", error);
          if (error.code === 'unavailable') {
            toast.error("Establishing neural link... (Offline mode active)", { id: 'offline-toast' });
          }
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
  }, [showWelcome]);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setBounties([]);
      setAllUsers([]);
      return;
    }

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

    const qUsers = query(collection(db, 'users'), limit(100));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData)));
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    return () => {
      unsubscribePosts();
      unsubscribeBounties();
      unsubscribeUsers();
    };
  }, [user]);

  const openEditProfile = () => {
    if (user) {
      setEditUsername(user.username);
      setEditHandle(user.handle || '');
      setEditBio(user.professional_bio);
      setEditIsVerified(user.is_verified);
      setEditProfileImage(user.profileImage || '');
      setEditBannerImage(user.bannerImage || '');
      setEditLocation(user.location || '');
      setEditWebsite(user.website || '');
      setEditCompetencies(user.competencies?.join(', ') || 'Systems Architecture, Editorial UI, Neural Branding');
      setIsEditProfileOpen(true);
    }
  };

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Incompatible volume: Signal too heavy. Limit transmissions to 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setter(event.target?.result as string);
        toast.success("Identity asset buffered securely.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);

    const cleanHandle = editHandle.toLowerCase().trim().replace(/\s+/g, '_');

    try {
      // Check for handle uniqueness if handle has changed
      if (cleanHandle && cleanHandle !== user.handle) {
        const handleQuery = query(collection(db, 'users'), where('handle', '==', cleanHandle));
        const handleSnap = await getDocs(handleQuery);
        if (!handleSnap.empty) {
          toast.error('Identity collision: Signal handle already allocated in neural registry.');
          setIsUpdatingProfile(false);
          return;
        }
      }

      const userRef = doc(db, 'users', user.id);
      const updatedData = {
        username: editUsername,
        handle: cleanHandle,
        professional_bio: editBio,
        is_verified: editIsVerified,
        profileImage: editProfileImage,
        bannerImage: editBannerImage,
        location: editLocation,
        website: editWebsite,
        competencies: editCompetencies.split(',').map(s => s.trim()).filter(Boolean),
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updatedData);
      
      setUser({ 
        ...user, 
        ...updatedData,
        competencies: updatedData.competencies
      });

      setIsEditProfileOpen(false);
      toast.success('Identity recalibrated successfully');
    } catch (error: any) {
      handleFirestoreError(error, 'update', `users/${user.id}`);
      console.error(error);
      toast.error('Neural registry update failed');
    } finally {
      setIsUpdatingProfile(false);
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
    } catch (error: any) {
      handleFirestoreError(error, 'update', `users/${user.id}`);
      console.error(error);
      toast.error('Failed to update follow status');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast.success('Post deleted');
    } catch (error: any) {
      handleFirestoreError(error, 'delete', `posts/${postId}`);
      console.error(error);
      toast.error('Failed to delete post');
    }
  };

  const [isDMOpen, setIsDMOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setTotalUnreadCount(0);
      return;
    }

    const count = conversations.reduce((acc, conv) => {
      return acc + (conv.unreadCounts?.[user.id] || 0);
    }, 0);
    
    setTotalUnreadCount(count);

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [conversations, user]);

  // Listen for new messages to trigger local notifications
  useEffect(() => {
    if (!user) return;

    const unsubscribeList = conversations.map(conv => {
      const q = query(
        collection(db, 'conversations', conv.id, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return;
        const msg = snapshot.docs[0].data();
        
        // Only notify if:
        // 1. Message is NOT from current user
        // 2. Message is relatively new (within last 10 seconds to avoid burst on load)
        // 3. Status is NOT 'read'
        const isNew = msg.createdAt && (Date.now() - (msg.createdAt.seconds * 1000) < 10000);
        if (msg.senderId !== user.id && msg.status !== 'read' && isNew) {
          if (Notification.permission === 'granted') {
            const otherParticipantId = conv.participants.find((p: string) => p !== user.id);
            getDoc(doc(db, 'users', otherParticipantId)).then(userSnap => {
              const senderName = userSnap.exists() ? userSnap.data().username : 'New Message';
              new Notification(senderName, {
                body: msg.text,
                icon: userSnap.exists() ? userSnap.data().profileImage : '/favicon.ico'
              });
            });
          }
        }
      });
    });

    return () => unsubscribeList.forEach(unsub => unsub());
  }, [conversations.map(c => c.id).join(','), user?.id]);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error in conversations snapshot:", error);
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
      setCurrentView('messaging');
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
          lastMessageAt: 0,
          unreadCounts: {
            [user.id]: 0,
            [otherUserId]: 0
          }
        });
      }
      setActiveConversationId(convId);
      setCurrentView('messaging');
    } catch (error: any) {
      handleFirestoreError(error, 'create', 'conversations');
      console.error(error);
      toast.error('Failed to start conversation');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('test_user_id');
    setUser(null);
    setPosts([]);
    setBounties([]);
    setAllUsers([]);
    setCurrentView('home');
    setSearchQuery('');
    setIsModalOpen(false);
    setIsLoungeOpen(false);
    setIsEditProfileOpen(false);
    setIsBountyModalOpen(false);
    setIsDMOpen(false);
    setActiveConversationId(null);
    setConversations([]);
    setShowWelcome(true);
    // Force reload to clear any stale state
    window.location.reload();
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'stats.likes': increment(isLiked ? 1 : -1),
        likedBy: isLiked ? arrayUnion(user.id) : arrayRemove(user.id)
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReVibePost = async (originalPost: Post) => {
    if (!user) return;
    try {
      const postData = {
        type: 'RE_VIBE',
        authorId: user.id,
        authorName: user.username,
        author: `@${user.username.toLowerCase().replace(/\s+/g, '_')}`,
        content: originalPost.content,
        originalPostId: originalPost.type === 'RE_VIBE' ? originalPost.originalPostId : originalPost.id,
        originalAuthorName: originalPost.type === 'RE_VIBE' ? originalPost.originalAuthorName : originalPost.authorName,
        tag: originalPost.tag,
        stats: { comments: 0, reVibes: 0, likes: 0 },
        likedBy: [],
        reVibedBy: [],
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'posts'), postData);
      
      // Update original post reVibes count
      const actualOriginalPostId = originalPost.type === 'RE_VIBE' && originalPost.originalPostId ? originalPost.originalPostId : originalPost.id;
      const originalRef = doc(db, 'posts', actualOriginalPostId);
      await updateDoc(originalRef, {
        'stats.reVibes': increment(1),
        reVibedBy: arrayUnion(user.id)
      });
      
      toast.success('Re-vibed successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to re-vibe');
    }
  };

  const handleCommentPost = async (postId: string, content: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorId: user.id,
        authorName: user.username,
        content,
        createdAt: serverTimestamp()
      });
      
      // Update post comments count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'stats.comments': increment(1)
      });
      
      toast.success('Comment added');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add comment');
    }
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
    if (feedType === 'following' && post.authorId !== 'system' && post.authorId !== user?.id && !user?.following?.includes(post.authorId || '')) return false;
    return true;
  });

  const vibePosts = visiblePosts.filter(p => p.type === 'VIBE');
  const gigPosts = visiblePosts.filter(p => p.type === 'GIG');

  return (
    <AnimatePresence mode="wait">
      <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="top-right" />
      {showWelcome ? (
        <motion.div key="welcome" exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} transition={{ duration: 0.8, ease: "easeInOut" }}>
          <WelcomeScreen onInitialize={() => setShowWelcome(false)} />
        </motion.div>
      ) : (
        <motion.div 
          key="app" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 1, delay: 0.2 }} 
          className={`min-h-screen max-w-[100vw] overflow-x-hidden bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary-fixed flex flex-col ${currentView === 'messaging' ? 'h-screen h-[100dvh] overflow-hidden' : ''}`}
        >
          <CallManager currentUser={user} allUsers={allUsers} />

      {/* TopNavBar - Smart Hide on Scroll */}
      {currentView !== 'messaging' && (
      <motion.nav 
        initial={false}
        animate={{ 
          y: isNavVisible ? 0 : -100,
          opacity: isNavVisible ? 1 : 0,
          scale: isNavVisible ? 1 : 0.98 
        }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50 bg-surface border-b border-outline-variant/10 shadow-sm"
      >
        <div className="flex items-center gap-8">
          <span className="text-xl font-black text-on-surface tracking-tighter font-headline">OpenSphere</span>
          <div className="hidden md:flex gap-6 items-center">
            <button onClick={() => setCurrentView('home')} className={`font-headline font-bold tracking-tight py-1 transition-all active:scale-95 duration-100 ${currentView === 'home' ? 'text-primary-container border-b-2 border-primary-container' : 'text-on-surface hover:text-primary-container'}`}>Vibe</button>
            <button onClick={() => setCurrentView('gigs')} className={`font-headline font-bold tracking-tight py-1 transition-all active:scale-95 duration-100 ${currentView === 'gigs' ? 'text-primary-container border-b-2 border-primary-container' : 'text-on-surface hover:text-primary-container'}`}>Gigs</button>
            <button onClick={() => setCurrentView('bounties')} className={`font-headline font-bold tracking-tight py-1 transition-all active:scale-95 duration-100 ${currentView === 'bounties' ? 'text-primary-container border-b-2 border-primary-container' : 'text-on-surface hover:text-primary-container'}`}>Bounties</button>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-4 text-on-surface">
            <button 
              onClick={() => setIsDMOpen(!isDMOpen)} 
              className={`p-1.5 hover:text-primary-container transition-colors rounded-full hover:bg-surface-container-high focus:outline-none relative ${isDMOpen ? 'text-primary-container' : ''}`}
              title="Recent Conversations"
            >
              <Mail className="w-5 h-5" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-on-primary text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg px-1 border-2 border-surface">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1 hover:text-primary-container transition-colors rounded-full hover:bg-surface-container-high focus:outline-none">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div 
              onClick={() => {
                setProfileSubject(null);
                setCurrentView('profile');
              }}
              className={`w-8 h-8 rounded-lg overflow-hidden border cursor-pointer transition-all ${currentView === 'profile' && !profileSubject ? 'border-primary-container ring-2 ring-primary-container/20' : 'border-outline-variant/30 hover:border-primary-container'}`}
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container flex items-center justify-center">
                  <User className="w-4 h-4 text-on-surface-variant" />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
      )}

      {/* Bottom Navigation Bar (Mobile) - Smart Hide */}
      {currentView !== 'messaging' && (
      <motion.div 
        initial={false}
        animate={{ 
          y: isNavVisible ? 0 : 150,
          opacity: isNavVisible ? 1 : 0 
        }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant/10 z-[60] px-8 py-3 flex justify-between items-center h-[72px] pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <button onClick={() => setCurrentView('home')} className={`p-2 transition-all flex flex-col items-center gap-1 bg-transparent border-none outline-none ${currentView === 'home' ? 'text-on-surface' : 'text-outline hover:text-on-surface'}`}>
          <div className="relative flex flex-col items-center">
            <Home className="w-6 h-6" fill={currentView === 'home' ? 'currentColor' : 'none'} strokeWidth={currentView === 'home' ? 2 : 2} />
            {currentView === 'home' && <span className="absolute -bottom-[8px] w-1 h-1 rounded-full bg-on-surface"></span>}
          </div>
        </button>
        
        <button onClick={() => setCurrentView('search')} className={`p-2 transition-all flex flex-col items-center gap-1 bg-transparent border-none outline-none ${currentView === 'search' ? 'text-on-surface' : 'text-outline hover:text-on-surface'}`}>
          <div className="relative flex flex-col items-center">
            <Search className="w-6 h-6" fill={currentView === 'search' ? 'currentColor' : 'none'} />
            {currentView === 'search' && <span className="absolute -bottom-[8px] w-1 h-1 rounded-full bg-on-surface"></span>}
          </div>
        </button>

        <button onClick={() => setCurrentView('network')} className={`p-2 transition-all flex flex-col items-center gap-1 bg-transparent border-none outline-none ${currentView === 'network' ? 'text-on-surface' : 'text-outline hover:text-on-surface'}`}>
          <div className="relative flex flex-col items-center">
            <Users className="w-6 h-6" fill={currentView === 'network' ? 'currentColor' : 'none'} />
            {currentView === 'network' && <span className="absolute -bottom-[8px] w-1 h-1 rounded-full bg-on-surface"></span>}
          </div>
        </button>
        
        <button onClick={() => setCurrentView('activity')} className={`p-2 transition-all flex flex-col items-center gap-1 bg-transparent border-none outline-none ${currentView === 'activity' ? 'text-on-surface' : 'text-outline hover:text-on-surface'}`}>
          <div className="relative flex flex-col items-center">
            <Bell className="w-6 h-6" fill={currentView === 'activity' ? 'currentColor' : 'none'} />
            {currentView === 'activity' && <span className="absolute -bottom-[8px] w-1 h-1 rounded-full bg-on-surface"></span>}
          </div>
        </button>
        
        <button onClick={() => setCurrentView('messaging')} className={`p-2 transition-all flex flex-col items-center gap-1 bg-transparent border-none outline-none relative ${currentView === 'messaging' ? 'text-on-surface' : 'text-outline hover:text-on-surface'}`}>
          <div className="relative flex flex-col items-center">
            <Mail className="w-6 h-6" fill={currentView === 'messaging' ? 'currentColor' : 'none'} />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-primary text-on-primary text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg px-1 border-2 border-surface">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
            {currentView === 'messaging' && <span className="absolute -bottom-[8px] w-1 h-1 rounded-full bg-on-surface"></span>}
          </div>
        </button>
      </motion.div>
      )}

      {/* Floating Theme Toggle (Removed per user request) */}
      {/* Mobile Floating Action Button */}
      {currentView !== 'messaging' && currentView !== 'gigs' && currentView !== 'bounties' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isNavVisible ? 1 : 0, 
            opacity: isNavVisible ? 1 : 0,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center z-[70] transition-all border border-primary-container/30 hover:border-primary-container/60 clean-glow"
          title="New Transmission"
        >
          <Plus className="w-7 h-7 text-primary-container animate-pulse-slow" />
        </motion.button>
      )}

        {/* SideNavBar - Collapses on Scroll Down */}
        {currentView !== 'gigs' && currentView !== 'messaging' && (
        <motion.aside 
          initial={false}
          animate={{ 
            x: isNavVisible ? 0 : (isSidebarCollapsed ? -80 : -256),
            opacity: isNavVisible ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className={`hidden lg:flex flex-col h-[calc(100vh-60px)] fixed left-0 top-[60px] pt-8 bg-surface-container-low border-r border-outline-variant/15 z-40 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
        >
          <div className="p-6 flex-1 flex flex-col">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3 mb-8">
                {user?.profileImage ? (
                  <img alt="User Avatar" className="w-10 h-10 rounded-full border border-primary-container/20 object-cover" src={user.profileImage} />
                ) : (
                  <img alt="User Avatar" className="w-10 h-10 rounded-full border border-primary-container/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCOWJ5vZEovondagcWGriDKF5gytHqkiFpqOXiKOfy1Tni5G8a7lVjfW-EWggSDJuumPqN2dAQga2N-YT6gA4CrP-qX_I52u-0woFdq9dDLfhsk1HshhH6v0GZAyBnysdTlHjZwoCxuBIzAP2EqND_q8lGS7tXREUaBg-QcLs8m3nkAOa-a254ival6t9EfDvrwrH5oeD_mfOsYwf5vg_zmYgQ2Z5ivEwNu1nTbfFpMj50Yt_es5P2aVYFq5LhuowjdJUxBNGHEaUB" />
                )}
                <div>
                  <p className="font-label uppercase tracking-widest text-[10px] text-primary-container font-bold">Executive Terminal</p>
                  <p className="font-label text-[10px] text-secondary">Kinetic Status: Active</p>
                </div>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center mb-8">
                {user?.profileImage ? (
                  <img alt="User Avatar" className="w-10 h-10 rounded-full border border-primary-container/20 object-cover" src={user.profileImage} />
                ) : (
                  <img alt="User Avatar" className="w-10 h-10 rounded-full border border-primary-container/20 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCOWJ5vZEovondagcWGriDKF5gytHqkiFpqOXiKOfy1Tni5G8a7lVjfW-EWggSDJuumPqN2dAQga2N-YT6gA4CrP-qX_I52u-0woFdq9dDLfhsk1HshhH6v0GZAyBnysdTlHjZwoCxuBIzAP2EqND_q8lGS7tXREUaBg-QcLs8m3nkAOa-a254ival6t9EfDvrwrH5oeD_mfOsYwf5vg_zmYgQ2Z5ivEwNu1nTbfFpMj50Yt_es5P2aVYFq5LhuowjdJUxBNGHEaUB" />
                )}
              </div>
            )}
            <nav className="space-y-1">
              <button onClick={() => setCurrentView('home')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'home' ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'text-secondary hover:bg-surface-container-high border border-transparent'}`}>
                <Grid className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Home</span>}
              </button>
              <button onClick={() => setCurrentView('search')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'search' ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'text-secondary hover:bg-surface-container-high border border-transparent'}`}>
                <Search className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Discover</span>}
              </button>
              <button onClick={() => setCurrentView('network')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'network' ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'text-secondary hover:bg-surface-container-high border border-transparent'}`}>
                <Users className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Network</span>}
              </button>
              <button 
                onClick={() => {
                  setProfileSubject(null);
                  setCurrentView('profile');
                }} 
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'profile' && !profileSubject ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'text-secondary hover:bg-surface-container-high border border-transparent'}`}
              >
                <User className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Profile</span>}
              </button>
              <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'dashboard' ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'text-secondary hover:bg-surface-container-high border border-transparent'}`}>
                <BarChart2 className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Dashboard</span>}
              </button>
              <button onClick={() => setCurrentView('bounties')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all ${currentView === 'bounties' ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'text-secondary hover:bg-surface-container-high border border-transparent'}`}>
                <DollarSign className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Bounty Board</span>}
              </button>
              <button onClick={() => setIsLoungeOpen(true)} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all text-lounge-gold hover:bg-lounge-gold/10 border border-transparent hover:border-lounge-gold/30`}>
                <Shield className="w-4 h-4" />
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">The Lounge</span>}
              </button>
              <button onClick={() => setCurrentView('messaging')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all relative ${currentView === 'messaging' ? 'bg-primary-container/10 text-primary-container border border-primary-container/30' : 'text-secondary hover:bg-surface-container-high border border-transparent'}`}>
                <MessageSquare className="w-4 h-4" />
                {totalUnreadCount > 0 && (
                  <span className={`absolute ${isSidebarCollapsed ? 'top-1 right-1' : 'right-4'} min-w-[16px] h-[16px] bg-primary text-on-primary text-[8px] font-black flex items-center justify-center rounded-md px-1`}>
                    {totalUnreadCount}
                  </span>
                )}
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Messaging</span>}
              </button>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded transition-all text-secondary hover:bg-surface-container-high border border-transparent`}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
              </button>
            </nav>
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`w-full mt-8 bg-black text-primary-container py-3 rounded font-label uppercase tracking-widest text-[10px] font-bold transition-all flex items-center justify-center border border-primary-container/30 hover:border-primary-container/60 clean-glow ${isSidebarCollapsed ? 'px-0' : 'px-4'}`}
            >
              {isSidebarCollapsed ? <Edit2 className="w-4 h-4 animate-pulse-slow" /> : <span className="animate-pulse-slow">Create Post</span>}
            </button>
          </div>
          <div className="mt-auto p-6 space-y-1">
            <button onClick={() => toast('Settings panel coming soon')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-secondary hover:text-primary-container transition-all`}>
              <Settings className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Settings</span>}
            </button>
            <button onClick={() => toast('Support center coming soon')} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-secondary hover:text-primary-container transition-all`}>
              <HelpCircle className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Support</span>}
            </button>
            <button onClick={handleLogout} className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 text-error hover:opacity-80 transition-all`}>
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Log Out</span>}
            </button>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2 mt-4 text-secondary hover:text-primary-container transition-all border-t border-outline-variant/10 pt-4`}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!isSidebarCollapsed && <span className="font-label uppercase tracking-widest text-[10px]">Collapse</span>}
            </button>
          </div>
        </motion.aside>
        )}

        {/* Main Content Area */}
        <main 
          onScroll={handleScroll}
          className={`flex-1 w-full bg-surface transition-all duration-300 ease-in-out ${(currentView === 'gigs' || currentView === 'messaging') ? 'lg:ml-0' : (isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')} ${currentView === 'messaging' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-[calc(100vh-60px)]'}`}
        >
          <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_320px] min-h-[calc(100vh-60px)]">
              
              {/* Left Column: The Vibe (Raw Feed) */}
            <section onScroll={handleScroll} className="hidden xl:block border-r border-outline-variant/10 bg-surface-container-low p-4 lg:p-6 overflow-y-auto custom-scrollbar">
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="font-headline text-2xl font-black text-primary tracking-tighter">VIBES</h2>
                  <div className="flex gap-4 mt-1">
                    <button 
                      onClick={() => setFeedType('all')}
                      className={`font-label text-[10px] uppercase tracking-widest transition-colors ${feedType === 'all' ? 'text-primary-container' : 'text-secondary hover:text-primary-container'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFeedType('following')}
                      className={`font-label text-[10px] uppercase tracking-widest transition-colors ${feedType === 'following' ? 'text-primary-container' : 'text-secondary hover:text-primary-container'}`}
                    >
                      Following
                    </button>
                  </div>
                </div>
              </header>

              {/* Inline Post Trigger */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-surface border border-outline-variant/15 rounded-2xl p-4 mb-6 flex items-center gap-4 hover:border-primary-container/50 transition-all group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/20">
                  <img src={user?.profileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm text-outline/50 font-medium">Transmit a raw vibe...</span>
                </div>
                <Edit2 className="w-4 h-4 text-outline/40 group-hover:text-primary-container transition-colors" />
              </button>

              <div className="space-y-4">
                <AnimatePresence>
                {vibePosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={user} 
                    authorProfileImage={allUsers.find(u => u.id === post.authorId)?.profileImage}
                    onFollowToggle={handleFollowToggle} 
                    onDelete={handleDeletePost}
                    onStartDM={handleStartDM}
                    onReVibe={handleReVibePost}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    onViewProfile={handleViewProfile}
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
            <section onScroll={handleScroll} className="hidden xl:block bg-surface p-4 lg:p-6 overflow-y-auto pb-32 custom-scrollbar border-r border-outline-variant/10">
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
                    authorProfileImage={allUsers.find(u => u.id === post.authorId)?.profileImage}
                    onFollowToggle={handleFollowToggle} 
                    onDelete={handleDeletePost}
                    onStartDM={handleStartDM}
                    onReVibe={handleReVibePost}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    onViewProfile={handleViewProfile}
                  />
                ))}
                </AnimatePresence>
              </div>
            </section>

            {/* Messaging Sidebar on Home Feed */}
            <aside className="hidden xl:block bg-surface-container-low/30 overflow-hidden">
               <ArchiveSidebar 
                  conversations={conversations} 
                  currentUserId={user?.id || ''} 
                  onConversationClick={(id) => {
                    setActiveConversationId(id);
                    setIsDMOpen(true);
                  }}
                  activeConversationId={activeConversationId}
               />
            </aside>

            {/* Mobile Unified Feed */}
            <section className="xl:hidden bg-surface p-4 pb-[100px] overflow-y-auto w-full">
              <header className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="font-headline text-2xl font-black text-primary tracking-tighter">FEED</h2>
                </div>
              </header>

              <div className="space-y-4">
                <AnimatePresence>
                {visiblePosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={user} 
                    authorProfileImage={allUsers.find(u => u.id === post.authorId)?.profileImage}
                    onFollowToggle={handleFollowToggle} 
                    onDelete={handleDeletePost}
                    onStartDM={handleStartDM}
                    onReVibe={handleReVibePost}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    onViewProfile={handleViewProfile}
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
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ProfileView 
                user={profileSubject || user} 
                posts={posts} 
                isOwnProfile={!profileSubject || profileSubject.id === user?.id}
                onEdit={openEditProfile} 
                onLogout={handleLogout}
                onBack={() => {
                  if (profileSubject) {
                    setProfileSubject(null); // Clear subject when going back from someone's profile
                  } else {
                    setCurrentView('home');
                  }
                }}
                onDeletePost={handleDeletePost}
                onLikePost={handleLikePost}
                onReVibePost={handleReVibePost}
                onCommentPost={handleCommentPost}
                onStartDM={handleStartDM}
                onStartCall={(id) => CallSignals.triggerCall(id, 'audio')}
                onStartVideoCall={(id) => CallSignals.triggerCall(id, 'video')}
              />
            </motion.div>
          )}

          {currentView === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SearchView 
                currentUser={user} 
                onFollowUser={handleFollowToggle} 
                onNavigateToProfile={handleViewProfile}
                onCreatePost={() => setIsModalOpen(true)}
              />
            </motion.div>
          )}

          {currentView === 'network' && (
            <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <NetworkView 
                currentUser={user} 
                onNavigateToProfile={handleViewProfile}
                onStartDM={handleStartDM}
                onCreatePost={() => setIsModalOpen(true)}
              />
            </motion.div>
          )}

          {currentView === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ActivityView 
                onBack={() => setCurrentView('home')}
                onNavigateToProfile={handleViewProfile}
                onNavigateToPost={(id) => { toast('Navigating to post ' + id); setCurrentView('home'); }}
                onNavigateToDMs={() => setCurrentView('messaging')}
                onCreatePost={() => setIsModalOpen(true)}
              />
            </motion.div>
          )}

          {currentView === 'messaging' && (
            <motion.div 
              key="messaging" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              transition={{ duration: 0.2 }}
              className="h-full w-full overflow-hidden"
            >
              <MessagingView 
                currentUser={user} 
                onNavigateToProfile={handleViewProfile}
                initialChatId={activeConversationId}
                onBack={() => setCurrentView('home')}
              />
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
                  
                  <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/20 flex items-center gap-6 hover:border-primary-container/30 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
                      <Heart className="w-8 h-8 text-primary-container" />
                    </div>
                    <div>
                      <p className="font-label text-xs text-secondary uppercase tracking-widest mb-1">Total Engagement</p>
                      <p className="text-5xl font-black font-headline text-primary-container">{totalEngagement}</p>
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
                          <span className="flex items-center gap-1.5 text-xs text-primary-container font-mono"><Heart className="w-3 h-3"/> {post.stats?.likes || 0}</span>
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
            <button onClick={() => setIsBountyModalOpen(true)} className="bg-black text-primary-container px-6 h-[44px] rounded font-label uppercase tracking-widest text-xs font-bold transition-all border border-primary-container/30 hover:border-primary-container/60 clean-glow shrink-0">
              <span className="animate-pulse-slow">Post Bounty</span>
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
                      <p className="font-headline font-black text-xl text-primary-container">{bounty.price}</p>
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
           <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-3xl bg-surface border border-outline-variant/30 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Decorative Geometric Background */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-container/5 blur-[100px] -mr-40 -mt-40 rounded-full pointer-events-none"></div>
              
              <div className="p-8 lg:p-12 border-b border-outline-variant/10 flex justify-between items-center relative z-10">
                <div>
                  <h2 className="text-4xl font-black font-headline text-primary tracking-tighter leading-none">Identity Recalibration</h2>
                  <p className="font-label text-[10px] text-secondary tracking-[0.3em] uppercase mt-3">Updating Neural Footprint / Registry 04-X</p>
                </div>
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="w-12 h-12 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest rounded-2xl transition-all group active:scale-95"
                >
                  <X className="w-5 h-5 text-outline group-hover:text-on-surface" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar relative z-10">
                {/* Visual Identity Section */}
                <div className="space-y-10">
                  <div className="relative group rounded-[32px] overflow-hidden aspect-[3/1] bg-surface-container-low border border-outline-variant/30">
                    <img 
                      src={editBannerImage || "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2000&auto=format&fit=crop"} 
                      className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                      alt="Banner Preview"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white underline underline-offset-4">Recalibrate Header</span>
                      </div>
                    </div>
                    <input 
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                      onChange={(e) => handleImageUpload(e, setEditBannerImage)}
                      title="Update Header Transmission"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-10 items-start -mt-20 px-4 relative z-20">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-[4px] border-surface bg-surface-container-low shadow-2xl relative z-10 transition-transform group-hover:scale-[1.05]">
                        <img 
                          src={editProfileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1000"} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        <input 
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer z-30"
                          onChange={(e) => handleImageUpload(e, setEditProfileImage)}
                          title="Update Node Avatar"
                        />
                      </div>
                      <div className="absolute -inset-2 bg-primary-container/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                      <div className="absolute -bottom-2 -right-2 bg-primary-container text-on-primary-fixed w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-surface z-20">
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-6 pt-10 md:pt-20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Header Source (Remote URL)
                          </label>
                          <input 
                            value={editBannerImage.startsWith('data:') ? 'LOCKED / LOCAL_CACHE' : editBannerImage}
                            onChange={(e) => setEditBannerImage(e.target.value)}
                            disabled={editBannerImage.startsWith('data:')}
                            className="w-full h-14 bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 text-sm font-medium focus:outline-none focus:border-primary-container transition-all disabled:opacity-50"
                            placeholder="Remote Image Path..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                            <Plus className="w-3 h-3" /> Avatar Source (Remote URL)
                          </label>
                          <input 
                            value={editProfileImage.startsWith('data:') ? 'LOCKED / LOCAL_CACHE' : editProfileImage}
                            onChange={(e) => setEditProfileImage(e.target.value)}
                            disabled={editProfileImage.startsWith('data:')}
                            className="w-full h-14 bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 text-sm font-medium focus:outline-none focus:border-primary-container transition-all disabled:opacity-50"
                            placeholder="Remote Image Path..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                        <User className="w-3 h-3" /> Identity Alias (Display Name)
                      </label>
                      <input 
                        required
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full h-14 bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 text-sm font-black focus:outline-none focus:border-primary-container transition-all tracking-tight"
                        placeholder="Neural_Architect_01"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Unique Signal Handle (@handle)
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-outline font-mono text-sm">@</span>
                        <input 
                          required
                          value={editHandle}
                          onChange={(e) => setEditHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="w-full h-14 bg-surface-container-low border border-outline-variant/30 rounded-2xl pl-10 pr-5 text-sm font-mono font-bold focus:outline-none focus:border-primary-container transition-all tracking-tight text-primary-container"
                          placeholder="architect_node"
                        />
                      </div>
                      <p className="text-[10px] text-outline/50 ml-1 italic font-medium uppercase tracking-widest leading-relaxed">System requirement: Handle must be unique to maintain node frequency integrity.</p>
                    </div>
                  </div>
                </div>

                {/* Mission / Bio */}
                <div className="space-y-3">
                  <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Core Mission / Bio
                  </label>
                  <textarea 
                    required
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full h-32 bg-surface-container-low border border-outline-variant/30 rounded-[32px] p-6 text-base font-medium focus:outline-none focus:border-primary-container transition-all resize-none italic"
                    placeholder="Architecting digital ecosystems for high-velocity delivery..."
                  />
                </div>

                {/* Grid Coordinates & Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Grid Coordinates (Location)
                    </label>
                    <input 
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full h-14 bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 text-sm font-medium focus:outline-none focus:border-primary-container transition-all"
                      placeholder="SF / New York / Remote"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                      <Globe2 className="w-3 h-3" /> External Node (Website)
                    </label>
                    <input 
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      className="w-full h-14 bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 text-sm font-medium focus:outline-none focus:border-primary-container transition-all"
                      placeholder="portfolio.design"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-label text-[10px] font-black uppercase tracking-widest text-outline ml-1 flex items-center gap-2">
                    <Grid className="w-3 h-3" /> Professional Clusters (Comma separated)
                  </label>
                  <input 
                    value={editCompetencies}
                    onChange={(e) => setEditCompetencies(e.target.value)}
                    className="w-full h-14 bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 text-sm font-medium focus:outline-none focus:border-primary-container transition-all"
                    placeholder="Systems Architecture, Editorial UI, Neural Branding"
                  />
                </div>

                {/* Permissions / Status */}
                <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${editIsVerified ? 'bg-[#00ffab]/10 text-[#00ffab]' : 'bg-outline/10 text-outline'}`}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-on-surface tracking-tight">Verified Credential</div>
                      <div className="text-[10px] text-outline uppercase tracking-widest font-bold">Protocol Auth Stage 1</div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditIsVerified(!editIsVerified)}
                    className={`w-14 h-8 rounded-full transition-all relative ${editIsVerified ? 'bg-[#00ffab]' : 'bg-outline/30'}`}
                  >
                    <motion.div 
                      layout
                      className="absolute top-1 left-1 bottom-1 w-6 bg-white rounded-full shadow-lg"
                      animate={{ x: editIsVerified ? 24 : 0 }}
                    />
                  </button>
                </div>
              </form>

              <div className="p-8 lg:p-12 bg-surface-container-low border-t border-outline-variant/10 flex justify-end gap-5 items-center">
                <button 
                  type="button"
                  disabled={isUpdatingProfile}
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-8 py-3 text-sm font-bold text-outline hover:text-on-surface transition-colors disabled:opacity-50"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  onClick={handleUpdateProfile}
                  className="px-10 py-4 bg-on-surface text-surface rounded-[20px] text-sm font-black tracking-tight hover:opacity-90 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Re-calibrating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> 
                      Save Profile Identity
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

        <Toaster position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
