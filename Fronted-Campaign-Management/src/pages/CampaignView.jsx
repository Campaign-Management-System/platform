import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Trophy, 
  Star,
  ArrowRight,
  Loader2,
  Lock,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';

export default function CampaignView() {
  const [campaignId, setCampaignId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCampaignId(params.get('id'));
    setIsLoading(false);
  }, []);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (data) => data[0]
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
    enabled: !!campaignId,
  });

  const { data: prizes = [] } = useQuery({
    queryKey: ['prizes'],
    queryFn: () => base44.entities.Prize.list(),
    enabled: !!campaignId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
    enabled: !!campaignId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
  const totalRedemptions = transactions.filter(t => t.type === 'prize_redemption').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="small" />
              <div>
                <h1 className="text-xl font-bold text-[#1e3a5f]">{campaign?.name || 'צפייה במבצע'}</h1>
                <Badge variant="secondary" className="mt-1">
                  <Lock className="w-3 h-3 ml-1" />
                  מצב צפייה בלבד
                </Badge>
              </div>
            </div>
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                חזרה
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Notice */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              המנוי שלך פג תוקף. ניתן לצפות בנתונים בלבד. 
              <Link to={createPageUrl('Landing')} className="underline font-medium mr-1">
                צור קשר לחידוש המנוי
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Campaign Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto text-[#1e3a5f] mb-2" />
                <p className="text-2xl font-bold text-[#1e3a5f]">{students.length}</p>
                <p className="text-sm text-gray-500">תלמידים</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto text-[#d4af37] mb-2" />
                <p className="text-2xl font-bold text-[#1e3a5f]">{totalPoints.toLocaleString()}</p>
                <p className="text-sm text-gray-500">נקודות</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-[#1e3a5f]">{prizes.length}</p>
                <p className="text-sm text-gray-500">פרסים</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <Gift className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-[#1e3a5f]">{totalRedemptions}</p>
                <p className="text-sm text-gray-500">מימושים</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Logo Display */}
        {campaign?.logo_url && (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>לוגו המבצע</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={campaign.logo_url} 
                alt={campaign.name}
                className="max-h-48 mx-auto object-contain"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}