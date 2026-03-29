import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  Star, 
  CreditCard,
  Clock,
  Gift,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

export default function StudentPortal() {
  const [campaignId, setCampaignId] = useState(null);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [cardInput, setCardInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCampaignId(params.get('id'));
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['students', campaignId],
    queryFn: () => base44.entities.Student.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['studentTransactions', scannedStudent?.id],
    queryFn: () => base44.entities.Transaction.filter({ student_id: scannedStudent?.id }, '-created_date', 10),
    enabled: !!scannedStudent?.id,
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['settings', campaignId],
    queryFn: () => base44.entities.Settings.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const setting = settings[0];

  // Countdown timer
  useEffect(() => {
    if (scannedStudent && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleClose();
    }
  }, [scannedStudent, countdown]);

  // Focus on input when no student
  useEffect(() => {
    if (!scannedStudent && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scannedStudent]);

  const handleCardInput = (value) => {
    setCardInput(value);
    
    // אם הקלט ארוך מספיק וכולל רק ספרות - בדוק מיד
    if (value.length >= 5 && /^\d+$/.test(value)) {
      const student = students.find(s => s.card_number === value);
      if (student) {
        setScannedStudent(student);
        setCountdown(60);
        setCardInput('');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && cardInput) {
      const student = students.find(s => s.card_number === cardInput);
      if (student) {
        setScannedStudent(student);
        setCountdown(60);
        setCardInput('');
      }
    }
  };

  const handleClose = () => {
    setScannedStudent(null);
    setShowHistory(false);
    setCountdown(60);
    setCardInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resetTimer = () => {
    setCountdown(60);
  };

  const typeConfig = {
    add: { icon: TrendingUp, color: 'text-green-500', label: 'הוספת נקודות' },
    subtract: { icon: TrendingDown, color: 'text-red-500', label: 'הורדת נקודות' },
    prize_redemption: { icon: Gift, color: 'text-purple-500', label: 'מימוש פרס' },
    card_replacement: { icon: RefreshCw, color: 'text-blue-500', label: 'החלפת כרטיס' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {setting?.logo_url ? (
              <img src={setting.logo_url} alt="" className="h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
                <Star className="w-5 h-5 text-[#d4af37]" />
              </div>
            )}
            <span className="font-bold text-[#1e3a5f]">צפייה בנקודות</span>
          </div>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!scannedStudent ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="overflow-hidden">
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-6"
                  >
                    <CreditCard className="w-24 h-24 mx-auto text-[#1e3a5f]" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">העבר את הכרטיס</h2>
                  <p className="text-gray-500 mb-6">או הקלד את מספר הכרטיס</p>
                  
                  <Input
                    ref={inputRef}
                    value={cardInput}
                    onChange={(e) => handleCardInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="מספר כרטיס..."
                    className="text-center text-xl py-6 font-mono max-w-xs mx-auto"
                    dir="ltr"
                    autoFocus
                  />
                  
                  <p className="text-sm text-gray-400 mt-4 animate-pulse">
                    ממתין לסריקה...
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="student"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Points Display */}
              <Card className="overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] text-white">
                <CardContent className="p-8 text-center relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={handleClose}
                  >
                    <X className="w-5 h-5" />
                  </Button>

                  <p className="text-xl opacity-90 mb-2">
                    {scannedStudent.first_name} {scannedStudent.last_name}
                  </p>
                  
                  <div className="flex items-center justify-center gap-3 my-6">
                    <Star className="w-10 h-10 text-[#d4af37]" />
                    <span className="text-6xl font-bold">{scannedStudent.points || 0}</span>
                  </div>
                  
                  <p className="text-lg opacity-80">נקודות</p>

                  {/* Timer */}
                  <div className="mt-6 flex items-center justify-center gap-2 text-white/70">
                    <Clock className="w-4 h-4" />
                    <span>נסגר בעוד {countdown} שניות</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white p-1 h-auto"
                      onClick={resetTimer}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* History Toggle */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'הסתר היסטוריה' : 'הצג היסטוריה אחרונה'}
              </Button>

              {/* Transaction History */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-[#1e3a5f] mb-4">היסטוריה אחרונה</h3>
                        <div className="space-y-3">
                          {recentTransactions.map((t) => {
                            const config = typeConfig[t.type] || typeConfig.add;
                            const Icon = config.icon;
                            return (
                              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Icon className={`w-5 h-5 ${config.color}`} />
                                  <div>
                                    <p className="font-medium text-sm">{config.label}</p>
                                    {t.prize_name && (
                                      <p className="text-xs text-gray-500">{t.prize_name}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className={`font-bold ${t.points_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.points_change >= 0 ? '+' : ''}{t.points_change}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {moment(t.created_date).format('DD/MM HH:mm')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {recentTransactions.length === 0 && (
                            <p className="text-center text-gray-500 py-4">אין היסטוריה</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close Button */}
              <Button
                onClick={handleClose}
                className="w-full bg-[#1e3a5f]"
              >
                סיום
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}