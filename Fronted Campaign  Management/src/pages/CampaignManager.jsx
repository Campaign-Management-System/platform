import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Trophy, 
  Settings, 
  History, 
  Home,
  GraduationCap,
  Award,
  TrendingUp,
  BarChart3,
  UserCog,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/ui/Logo';

import StudentsTab from '@/components/admin/StudentsTab.jsx';
import ClassesTab from '@/components/admin/ClassesTab.jsx';
import PrizesTab from '@/components/admin/PrizesTab.jsx';
import HistoryTab from '@/components/admin/HistoryTab.jsx';
import SettingsTab from '@/components/admin/SettingsTab.jsx';
import StatsTab from '@/components/admin/StatsTab.jsx';
import StaffTab from '@/components/admin/StaffTab.jsx';

export default function CampaignManager() {
  const [activeTab, setActiveTab] = useState('students');
  const [campaignId, setCampaignId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCampaignId(params.get('id'));
    
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        base44.auth.redirectToLogin();
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (data) => data[0]
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', campaignId],
    queryFn: () => base44.entities.Student.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', campaignId],
    queryFn: () => base44.entities.Class.filter({ campaign_id: campaignId }),
    enabled: !!campaignId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', campaignId],
    queryFn: () => base44.entities.Transaction.filter({ campaign_id: campaignId }, '-created_date', 100),
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
  const activeStudents = students.filter(s => s.is_active !== false).length;

  const stats = [
    { 
      label: 'תלמידים פעילים', 
      value: activeStudents, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'כיתות', 
      value: classes.length, 
      icon: GraduationCap, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      label: 'סה"כ נקודות במערכת', 
      value: totalPoints.toLocaleString(), 
      icon: Award, 
      color: 'from-[#d4af37] to-[#c9a32f]',
      bgColor: 'bg-yellow-50'
    },
    { 
      label: 'פעולות החודש', 
      value: transactions.length, 
      icon: TrendingUp, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="small" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-[#1e3a5f]">{campaign?.name || 'ניהול מבצע'}</h1>
                <p className="text-sm text-gray-500">ניהול מערכת הנקודות</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="outline" className="gap-2">
                  <ArrowRight className="w-4 h-4" />
                  חזרה לדשבורד
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-[#1e3a5f]">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-5 h-5`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex-wrap h-auto gap-1">
            <TabsTrigger value="students" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">תלמידים</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">כיתות</span>
            </TabsTrigger>
            <TabsTrigger value="prizes" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">פרסים</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">היסטוריה</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">סטטיסטיקות</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">צוות</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">הגדרות</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsTab campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="classes">
            <ClassesTab campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="prizes">
            <PrizesTab campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="history">
            <HistoryTab campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="stats">
            <StatsTab campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="staff">
            <StaffTab campaignId={campaignId} />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsTab campaignId={campaignId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}