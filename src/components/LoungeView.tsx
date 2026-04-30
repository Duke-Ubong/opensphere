import React, { useState, useEffect, useRef } from 'react';
import { Shield, User, Settings, LogOut, Search, MoreVertical, Paperclip, AtSign, Smile, Send, ChevronLeft, ChevronRight, CheckCircle, Fingerprint, Activity, Lock, Users, Sliders, AlertTriangle, RefreshCw, Edit2, List, Download, Camera, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import CreateLoungeModal from './CreateLoungeModal';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface LoungeViewProps {
  user: any;
  onClose: () => void;
}

const LoungeView: React.FC<LoungeViewProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'gateway' | 'dashboard' | 'console'>('directory');
  const [lounges, setLounges] = useState<any[]>([]);
  const [activeLounge, setActiveLounge] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'lounges'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loungesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLounges(loungesData);
    }, (error) => {
      console.error("Error fetching lounges:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleJoinLounge = (lounge: any) => {
    setActiveLounge(lounge);
    setActiveTab('gateway');
    setIsVerified(false);
    setVerificationProgress(0);
  };

  const handleLoungeCreated = (newLounge: any) => {
    // Handled by onSnapshot
  };

  // Simulate verification process
  useEffect(() => {
    if (activeTab === 'gateway' && !isVerified) {
      const interval = setInterval(() => {
        setVerificationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsVerified(true), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activeTab, isVerified]);

  return (
    <div className="fixed inset-0 bg-surface z-50 flex flex-col md:flex-row text-on-surface font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={`hidden md:flex w-64 bg-surface-container border-r border-lounge-gold/20 flex-col shrink-0 ${activeTab === 'dashboard' ? '!hidden' : ''}`}>
        <div className="p-6 flex items-center gap-3 border-b border-lounge-gold/20">
          <Shield className="w-6 h-6 text-lounge-gold" />
          <div>
            <h1 className="text-lg font-bold text-lounge-gold tracking-wider">The Lounge</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-lounge-gold/70 uppercase tracking-widest mt-1">
              <Lock className="w-3 h-3" /> Deep Encryption Active
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-lounge-gold/20">
          <div className="flex items-center gap-3">
            <img src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"} alt="User" className="w-10 h-10 rounded-lg border border-lounge-gold/30 object-cover" />
            <div>
              <p className="text-xs font-bold text-lounge-gold uppercase tracking-widest">Member Access</p>
              <p className="text-[10px] text-outline">Verified Professional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('directory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'}`}
          >
            <List className="w-4 h-4" /> Directory
          </button>
          <button 
            onClick={() => { if(activeLounge) setActiveTab('gateway') }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'gateway' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'} ${!activeLounge && 'opacity-50 cursor-not-allowed'}`}
          >
            <Fingerprint className="w-4 h-4" /> Entry Gateway
          </button>
          <button 
            onClick={() => { if(activeLounge && isVerified) setActiveTab('dashboard') }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
          >
            <Activity className="w-4 h-4" /> Lounge Dashboard
          </button>
          <button 
            onClick={() => { if(activeLounge && isVerified) setActiveTab('console') }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'console' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
          >
            <Shield className="w-4 h-4" /> Curator's Console
          </button>
        </nav>

        <div className="p-4 border-t border-lounge-gold/20 space-y-2">
          <button onClick={() => toast('Lounge settings coming soon')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-outline hover:text-on-surface hover:bg-on-surface/5 transition-all">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-outline hover:text-error hover:bg-error/10 transition-all">
            <LogOut className="w-4 h-4" /> Exit Lounge
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-surface min-w-0">
        {/* Top Navigation Bar (Mobile/Tablet) */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b border-lounge-gold/20 bg-surface-container ${activeTab === 'dashboard' ? 'hidden' : ''}`}>
           <div className="flex gap-3 overflow-x-auto no-scrollbar flex-1 pb-1">
              <button 
                onClick={() => setActiveTab('directory')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'directory' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'}`}
              >
                <List className="w-3 h-3" /> Directory
              </button>
              <button 
                onClick={() => activeLounge && setActiveTab('gateway')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'gateway' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'} ${!activeLounge && 'opacity-50 cursor-not-allowed'}`}
              >
                <Fingerprint className="w-3 h-3" /> Gateway
              </button>
              <button 
                onClick={() => activeLounge && isVerified && setActiveTab('dashboard')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
              >
                <Activity className="w-3 h-3" /> Dashboard
              </button>
              <button 
                onClick={() => activeLounge && isVerified && setActiveTab('console')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'console' ? 'bg-lounge-gold/10 text-lounge-gold border border-lounge-gold/30' : 'text-outline hover:text-lounge-gold hover:bg-lounge-gold/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
              >
                <Shield className="w-3 h-3" /> Console
              </button>
           </div>
           <button onClick={onClose} className="ml-2 p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-all shrink-0">
             <LogOut className="w-5 h-5" />
           </button>
        </div>

        <div className={`flex-1 flex flex-col relative min-h-0 ${activeTab === 'dashboard' ? 'overflow-hidden' : 'overflow-y-auto p-4 md:p-8'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'directory' && (
              <motion.div key="directory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-h-0">
                <DirectoryView lounges={lounges} onJoin={handleJoinLounge} onCreate={() => setIsCreateModalOpen(true)} />
              </motion.div>
            )}
            {activeTab === 'gateway' && activeLounge && (
              <motion.div key="gateway" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-h-0">
                <GatewayView lounge={activeLounge} isVerified={isVerified} progress={verificationProgress} onEnter={() => setActiveTab('dashboard')} />
              </motion.div>
            )}
            {activeTab === 'dashboard' && activeLounge && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-h-0">
                <DashboardView lounge={activeLounge} user={user} onBack={() => setActiveTab('directory')} />
              </motion.div>
            )}
            {activeTab === 'console' && activeLounge && (
              <motion.div key="console" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col min-h-0">
                <ConsoleView lounge={activeLounge} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <CreateLoungeModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCreated={handleLoungeCreated} 
      />
    </div>
  );
};

// --- Sub-Views ---

const DirectoryView = ({ lounges, onJoin, onCreate }: { lounges: any[], onJoin: (lounge: any) => void, onCreate: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredLounges = lounges.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.keys(l.skill_thresholds || {}).some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-bold text-on-surface tracking-tight mb-2">Lounge Directory</h2>
          <p className="text-outline text-sm">Discover and join skill-gated professional environments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-[342px]" style={{ height: '50px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input 
              type="text" 
              placeholder="Search lounges or skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 text-xs text-on-surface focus:outline-none focus:border-lounge-gold/50 transition-colors"
            />
          </div>
          <button onClick={onCreate} className="bg-lounge-gold text-on-primary-fixed px-6 h-[50px] rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-lounge-gold/90 transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)] shrink-0">
            Initialize Lounge
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLounges.map(lounge => (
          <div key={lounge.id} className="bg-surface-container border border-lounge-gold/20 rounded-2xl p-6 flex flex-col hover:border-lounge-gold/50 transition-colors">
            <div className="flex justify-between items-start mb-4 gap-2">
              <h3 className="text-xl font-bold text-on-surface leading-tight">{lounge.name}</h3>
              {lounge.is_temporary && <span className="px-2 py-1 bg-error/10 text-error text-[10px] font-bold uppercase tracking-widest rounded border border-error/20 shrink-0">OTR</span>}
            </div>
            <div className="mb-8 flex-1">
              <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-3">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(lounge.skill_thresholds || {}).map(([skill, score]) => (
                  <span key={skill} className="px-2 py-1 bg-surface border border-outline-variant rounded text-xs text-on-surface-variant flex items-center gap-2">
                    {skill} <span className="text-lounge-gold font-mono">{score as React.ReactNode}+</span>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => onJoin(lounge)} className="w-full py-3 bg-surface border border-lounge-gold/30 text-lounge-gold rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-lounge-gold/10 transition-colors">
              Attempt Entry
            </button>
          </div>
        ))}
        {filteredLounges.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed border-outline-variant rounded-2xl">
            <p className="text-outline font-mono">No active lounges found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GatewayView = ({ lounge, isVerified, progress, onEnter }: { lounge: any, isVerified: boolean, progress: number, onEnter: () => void }) => (
  <div className="max-w-5xl mx-auto h-full flex flex-col px-4 md:px-0">
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lounge-gold/10 border border-lounge-gold/30 text-lounge-gold text-[10px] font-bold uppercase tracking-widest mb-6">
        <span className="w-2 h-2 rounded-full bg-lounge-gold animate-pulse"></span> System: Online
      </div>
      <h2 className="text-5xl md:text-7xl font-bold text-on-surface tracking-tight mb-4 leading-none">
        {lounge.name}<br/><span className="text-lounge-gold">Gateway</span>
      </h2>
      <p className="text-outline max-w-md text-sm leading-relaxed">
        Secure clearance check initiated. Align your biometric signature with the vault perimeter to proceed to the inner chambers.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
      {/* Left Column */}
      <div className="space-y-6 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container border border-lounge-gold/20 p-6 rounded-xl">
            <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-2">Clearance Level</p>
            <p className="text-2xl font-bold text-on-surface">Tier Alpha</p>
          </div>
          <div className="bg-surface-container border border-lounge-gold/20 p-6 rounded-xl">
            <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-2">Neural Sync</p>
            <p className="text-2xl font-bold text-on-surface">Active</p>
          </div>
        </div>
        
        <button 
          onClick={onEnter}
          disabled={!isVerified}
          className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 relative overflow-hidden ${isVerified ? 'bg-lounge-gold text-on-primary-fixed hover:-translate-y-1 shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)]' : 'bg-surface-container-high text-outline border border-outline-variant/40 cursor-not-allowed opacity-80'}`}
        >
          {isVerified ? 'Initialize Access' : `Verifying... ${progress}%`}
          {isVerified && <ChevronRight className="w-5 h-5 absolute right-4 group-hover:translate-x-1 transition-transform" />}
          {!isVerified && <div className="absolute bottom-0 left-0 h-0.5 bg-lounge-gold transition-all duration-300" style={{ width: `${progress}%` }}></div>}
          {!isVerified && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full -translate-x-full animate-shimmer"></div>}
        </button>
        
        {isVerified && (
          <div className="text-center">
            <p className="text-[10px] text-lounge-gold uppercase tracking-widest font-mono">Identity Hash</p>
            <p className="text-xs text-outline font-mono mt-1">XF-990-221-DELTA</p>
          </div>
        )}
      </div>

      {/* Right Column - Scanner */}
      <div className="relative bg-surface-container border border-lounge-gold/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] overflow-hidden">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-lounge-gold/50 m-6"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-lounge-gold/50 m-6"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-lounge-gold/50 m-6"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-lounge-gold/50 m-6"></div>

        <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] font-mono text-outline text-right">
          <div>
            <p>CORE_LOAD: 0.11ms</p>
            <p>LATENCY: 2ms</p>
            <p>ENCRYPTION: AES-256</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-12 z-10">
          {isVerified ? <CheckCircle className="w-6 h-6 text-lounge-gold" /> : <RefreshCw className="w-6 h-6 text-lounge-gold animate-spin" />}
          <div>
            <p className="text-[10px] text-outline uppercase tracking-widest font-bold">Identity Status</p>
            <p className={`text-lg font-bold ${isVerified ? 'text-lounge-gold' : 'text-on-surface'}`}>
              {isVerified ? 'Verification: Active' : 'Scanning Signature...'}
            </p>
          </div>
        </div>

        {/* Scanner Animation */}
        <div className="relative w-48 h-48 flex items-center justify-center z-10 group">
          <div className={`absolute inset-0 border border-lounge-gold/30 rotate-45 transition-all duration-1000 ${isVerified ? 'scale-110 opacity-50' : 'animate-pulse'}`}></div>
          <div className={`absolute inset-4 border border-lounge-gold/50 rotate-45 transition-all duration-1000 ${isVerified ? 'scale-105 opacity-80' : 'animate-pulse delay-75'}`}></div>
          
          <div className="w-32 h-32 bg-surface text-lounge-gold/50 border border-lounge-gold z-20 overflow-hidden relative flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-500">
             {isVerified ? (
               <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" alt="Verified User" className="w-full h-full object-cover opacity-80 grayscale scale-105 transition-transform duration-1000" />
             ) : (
               <Fingerprint className="w-16 h-16 opacity-70 animate-pulse" />
             )}
             {/* Scan Line */}
             {!isVerified && <div className="absolute top-0 left-0 w-full h-1 bg-lounge-gold shadow-[0_0_15px_rgba(212,175,55,0.8)] animate-scan"></div>}
          </div>
        </div>

        <div className="mt-12 w-full max-w-xs z-10">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 transition-colors ${isVerified ? 'text-lounge-gold' : 'text-outline'}`} />
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold">Expertise Vector</p>
                <p className="text-sm font-bold text-on-surface transition-colors">Skill Match: <span className={isVerified ? 'text-lounge-gold' : ''}>{progress}%</span></p>
              </div>
            </div>
            <p className="text-[10px] text-outline font-mono">99.9% CERTAINTY</p>
          </div>
          <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden shadow-inner isolate">
            <div className="h-full bg-lounge-gold transition-all duration-300 relative overflow-hidden" style={{ width: `${progress}%` }}>
              {!isVerified && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-[200%] -translate-x-full animate-shimmer"></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DashboardView = ({ lounge, user, onBack }: { lounge: any, user: any, onBack?: () => void }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat',
          content: `Shared a file: ${file.name}`,
          attachment: {
            name: file.name,
            type: file.type,
            data: reader.result
          },
          isOtr: lounge.is_temporary
        }));
        toast.success(`Uploading ${file.name}...`);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      setConnectionStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws-lounge?loungeId=${lounge.id}&username=${encodeURIComponent(user?.username || 'Anonymous')}`;
      
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
          return;
        }
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'presence') {
            setOnlineUsers(data.users);
          } else if (data.type === 'chat' || data.type === 'system') {
            setMessages(prev => {
              if (prev.some(m => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          } else if (data.type === 'typing') {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              if (data.isTyping) newSet.add(data.username);
              else newSet.delete(data.username);
              return newSet;
            });
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      ws.onclose = () => {
        if (!isMounted) return;
        setConnectionStatus('disconnected');
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        if (!isMounted) return;
        setConnectionStatus('disconnected');
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [lounge.id, user?.username]);

  // OTR Expiry Checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.expiresAt || msg.expiresAt > now);
        // Only trigger re-render if something actually expired to avoid unnecessary renders
        if (filtered.length !== prev.length) return filtered;
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: true }));
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: false }));
        }
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      content: input,
      isOtr: lounge.is_temporary
    }));
    
    wsRef.current.send(JSON.stringify({ type: 'typing', isTyping: false }));
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setInput('');
  };

  // Force re-render every second to update countdowns if there are OTR messages
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!lounge.is_temporary) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [lounge.is_temporary]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-surface">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-container overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-lounge-gold/20 flex justify-between items-center bg-surface-container z-10 cursor-pointer hover:bg-surface-container-high transition-colors">
          <div className="flex items-center gap-3 md:gap-4">
            {onBack && (
              <button 
                onClick={(e) => { e.stopPropagation(); onBack(); }}
                className="p-2 -ml-2 text-outline hover:text-lounge-gold transition-colors rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-lounge-gold/20 flex items-center justify-center text-lounge-gold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-bold text-on-surface truncate">{lounge.name}</h2>
              <p className="text-[10px] md:text-xs text-outline flex items-center gap-1 truncate">
                {onlineUsers.length} members online
                {typingUsers.size > 0 && (
                   <span className="text-lounge-gold italic ml-2 truncate">
                    {Array.from(typingUsers).join(', ')} typing...
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4 shrink-0">
            <button onClick={() => toast('Search coming soon')} className="text-outline hover:text-lounge-gold transition-colors p-2"><Search className="w-5 h-5" /></button>
            <button onClick={() => toast('More options coming soon')} className="text-outline hover:text-lounge-gold transition-colors p-2"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-surface relative">
          {/* Subtle background pattern could go here */}
          {connectionStatus !== 'connected' && (
            <div className="absolute top-0 left-0 right-0 bg-error/10 text-error text-xs text-center py-1 font-mono border-b border-error/20 z-20">
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection lost. Reconnecting...'}
            </div>
          )}
          
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-outline space-y-4">
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant text-center max-w-sm">
                <Lock className="w-8 h-8 text-lounge-gold mx-auto mb-2 opacity-50" />
                <p className="text-xs text-outline">Messages are end-to-end encrypted. No one outside of this chat, not even the server, can read them.</p>
              </div>
            </div>
          )}
          {messages.map(msg => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="bg-surface-container text-outline text-[10px] px-3 py-1 rounded-lg border border-outline-variant/50 shadow-sm">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const isMe = msg.author === user?.username;
            const timeLeft = msg.expiresAt ? Math.max(0, Math.ceil((msg.expiresAt - Date.now()) / 1000)) : null;
            
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant shrink-0 flex items-center justify-center text-lounge-gold font-bold uppercase text-xs mt-1">
                    {msg.author.substring(0, 2)}
                  </div>
                )}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-xs text-outline ml-1 mb-1">{msg.author}</span>}
                  <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-lounge-gold text-on-primary-fixed rounded-tr-sm' : 'bg-surface-container border border-outline-variant text-on-surface rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    {msg.attachment && (
                      <div className={`mt-2 p-2 rounded border ${isMe ? 'bg-black/10 border-black/20' : 'bg-on-surface/5 border-on-surface/10'} flex items-center gap-2`}>
                        <Paperclip className="w-4 h-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold truncate">{msg.attachment.name}</p>
                          <p className="text-[8px] opacity-50 uppercase tracking-widest">{msg.attachment.type}</p>
                        </div>
                        <a 
                          href={msg.attachment.data} 
                          download={msg.attachment.name}
                          className={`p-1 rounded hover:bg-on-surface/10 transition-colors ${isMe ? 'text-on-primary-fixed' : 'text-lounge-gold'}`}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-on-primary-fixed/60' : 'text-outline'}`}>
                      {timeLeft !== null && (
                        <span className="text-[9px] font-mono font-bold animate-pulse text-error">
                          {timeLeft}s
                        </span>
                      )}
                      <span className="text-[9px]">{msg.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-surface-container border-t border-lounge-gold/20">
          {lounge.is_temporary && (
            <div className="flex items-center justify-center mb-2">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-error text-[9px] font-bold uppercase tracking-widest bg-error/10">
                <Lock className="w-3 h-3" /> OTR Active
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            {/* The Capsule */}
            <div className="flex-1 flex items-center bg-surface-container-high border border-lounge-gold/20 rounded-full px-2 py-0.5 shadow-inner transition-all duration-300">
              <button onClick={() => toast('Emoji picker coming soon')} className="p-2.5 text-outline hover:text-lounge-gold transition-colors rounded-full hover:bg-lounge-gold/5">
                <Smile className="w-6 h-6" />
              </button>
              
              <textarea 
                value={input}
                onChange={handleTyping}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message"
                className="flex-1 bg-transparent text-on-surface text-sm px-3 py-3 focus:outline-none resize-none max-h-32 placeholder:text-outline/40"
                rows={1}
                disabled={connectionStatus !== 'connected'}
                style={{ height: 'auto' }}
              />

              <div className="flex items-center gap-0.5 pr-1">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-outline hover:text-lounge-gold transition-colors rounded-full hover:bg-lounge-gold/5">
                  <Paperclip className="w-6 h-6 -rotate-45" />
                </button>
                {!input.trim() && (
                  <button onClick={() => toast('Camera coming soon')} className="p-2.5 text-outline hover:text-lounge-gold transition-colors rounded-full hover:bg-lounge-gold/5">
                    <Camera className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Circular Button */}
            <div className="shrink-0">
              {input.trim() ? (
                <button 
                  onClick={handleSend}
                  disabled={connectionStatus !== 'connected'}
                  className="w-[52px] h-[52px] bg-lounge-gold text-white rounded-full flex items-center justify-center shadow-lg hover:bg-lounge-gold/90 transition-all duration-200 disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-5 h-5 ml-1 fill-current" />
                </button>
              ) : (
                <button 
                  onClick={() => toast('Voice messages coming soon')} 
                  className="w-[52px] h-[52px] bg-lounge-gold text-white rounded-full flex items-center justify-center shadow-lg hover:bg-lounge-gold/90 transition-all duration-200 active:scale-95"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsoleView = ({ lounge }: { lounge: any }) => {
  const [gateActive, setGateActive] = useState(true);
  const [rules, setRules] = useState([
    { id: 1, title: 'I. Total Discretion', content: 'What happens in the vault stays in the vault. Screenshots and leaks lead to permanent terminal termination.' },
    { id: 2, title: 'II. Intellectual Merit', content: 'Value is measured in expertise. Ad-hominem attacks are prohibited; dismantle arguments, not people.' },
    { id: 3, title: 'III. Professional Integrity', content: 'Speak truthfully. Maintain the highest standards of professional discourse and mutual respect.' }
  ]);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleEditRule = (rule: any) => {
    setEditingRule(rule.id);
    setEditContent(rule.content);
  };

  const saveRule = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, content: editContent } : r));
    setEditingRule(null);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col px-4 md:px-0">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-on-surface tracking-tight mb-2">{lounge.name} Console</h2>
        <p className="text-outline text-sm">Master management of the digital environment. Define the atmosphere, set thresholds, and orchestrate the flow of elite discourse.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-8 custom-scrollbar">
        {/* Left Column - Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lounge Info Card */}
          <div className="bg-surface-container border border-lounge-gold/20 rounded-2xl p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-lounge-gold uppercase tracking-widest mb-1">Lounge Environment</h3>
                <p className="text-xs text-outline">Real-time environment status</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-lounge-gold uppercase tracking-tighter">OPTIMIZED</p>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mt-1">Status: High Fidelity</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-outline-variant">
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-2">Network Stability</p>
                <div className="h-1 w-full bg-outline-variant rounded-full"><div className="h-full bg-lounge-gold transition-all" style={{ width: '98%' }}></div></div>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-2">Encryption Strength</p>
                <div className="h-1 w-full bg-outline-variant rounded-full"><div className="h-full bg-lounge-gold transition-all" style={{ width: '100%' }}></div></div>
              </div>
              <div>
                <p className="text-[10px] text-outline uppercase tracking-widest font-bold mb-2">Uptime Reliability</p>
                <div className="h-1 w-full bg-outline-variant rounded-full"><div className="h-full bg-lounge-gold transition-all" style={{ width: '99.9%' }}></div></div>
              </div>
            </div>
          </div>

          {/* Member Activity */}
          <div className="bg-surface-container border border-lounge-gold/20 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-lounge-gold uppercase tracking-widest">Member Activity</h3>
              <button onClick={() => toast('Refreshing member list...')} className="text-[10px] text-outline uppercase tracking-widest font-bold flex items-center gap-1 hover:text-lounge-gold transition-colors"><RefreshCw className="w-3 h-3" /> Refresh List</button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Julianna Thorne', role: 'Senior Strategist', tier: 'Contributor' },
                { name: 'Marcus Sterling', role: 'Creative Director', tier: 'Moderator' },
                { name: 'Elena Vance', role: 'Lead Architect', tier: 'Contributor' }
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-surface border border-outline-variant rounded-xl hover:border-lounge-gold/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center text-lounge-gold font-bold uppercase">{member.name.substring(0, 2)}</div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{member.name}</p>
                      <p className="text-[10px] text-outline uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 bg-surface-container border ${member.tier === 'Moderator' ? 'border-lounge-gold/50 text-lounge-gold' : 'border-outline-variant text-outline'} rounded text-[10px] font-bold uppercase tracking-widest`}>{member.tier}</span>
                    <button onClick={() => toast(`Warning sent to ${member.name}`)} className="text-outline hover:text-error transition-colors" title="Warn User"><AlertTriangle className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Rules */}
        <div className="space-y-6">
          {/* Skill-Gate */}
          <div className="bg-surface-container border border-lounge-gold/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-lounge-gold" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Skill-Gate</h3>
            </div>
            <p className="text-xs text-outline mb-6 leading-relaxed">Restrict entry based on verified professional credentials and portfolio metrics. When active, only "Verified Experts" may participate.</p>
            
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-outline-variant">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Gate Status</span>
              <div 
                className={`w-12 h-6 rounded-full relative cursor-pointer border transition-colors ${gateActive ? 'bg-lounge-gold/20 border-lounge-gold/50' : 'bg-surface-container-high border-outline-variant'}`}
                onClick={() => setGateActive(!gateActive)}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${gateActive ? 'bg-lounge-gold right-1' : 'bg-outline text-outline left-1'}`}></div>
              </div>
            </div>

            <div className={`space-y-4 transition-opacity ${gateActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-outline">Minimum Portfolio Score</span>
                <span className="text-lounge-gold font-bold">850+</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-outline">Industry Experience</span>
                <span className="text-lounge-gold font-bold">5Y+</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-outline">Manual Review Sync</span>
                <span className="text-lounge-gold font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Room Rules */}
          <div className="bg-surface-container border border-lounge-gold/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Room Rules</h3>
              <Sliders className="w-4 h-4 text-outline" />
            </div>

            <div className="space-y-6">
              {rules.map((rule) => (
                <div key={rule.id}>
                  <h4 className="text-[10px] font-bold text-lounge-gold uppercase tracking-widest mb-2 flex justify-between items-center">
                    {rule.title} 
                    {editingRule !== rule.id && (
                      <Edit2 className="w-3 h-3 text-outline cursor-pointer hover:text-lounge-gold transition-colors" onClick={() => handleEditRule(rule)} />
                    )}
                  </h4>
                  {editingRule === rule.id ? (
                    <div className="space-y-2">
                      <textarea 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-surface border border-lounge-gold/30 rounded p-2 text-xs text-on-surface focus:outline-none focus:border-lounge-gold min-h-[60px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingRule(null)} className="text-[10px] text-outline hover:text-on-surface uppercase tracking-widest font-bold px-2 py-1">Cancel</button>
                        <button onClick={() => saveRule(rule.id)} className="text-[10px] text-lounge-gold hover:text-lounge-gold/80 uppercase tracking-widest font-bold px-2 py-1">Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-outline leading-relaxed">{rule.content}</p>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                const newId = Math.max(...rules.map(r => r.id)) + 1;
                const newRule = { id: newId, title: `Rule ${newId}`, content: 'New rule description...' };
                setRules([...rules, newRule]);
                handleEditRule(newRule);
              }}
              className="w-full mt-6 py-3 border border-outline-variant rounded-lg text-[10px] font-bold text-outline uppercase tracking-widest hover:text-lounge-gold hover:border-lounge-gold/50 transition-colors"
            >
              Append New Protocol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoungeView;
