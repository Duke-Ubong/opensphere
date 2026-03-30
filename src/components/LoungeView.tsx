import React, { useState, useEffect, useRef } from 'react';
import { Shield, User, Settings, LogOut, Search, MoreVertical, Paperclip, AtSign, Smile, Send, ChevronLeft, ChevronRight, CheckCircle, Fingerprint, Activity, Lock, Users, Sliders, AlertTriangle, RefreshCw, Edit2, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import CreateLoungeModal from './CreateLoungeModal';

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
    fetch('/api/lounges').then(res => res.json()).then(setLounges);
  }, []);

  const handleJoinLounge = (lounge: any) => {
    setActiveLounge(lounge);
    setActiveTab('gateway');
    setIsVerified(false);
    setVerificationProgress(0);
  };

  const handleLoungeCreated = (newLounge: any) => {
    setLounges([newLounge, ...lounges]);
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
    <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col md:flex-row text-white font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={`hidden md:flex w-64 bg-[#111111] border-r border-[#D4AF37]/20 flex-col shrink-0 ${activeTab === 'dashboard' ? '!hidden' : ''}`}>
        <div className="p-6 flex items-center gap-3 border-b border-[#D4AF37]/20">
          <Shield className="w-6 h-6 text-[#D4AF37]" />
          <div>
            <h1 className="text-lg font-bold text-[#D4AF37] tracking-wider">The Lounge</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-[#D4AF37]/70 uppercase tracking-widest mt-1">
              <Lock className="w-3 h-3" /> Deep Encryption Active
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <img src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100"} alt="User" className="w-10 h-10 rounded-lg border border-[#D4AF37]/30 object-cover" />
            <div>
              <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">Member Access</p>
              <p className="text-[10px] text-gray-400">Verified Professional</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('directory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'}`}
          >
            <List className="w-4 h-4" /> Directory
          </button>
          <button 
            onClick={() => { if(activeLounge) setActiveTab('gateway') }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'gateway' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'} ${!activeLounge && 'opacity-50 cursor-not-allowed'}`}
          >
            <Fingerprint className="w-4 h-4" /> Entry Gateway
          </button>
          <button 
            onClick={() => { if(activeLounge && isVerified) setActiveTab('dashboard') }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
          >
            <Activity className="w-4 h-4" /> Lounge Dashboard
          </button>
          <button 
            onClick={() => { if(activeLounge && isVerified) setActiveTab('console') }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'console' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
          >
            <Shield className="w-4 h-4" /> Curator's Console
          </button>
        </nav>

        <div className="p-4 border-t border-[#D4AF37]/20 space-y-2">
          <button onClick={() => toast('Lounge settings coming soon')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button onClick={onClose} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut className="w-4 h-4" /> Exit Lounge
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0A] min-w-0">
        {/* Top Navigation Bar (Mobile/Tablet) */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b border-[#D4AF37]/20 bg-[#111111] ${activeTab === 'dashboard' ? 'hidden' : ''}`}>
           <div className="flex gap-3 overflow-x-auto no-scrollbar flex-1 pb-1">
              <button 
                onClick={() => setActiveTab('directory')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'directory' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'}`}
              >
                <List className="w-3 h-3" /> Directory
              </button>
              <button 
                onClick={() => activeLounge && setActiveTab('gateway')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'gateway' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'} ${!activeLounge && 'opacity-50 cursor-not-allowed'}`}
              >
                <Fingerprint className="w-3 h-3" /> Gateway
              </button>
              <button 
                onClick={() => activeLounge && isVerified && setActiveTab('dashboard')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
              >
                <Activity className="w-3 h-3" /> Dashboard
              </button>
              <button 
                onClick={() => activeLounge && isVerified && setActiveTab('console')} 
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-lg transition-all ${activeTab === 'console' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30' : 'text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'} ${(!activeLounge || !isVerified) && 'opacity-50 cursor-not-allowed'}`}
              >
                <Shield className="w-3 h-3" /> Console
              </button>
           </div>
           <button onClick={onClose} className="ml-2 p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all shrink-0">
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
          <h2 className="text-4xl font-bold text-white tracking-tight mb-2">Lounge Directory</h2>
          <p className="text-gray-400 text-sm">Discover and join skill-gated professional environments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative" style={{ height: '50px', width: '342.354px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search lounges or skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full bg-[#111111] border border-gray-800 rounded-lg pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
            />
          </div>
          <button onClick={onCreate} className="bg-[#D4AF37] text-black px-6 h-[50px] rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#F3E5AB] transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)] shrink-0">
            Initialize Lounge
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLounges.map(lounge => (
          <div key={lounge.id} className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col hover:border-[#D4AF37]/50 transition-colors">
            <div className="flex justify-between items-start mb-4 gap-2">
              <h3 className="text-xl font-bold text-white leading-tight">{lounge.name}</h3>
              {lounge.is_temporary && <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded border border-red-500/20 shrink-0">OTR</span>}
            </div>
            <div className="mb-8 flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(lounge.skill_thresholds || {}).map(([skill, score]) => (
                  <span key={skill} className="px-2 py-1 bg-[#0A0A0A] border border-gray-800 rounded text-xs text-gray-300 flex items-center gap-2">
                    {skill} <span className="text-[#D4AF37] font-mono">{score as React.ReactNode}+</span>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => onJoin(lounge)} className="w-full py-3 bg-[#0A0A0A] border border-[#D4AF37]/30 text-[#D4AF37] rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#D4AF37]/10 transition-colors">
              Attempt Entry
            </button>
          </div>
        ))}
        {filteredLounges.length === 0 && (
          <div className="col-span-full p-12 text-center border border-dashed border-gray-800 rounded-2xl">
            <p className="text-gray-500 font-mono">No active lounges found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GatewayView = ({ lounge, isVerified, progress, onEnter }: { lounge: any, isVerified: boolean, progress: number, onEnter: () => void }) => (
  <div className="max-w-5xl mx-auto h-full flex flex-col px-4 md:px-0">
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-6">
        <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span> System: Online
      </div>
      <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 leading-none">
        {lounge.name}<br/><span className="text-[#D4AF37]">Gateway</span>
      </h2>
      <p className="text-gray-400 max-w-md text-sm leading-relaxed">
        Secure clearance check initiated. Align your biometric signature with the vault perimeter to proceed to the inner chambers.
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
      {/* Left Column */}
      <div className="space-y-6 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111111] border border-[#D4AF37]/20 p-6 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Clearance Level</p>
            <p className="text-2xl font-bold text-white">Tier Alpha</p>
          </div>
          <div className="bg-[#111111] border border-[#D4AF37]/20 p-6 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Neural Sync</p>
            <p className="text-2xl font-bold text-white">Active</p>
          </div>
        </div>
        
        <button 
          onClick={onEnter}
          disabled={!isVerified}
          className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${isVerified ? 'bg-[#D4AF37] text-black hover:bg-[#F3E5AB] shadow-[0_0_30px_rgba(212,175,55,0.3)]' : 'bg-[#111111] text-gray-500 border border-gray-800 cursor-not-allowed'}`}
        >
          {isVerified ? 'Initialize Access' : `Verifying... ${progress}%`}
          {isVerified && <ChevronRight className="w-5 h-5" />}
        </button>
        
        {isVerified && (
          <div className="text-center">
            <p className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-mono">Identity Hash</p>
            <p className="text-xs text-gray-500 font-mono mt-1">XF-990-221-DELTA</p>
          </div>
        )}
      </div>

      {/* Right Column - Scanner */}
      <div className="relative bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] overflow-hidden">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37]/50 m-6"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]/50 m-6"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]/50 m-6"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37]/50 m-6"></div>

        <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] font-mono text-gray-500 text-right">
          <div>
            <p>CORE_LOAD: 0.11ms</p>
            <p>LATENCY: 2ms</p>
            <p>ENCRYPTION: AES-256</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-12 z-10">
          {isVerified ? <CheckCircle className="w-6 h-6 text-[#D4AF37]" /> : <RefreshCw className="w-6 h-6 text-[#D4AF37] animate-spin" />}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Identity Status</p>
            <p className={`text-lg font-bold ${isVerified ? 'text-[#D4AF37]' : 'text-white'}`}>
              {isVerified ? 'Verification: Active' : 'Scanning Signature...'}
            </p>
          </div>
        </div>

        {/* Scanner Animation */}
        <div className="relative w-48 h-48 flex items-center justify-center z-10">
          <div className={`absolute inset-0 border border-[#D4AF37]/30 rotate-45 transition-all duration-1000 ${isVerified ? 'scale-110 opacity-50' : 'animate-pulse'}`}></div>
          <div className={`absolute inset-4 border border-[#D4AF37]/50 rotate-45 transition-all duration-1000 ${isVerified ? 'scale-105 opacity-80' : 'animate-pulse delay-75'}`}></div>
          
          <div className="w-32 h-32 bg-[#0A0A0A] border border-[#D4AF37] z-20 overflow-hidden relative flex items-center justify-center">
             {isVerified ? (
               <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" alt="Verified User" className="w-full h-full object-cover opacity-80 grayscale" />
             ) : (
               <Fingerprint className="w-16 h-16 text-[#D4AF37]/50" />
             )}
             {/* Scan Line */}
             {!isVerified && <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] animate-[scan_2s_ease-in-out_infinite]"></div>}
          </div>
        </div>

        <div className="mt-12 w-full max-w-xs z-10">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Expertise Vector</p>
                <p className="text-sm font-bold text-white">Skill Match: {progress}%</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">99.9% CERTAINTY</p>
          </div>
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#D4AF37] transition-all duration-300" style={{ width: `${progress}%` }}></div>
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0A]">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#111111] overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[#D4AF37]/20 flex justify-between items-center bg-[#111111] z-10 cursor-pointer hover:bg-[#1A1A1A] transition-colors">
          <div className="flex items-center gap-3 md:gap-4">
            {onBack && (
              <button 
                onClick={(e) => { e.stopPropagation(); onBack(); }}
                className="p-2 -ml-2 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-bold text-white truncate">{lounge.name}</h2>
              <p className="text-[10px] md:text-xs text-gray-400 flex items-center gap-1 truncate">
                {onlineUsers.length} members online
                {typingUsers.size > 0 && (
                  <span className="text-[#D4AF37] italic ml-2 truncate">
                    {Array.from(typingUsers).join(', ')} typing...
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4 shrink-0">
            <button onClick={() => toast('Search coming soon')} className="text-gray-400 hover:text-[#D4AF37] transition-colors p-2"><Search className="w-5 h-5" /></button>
            <button onClick={() => toast('More options coming soon')} className="text-gray-400 hover:text-[#D4AF37] transition-colors p-2"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-[#0A0A0A] relative">
          {/* Subtle background pattern could go here */}
          {connectionStatus !== 'connected' && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-500/10 text-yellow-500 text-xs text-center py-1 font-mono border-b border-yellow-500/20 z-20">
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection lost. Reconnecting...'}
            </div>
          )}
          
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <div className="bg-[#111111] p-4 rounded-xl border border-gray-800 text-center max-w-sm">
                <Lock className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-gray-400">Messages are end-to-end encrypted. No one outside of this chat, not even the server, can read them.</p>
              </div>
            </div>
          )}
          {messages.map(msg => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="bg-[#111111] text-gray-400 text-[10px] px-3 py-1 rounded-lg border border-gray-800/50 shadow-sm">
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
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 shrink-0 flex items-center justify-center text-[#D4AF37] font-bold uppercase text-xs mt-1">
                    {msg.author.substring(0, 2)}
                  </div>
                )}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-xs text-gray-400 ml-1 mb-1">{msg.author}</span>}
                  <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${isMe ? 'bg-[#D4AF37] text-black rounded-tr-sm' : 'bg-[#111111] border border-gray-800 text-gray-200 rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-black/60' : 'text-gray-500'}`}>
                      {timeLeft !== null && (
                        <span className="text-[9px] font-mono font-bold animate-pulse text-red-600">
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

        <div className="p-3 bg-[#111111] border-t border-[#D4AF37]/20">
          {lounge.is_temporary && (
            <div className="flex items-center justify-center mb-2">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-red-400 text-[9px] font-bold uppercase tracking-widest bg-red-400/10">
                <Lock className="w-3 h-3" /> OTR Active
              </div>
            </div>
          )}
          
          <div className="flex items-end gap-2 max-w-5xl mx-auto">
            <button onClick={() => toast('Emoji picker coming soon')} className="p-3 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5 shrink-0">
              <Smile className="w-6 h-6" />
            </button>
            <button onClick={() => toast('File upload coming soon')} className="p-3 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5 shrink-0">
              <Paperclip className="w-6 h-6" />
            </button>
            <div className="flex-1 bg-[#1A1A1A] rounded-2xl border border-gray-800 focus-within:border-[#D4AF37]/50 transition-colors flex items-center min-h-[44px]">
              <textarea 
                value={input}
                onChange={handleTyping}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message"
                className="w-full bg-transparent text-white text-sm px-4 py-3 focus:outline-none resize-none max-h-32"
                rows={1}
                disabled={connectionStatus !== 'connected'}
                style={{ height: 'auto' }}
              />
            </div>
            {input.trim() ? (
              <button 
                onClick={handleSend}
                disabled={connectionStatus !== 'connected'}
                className="p-3 bg-[#D4AF37] text-black rounded-full hover:bg-[#F3E5AB] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button onClick={() => toast('Voice messages coming soon')} className="p-3 text-gray-400 hover:text-[#D4AF37] transition-colors rounded-full hover:bg-white/5 shrink-0">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsoleView = ({ lounge }: { lounge: any }) => {
  const [dialValue, setDialValue] = useState(72);
  const [gateActive, setGateActive] = useState(true);
  const [rules, setRules] = useState([
    { id: 1, title: 'I. Total Discretion', content: 'What happens in the vault stays in the vault. Screenshots and leaks lead to permanent terminal termination.' },
    { id: 2, title: 'II. Intellectual Merit', content: 'Value is measured in expertise. Ad-hominem attacks are prohibited; dismantle arguments, not people.' },
    { id: 3, title: 'III. Raw Precision', content: 'Speak truthfully. Euphemisms are discouraged. At RAW 70+, blunt force reality is the standard.' }
  ]);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleDialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDialValue(parseInt(e.target.value));
  };

  const getStatusText = (val: number) => {
    if (val < 25) return 'Purely Professional';
    if (val < 50) return 'Filtered';
    if (val < 75) return 'Edgy';
    return 'Unfiltered Raw';
  };

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
        <h2 className="text-4xl font-bold text-white tracking-tight mb-2">{lounge.name} Console</h2>
        <p className="text-gray-400 text-sm">Master management of the digital environment. Define the atmosphere, set thresholds, and orchestrate the flow of elite discourse.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pb-8 custom-scrollbar">
        {/* Left Column - Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lounge Dial */}
          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-xl font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Lounge Dial</h3>
                <p className="text-xs text-gray-500">Real-time atmosphere calibration</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-[#D4AF37]">{dialValue}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Status: {getStatusText(dialValue)}</p>
              </div>
            </div>

            <div className="relative mb-8">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                <span className={dialValue < 25 ? 'text-[#D4AF37]' : ''}>Professional</span>
                <span className={dialValue >= 25 && dialValue < 50 ? 'text-[#D4AF37]' : ''}>Filtered</span>
                <span className={dialValue >= 50 && dialValue < 75 ? 'text-[#D4AF37]' : ''}>Edgy</span>
                <span className={dialValue >= 75 ? 'text-[#D4AF37]' : ''}>Raw</span>
              </div>
              <div className="relative h-2 w-full bg-gray-800 rounded-full flex items-center">
                <div className="absolute top-0 left-0 h-full bg-[#D4AF37] rounded-full" style={{ width: `${dialValue}%` }}></div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={dialValue} 
                  onChange={handleDialChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="absolute w-4 h-8 bg-[#D4AF37] rounded shadow-[0_0_15px_rgba(212,175,55,0.5)] pointer-events-none transition-all duration-75"
                  style={{ left: `calc(${dialValue}% - 8px)` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-800">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Keyword Sensitivity</p>
                <div className="h-1 w-full bg-gray-800 rounded-full"><div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${Math.max(10, 100 - dialValue)}%` }}></div></div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Media Restrictions</p>
                <div className="h-1 w-full bg-gray-800 rounded-full"><div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${Math.max(5, 100 - dialValue * 1.2)}%` }}></div></div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Auto-Moderation</p>
                <div className="h-1 w-full bg-gray-800 rounded-full"><div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${Math.max(0, 100 - dialValue * 1.5)}%` }}></div></div>
              </div>
            </div>
          </div>

          {/* Member Activity */}
          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest">Member Activity</h3>
              <button onClick={() => toast('Refreshing member list...')} className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-1 hover:text-[#D4AF37] transition-colors"><RefreshCw className="w-3 h-3" /> Refresh List</button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Julianna Thorne', role: 'Senior Strategist', tier: 'Contributor' },
                { name: 'Marcus Sterling', role: 'Creative Director', tier: 'Moderator' },
                { name: 'Elena Vance', role: 'Lead Architect', tier: 'Contributor' }
              ].map((member, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl hover:border-[#D4AF37]/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-[#D4AF37] font-bold uppercase">{member.name.substring(0, 2)}</div>
                    <div>
                      <p className="text-sm font-bold text-white">{member.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 bg-gray-900 border ${member.tier === 'Moderator' ? 'border-[#D4AF37]/50 text-[#D4AF37]' : 'border-gray-700 text-gray-400'} rounded text-[10px] font-bold uppercase tracking-widest`}>{member.tier}</span>
                    <button onClick={() => toast(`Warning sent to ${member.name}`)} className="text-gray-600 hover:text-red-500 transition-colors" title="Warn User"><AlertTriangle className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Rules */}
        <div className="space-y-6">
          {/* Skill-Gate */}
          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Skill-Gate</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">Restrict entry based on verified professional credentials and portfolio metrics. When active, only "Verified Experts" may participate.</p>
            
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-800">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Gate Status</span>
              <div 
                className={`w-12 h-6 rounded-full relative cursor-pointer border transition-colors ${gateActive ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50' : 'bg-gray-800 border-gray-700'}`}
                onClick={() => setGateActive(!gateActive)}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${gateActive ? 'bg-[#D4AF37] right-1' : 'bg-gray-500 left-1'}`}></div>
              </div>
            </div>

            <div className={`space-y-4 transition-opacity ${gateActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Minimum Portfolio Score</span>
                <span className="text-[#D4AF37] font-bold">850+</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Industry Experience</span>
                <span className="text-[#D4AF37] font-bold">5Y+</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Manual Review Sync</span>
                <span className="text-[#D4AF37] font-bold">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Room Rules */}
          <div className="bg-[#111111] border border-[#D4AF37]/20 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Room Rules</h3>
              <Sliders className="w-4 h-4 text-gray-500" />
            </div>

            <div className="space-y-6">
              {rules.map((rule) => (
                <div key={rule.id}>
                  <h4 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2 flex justify-between items-center">
                    {rule.title} 
                    {editingRule !== rule.id && (
                      <Edit2 className="w-3 h-3 text-gray-600 cursor-pointer hover:text-[#D4AF37] transition-colors" onClick={() => handleEditRule(rule)} />
                    )}
                  </h4>
                  {editingRule === rule.id ? (
                    <div className="space-y-2">
                      <textarea 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-gray-900 border border-[#D4AF37]/30 rounded p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37] min-h-[60px]"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingRule(null)} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold px-2 py-1">Cancel</button>
                        <button onClick={() => saveRule(rule.id)} className="text-[10px] text-[#D4AF37] hover:text-[#F3E5AB] uppercase tracking-widest font-bold px-2 py-1">Save</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 leading-relaxed">{rule.content}</p>
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
              className="w-full mt-6 py-3 border border-gray-700 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors"
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
