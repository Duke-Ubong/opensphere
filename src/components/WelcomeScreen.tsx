import React from 'react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  onInitialize: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onInitialize }) => {
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

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,255,171,0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onInitialize}
          className="bg-[#00FFAB] text-[#003822] px-8 sm:px-12 py-3 sm:py-4 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm transition-all cursor-pointer rounded-sm"
        >
          Initialize
        </motion.button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
