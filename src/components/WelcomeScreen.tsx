import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { seedDatabase } from '../seed';
import { toast } from 'sonner';

interface WelcomeScreenProps {
  onInitialize: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onInitialize }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userId = 'test-user-' + username.trim().toLowerCase().replace(/\s+/g, '-');
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(doc(db, 'users', userId), {
          id: userId,
          username: username.trim(),
          email: `${username.trim().toLowerCase().replace(/\s+/g, '')}@test.local`,
          professional_bio: 'New to OpenSphere',
          is_verified: false,
          exposure_dial: 50,
          nodes: 0,
          trust_score: 50,
          following: [],
          credentials: [],
          documents: []
        });
      } else {
        // Update username
        await setDoc(doc(db, 'users', userId), {
          username: username.trim()
        }, { merge: true });
      }
      
      localStorage.setItem('test_user_id', userId);
      
      await seedDatabase(); // Ensure mock data exists after auth
      toast.success('Authentication successful');
      onInitialize();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to authenticate');
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
      <div className="flex flex-col items-center z-10 w-full px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-12 relative"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border border-[#00FFAB]/20 bg-[#00FFAB]/5 flex items-center justify-center shadow-[0_0_50px_rgba(0,255,171,0.1)]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-[#00FFAB] shadow-[0_0_20px_rgba(0,255,171,0.5)]"></div>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[0.1em] sm:tracking-[0.2em] mb-6 text-center"
        >
          OPENSPHERE
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-[#849589] tracking-[0.15em] sm:tracking-[0.3em] text-[10px] sm:text-xs md:text-sm uppercase mb-12 sm:mb-16 text-center"
        >
          The Next-Gen Professional Ecosystem
        </motion.p>

        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-col gap-4 w-full max-w-md"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ENTER USERNAME"
            className="w-full bg-[#1C1B1B] border border-[#3A4A40]/30 text-white px-6 py-4 font-mono text-sm tracking-widest uppercase focus:outline-none focus:border-[#00FFAB] transition-colors text-center placeholder:text-[#849589]/50"
          />
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full bg-[#00FFAB] text-black px-6 py-4 font-bold tracking-[0.1em] uppercase text-xs sm:text-sm transition-all cursor-pointer rounded-sm hover:bg-[#00FFAB]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Enter Sphere'}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default WelcomeScreen;
