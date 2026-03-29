import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Star, 
  Gift, 
  Check, 
  ArrowRight,
  Home,
  Play,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Demo() {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [studentPoints, setStudentPoints] = useState(150);

  const demoStudent = {
    name: 'יוסי כהן',
    class: 'כיתה ד\'',
    cardNumber: '1234567890'
  };

  const demoPrizes = [
    { name: 'ממתק', points: 10, available: true },
    { name: 'צעצוע קטן', points: 30, available: true },
    { name: 'משחק קופסה', points: 100, available: true },
  ];

  const steps = [
    { 
      title: 'סריקת כרטיס',
      desc: 'התלמיד מעביר את הכרטיס המגנטי',
      content: 'scan'
    },
    { 
      title: 'הצגת יתרה',
      desc: 'הנקודות מוצגות מיידית',
      content: 'points'
    },
    { 
      title: 'בחירת פרס',
      desc: 'המוכר בוחר פרס מתאים',
      content: 'prizes'
    },
    { 
      title: 'אישור מימוש',
      desc: 'אישור ומסירת הפרס',
      content: 'confirm'
    },
    { 
      title: 'הושלם!',
      desc: 'הנקודות ירדו והפרס נמסר',
      content: 'done'
    },
  ];

  useEffect(() => {
    if (isPlaying && step < steps.length - 1) {
      const timer = setTimeout(() => {
        setStep(prev => prev + 1);
        if (step === 3) {
          setStudentPoints(50); // After redeeming 100 point prize
        }
      }, 2500);
      return () => clearTimeout(timer);
    } else if (step === steps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, step]);

  const startDemo = () => {
    setStep(0);
    setStudentPoints(150);
    setIsPlaying(true);
  };

  const resetDemo = () => {
    setStep(0);
    setStudentPoints(150);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1e3a5f]">הדגמת המערכת</h1>
          <Link to={createPageUrl('Landing')}>
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              חזרה
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
          {steps.map((s, index) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center min-w-[80px]">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  index <= step 
                    ? 'bg-[#1e3a5f] text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < step ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`text-xs mt-2 text-center ${index <= step ? 'text-[#1e3a5f] font-medium' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 w-8 mx-2 rounded ${index < step ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Demo Content */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8a] text-white p-4">
              <h2 className="text-lg font-bold">{steps[step].title}</h2>
              <p className="opacity-80 text-sm">{steps[step].desc}</p>
            </div>

            <div className="p-8 min-h-[300px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {steps[step].content === 'scan' && (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="mb-6"
                    >
                      <CreditCard className="w-24 h-24 mx-auto text-[#1e3a5f]" />
                    </motion.div>
                    <p className="text-gray-600">מעבירים את הכרטיס בקורא...</p>
                    <p className="text-sm text-gray-400 mt-2 font-mono">{demoStudent.cardNumber}</p>
                  </motion.div>
                )}

                {steps[step].content === 'points' && (
                  <motion.div
                    key="points"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] rounded-2xl p-8 text-white shadow-xl">
                      <p className="text-lg opacity-80 mb-2">{demoStudent.name}</p>
                      <p className="text-sm opacity-60 mb-4">{demoStudent.class}</p>
                      <div className="flex items-center justify-center gap-3">
                        <Star className="w-8 h-8 text-[#d4af37]" />
                        <span className="text-5xl font-bold">{studentPoints}</span>
                      </div>
                      <p className="text-sm opacity-60 mt-2">נקודות</p>
                    </div>
                  </motion.div>
                )}

                {steps[step].content === 'prizes' && (
                  <motion.div
                    key="prizes"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-full max-w-sm"
                  >
                    <div className="space-y-3">
                      {demoPrizes.map((prize, index) => (
                        <motion.div
                          key={prize.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            prize.points === 100 
                              ? 'border-[#1e3a5f] bg-[#1e3a5f]/5' 
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Gift className={`w-5 h-5 ${prize.points === 100 ? 'text-[#1e3a5f]' : 'text-gray-400'}`} />
                              <span className="font-medium">{prize.name}</span>
                            </div>
                            <Badge variant={prize.points === 100 ? 'default' : 'secondary'}>
                              {prize.points} נק׳
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-4">
                      נבחר: משחק קופסה (100 נקודות)
                    </p>
                  </motion.div>
                )}

                {steps[step].content === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center max-w-sm"
                  >
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                      <p className="text-gray-600 mb-2">פרס: <strong>משחק קופסה</strong></p>
                      <p className="text-gray-600 mb-2">עלות: <strong className="text-red-600">-100 נקודות</strong></p>
                      <div className="border-t pt-4 mt-4">
                        <p className="text-gray-600">יתרה לאחר מימוש:</p>
                        <p className="text-2xl font-bold text-[#1e3a5f]">50 נקודות</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Button className="bg-[#1e3a5f]">
                        <Check className="w-4 h-4 ml-2" />
                        מאשר מימוש
                      </Button>
                    </motion.div>
                  </motion.div>
                )}

                {steps[step].content === 'done' && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
                    >
                      <Check className="w-12 h-12 text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[#1e3a5f] mb-2">הפעולה הושלמה!</h3>
                    <p className="text-gray-600 mb-6">
                      {demoStudent.name} קיבל משחק קופסה
                      <br />
                      <span className="text-sm text-gray-400">יתרה חדשה: 50 נקודות</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-8">
          {!isPlaying ? (
            <>
              <Button onClick={startDemo} size="lg" className="bg-[#1e3a5f] gap-2">
                <Play className="w-5 h-5" />
                {step === 0 ? 'התחל הדגמה' : 'המשך הדגמה'}
              </Button>
              {step > 0 && (
                <Button onClick={resetDemo} size="lg" variant="outline" className="gap-2">
                  <RotateCcw className="w-5 h-5" />
                  התחל מחדש
                </Button>
              )}
            </>
          ) : (
            <Button onClick={() => setIsPlaying(false)} size="lg" variant="outline">
              עצור
            </Button>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">רוצים לנסות את המערכת?</p>
          <Link to={createPageUrl('Landing')}>
            <Button size="lg" className="bg-[#d4af37] hover:bg-[#c9a32f] text-[#1e3a5f]">
              קבל הצעת מחיר
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}