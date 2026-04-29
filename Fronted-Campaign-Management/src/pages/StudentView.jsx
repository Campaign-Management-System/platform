import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, History, ArrowUpCircle, ArrowDownCircle, Gift, RefreshCw, Clock, AlertCircle, Trophy, Crown, CreditCard, X, Star, Medal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import Logo from '@/components/ui/Logo';
import StudentIdentifier from '@/components/ui/StudentIdentifier';
import PointsDisplay from '@/components/ui/PointsDisplay';

// --- פונקציות עזר ללוגיקה (ללא שינוי) ---
const getScanCount = (studentId) => {
  const today = moment().format('YYYY-MM-DD');
  const scanHistory = JSON.parse(localStorage.getItem('scan_history') || '{}');
  return (scanHistory[today] && scanHistory[today][studentId]) || 0;
};

const incrementScanCount = (studentId) => {
  const today = moment().format('YYYY-MM-DD');
  const scanHistory = JSON.parse(localStorage.getItem('scan_history') || '{}');
  if (!scanHistory[today]) scanHistory[today] = {};
  scanHistory[today][studentId] = (scanHistory[today][studentId] || 0) + 1;
  localStorage.setItem('scan_history', JSON.stringify(scanHistory));
};

const RankTicker = ({ students }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (students.length <= 1) return;
    const interval = setInterval(() => setIndex(prev => (prev + 1) % students.length), 3000);
    return () => clearInterval(interval);
  }, [students]);
  return (
    <div className="relative h-5 overflow-hidden w-full flex items-center text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={students[index].id}
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -15, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 w-full"
        >
          <p className="font-black text-[12px] truncate leading-none uppercase tracking-wide">
            {students[index].first_name} {students[index].last_name}
          </p>
          {students.length > 1 && (
            <span className="text-[8px] bg-blue-500/40 text-blue-200 px-1.5 py-0.5 rounded-full font-bold shrink-0">תיקו</span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- רכיב הפרסים הצפים - צבעי ניאון בולטים על רקע כהה (z-index 9999) ---
const FloatingItemsOverlay = () => {
  const items = [Gift, Star, Trophy, Medal, Sparkles];
  const particles = useMemo(() => [...Array(22)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 20,
    duration: 12 + Math.random() * 10,
    size: 20 + Math.random() * 35,
    icon: items[i % items.length],
    // צבעי ניאון בולטים
    color: ['text-cyan-400', 'text-yellow-400', 'text-fuchsia-400', 'text-lime-400', 'text-orange-400'][i % 5]
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "110vh", x: p.x + "vw", opacity: 0, rotate: 0 }}
          animate={{ 
            y: "-20vh", 
            opacity: [0, 1, 1, 0],
            x: [p.x + "vw", (p.x + (p.id % 2 === 0 ? 8 : -8)) + "vw"], 
            rotate: 360
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
          className={`absolute ${p.color} drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
          style={{ left: 0 }}
        >
          <p.icon size={p.size} strokeWidth={1.5} />
        </motion.div>
      ))}
    </div>
  );
};

export default function StudentView() {
  const [scannedStudent, setScannedStudent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const keepFocus = () => {
      const input = document.querySelector('input');
      if (input && document.activeElement !== input) input.focus();
    };
    const interval = setInterval(keepFocus, 500);
    window.addEventListener('click', keepFocus);
    return () => { clearInterval(interval); window.removeEventListener('click', keepFocus); };
  }, []);

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
    refetchInterval: 20000,
  });

  const { data: classes = [] } = useQuery({ 
    queryKey: ['classes'], 
    queryFn: () => base44.entities.Class.list(),
    refetchInterval: 60000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
    enabled: !!scannedStudent,
  });

  const topRanks = useMemo(() => {
    const activeWithPoints = students.filter(s => s.is_active !== false && (s.points || 0) > 0);
    const uniqueScores = [...new Set(activeWithPoints.map(s => s.points))].sort((a, b) => b - a).slice(0, 3);
    return uniqueScores.map((score, idx) => ({
      score, idx, students: activeWithPoints.filter(s => s.points === score)
    }));
  }, [students]);

  const topClass = useMemo(() => {
    if (!classes.length || !students.length) return null;
    return classes.map(cls => ({
      ...cls,
      totalPoints: students.filter(s => s.class_id === cls.id).reduce((sum, s) => sum + (s.points || 0), 0),
    })).sort((a, b) => b.totalPoints - a.totalPoints)[0];
  }, [students, classes]);

  useEffect(() => {
    if (scannedStudent && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerRef.current);
    } else if (timeLeft === 0) {
      handleReset();
    }
  }, [scannedStudent, timeLeft]);

  const handleReset = () => {
    setScannedStudent(null);
    setTimeLeft(10);
  };

  const handleStudentIdentify = (value) => {
    setError(null);
    if (!value) return;
    const student = students.find(s => s.card_number === value || s.id_number === value);
    if (!student) { setError("הנתון לא נמצא במערכת."); return; }
    if (getScanCount(student.id) >= 3) { setError("מגבלה יומית נוצלה (3 סריקות)."); return; }
    incrementScanCount(student.id);
    setScannedStudent(student);
    setTimeLeft(10); 
  };

  const studentTransactions = transactions.filter(t => t.student_id === scannedStudent?.id).slice(0, 8);

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col font-sans text-right overflow-hidden px-4 relative" dir="rtl">
      
      {/* רקע עננים (Aurora) מונפש */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.3, 1], x: [-50, 50, -50] }} transition={{ duration: 15, repeat: Infinity }} className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-indigo-900/30 blur-[120px] rounded-full" />
        <motion.div animate={{ scale: [1, 1.2, 1], x: [50, -50, 50] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-purple-900/20 blur-[120px] rounded-full" />
      </div>

      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10 px-6 py-2 shadow-2xl shrink-0 rounded-b-2xl mb-4 z-10 relative">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <Logo size="small" />
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="xs" className="gap-1 font-bold text-slate-400 hover:text-white hover:bg-white/5 h-8">
              <Home className="w-3.5 h-3.5" /> תפריט
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden pb-6 z-10 relative">
        
        {/* טור מובילים - מראה Glassmorphism כהה */}
        <aside className="md:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
          {topClass && topClass.totalPoints > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-gradient-to-br from-blue-600/80 to-indigo-700/80 p-4 rounded-3xl shadow-2xl shrink-0 border border-white/20">
              <div className="flex flex-col gap-1 text-white">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-300 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">הכיתה המובילה</p>
                </div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black truncate">{topClass.name}</h2>
                  <div className="bg-white/20 px-2.5 py-1 rounded-xl text-xs font-black">{topClass.totalPoints.toLocaleString()}</div>
                </div>
              </div>
            </motion.div>
          )}

          {topRanks.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-5 shadow-2xl flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-5 shrink-0 border-b border-white/5 pb-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-xs text-slate-200 uppercase tracking-wider">טבלת האלופים</h3>
              </div>
              <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {topRanks.map((rank) => {
                  const MedalIcon = rank.idx === 0 ? Trophy : rank.idx === 1 ? Medal : Star;
                  const colors = [
                    { bg: 'from-amber-500/20 to-yellow-500/5', border: 'border-amber-500/30', icon: 'text-amber-400', badge: 'bg-amber-500' },
                    { bg: 'from-slate-400/20 to-slate-400/5', border: 'border-slate-400/30', icon: 'text-slate-300', badge: 'bg-slate-500' },
                    { bg: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30', icon: 'text-orange-400', badge: 'bg-orange-600' }
                  ][rank.idx];
                  return (
                    <motion.div layout key={rank.score} className={`flex flex-col gap-3 p-4 rounded-2xl bg-gradient-to-l ${colors.bg} border ${colors.border} shadow-lg backdrop-blur-md`}>
                      <div className="flex items-center gap-3 relative z-10">
                        <MedalIcon className={`w-4 h-4 ${colors.icon}`} />
                        <RankTicker students={rank.students} />
                      </div>
                      <div className="flex justify-between items-center px-1 relative z-10">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">נקודות</span>
                        <div className={`${colors.badge} text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg`}>{rank.score.toLocaleString()}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </aside>

        {/* טור סריקה מרכזי - מראה טכנולוגי כהה */}
        <section className={`flex flex-col transition-all duration-500 h-full ${scannedStudent ? 'md:col-span-5' : 'md:col-span-9'} items-center justify-center`}>
          <AnimatePresence mode="wait">
            {!scannedStudent ? (
              <motion.div key="scan" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl h-full flex items-center justify-center">
                <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[4rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 w-full p-12 relative text-center overflow-hidden">
                  
                  {/* אפקט הילה פנימית */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />

                  <div className="w-full max-w-sm absolute -top-4 right-1/2 translate-x-1/2 h-[50px] z-20">
                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <Alert className="rounded-2xl border-none py-3 shadow-2xl bg-red-500/90 text-white backdrop-blur-xl">
                            <AlertCircle className="h-5 w-5 ml-2" />
                            <AlertDescription className="font-bold text-sm text-right">{error}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div animate={{ y: [0, -12, 0], filter: ['drop-shadow(0 0 10px rgba(59,130,246,0.3))', 'drop-shadow(0 0 25px rgba(59,130,246,0.6))', 'drop-shadow(0 0 10px rgba(59,130,246,0.3))'] }} transition={{ repeat: Infinity, duration: 4 }} className="bg-blue-600 w-24 h-24 rounded-[2.2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-blue-400/50">
                    <CreditCard className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <h3 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-md">בדיקת יתרה</h3>
                  <p className="text-slate-400 text-xs font-bold mb-10 uppercase tracking-[0.3em] opacity-60">Scan Student Card</p>
                  
                  <div className="w-full max-w-sm mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl overflow-hidden border border-white/5">
                    <StudentIdentifier onIdentify={handleStudentIdentify} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl h-full flex flex-col gap-5 justify-center">
                <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-2xl px-6 py-3.5 rounded-[2rem] border border-white/10 shadow-2xl shrink-0">
                  <div className="flex gap-4">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg">
                      <Clock className="w-4 h-4" /> {timeLeft} ש'
                    </div>
                    <div className="bg-white/5 text-slate-300 px-4 py-2 rounded-xl font-black text-xs border border-white/10">
                      סריקות: {3 - getScanCount(scannedStudent.id)}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="font-black text-slate-400 hover:text-red-400 rounded-xl transition-all" onClick={handleReset}>ביטול <X className="mr-1 w-4 h-4" /></Button>
                </div>
                <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/10 p-8 shadow-2xl">
                  <PointsDisplay points={scannedStudent.points || 0} studentName={`${scannedStudent.first_name} ${scannedStudent.last_name}`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* טור היסטוריה - Dark Glass */}
        <AnimatePresence>
          {scannedStudent && (
            <motion.aside initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="md:col-span-4 flex flex-col overflow-hidden h-full">
              <Card className="bg-slate-900/80 backdrop-blur-2xl text-white border-none rounded-[3rem] shadow-[0_0_40px_rgba(0,0,0,0.4)] flex-1 overflow-hidden flex flex-col border border-white/10">
                <div className="px-6 py-5 border-b border-white/10 bg-white/5 flex items-center gap-3 font-bold text-xs shrink-0 tracking-widest uppercase text-blue-400">
                  <History className="w-5 h-5" /> היסטוריה
                </div>
                <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                  {studentTransactions.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {studentTransactions.map((t, i) => {
                        const config = { add: { icon: ArrowUpCircle, color: 'text-green-400' }, subtract: { icon: ArrowDownCircle, color: 'text-red-400' }, prize_redemption: { icon: Gift, color: 'text-purple-400' }, card_replacement: { icon: RefreshCw, color: 'text-blue-400' } }[t.type] || { icon: ArrowUpCircle, color: 'text-green-400' };
                        return (
                          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} key={t.id} className="p-5 flex justify-between items-center hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4 text-right min-w-0">
                              <div className={`p-2.5 rounded-2xl bg-white/5 ${config.color} shadow-inner`}><config.icon size={20} /></div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-100 truncate">{t.prize_name || "עדכון ידני"}</p>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">{moment(t.created_date).format('DD/MM HH:mm')}</p>
                              </div>
                            </div>
                            <span className={`text-base font-black tabular-nums mr-4 ${t.points_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {t.points_change >= 0 ? '+' : ''}{t.points_change}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50"><p className="text-sm font-bold tracking-widest italic">אין פעולות</p></div>
                  )}
                </CardContent>
              </Card>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* שכבת הפרסים הצפה - מעל הכל ובצבעי ניאון */}
      <FloatingItemsOverlay />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}