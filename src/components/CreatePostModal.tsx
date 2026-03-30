import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, FileText, Smile, MapPin, ShieldAlert, Zap, Briefcase, ChevronRight } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  user: any;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated, user }: CreatePostModalProps) {
  const [postType, setPostType] = useState<'VIBE' | 'GIG'>('VIBE');
  const [content, setContent] = useState('');
  const [isUncensored, setIsUncensored] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tag, setTag] = useState('');
  
  // GIG specific
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [step, setStep] = useState(1); // For GIG multi-step
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 280;
  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = postType === 'VIBE' && charsLeft < 0;
  const progressPercentage = Math.min((content.length / MAX_CHARS) * 100, 100);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, postType, step]);

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (postType === 'VIBE' && (!content.trim() || isOverLimit)) return;
    if (postType === 'GIG' && (!title.trim() || !content.trim() || !category.trim())) return;

    setIsSubmitting(true);
    
    const postData: any = { type: postType };
    if (postType === 'VIBE') {
      postData.content = content;
      postData.isUncensored = isUncensored;
      if (tag.trim()) postData.tag = tag.trim();
      if (imagePreview) {
        postData.image = imagePreview;
      }
    } else {
      postData.title = title;
      postData.description = content;
      postData.category = category;
      if (imagePreview) {
        postData.image = imagePreview;
      }
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (res.ok) {
        const newPost = await res.json();
        onPostCreated(newPost);
        handleClose();
      }
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPostType('VIBE');
    setContent('');
    setIsUncensored(false);
    setImagePreview(null);
    setTag('');
    setTitle('');
    setCategory('');
    setStep(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl bg-surface-container border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <div className="flex gap-1 bg-surface-container-lowest p-1 rounded-lg">
                <button
                  onClick={() => { setPostType('VIBE'); setStep(1); }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase transition-all ${
                    postType === 'VIBE' ? 'bg-primary-container/20 text-primary-container' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Zap className="w-3 h-3 inline mr-1.5" /> Vibe
                </button>
                <button
                  onClick={() => { setPostType('GIG'); setStep(1); }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase transition-all ${
                    postType === 'GIG' ? 'bg-secondary-fixed-dim/20 text-secondary-fixed-dim' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Briefcase className="w-3 h-3 inline mr-1.5" /> Gig
                </button>
              </div>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex gap-4">
                <img 
                  src={user?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDCOWJ5vZEovondagcWGriDKF5gytHqkiFpqOXiKOfy1Tni5G8a7lVjfW-EWggSDJuumPqN2dAQga2N-YT6gA4CrP-qX_I52u-0woFdq9dDLfhsk1HshhH6v0GZAyBnysdTlHjZwoCxuBIzAP2EqND_q8lGS7tXREUaBg-QcLs8m3nkAOa-a254ival6t9EfDvrwrH5oeD_mfOsYwf5vg_zmYgQ2Z5ivEwNu1nTbfFpMj50Yt_es5P2aVYFq5LhuowjdJUxBNGHEaUB"} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    {postType === 'VIBE' ? (
                      <motion.div 
                        key="vibe"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full"
                      >
                        <textarea
                          ref={textareaRef}
                          value={content}
                          onChange={handleAutoResize}
                          placeholder="What's the raw vibe right now?"
                          className="w-full bg-transparent text-white text-lg placeholder:text-gray-600 resize-none outline-none min-h-[120px] font-sans"
                        />
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => setTag(e.target.value)}
                          placeholder="Add a tag (e.g., ERR_SLIPPAGE_DETECTED)"
                          className="w-full bg-transparent text-primary-container text-sm font-mono placeholder:text-gray-600 outline-none mt-2 border-b border-white/10 pb-2 focus:border-primary-container/50 transition-colors"
                        />
                        {imagePreview && (
                          <div className="relative mt-2 rounded-2xl overflow-hidden border border-white/10">
                            <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
                            <button 
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors backdrop-blur-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="gig"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full space-y-4"
                      >
                        {step === 1 ? (
                          <div className="space-y-4">
                            <input
                              autoFocus
                              type="text"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Title of your Deep Dive..."
                              className="w-full bg-transparent text-white text-xl font-bold placeholder:text-gray-600 outline-none border-b border-white/10 pb-2"
                            />
                            <input
                              type="text"
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              placeholder="Category (e.g., RESEARCH PAPER, MILESTONE)"
                              className="w-full bg-transparent text-secondary-fixed-dim text-sm font-mono uppercase tracking-widest placeholder:text-gray-600 outline-none border-b border-white/10 pb-2"
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">
                              <span className="text-white">{title || 'Untitled'}</span>
                              <span>•</span>
                              <span className="text-secondary-fixed-dim">{category || 'Uncategorized'}</span>
                              <button onClick={() => setStep(1)} className="ml-auto text-primary-container hover:underline">Edit</button>
                            </div>
                            <textarea
                              ref={textareaRef}
                              value={content}
                              onChange={handleAutoResize}
                              placeholder="Provide a brief summary or description of the work..."
                              className="w-full bg-transparent text-white text-base placeholder:text-gray-600 resize-none outline-none min-h-[120px] font-sans"
                            />
                            {imagePreview && (
                              <div className="relative mt-2 rounded-2xl overflow-hidden border border-white/10">
                                <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
                                <button 
                                  onClick={removeImage}
                                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors backdrop-blur-sm"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer / Toolbar */}
            <div className="p-4 border-t border-white/5 bg-surface-container-high flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-primary-container hover:bg-primary-container/10 rounded-full transition-colors" 
                  title="Add Media"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                {postType === 'GIG' && (
                  <button className="p-2 text-primary-container hover:bg-primary-container/10 rounded-full transition-colors" title="Attach Document">
                    <FileText className="w-5 h-5" />
                  </button>
                )}
                <button className="p-2 text-primary-container hover:bg-primary-container/10 rounded-full transition-colors hidden sm:block" title="Add Emoji">
                  <Smile className="w-5 h-5" />
                </button>
                <button className="p-2 text-primary-container hover:bg-primary-container/10 rounded-full transition-colors hidden sm:block" title="Add Location">
                  <MapPin className="w-5 h-5" />
                </button>
                
                {postType === 'VIBE' && (
                  <div className="ml-2 flex items-center">
                    <button 
                      onClick={() => setIsUncensored(!isUncensored)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        isUncensored ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {isUncensored ? 'UNCENSORED' : 'FILTERED'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {postType === 'VIBE' && content.length > 0 && (
                  <div className="flex items-center gap-3 mr-2">
                    <div className="relative w-6 h-6 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-white/10"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray="62.83"
                          strokeDashoffset={62.83 - (62.83 * progressPercentage) / 100}
                          className={`transition-all duration-200 ${
                            isOverLimit ? 'text-red-500' : charsLeft <= 20 ? 'text-yellow-500' : 'text-primary-container'
                          }`}
                        />
                      </svg>
                    </div>
                    {charsLeft <= 20 && (
                      <span className={`text-xs font-mono ${isOverLimit ? 'text-red-500' : 'text-yellow-500'}`}>
                        {charsLeft}
                      </span>
                    )}
                    <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                  </div>
                )}
                {postType === 'GIG' && step === 1 ? (
                  <button
                    onClick={() => setStep(2)}
                    disabled={!title.trim() || !category.trim()}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !content.trim() || isOverLimit || (postType === 'GIG' && (!title.trim() || !category.trim()))}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all ${
                      postType === 'VIBE' 
                        ? 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 shadow-[0_0_15px_rgba(0,255,170,0.3)]' 
                        : 'bg-secondary-fixed-dim text-on-surface hover:bg-secondary-fixed-dim/90 shadow-sm'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
