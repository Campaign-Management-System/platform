import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, 
  ShoppingBag, 
  CreditCard,
  Sparkles,
  Star,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';

export default function CampaignPortal() {
  const navigate = useNavigate();
  const [campaignSlug, setCampaignSlug] = useState(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeType, setCodeType] = useState('admin');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    // קבלת unique_id מה-URL
    const path = window.location.pathname;
    const match = path.match(/\/campaign\/([^/]+)/);
    if (match) {
      setCampaignSlug(decodeURIComponent(match[1]));
    }
  }, []);

  // מציאת הקמפיין לפי unique_id
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaignBySlug', campaignSlug],
    queryFn: () => base44.entities.Campaign.list(),
    enabled: !!campaignSlug,
  });

  const campaign = campaigns.find(c => c.unique_id === campaignSlug);

  const { data: settings = [] } = useQuery({
    queryKey: ['campaignSettings', campaign?.id],
    queryFn: () => base44.entities.Settings.filter({ campaign_id: campaign?.id }),
    enabled: !!campaign?.id,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['campaignStaff', campaign?.id],
    queryFn: () => base44.entities.Staff.filter({ campaign_id: campaign?.id }),
    enabled: !!campaign?.id,
  });

  const setting = settings[0];

  const handleCodeSubmit = () => {
    setError('');
    
    // בדיקת קוד מנהל מההגדרות
    if (code === setting?.admin_code) {
      if (codeType === 'admin') {
        navigate(createPageUrl('CampaignManager') + `?id=${campaign.id}`);
      } else {
        navigate(createPageUrl('SellerPanel') + `?id=${campaign.id}`);
      }
      return;
    }
    
    // בדיקת קודי צוות
    const staff = staffList.find(s => s.access_code === code && s.is_active !== false);
    
    if (staff) {
      if (codeType === 'admin' && staff.role === 'admin') {
        navigate(createPageUrl('CampaignManager') + `?id=${campaign.id}`);
        return;
      } else if (codeType === 'seller') {
        navigate(createPageUrl('SellerPanel') + `?id=${campaign.id}`);
        return;
      } else if (codeType === 'admin' && staff.role === 'seller') {
        setError('אין לך הרשאת מנהל');
        return;
      }
    }
    
    setError('קוד שגוי');
  };

  const openDialog = (type) => {
    setCodeType(type);
    setCode('');
    setError('');
    setShowCodeDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4" dir="rtl">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">מבצע לא נמצא</h1>
            <p className="text-gray-500 mb-6">
              הכתובת שהזנת אינה תקינה או שהמבצע אינו קיים
            </p>
            <Button onClick={() => navigate(createPageUrl('Landing'))} className="bg-[#1e3a5f]">
              חזרה לדף הראשי
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white relative overflow-hidden" dir="rtl">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#1e3a5f] opacity-5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4af37] opacity-5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      {/* Floating stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[#d4af37]/20"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 500), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 500) 
          }}
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5
          }}
        >
          <Star className="w-8 h-8 fill-current" />
        </motion.div>
      ))}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* לוגו המבצע */}
          {setting?.logo_url ? (
            <img 
              src={setting.logo_url} 
              alt={campaign.name}
              className="h-24 mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
              <Star className="w-12 h-12 text-[#d4af37]" />
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-[#1e3a5f]">{campaign.name}</h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <p className="text-gray-600 text-lg">מערכת ניהול נקודות ופרסים</p>
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-md space-y-4"
        >
          <Button
            onClick={() => openDialog('admin')}
            className="w-full py-8 text-xl font-bold bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8a] hover:from-[#152c4a] hover:to-[#1e3a5f] rounded-2xl shadow-xl shadow-[#1e3a5f]/20 transition-all duration-300 hover:scale-[1.02]"
          >
            <Shield className="w-7 h-7 ml-3" />
            כניסת מנהל
          </Button>

          <Button
            onClick={() => openDialog('seller')}
            className="w-full py-8 text-xl font-bold bg-gradient-to-r from-[#d4af37] to-[#c9a32f] hover:from-[#c9a32f] hover:to-[#b8932a] text-[#1e3a5f] rounded-2xl shadow-xl shadow-[#d4af37]/20 transition-all duration-300 hover:scale-[1.02]"
          >
            <ShoppingBag className="w-7 h-7 ml-3" />
            כניסת מוכר
          </Button>
        </motion.div>

        {/* Student View Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl('StudentPortal') + `?id=${campaign.id}`)}
            className="text-gray-600 hover:text-[#1e3a5f] gap-2"
          >
            <CreditCard className="w-5 h-5" />
            סריקת כרטיס לצפייה בנקודות
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-gray-400 text-sm"
        >
          © כל הזכויות שמורות
        </motion.p>
      </div>

      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {codeType === 'admin' ? 'כניסת מנהל' : 'כניסת מוכר'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex justify-center">
              <div className={`p-4 rounded-full ${codeType === 'admin' ? 'bg-[#1e3a5f]/10' : 'bg-[#d4af37]/10'}`}>
                {codeType === 'admin' ? (
                  <Shield className="w-12 h-12 text-[#1e3a5f]" />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-[#d4af37]" />
                )}
              </div>
            </div>

            <div className="relative">
              <Input
                type={showCode ? 'text' : 'password'}
                placeholder="הקלד קוד גישה..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCodeSubmit()}
                className="text-center text-xl py-6 pl-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            {error && (
              <p className="text-red-500 text-center text-sm">{error}</p>
            )}

            <Button
              onClick={handleCodeSubmit}
              className={`w-full py-6 text-lg ${
                codeType === 'admin' 
                  ? 'bg-[#1e3a5f] hover:bg-[#152c4a]' 
                  : 'bg-[#d4af37] hover:bg-[#c9a32f] text-[#1e3a5f]'
              }`}
            >
              כניסה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}