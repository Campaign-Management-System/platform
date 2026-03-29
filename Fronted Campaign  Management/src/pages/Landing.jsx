import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Star, 
  Gift, 
  Users, 
  CreditCard, 
  BarChart3, 
  Shield,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Award,
  Zap,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Landing() {
  const navigate = useNavigate();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    message: '',
    estimated_students: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const createRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactRequest.create(data),
    onSuccess: () => {
      setShowContactDialog(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        message: '',
        estimated_students: ''
      });
      toast.success('הפנייה נשלחה בהצלחה! ניצור איתך קשר בהקדם');
    }
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'שם חובה';
    if (!formData.email.trim()) errors.email = 'אימייל חובה';
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) errors.email = 'אימייל לא תקין';
    if (!formData.phone.trim()) errors.phone = 'טלפון חובה';
    if (!/^0\d{8,9}$/.test(formData.phone.replace(/[-\s]/g, ''))) errors.phone = 'טלפון לא תקין';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    createRequestMutation.mutate({
      ...formData,
      estimated_students: parseInt(formData.estimated_students) || 0
    });
  };

  const features = [
    { icon: CreditCard, title: 'כרטיסים מגנטיים', desc: 'סריקה מהירה ונוחה של כרטיסי תלמידים' },
    { icon: Star, title: 'ניהול נקודות', desc: 'הוספה והורדת נקודות בקלות' },
    { icon: Gift, title: 'מימוש פרסים', desc: 'קטלוג פרסים דיגיטלי עם מלאי' },
    { icon: Users, title: 'ניהול תלמידים', desc: 'ייבוא מאקסל, חלוקה לכיתות' },
    { icon: BarChart3, title: 'דוחות וסטטיסטיקות', desc: 'מעקב מלא אחרי הפעילות' },
    { icon: Shield, title: 'הרשאות וקודים', desc: 'גישה מאובטחת למנהלים ומוכרים' },
  ];

  const steps = [
    { num: '1', title: 'סריקת כרטיס', desc: 'התלמיד מעביר את הכרטיס' },
    { num: '2', title: 'צפייה בנקודות', desc: 'היתרה מוצגת מיידית' },
    { num: '3', title: 'בחירת פרס', desc: 'המוכר בוחר פרס מהקטלוג' },
    { num: '4', title: 'מימוש!', desc: 'הנקודות יורדות והפרס נמסר' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
              <Star className="w-5 h-5 text-[#d4af37]" />
            </div>
            <span className="font-bold text-xl text-[#1e3a5f]">נקודות זכות</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(createPageUrl('AdminLogin'))}>
              כניסת מנהל
            </Button>
            <Button onClick={() => setShowContactDialog(true)} className="bg-[#1e3a5f]">
              צור קשר
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[#1e3a5f] font-medium">מערכת ניהול נקודות לתלמודי תורה</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-[#1e3a5f] mb-6">
              נהל מבצעי נקודות
              <br />
              <span className="text-[#d4af37]">בקלות ובהנאה</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              מערכת מקצועית לניהול נקודות, פרסים ותלמידים. 
              כולל כרטיסים מגנטיים, סריקה מהירה ודוחות מפורטים.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => setShowContactDialog(true)}
                className="bg-[#1e3a5f] text-lg py-6 px-8"
              >
                <Zap className="w-5 h-5 ml-2" />
                קבל הצעת מחיר
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate(createPageUrl('Demo'))}
                className="text-lg py-6 px-8"
              >
                צפה בהדגמה
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1e3a5f] mb-12">איך זה עובד?</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{step.num}</span>
                </div>
                <h3 className="font-bold text-[#1e3a5f] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#1e3a5f] mb-4">כל מה שצריך במקום אחד</h2>
          <p className="text-center text-gray-600 mb-12">מערכת מלאה לניהול מבצעי נקודות</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-0 bg-white">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-[#1e3a5f]" />
                    </div>
                    <h3 className="font-bold text-lg text-[#1e3a5f] mb-2">{feature.title}</h3>
                    <p className="text-gray-500">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] border-0 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <Award className="w-16 h-16 mx-auto mb-6 text-[#d4af37]" />
                <h2 className="text-3xl font-bold mb-4">מוכנים להתחיל?</h2>
                <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                  צרו איתנו קשר לקבלת הצעת מחיר מותאמת אישית
                </p>
                <Button 
                  size="lg"
                  onClick={() => setShowContactDialog(true)}
                  className="bg-[#d4af37] hover:bg-[#c9a32f] text-[#1e3a5f] text-lg py-6 px-8"
                >
                  <Phone className="w-5 h-5 ml-2" />
                  צור קשר עכשיו
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          © כל הזכויות שמורות | נקודות זכות - מערכת ניהול נקודות לתלמודי תורה
        </div>
      </footer>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">צור קשר לקבלת הצעת מחיר</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>שם מלא *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>
            
            <div>
              <Label>אימייל *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                dir="ltr"
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
            </div>
            
            <div>
              <Label>טלפון *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                dir="ltr"
                placeholder="05XXXXXXXX"
                className={formErrors.phone ? 'border-red-500' : ''}
              />
              {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
            </div>
            
            <div>
              <Label>שם הארגון / תלמוד תורה</Label>
              <Input
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
              />
            </div>
            
            <div>
              <Label>מספר תלמידים משוער</Label>
              <Input
                type="number"
                value={formData.estimated_students}
                onChange={(e) => setFormData({...formData, estimated_students: e.target.value})}
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>הודעה / הערות</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>ביטול</Button>
            <Button onClick={handleSubmit} className="bg-[#1e3a5f]" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending ? 'שולח...' : 'שלח פנייה'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}