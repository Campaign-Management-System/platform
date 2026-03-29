import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { CreditCard, Scan } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CardScanner({ onCardScanned, placeholder = "העבר כרטיס או הקלד מספר...", autoFocus = true }) {
  const [cardNumber, setCardNumber] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && cardNumber.trim()) {
      onCardScanned(cardNumber.trim());
      setCardNumber('');
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setCardNumber(value);
    
    // Auto-submit for magnetic card readers that add Enter at the end
    // or if the card number reaches a certain length (e.g., 10 digits)
    if (value.length >= 10 && /^\d+$/.test(value)) {
      setTimeout(() => {
        onCardScanned(value.trim());
        setCardNumber('');
      }, 100);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] to-[#d4af37] rounded-2xl blur opacity-20" />
        <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] p-3 rounded-xl">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1e3a5f] text-lg">סריקת כרטיס</h3>
              <p className="text-gray-500 text-sm">העבר את הכרטיס המגנטי או הקלד ידנית</p>
            </div>
          </div>

          <div className="relative">
            <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              value={cardNumber}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="pr-12 py-6 text-xl text-center font-mono bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#1e3a5f] focus:ring-[#1e3a5f] transition-all"
              dir="ltr"
            />
          </div>

          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-4 text-center text-sm text-gray-400"
          >
            ממתין לסריקה...
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}