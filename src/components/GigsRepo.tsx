import React, { useState, useRef, useEffect } from 'react';
import { FlaskConical, Award, BookOpen, UploadCloud, Trophy, Archive, Trash2, Filter, Search, CheckCircle2, ShieldCheck, Layers, Menu, Terminal, ChevronRight, Star, Plus, Sparkles, LayoutGrid, List, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { addDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const GIGS_REPO_DATA = [
  {
    id: '1',
    category: 'Certifications',
    displayId: 'CERT_ID: 8829-X',
    date: '24 OCT 2023',
    title1: 'ADVANCED KINETIC',
    titleHighlight: 'INFRASTRUCTURE',
    title2: 'CERTIFICATION',
    description: 'Verification of high-velocity deployment capabilities in executive...',
    tags: ['VERIFIED', 'CORE'],
    issueDate: 'October 24, 2023',
    issuer: 'Gigs Global Auth',
    expires: 'Perpetual',
    summary: "This certification validates the holder's ability to architect and manage high-velocity digital infrastructures. Key focus areas include low-latency data streams, asynchronous process management, and the implementation of kinetic executive workflows within decentralized professional environments.\n\nAwarded after a 72-hour intensive simulation involving real-time network stress and organizational bottleneck resolution.",
    trust: {
      identity: 'BIO-HASH: VERIFIED',
      chain: 'BLOCK: 44,902,112',
      registry: 'STATUS: AUTHENTICATED'
    }
  },
  {
    id: '2',
    category: 'Certifications',
    displayId: 'CERT_ID: 4412-M',
    date: '12 SEP 2023',
    title1: 'QUARTERLY PERFORMANCE AUDIT:',
    titleHighlight: 'Q3 EXECUTION',
    title2: '',
    description: 'Comprehensive analysis of structural throughput and kinetic...',
    tags: ['INTERNAL'],
    issueDate: 'September 12, 2023',
    issuer: 'Internal Audit Board',
    expires: 'Q4 2024',
    summary: "Comprehensive analysis of structural throughput and kinetic execution for the third quarter. Demonstrates consistent outperformance of baseline metrics.",
    trust: {
      identity: 'CORP-ID: VALID',
      chain: 'BLOCK: 41,200,991',
      registry: 'STATUS: LOGGED'
    }
  },
  {
    id: '3',
    category: 'Publications',
    displayId: 'PUB_ID: 9901-P',
    date: '05 AUG 2023',
    title1: 'THE NEURAL GRID:',
    titleHighlight: 'SCALABILITY IN DARK TECH',
    title2: '',
    description: 'Research paper exploring decentralized high-density logic gates.',
    tags: ['PUBLISHED', 'TECH'],
    issueDate: 'August 05, 2023',
    issuer: 'Tech Journal X',
    expires: 'N/A',
    summary: "Research paper exploring decentralized high-density logic gates and their application in modern kinetic infrastructures. Peer-reviewed and published in the annual Dark Tech compendium.",
    trust: {
      identity: 'AUTHOR-HASH: VERIFIED',
      chain: 'BLOCK: 39,112,004',
      registry: 'STATUS: PUBLISHED'
    }
  },
  {
    id: '4',
    category: 'Achievements',
    displayId: 'ACH_ID: 0021-A',
    date: '18 JUN 2023',
    title1: 'FOUNDATION MERIT:',
    titleHighlight: 'ARCHITECTURAL INTEGRITY',
    title2: '',
    description: 'Award for maintaining zero-latency standards across enterprise...',
    tags: ['AWARD'],
    issueDate: 'June 18, 2023',
    issuer: 'Enterprise Standards',
    expires: 'Perpetual',
    summary: "Awarded for maintaining zero-latency standards across enterprise deployments during the Q2 migration phase.",
    trust: {
      identity: 'MERIT-ID: VERIFIED',
      chain: 'BLOCK: 35,441,220',
      registry: 'STATUS: AUTHENTICATED'
    }
  }
];

const SIDEBAR_ITEMS = [
  { id: 'Research', icon: FlaskConical, label: 'RESEARCH' },
  { id: 'Certifications', icon: Award, label: 'CERTIFICATIONS' },
  { id: 'Publications', icon: BookOpen, label: 'PUBLICATIONS' },
  { id: 'Uploads', icon: UploadCloud, label: 'UPLOADS' },
  { id: 'Achievements', icon: Trophy, label: 'ACHIEVEMENTS' }
];

export default function GigsRepo() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('1');
  const [isListVisible, setIsListVisible] = useState(true);
  const [isImmersive, setIsImmersive] = useState(true);
  const [isGrid, setIsGrid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState(GIGS_REPO_DATA);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Certifications');
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          category: data.category,
          displayId: `DOC_ID: ${doc.id.substring(0, 6).toUpperCase()}`,
          date: new Date(data.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
          title1: data.title.toUpperCase(),
          titleHighlight: '',
          title2: '',
          description: `Verification of ${data.category.toLowerCase()}...`,
          tags: data.tags || ['New', data.category],
          issueDate: new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
          issuer: 'User Upload',
          expires: 'N/A',
          summary: `User-uploaded document for ${data.category}. Status: PENDING.`,
          trust: {
            identity: 'UPLOAD-HASH: VERIFIED',
            chain: 'PENDING_VALIDATION',
            registry: 'STATUS: LOGGED'
          }
        };
      });
      setDocuments([...docs, ...GIGS_REPO_DATA]);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching documents:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadTitle.trim() || !uploadCategory.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'documents'), {
        title: uploadTitle,
        category: uploadCategory,
        fileData: uploadFile,
        tags: ['New', uploadCategory],
        createdAt: Date.now()
      });

      toast.success('Document uploaded for verification');
      setIsUploadModalOpen(false);
      // Reset form
      setUploadTitle('');
      setUploadCategory('Certifications');
      setUploadFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    (activeCategory === 'All' || doc.category === activeCategory) &&
    (doc.title1.toLowerCase().includes(searchQuery.toLowerCase()) || 
     doc.titleHighlight.toLowerCase().includes(searchQuery.toLowerCase()) ||
     doc.displayId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  return (
    <>
    {/* Desktop View */}
    <div className="hidden lg:flex flex-col h-[calc(100vh-60px)] w-full bg-[#111111] text-white overflow-hidden font-sans">
      
      {/* Sub-Navigation (Mockup Header) */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#131313]">
        <div className="flex items-center gap-8">
          <button onClick={() => setIsListVisible(!isListVisible)} className="text-gray-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xl font-black text-primary-container tracking-tighter">VAULT</span>
          <div className="flex gap-6 items-center">
            <button onClick={() => toast('Attributes tab active')} className="text-sm font-bold text-primary-container border-b-2 border-primary-container pb-1">Attributes</button>
            <button onClick={() => toast('Insights coming soon')} className="text-sm font-bold text-gray-500 hover:text-white pb-1">Insights</button>
            <button onClick={() => toast('Network view coming soon')} className="text-sm font-bold text-gray-500 hover:text-white pb-1">Network</button>
            <div className="w-px h-4 bg-white/10 mx-2"></div>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-black text-primary-container px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-2 border border-primary-container/30 hover:border-primary-container/60 clean-glow"
            >
              <Plus className="w-3 h-3 animate-pulse-slow" />
              <span className="animate-pulse-slow">Upload New</span>
            </button>
            <div className="w-px h-4 bg-white/10 mx-2"></div>
            <button 
              onClick={() => setIsImmersive(!isImmersive)} 
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 ${isImmersive ? 'bg-primary-container/20 text-primary-container' : 'bg-[#1A1A1A] text-gray-400'}`}
              title="Toggle Immersive Mode"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-widest uppercase hidden xl:inline">
                {isImmersive ? 'Immersive' : 'Minimal'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Document List (Toggleable) */}
        <div className={`bg-[#131313] border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out ${isListVisible ? 'w-96' : 'w-0 overflow-hidden border-none'}`}>
          <div className="p-6 border-b border-white/5 min-w-[384px]">
            <div className="mb-4 relative">
              <select 
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded text-xs font-bold tracking-widest text-white px-4 py-3 focus:outline-none focus:border-primary-container transition-colors font-mono appearance-none cursor-pointer"
              >
                <option value="All">ALL CATEGORIES</option>
                {SIDEBAR_ITEMS.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#B5C8DF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="relative bg-[#1A1A1A] rounded flex items-center px-4 py-3">
              <Search className="w-4 h-4 text-gray-500 mr-3" />
              <input 
                type="text" 
                placeholder="SEARCH REPOSITORY..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs tracking-widest text-white placeholder:text-gray-600 w-full"
              />
            </div>
            <div className="flex justify-between items-center mt-6">
              <span className="text-[10px] text-gray-500 tracking-widest uppercase">{filteredDocs.length} DOCUMENTS FOUND</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-w-[384px]">
          <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-6"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between mb-2">
                    <div className="h-2 w-20 bg-white/5 rounded"></div>
                    <div className="h-2 w-12 bg-white/5 rounded"></div>
                  </div>
                  <div className="h-4 w-48 bg-white/10 rounded mb-2"></div>
                  <div className="h-2 w-full bg-white/5 rounded mb-1"></div>
                  <div className="h-2 w-2/3 bg-white/5 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-4 w-12 bg-white/5 rounded"></div>
                    <div className="h-4 w-12 bg-white/5 rounded"></div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="list">
              {filteredDocs.map(doc => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <motion.div 
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`p-6 border-b border-white/5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#1A1A1A] border-l-4 border-l-primary-container' : 'hover:bg-[#161616] border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-mono tracking-widest ${isSelected ? 'text-primary-container' : 'text-gray-400'}`}>
                        {doc.displayId}
                      </span>
                      <span className="text-[10px] text-gray-500 tracking-widest">{doc.date}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug mb-2 text-white">
                      {doc.title1} {doc.titleHighlight} {doc.title2}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {doc.description}
                    </p>
                    <div className="flex gap-2">
                      {doc.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-[#222] text-gray-400 text-[8px] tracking-widest rounded border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className={`flex-1 overflow-y-auto p-10 lg:p-16 relative transition-all duration-500 ${isImmersive ? 'bg-[#0A0F0C]' : 'bg-[#0F0F0F]'}`}>
        {isImmersive && (
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-container/40 via-transparent to-transparent pointer-events-none"></div>
        )}
        
        {selectedDoc ? (
          <div className="max-w-4xl mx-auto relative z-10">
            {/* Header Status */}
            <div className="flex items-center gap-4 mb-12">
              <span className={`text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-sm transition-colors ${isImmersive ? 'bg-primary-container/20 text-primary-container shadow-[0_0_10px_rgba(45,212,191,0.2)]' : 'bg-[#003322] text-primary-container'}`}>
                ATTRIBUTE PREVIEW_MODE
              </span>
              <span className="text-[10px] text-gray-500 tracking-widest uppercase">
                STATUS: VERIFIED
              </span>
            </div>

            {/* Massive Title */}
            <h1 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tighter mb-16 uppercase">
              <span className="text-white block">{selectedDoc.title1}</span>
              <span className={`block transition-colors ${isImmersive ? 'text-primary-container drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'text-primary-container'}`}>{selectedDoc.titleHighlight}</span>
              <span className="text-white block">{selectedDoc.title2}</span>
            </h1>

            {/* Metadata Cards */}
            <div className="grid grid-cols-3 gap-6 mb-16">
              <div className={`p-6 rounded-lg border transition-all ${isImmersive ? 'bg-[#111A14] border-primary-container/20 shadow-[0_4px_20px_rgba(45,212,191,0.05)]' : 'bg-[#161616] border-white/5'}`}>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">ISSUE DATE</p>
                <p className="text-lg font-bold text-white">{selectedDoc.issueDate}</p>
              </div>
              <div className={`p-6 rounded-lg border transition-all ${isImmersive ? 'bg-[#111A14] border-primary-container/20 shadow-[0_4px_20px_rgba(45,212,191,0.05)]' : 'bg-[#161616] border-white/5'}`}>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">ISSUER</p>
                <p className="text-lg font-bold text-white">{selectedDoc.issuer}</p>
              </div>
              <div className={`p-6 rounded-lg border transition-all ${isImmersive ? 'bg-[#111A14] border-primary-container/20 shadow-[0_4px_20px_rgba(45,212,191,0.05)]' : 'bg-[#161616] border-white/5'}`}>
                <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-2">EXPIRES</p>
                <p className="text-lg font-bold text-white">{selectedDoc.expires}</p>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col gap-12">
              <div className="flex-1">
                <h3 className={`text-xs font-bold tracking-widest uppercase mb-6 ${isImmersive ? 'text-primary-container drop-shadow-[0_0_5px_rgba(45,212,191,0.5)]' : 'text-primary-container'}`}>SUMMARY</h3>
                <div className="text-gray-300 text-sm leading-relaxed space-y-4">
                  {selectedDoc.summary.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm tracking-widest">
            NO DOCUMENT SELECTED
          </div>
        )}
      </div>
      </div>
    </div>

    {/* Mobile View */}
    <div className="lg:hidden flex flex-col w-full bg-[#111111] text-white min-h-[calc(100vh-60px)] pb-[100px] overflow-x-hidden font-sans">
      <div className="px-4 pt-8 pb-4 bg-[#111111]/80 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter leading-none break-words">Professional Vault</h1>
            <p className="text-[9px] text-gray-500 tracking-[0.2em] uppercase mt-2 font-bold">Verified Attributes // Credentials</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="p-2.5 rounded-xl bg-primary-container text-black shadow-[0_0_15px_rgba(45,212,191,0.4)] active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsGrid(!isGrid)} 
              className={`p-2.5 rounded-xl transition-all duration-300 relative active:scale-95 ${isGrid ? 'bg-primary-container/20 text-primary-container' : 'bg-[#1A1A1A] text-gray-400'}`}
            >
              <AnimatePresence mode="wait">
                {isGrid ? (
                  <motion.div key="grid" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <LayoutGrid className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div key="list" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <List className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
        <div className="relative bg-[#1A1A1A] rounded flex items-center px-4 py-3">
          <Search className="w-4 h-4 text-gray-500 mr-3" />
          <input 
            type="text" 
            placeholder="SEARCH REPOSITORY..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs tracking-widest text-white placeholder:text-gray-600 w-full"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-4 overflow-x-auto no-scrollbar flex gap-2 border-b border-white/5 bg-[#0D0D0D]">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all ${
            activeCategory === 'All' 
              ? (isImmersive ? 'bg-primary-container text-black shadow-[0_0_10px_rgba(45,212,191,0.3)]' : 'bg-white text-black') 
              : 'bg-[#1A1A1A] text-gray-400 border border-white/5'
          }`}
        >
          ALL
        </button>
        {SIDEBAR_ITEMS.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveCategory(item.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold tracking-widest transition-all flex items-center gap-2 ${
              activeCategory === item.id 
                ? (isImmersive ? 'bg-primary-container text-black shadow-[0_0_10px_rgba(45,212,191,0.3)]' : 'bg-white text-black') 
                : 'bg-[#1A1A1A] text-gray-400 border border-white/5'
            }`}
          >
            <item.icon className="w-3 h-3" />
            {item.label}
          </button>
        ))}
      </div>

      <div className={`px-4 mt-2 ${isGrid ? 'grid grid-cols-2 gap-3' : 'space-y-4'}`}>
        <AnimatePresence mode="popLayout">
        {isLoading ? (
          [1, 2, 4].map(i => (
            <motion.div 
              key={`skeleton-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`bg-[#161616] rounded-xl p-5 animate-pulse ${isGrid ? 'h-40' : ''}`}
            >
              <div className="h-3 w-16 bg-white/5 rounded mb-4"></div>
              <div className="h-5 w-32 bg-white/10 rounded mb-2"></div>
              <div className="h-3 w-full bg-white/5 rounded mb-1"></div>
              <div className="h-3 w-2/3 bg-white/5 rounded"></div>
            </motion.div>
          ))
        ) : (
          filteredDocs.map(doc => (
            <motion.div 
              layout
              key={doc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                isImmersive 
                  ? 'bg-[#1A1A1A] border border-primary-container/20 shadow-[0_4px_20px_rgba(45,212,191,0.05)] hover:shadow-[0_4px_25px_rgba(45,212,191,0.1)]' 
                  : 'bg-[#161616] border border-white/5'
              } ${isGrid ? 'p-4 flex flex-col h-full' : 'p-5'}`}
            >
              {isImmersive && (
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-container via-transparent to-transparent pointer-events-none"></div>
              )}
              
              <div className={`flex justify-between items-start ${isGrid ? 'mb-3' : 'mb-4'}`}>
                <span className={`text-[8px] tracking-widest uppercase px-2 py-1 rounded ${
                  isImmersive ? 'bg-primary-container/10 text-primary-container' : 'bg-white/10 text-gray-300'
                }`}>
                  {doc.category}
                </span>
                {!isGrid && <span className="text-[10px] text-gray-500 tracking-widest">{doc.date}</span>}
              </div>

              <h3 className={`font-bold mb-2 leading-tight ${isGrid ? 'text-sm' : 'text-lg'}`}>
                <span className="text-white">{doc.title1} </span>
                <span className={isImmersive ? 'text-primary-container' : 'text-white'}>{doc.titleHighlight} </span>
                <span className="text-white">{doc.title2}</span>
              </h3>

              <p className={`text-gray-400 leading-relaxed ${isGrid ? 'text-[10px] line-clamp-3 mb-3 flex-1' : 'text-xs mb-4'}`}>
                {doc.description}
              </p>

              <div className={`flex items-center justify-between mt-auto pt-3 border-t ${isImmersive ? 'border-primary-container/10' : 'border-white/5'}`}>
                <div className="flex gap-1.5">
                  {doc.tags.slice(0, isGrid ? 1 : 2).map(tag => (
                    <span key={tag} className="text-[8px] text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className={`w-3 h-3 ${isImmersive ? 'text-primary-container' : 'text-gray-400'}`} />
                  <span className={`text-[8px] font-mono ${isImmersive ? 'text-primary-container' : 'text-gray-400'}`}>VERIFIED</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
        </AnimatePresence>
      </div>
    </div>

    {/* Upload Modal */}
    <AnimatePresence>
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsUploadModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#161616] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-black tracking-tighter text-white">UPLOAD DOCUMENT</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-primary-container/50 transition-colors cursor-pointer group relative overflow-hidden"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                
                {uploadFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-primary-container" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">File Selected</p>
                    <p className="text-xs text-gray-500">Click to change</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-primary-container/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-primary-container" />
                    </div>
                    <p className="text-sm font-bold text-white mb-2">Drop files here or click to browse</p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
              
              <div className="mt-8 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Document Title</label>
                  <input 
                    type="text" 
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-container transition-colors" 
                    placeholder="e.g. Q4 Performance Audit" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">Category</label>
                  <select 
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/5 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-container transition-colors appearance-none"
                  >
                    <option>Certifications</option>
                    <option>Publications</option>
                    <option>Achievements</option>
                    <option>Research</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[#1A1A1A] flex justify-end gap-4">
              <button 
                onClick={() => setIsUploadModalOpen(false)} 
                className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-white tracking-widest uppercase"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadSubmit}
                disabled={isUploading}
                className={`bg-black text-primary-container px-8 py-2 rounded font-black text-xs tracking-widest uppercase transition-all flex items-center gap-2 border border-primary-container/30 hover:border-primary-container/60 clean-glow ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                {isUploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
