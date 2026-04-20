import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MessageSquare, RefreshCw, MapPin, 
  Link as LinkIcon, Share2, ArrowLeft, Calendar, 
  LogOut, Verified, User, Zap, Grid, Trash2, Send, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

interface ProfileViewProps {
  user: any;
  posts: any[];
  onEdit: () => void;
  onLogout: () => void;
  onBack: () => void;
  onDeletePost?: (postId: string) => void;
  onLikePost?: (postId: string, isLiked: boolean) => void;
  onReVibePost?: (post: any) => void;
  onCommentPost?: (postId: string, content: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, posts, onEdit, onLogout, onBack, 
  onDeletePost, onLikePost, onReVibePost, onCommentPost 
}) => {
  const [activeTab, setActiveTab] = useState<'Posts' | 'Media' | 'Likes'>('Posts');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState<{[key: string]: any[]}>({});
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (!expandedCommentsPostId) return;

    setIsLoadingComments(true);
    const q = query(
      collection(db, 'posts', expandedCommentsPostId, 'comments'), 
      orderBy('createdAt', 'desc'), 
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommentsMap(prev => ({ ...prev, [expandedCommentsPostId]: postComments }));
      setIsLoadingComments(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setIsLoadingComments(false);
    });

    return () => unsubscribe();
  }, [expandedCommentsPostId]);

  const handleSendComment = async (postId: string) => {
    if (!commentText.trim()) return;
    try {
      await onCommentPost?.(postId, commentText);
      setCommentText('');
    } catch (error) {
      console.error(error);
    }
  };

  const userPosts = useMemo(() => {
    return posts.filter(p => p.authorId === user?.id || p.author === user?.username);
  }, [posts, user]);

  const handleShare = async () => {
    const shareData = {
      title: `${user?.username || 'operative_pulse'} | ProRaw Profile`,
      text: user?.professional_bio || 'Check out this operative on ProRaw',
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard');
      }
    }
  };

  const handleLogoutClick = () => {
    toast('Finalize node disconnect?', {
      action: {
        label: 'Disconnect',
        onClick: onLogout
      }
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Joined April 2024';
    const date = new Date(timestamp);
    return `Joined ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };

  return (
    <div className="flex-1 bg-surface min-h-screen flex flex-col md:border-x border-outline-variant/10 max-w-2xl mx-auto overflow-y-auto no-scrollbar pb-20">
      {/* Sticky Header - X Style */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/5 px-4 h-14 flex items-center gap-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-on-surface/10 rounded-full transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <h1 className="text-lg font-black tracking-tight leading-tight">{user?.username || 'User Profile'}</h1>
            {user?.is_verified && <Verified className="w-4 h-4 text-primary-container" />}
          </div>
          <span className="text-[11px] text-outline font-medium tracking-wide uppercase">
            {userPosts.length} Transmissions
          </span>
        </div>
      </header>

      {/* Banner / Cover - X Style (3:1 Ratio) */}
      <div className="relative aspect-[3/1] bg-surface-container-low overflow-hidden group border-b border-outline-variant/10">
        <img 
          src={user?.bannerImage || "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=2000&auto=format&fit=crop"} 
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-40"></div>
      </div>

      {/* Profile Section */}
      <div className="px-4 relative mb-4">
        {/* Avatar Area */}
        <div className="flex justify-between items-start -mt-14 md:-mt-20">
          <div className="relative group p-1 bg-surface rounded-full">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-surface shadow-xl relative z-10 transition-transform hover:scale-[1.02] duration-300">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <User className="w-16 h-16 text-outline" />
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>

          <div className="flex gap-2 pt-16 md:pt-24 translate-y-2">
            <button 
              onClick={handleShare}
              className="p-2.5 border border-outline-variant/30 rounded-full hover:bg-surface-container transition-colors active:scale-95"
              title="Share Profile"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onEdit}
              className="px-6 py-2 border border-outline-variant/30 rounded-full font-black text-sm hover:bg-surface-container transition-colors active:scale-95"
            >
              Edit profile
            </button>
            <button 
              onClick={handleLogoutClick}
              className="p-2.5 bg-error/10 border border-error/20 rounded-full hover:bg-error/20 text-error transition-colors active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info Area */}
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-black text-on-surface">{user?.username || 'operative_pulse'}</h2>
              {user?.is_verified && <Verified className="w-4 h-4 text-primary-container" />}
            </div>
            <p className="text-sm text-outline font-medium">@{user?.email?.split('@')[0] || 'unknown_node'}</p>
          </div>

          <p className="text-[15px] leading-relaxed text-on-surface-variant font-medium max-w-lg">
            {user?.professional_bio || 'Architecture of high-fidelity systems. Navigating the intersection of editorial design and raw performance.'}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] text-outline font-medium pt-1">
            {user?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 opacity-70" /> {user.location}
              </div>
            )}
            {user?.website && (
              <a href={`https://${user.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-container hover:underline decoration-primary-container/30 underline-offset-4">
                <LinkIcon className="w-4 h-4 opacity-70" /> {user.website}
              </a>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 opacity-70" /> {formatDate(user?.createdAt)}
            </div>
          </div>

          <div className="flex gap-5 text-sm pt-1">
            <div 
              onClick={() => toast.info('Accessing network node connections...')}
              className="flex items-center gap-1 group cursor-pointer"
            >
              <span className="font-black text-on-surface group-hover:underline">{user?.following?.length || 0}</span>
              <span className="text-outline">Following</span>
            </div>
            <div 
              onClick={() => toast.info('Accessing network node subscribers...')}
              className="flex items-center gap-1 group cursor-pointer"
            >
              <span className="font-black text-on-surface group-hover:underline">{user?.followers?.length || 0}</span>
              <span className="text-outline">Followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vibe Intensity Indicator - Transformed for X layout but remaining true to ProRaw DNA */}
      <div className="mx-4 my-2 px-4 py-3 bg-primary-container/[0.03] border border-outline-variant/10 rounded-2xl flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_10px_rgba(0,255,171,0.5)]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-container">Transmission Level</span>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-[10px] font-mono text-outline/50 mr-2">{(user?.exposure_dial || 50)}%</span>
          <div className="w-32 h-1 bg-surface-container-high rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }} 
               animate={{ width: `${user?.exposure_dial || 50}%` }} 
               className="h-full bg-primary-container shadow-[0_0_8px_rgba(0,255,171,0.3)]"
             ></motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - X Style */}
      <nav className="flex border-b border-outline-variant/10 mt-2">
        {(['Posts', 'Media', 'Likes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-4 text-sm font-bold transition-colors hover:bg-on-surface/5 relative group"
          >
            <span className={`transition-colors ${activeTab === tab ? 'text-on-surface' : 'text-outline group-hover:text-on-surface'}`}>{tab}</span>
            {activeTab === tab && (
              <motion.div 
                layoutId="profileTabUnderline" 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary-container rounded-full" 
              />
            )}
          </button>
        ))}
      </nav>

      {/* Timeline Content Area */}
      <div className="divide-y divide-outline-variant/5">
        {activeTab === 'Posts' && (
          <div className="flex flex-col">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <motion.div 
                  key={post.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-on-surface/[0.01] cursor-pointer transition-colors flex gap-4 border-b border-outline-variant/5"
                >
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant/10">
                      <img src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} className="w-full h-full object-cover" alt="Author" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[15px] font-black tracking-tight truncate">{user?.username}</span>
                        {user?.is_verified && <Verified className="w-3.5 h-3.5 text-primary-container" />}
                        <span className="text-[14px] text-outline truncate font-medium">@{user?.email?.split('@')[0]}</span>
                        <span className="text-outline">·</span>
                        <span className="text-[14px] text-outline font-medium">{post.time || 'now'}</span>
                      </div>
                      {onDeletePost && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast('Purge this transmission?', {
                              description: 'This action will decommission the record from the network permanently.',
                              action: {
                                label: 'Decommission',
                                onClick: () => onDeletePost(post.id)
                              }
                            });
                          }}
                          className="p-2 hover:bg-error/10 text-outline hover:text-error rounded-full transition-colors active:scale-90"
                          title="Delete Transmission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {post.type === 'GIG' && (
                      <div className="bg-primary-container/[0.08] border border-primary-container/10 rounded-xl p-3 mb-2 group/gig">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-3.5 h-3.5 text-primary-container" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary-container">PRO COLLABORATION</span>
                        </div>
                        <h3 className="text-[14px] font-black text-on-surface group-hover/gig:text-primary-container transition-colors">{post.title}</h3>
                      </div>
                    )}

                    <p className="text-[15px] leading-normal text-on-surface-variant break-words">
                      {post.content || post.description}
                    </p>

                    {post.image && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-outline-variant/10 aspect-video bg-surface-container shadow-sm">
                        <img src={post.image} className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-500" alt="Post content" />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2.5 max-w-[400px] text-outline">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (expandedCommentsPostId === post.id) {
                            setExpandedCommentsPostId(null);
                          } else {
                            setExpandedCommentsPostId(post.id);
                            setCommentText('');
                          }
                        }}
                        className={`flex items-center gap-2 transition-colors group/action ${expandedCommentsPostId === post.id ? 'text-primary-container' : 'hover:text-primary-container'}`}
                      >
                        <div className={`p-2 rounded-full transition-colors ${expandedCommentsPostId === post.id ? 'bg-primary-container/10' : 'group-hover/action:bg-primary-container/10'}`}>
                          <MessageSquare className={`w-[18px] h-[18px] ${expandedCommentsPostId === post.id ? 'fill-primary-container' : ''}`} />
                        </div>
                        <span className="text-[12px] font-bold">{post.stats?.comments || 0}</span>
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onReVibePost?.(post);
                        }}
                        className="flex items-center gap-2 hover:text-primary-container transition-colors group/action"
                      >
                        <div className="p-2 rounded-full group-hover/action:bg-primary-container/10 transition-colors">
                          <RefreshCw className={`w-[18px] h-[18px] ${post.reVibedBy?.includes(user?.id) ? 'text-primary-container' : ''}`} />
                        </div>
                        <span className={`text-[12px] font-bold ${post.reVibedBy?.includes(user?.id) ? 'text-primary-container' : ''}`}>
                          {post.stats?.reVibes || 0}
                        </span>
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentlyLiked = post.likedBy?.includes(user?.id);
                          onLikePost?.(post.id, !currentlyLiked);
                        }}
                        className="flex items-center gap-2 hover:text-[#FF2D55] transition-colors group/action"
                      >
                        <div className="p-2 rounded-full group-hover/action:bg-[#FF2D55]/10 transition-colors">
                          <Heart className={`w-[18px] h-[18px] ${post.likedBy?.includes(user?.id) ? 'fill-[#FF2D55] text-[#FF2D55]' : ''}`} />
                        </div>
                        <span className={`text-[12px] font-bold ${post.likedBy?.includes(user?.id) ? 'text-[#FF2D55]' : ''}`}>
                          {post.stats?.likes || post.likedBy?.length || 0}
                        </span>
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare();
                        }}
                        className="flex items-center gap-2 hover:text-primary-container transition-colors group/action"
                      >
                        <div className="p-2 rounded-full group-hover/action:bg-primary-container/10 transition-colors">
                          <Share2 className="w-[18px] h-[18px]" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Comment Section */}
                    <AnimatePresence>
                      {expandedCommentsPostId === post.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="pt-4 pb-2 space-y-4">
                            {/* Comment Input */}
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                                <img src={user?.profileImage} className="w-full h-full object-cover" alt="User" />
                              </div>
                              <div className="flex-1 relative">
                                <textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Post your reply..."
                                  className="w-full bg-transparent border-b border-outline-variant/10 py-1.5 focus:border-primary-container transition-colors resize-none text-[15px] focus:outline-none min-h-[40px] max-h-[120px] pr-10"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendComment(post.id);
                                    }
                                  }}
                                />
                                <button
                                  disabled={!commentText.trim()}
                                  onClick={() => handleSendComment(post.id)}
                                  className="absolute right-0 bottom-2 p-1.5 text-primary-container disabled:text-outline/30 transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Comment List */}
                            <div className="space-y-4 pl-11">
                              {isLoadingComments && !commentsMap[post.id] && (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="w-5 h-5 animate-spin text-outline" />
                                </div>
                              )}
                              
                              {commentsMap[post.id]?.map((comment: any) => (
                                <div key={comment.id} className="flex gap-2 text-[14px]">
                                  <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-black text-on-surface leading-tight">{comment.authorName}</span>
                                      <span className="text-outline">·</span>
                                      <span className="text-[12px] text-outline">
                                        {comment.createdAt?.seconds 
                                          ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString() 
                                          : 'now'}
                                      </span>
                                    </div>
                                    <p className="text-on-surface-variant leading-relaxed">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              
                              {commentsMap[post.id]?.length === 0 && !isLoadingComments && (
                                <p className="text-center text-[12px] text-outline py-2">No transmissions in this thread yet.</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-20 px-8 text-center space-y-4">
                <div className="w-20 h-20 bg-surface-container-high rounded-3xl mx-auto flex items-center justify-center border border-outline-variant/10">
                   <Zap className="w-10 h-10 text-outline opacity-20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Silence in the Vault</h3>
                  <p className="text-outline text-xs font-bold uppercase tracking-[0.2em] opacity-60">
                    No professional transmissions detected from this node.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Media' && (
          <div className="py-20 text-center">
            <Grid className="w-16 h-16 mx-auto mb-4 opacity-10 text-on-surface" />
            <p className="text-sm font-black uppercase tracking-widest text-outline">Media vault is classified</p>
          </div>
        )}

        {activeTab === 'Likes' && (
          <div className="py-20 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-10 text-on-surface" />
            <p className="text-sm font-black uppercase tracking-widest text-outline">No liked signals detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileView;
