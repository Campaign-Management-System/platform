import React from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, Sparkles } from 'lucide-react';

export default function PointsDisplay({ points, studentName, showAnimation = true }) {
  return (
    <motion.div 
      initial={showAnimation ? { scale: 0.8, opacity: 0 } : {}}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8a] to-[#1e3a5f] rounded-3xl p-8 shadow-2xl"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37] opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#d4af37] opacity-10 rounded-full blur-2xl" />
      
      <div className="relative z-10 text-center">
        <motion.div
          initial={showAnimation ? { y: -20 } : {}}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-4"
        >
          <div className="bg-[#d4af37]/20 p-4 rounded-full">
            <Trophy className="w-12 h-12 text-[#d4af37]" />
          </div>
        </motion.div>

        {studentName && (
          <motion.p 
            initial={showAnimation ? { opacity: 0 } : {}}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-xl mb-2"
          >
            {studentName}
          </motion.p>
        )}

        <motion.div
          initial={showAnimation ? { scale: 0.5 } : {}}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          className="flex items-center justify-center gap-3"
        >
          <Sparkles className="w-8 h-8 text-[#d4af37]" />
          <span className="text-7xl font-black text-white">{points}</span>
          <Sparkles className="w-8 h-8 text-[#d4af37]" />
        </motion.div>

        <motion.p
          initial={showAnimation ? { opacity: 0, y: 20 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[#d4af37] text-2xl font-semibold mt-4"
        >
          נקודות
        </motion.p>

        {/* Stars decoration */}
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={showAnimation ? { opacity: 0, rotate: -180 } : {}}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <Star className="w-6 h-6 text-[#d4af37] fill-[#d4af37]" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}