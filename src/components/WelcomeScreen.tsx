import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface WelcomeScreenProps {
  onInitialize: (user: any) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onInitialize }) => {
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = mode === 'login' ? { email, password } : { username, email, password, occupation };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
        onInitialize(data);
      } else {
        toast.error(data.error || 'Authentication failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center relative overflow-hidden font-body text-white">
      {/* Top Nav */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute top-0 w-full p-6 flex justify-between items-center"
      >
        <div className="flex items-center gap-2 text-[#00FFAB] font-bold text-xl tracking-tighter">
          <div className="w-6 h-6 relative">
            <div className="absolute inset-0 border-2 border-current rounded-full"></div>
            <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-current rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-1 left-0 w-1.5 h-1.5 bg-current rounded-full -translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute bottom-1 right-0 w-1.5 h-1.5 bg-current rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          OpenSphere
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col items-center z-10 w-full px-4 max-w-md">
        <AnimatePresence mode="wait">
          {mode === 'welcome' ? (
            <motion.div
              key="welcome-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center"
            >
              <div className="mb-12 relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border border-[#00FFAB]/20 bg-[#00FFAB]/5 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,171,0.1)]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-[#00FFAB] shadow-[0_0_20px_rgba(0,255,171,0.5)]"></div>
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-[0.1em] sm:tracking-[0.2em] mb-6 text-center">
                OPENSPHERE
              </h1>

              <p className="text-[#849589] tracking-[0.15em] sm:tracking-[0.3em] text-[10px] sm:text-xs uppercase mb-12 text-center">
                The Next-Gen Professional Ecosystem
              </p>

              <div className="flex flex-col gap-4 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('login')}
                  className="bg-[#00FFAB] text-[#003822] w-full py-4 font-bold tracking-[0.2em] uppercase text-xs transition-all cursor-pointer rounded-sm"
                >
                  Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('signup')}
                  className="border border-[#00FFAB] text-[#00FFAB] w-full py-4 font-bold tracking-[0.2em] uppercase text-xs transition-all cursor-pointer rounded-sm"
                >
                  Join the Network
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 shadow-2xl"
            >
              <h2 className="text-2xl font-black tracking-tighter mb-6 uppercase text-[#00FFAB]">
                {mode === 'login' ? 'Terminal Login' : 'Create Node'}
              </h2>
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Username</label>
                      <input 
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-[#00FFAB] transition-colors outline-none"
                        placeholder="marcus_vance"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Occupation</label>
                      <input 
                        required
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-[#00FFAB] transition-colors outline-none"
                        placeholder="Systems Architect"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Email</label>
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-[#00FFAB] transition-colors outline-none"
                    placeholder="marcus@opensphere.io"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Password</label>
                  <input 
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm focus:border-[#00FFAB] transition-colors outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  disabled={isLoading}
                  className="w-full bg-[#00FFAB] text-[#003822] py-4 font-bold tracking-[0.2em] uppercase text-xs rounded-sm mt-4 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : mode === 'login' ? 'Initialize' : 'Establish Node'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-[#00FFAB] transition-colors"
                >
                  {mode === 'login' ? "Don't have a node? Create one" : "Already have a node? Login"}
                </button>
                <div className="mt-4">
                  <button 
                    onClick={() => setMode('welcome')}
                    className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                  >
                    Back to Start
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WelcomeScreen;
