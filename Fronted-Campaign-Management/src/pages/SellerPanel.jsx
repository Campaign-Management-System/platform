import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Home, 
  Gift, 
  Star, 
  CreditCard,
  Minus,
  Check,
  X,
  AlertCircle,
  LogOut,
  ShoppingCart,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Logo from '@/components/ui/Logo';
import PointsDisplay from '@/components/ui/PointsDisplay';
import StudentIdentifier from '@/components/ui/StudentIdentifier';

export default function SellerPanel() {
  const queryClient = useQueryClient();
  const [scannedStudent, setScannedStudent] = useState(null);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [manualPoints, setManualPoints] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState(null);
  const [isCartBumping, setIsCartBumping] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: prizes = [] } = useQuery({
    queryKey: ['prizes'],
    queryFn: () => base44.entities.Prize.list(),
  });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // לוגיקה לקיבוץ פריטים בסל לפי כמות
  const groupedCart = cart.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = { ...item, quantity: 0 };
    }
    acc[item.id].quantity += 1;
    return acc;
  }, {});

  const cartItemsArray = Object.values(groupedCart);
  const cartTotalPoints = cart.reduce((sum, item) => sum + item.points_cost, 0);

  const availablePrizes = prizes.filter(p => p.is_available && (p.stock > 0 || p.stock === null || p.stock === undefined));

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
    }
  });

  const updatePrizeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Prize.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prizes']);
    }
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
    }
  });

  const handleStudentIdentify = (value) => {
    setError(null);
    if (!value) return;
    const student = students.find(s => s.card_number === value || s.id_number === value);
    if (!student) {
      setError("הנתון לא נמצא במערכת. פנה להנהלה.");
      return;
    }
    setScannedStudent(student);
  };

  const handleCloseStudent = () => {
    setScannedStudent(null);
    setCart([]);
  };

  const handleSelectPrize = (prize) => {
    if (!scannedStudent) {
      toast.error('יש לסרוק כרטיס תחילה');
      return;
    }

    if ((scannedStudent.points || 0) < cartTotalPoints + prize.points_cost) {
      toast.error('אין מספיק נקודות לכל הפריטים בסל');
      return;
    }

    if (prize.stock !== null && prize.stock !== undefined && prize.stock <= 0) {
      toast.error('הפרס אזל מהמלאי!');
      return;
    }

    setCart([...cart, prize]);
    setIsCartBumping(true);
    setTimeout(() => setIsCartBumping(false), 300);
    toast.success(`${prize.name} נוסף לסל`);
  };

  const handleConfirmPurchase = async () => {
    if (cart.length === 0 || !scannedStudent || isProcessing) return;
    setIsProcessing(true);
    try {
      const newPoints = (scannedStudent.points || 0) - cartTotalPoints;

      await createTransactionMutation.mutateAsync({
        student_id: scannedStudent.id,
        student_name: `${scannedStudent.first_name} ${scannedStudent.last_name}`,
        card_number: scannedStudent.card_number,
        type: 'prize_redemption',
        points_change: -cartTotalPoints,
        points_before: scannedStudent.points || 0,
        points_after: newPoints,
        note: `רכישת סל: ${cartItemsArray.map(p => `${p.name} (x${p.quantity})`).join(', ')}`,
        performed_by: 'מוכר'
      });

      await updateStudentMutation.mutateAsync({
        id: scannedStudent.id,
        data: { points: newPoints }
      });

      for (const item of cart) {
        if (item.stock > 0) {
          await updatePrizeMutation.mutateAsync({
            id: item.id,
            data: { stock: item.stock - 1 }
          });
        }
      }

      toast.success('הרכישה הושלמה! הכרטיס הוסר.');
      setCart([]); 
      setScannedStudent(null); 
      setShowPrizeDialog(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualDeduct = async () => {
    if (!scannedStudent || !manualPoints || isProcessing) return;
    const pointsToDeduct = parseInt(manualPoints);
    if (isNaN(pointsToDeduct) || pointsToDeduct <= 0) {
      toast.error('יש להזין מספר חיובי');
      return;
    }
    if ((scannedStudent.points || 0) < pointsToDeduct) {
      toast.error('אין מספיק נקודות');
      return;
    }
    setIsProcessing(true);
    try {
      const newPoints = (scannedStudent.points || 0) - pointsToDeduct;
      await createTransactionMutation.mutateAsync({
        student_id: scannedStudent.id,
        student_name: `${scannedStudent.first_name} ${scannedStudent.last_name}`,
        card_number: scannedStudent.card_number,
        type: 'subtract',
        points_change: -pointsToDeduct,
        points_before: scannedStudent.points || 0,
        points_after: newPoints,
        note: manualNote || 'הורדה ידנית עבור פרס',
        performed_by: 'מוכר'
      });
      await updateStudentMutation.mutateAsync({
        id: scannedStudent.id,
        data: { points: newPoints }
      });
      setScannedStudent({ ...scannedStudent, points: newPoints });
      setShowManualDialog(false);
      setManualPoints('');
      setManualNote('');
      toast.success('הנקודות הורדו בהצלחה!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="small" />
              <div className="hidden sm:block text-right">
                <h1 className="text-xl font-bold text-[#1e3a5f]">עמדת מוכר</h1>
                <p className="text-sm text-gray-500">מימוש פרסים</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* אייקון סל קניות צף */}
              {scannedStudent && (
                <Popover>
                  <PopoverTrigger asChild>
                    <motion.div animate={isCartBumping ? { scale: [1, 1.3, 1] } : {}}>
                      <Button variant="outline" className="relative h-12 w-12 rounded-full border-2 border-[#1e3a5f] text-[#1e3a5f] bg-white hover:bg-slate-50 shadow-lg">
                        <ShoppingCart className="w-6 h-6" />
                        {cart.length > 0 && (
                          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white h-6 w-6 flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
                            {cart.length}
                          </Badge>
                        )}
                      </Button>
                    </motion.div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 mr-4 mt-2 shadow-2xl rounded-2xl border-none overflow-hidden" align="start">
                    <div className="bg-[#1e3a5f] p-4 text-white">
                      <h3 className="font-bold flex items-center gap-2 text-lg">
                        <ShoppingCart className="w-5 h-5" /> הסל שלי
                      </h3>
                    </div>
                    <div className="p-4 bg-white max-h-[400px] overflow-y-auto">
                      {cart.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 italic">הסל ריק כרגע</div>
                      ) : (
                        <div className="space-y-3">
                          {cartItemsArray.map((item, i) => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold h-6 px-1.5">
                                  x{item.quantity}
                                </Badge>
                                <span className="font-medium text-slate-700">{item.name}</span>
                              </div>
                              <span className="font-bold text-[#1e3a5f]">{item.points_cost * item.quantity} איסרים</span>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-slate-100 mt-4">
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-bold text-gray-600">סה"כ לתשלום:</span>
                              <span className="text-xl font-black text-[#1e3a5f]">{cartTotalPoints} איסרים</span>
                            </div>
                            <Button 
                              className="w-full bg-[#1e3a5f] hover:bg-[#2a5285] h-12 text-lg shadow-inner" 
                              onClick={() => setShowPrizeDialog(true)}
                            >
                              אישור ותשלום
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="w-full mt-2 text-red-500 hover:bg-red-50 h-8 text-xs" 
                              onClick={() => setCart([])}
                            >
                              ניקוי סל
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <Link to={createPageUrl('Home')}>
                <Button variant="outline" className="gap-2 h-10">
                  <Home className="w-4 h-4" />
                  חזרה
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
          {/* Student Identification Section */}
          <div className="lg:col-span-1 space-y-6">
            <StudentIdentifier onIdentify={handleStudentIdentify} />

            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-bold">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {scannedStudent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <PointsDisplay 
                    points={scannedStudent.points || 0}
                    studentName={`${scannedStudent.first_name} ${scannedStudent.last_name}`}
                  />

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowManualDialog(true)}
                    >
                      <Minus className="w-4 h-4 ml-2" />
                      הורדת איסרים
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCloseStudent}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      יציאה
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!scannedStudent && (
              <div className="bg-gray-100 rounded-2xl p-8 text-center text-gray-500">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>זהה תלמיד לפי כרטיס או ת"ז</p>
                <p className="text-sm">להצגת יתרת איסרים ומימוש פרסים</p>
              </div>
            )}
          </div>

          {/* Prizes Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-[#1e3a5f] flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  פרסים זמינים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {availablePrizes.map((prize, index) => {
                    const canAfford = scannedStudent && (scannedStudent.points - cartTotalPoints) >= prize.points_cost;
                    
                    return (
                      <motion.div
                        key={prize.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-lg h-full flex flex-col ${
                            !scannedStudent ? 'opacity-60' :
                            canAfford ? 'hover:border-[#1e3a5f] border-2 border-transparent' : 'opacity-50 pointer-events-none'
                          }`}
                          onClick={() => scannedStudent && canAfford && handleSelectPrize(prize)}
                        >
                          <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 relative rounded-t-lg overflow-hidden">
                            {prize.image_url ? (
                              <img src={prize.image_url} alt={prize.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Gift className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                            {scannedStudent && canAfford && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-green-500">
                                  <Check className="w-3 h-3 ml-1" />
                                  ניתן להוסיף
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3 flex-1 flex flex-col justify-between">
                            <h3 className="font-bold text-[#1e3a5f] truncate text-sm">{prize.name}</h3>
                            <div className="flex items-center gap-1 mt-2 text-[#d4af37]">
                              <Star className="w-4 h-4 fill-[#d4af37]" />
                              <span className="font-bold">{prize.points_cost}</span>
                              <span className="text-gray-500 text-xs">איסרים</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm Purchase Dialog */}
      <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">אישור רכישת סל פריטים</DialogTitle>
          </DialogHeader>
          
          {scannedStudent && cart.length > 0 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">תלמיד:</span>
                  <span className="font-medium">{scannedStudent.first_name} {scannedStudent.last_name}</span>
                </div>
                <div className="border-t border-b py-2 my-2 max-h-40 overflow-y-auto">
                  <p className="text-sm font-bold mb-2">פירוט הסל:</p>
                  {cartItemsArray.map((item, i) => (
                    <div key={item.id} className="text-xs flex justify-between py-1 border-b border-gray-100 last:border-0">
                      <span>{item.name} <b>x{item.quantity}</b></span>
                      <span>{item.points_cost * item.quantity} איסרים</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-red-600 font-bold">
                  <span>סה"כ לתשלום:</span>
                  <span>-{cartTotalPoints}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-[#1e3a5f]">
                  <span>יתרה לאחר מימוש:</span>
                  <span>{scannedStudent.points - cartTotalPoints}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPrizeDialog(false)} disabled={isProcessing}>
              ביטול
            </Button>
            <Button 
              onClick={handleConfirmPurchase}
              className="bg-[#1e3a5f] gap-2 text-white"
              disabled={isProcessing}
            >
              <Check className="w-4 h-4" />
              {isProcessing ? 'מעבד...' : 'אישור סופי'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Deduct Dialog */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הורדת איסרים ידנית</DialogTitle>
          </DialogHeader>
          {scannedStudent && (
            <div className="space-y-4">
              <p className="text-center text-gray-600">{scannedStudent.first_name} {scannedStudent.last_name}</p>
              <p className="text-center text-2xl font-bold text-[#1e3a5f]">יתרה: {scannedStudent.points || 0}</p>
              <div>
                <Label>כמות איסרים להורדה</Label>
                <Input
                  type="number"
                  value={manualPoints}
                  onChange={(e) => setManualPoints(e.target.value)}
                  placeholder="כמות..."
                  className="text-center text-xl mt-2"
                />
              </div>
              <div>
                <Label>תיאור הפרס / סיבה</Label>
                <Textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="לדוגמה: ממתק..."
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualDialog(false)}>ביטול</Button>
            <Button onClick={handleManualDeduct} className="bg-[#1e3a5f]" disabled={isProcessing}>
              {isProcessing ? 'מעבד...' : 'הורד איסרים'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}