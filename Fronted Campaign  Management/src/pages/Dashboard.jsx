import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Star, 
  Users, 
  Gift, 
  Settings,
  LogOut,
  Clock,
  AlertCircle,
  Lock,
  Eye,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCampaignName, setNewCampaignName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin(createPageUrl('Dashboard'));
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions', user?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: () => base44.entities.Campaign.filter({ owner_id: user?.id }),
    enabled: !!user?.id,
  });

  const mySub = subscriptions[0];
  const isActive = mySub?.status === 'active' && (!mySub?.end_date || new Date(mySub.end_date) > new Date());
  const canCreateMore = isActive && campaigns.length < (mySub?.max_campaigns || 0);
  const daysLeft = mySub?.end_date ? moment(mySub.end_date).diff(moment(), 'days') : null;

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries(['campaigns']);
      setShowNewCampaignDialog(false);
      setNewCampaignName('');
      toast.success('המבצע נוצר בהצלחה!');
    }
  });

  const handleCreateCampaign = () => {
    if (!newCampaignName.trim()) {
      toast.error('יש להזין שם למבצע');
      return;
    }
    // יצירת slug מהשם
    const slug = newCampaignName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0590-\u05FF-]/g, '');
    
    createCampaignMutation.mutate({
      name: newCampaignName,
      slug: slug,
      owner_id: user.id,
      owner_email: user.email,
      admin_code: Math.floor(1000 + Math.random() * 9000).toString()
    });
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Landing'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
              <Star className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h1 className="font-bold text-[#1e3a5f]">שלום, {user?.full_name || 'משתמש'}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        {!mySub || mySub.status === 'pending' ? (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-yellow-100">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-yellow-800 mb-1">ממתין לאישור</h3>
                  <p className="text-yellow-700">
                    הפנייה שלך התקבלה וניצור איתך קשר בהקדם. 
                    לאחר אישור התשלום תקבל גישה מלאה למערכת.
                  </p>
                </div>
                <Link to={createPageUrl('Landing')}>
                  <Button variant="outline" className="border-yellow-400 text-yellow-700">
                    צור קשר שוב
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : !isActive ? (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-100">
                  <Lock className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 mb-1">המנוי פג תוקף</h3>
                  <p className="text-red-700">
                    המנוי שלך הסתיים. ניתן לצפות בנתונים אך לא לבצע פעולות.
                    צור קשר לחידוש המנוי.
                  </p>
                </div>
                <Link to={createPageUrl('Landing')}>
                  <Button className="bg-red-600 hover:bg-red-700">
                    חדש מנוי
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800">מנוי פעיל</h3>
                    <p className="text-green-700 text-sm">
                      {mySub.max_campaigns} מבצעים | 
                      {daysLeft !== null ? ` ${daysLeft} ימים נותרו` : ' ללא הגבלה'}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-600">
                  {campaigns.length} / {mySub.max_campaigns} מבצעים בשימוש
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaigns */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1e3a5f]">המבצעים שלי</h2>
          {canCreateMore && (
            <Button onClick={() => setShowNewCampaignDialog(true)} className="bg-[#1e3a5f] gap-2">
              <Plus className="w-4 h-4" />
              מבצע חדש
            </Button>
          )}
        </div>

        {campaigns.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">אין מבצעים עדיין</h3>
              <p className="text-gray-500 mb-6">
                {isActive ? 'צור את המבצע הראשון שלך' : 'לאחר אישור המנוי תוכל ליצור מבצעים'}
              </p>
              {canCreateMore && (
                <Button onClick={() => setShowNewCampaignDialog(true)} className="bg-[#1e3a5f]">
                  צור מבצע ראשון
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-24 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
                    {campaign.logo_url ? (
                      <img src={campaign.logo_url} alt={campaign.name} className="h-16 object-contain" />
                    ) : (
                      <Star className="w-12 h-12 text-[#d4af37]" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg text-[#1e3a5f]">{campaign.name}</h3>
                      <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                        {campaign.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <Users className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <span className="text-sm font-bold">{campaign.total_students || 0}</span>
                        <p className="text-xs text-gray-500">תלמידים</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <Star className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <span className="text-sm font-bold">{campaign.total_points_distributed || 0}</span>
                        <p className="text-xs text-gray-500">נקודות</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <Gift className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <span className="text-sm font-bold">{campaign.total_prizes_redeemed || 0}</span>
                        <p className="text-xs text-gray-500">פרסים</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 text-center">
                        קישור: <span className="font-mono text-[#1e3a5f]">/campaign/{campaign.slug || campaign.id}</span>
                      </div>
                      <div className="flex gap-2">
                        {isActive ? (
                          <Link to={createPageUrl('CampaignManager') + `?id=${campaign.id}`} className="flex-1">
                            <Button className="w-full bg-[#1e3a5f]">
                              <Settings className="w-4 h-4 ml-2" />
                              נהל מבצע
                            </Button>
                          </Link>
                        ) : (
                          <Link to={createPageUrl('CampaignView') + `?id=${campaign.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Eye className="w-4 h-4 ml-2" />
                              צפייה בלבד
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>יצירת מבצע חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם המבצע</Label>
              <Input
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="לדוגמה: מבצע נקודות זכות תשפ״ה"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCampaignDialog(false)}>ביטול</Button>
            <Button onClick={handleCreateCampaign} className="bg-[#1e3a5f]" disabled={createCampaignMutation.isPending}>
              {createCampaignMutation.isPending ? 'יוצר...' : 'צור מבצע'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}