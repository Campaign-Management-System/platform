import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Star, 
  MessageSquare, 
  Settings,
  Search,
  Plus,
  Edit,
  Eye,
  Check,
  X,
  Clock,
  AlertCircle,
  Calendar,
  Loader2,
  LogOut,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import moment from 'moment';
import { createPageUrl } from '@/utils';

export default function SuperAdmin() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [search, setSearch] = useState('');
  
  // Dialogs
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subFormData, setSubFormData] = useState({
    max_campaigns: 1,
    start_date: moment().format('YYYY-MM-DD'),
    end_date: moment().add(1, 'year').format('YYYY-MM-DD'),
    status: 'active',
    notes: '',
    price_paid: 0
  });

  useEffect(() => {
    // בדיקת התחברות מנהל על
    const isLoggedIn = sessionStorage.getItem('superAdminLoggedIn');
    if (isLoggedIn !== 'true') {
      window.location.href = createPageUrl('AdminLogin');
      return;
    }
    setIsLoading(false);
  }, []);

  const { data: contactRequests = [] } = useQuery({
    queryKey: ['contactRequests'],
    queryFn: () => base44.entities.ContactRequest.list('-created_date'),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['allCampaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContactRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contactRequests']);
      toast.success('הפנייה עודכנה');
    }
  });

  const createSubMutation = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
      setShowSubDialog(false);
      toast.success('המנוי נוצר בהצלחה');
    }
  });

  const updateSubMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
      toast.success('המנוי עודכן');
    }
  });

  const handleCreateSubscription = () => {
    if (!selectedUser) return;
    createSubMutation.mutate({
      user_id: selectedUser.id,
      user_email: selectedUser.email,
      user_name: selectedUser.full_name,
      ...subFormData
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      new: { color: 'bg-blue-100 text-blue-800', label: 'חדש' },
      contacted: { color: 'bg-yellow-100 text-yellow-800', label: 'נוצר קשר' },
      converted: { color: 'bg-green-100 text-green-800', label: 'הפך ללקוח' },
      declined: { color: 'bg-red-100 text-red-800', label: 'נדחה' },
      active: { color: 'bg-green-100 text-green-800', label: 'פעיל' },
      expired: { color: 'bg-red-100 text-red-800', label: 'פג תוקף' },
      suspended: { color: 'bg-orange-100 text-orange-800', label: 'מושהה' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'ממתין' },
    };
    const c = config[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const filteredRequests = contactRequests.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.email?.toLowerCase().includes(search.toLowerCase()) ||
    r.organization?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSubs = subscriptions.filter(s =>
    s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'פניות חדשות', value: contactRequests.filter(r => r.status === 'new').length, icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
    { label: 'מנויים פעילים', value: subscriptions.filter(s => s.status === 'active').length, icon: Users, color: 'bg-green-50 text-green-600' },
    { label: 'מבצעים פעילים', value: campaigns.filter(c => c.is_active).length, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'סה״כ משתמשים', value: allUsers.length, icon: Users, color: 'bg-purple-50 text-purple-600' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" dir="rtl">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#d4af37]" />
            <div>
              <h1 className="font-bold text-lg">ניהול מערכת</h1>
              <p className="text-sm opacity-80">פאנל מנהל ראשי</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => {
            sessionStorage.removeItem('superAdminLoggedIn');
            window.location.href = createPageUrl('Landing');
          }} className="text-white border-white/30 hover:bg-white/10">
            <LogOut className="w-4 h-4 ml-2" />
            התנתק
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1e3a5f]">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border mb-6">
            <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <MessageSquare className="w-4 h-4" />
              פניות
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <Users className="w-4 h-4" />
              מנויים
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2 data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
              <Star className="w-4 h-4" />
              מבצעים
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="חיפוש..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Contact Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>פניות</CardTitle>
                <CardDescription>ניהול פניות מלקוחות פוטנציאליים</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">ארגון</TableHead>
                        <TableHead className="text-right">טלפון</TableHead>
                        <TableHead className="text-right">תלמידים</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="text-sm text-gray-500">
                            {moment(request.created_date).format('DD/MM/YY')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.name}</p>
                              <p className="text-sm text-gray-500">{request.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{request.organization || '-'}</TableCell>
                          <TableCell dir="ltr" className="text-left">{request.phone}</TableCell>
                          <TableCell>{request.estimated_students || '-'}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            <Select
                              value={request.status}
                              onValueChange={(value) => updateRequestMutation.mutate({ id: request.id, data: { status: value } })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">חדש</SelectItem>
                                <SelectItem value="contacted">נוצר קשר</SelectItem>
                                <SelectItem value="converted">הפך ללקוח</SelectItem>
                                <SelectItem value="declined">נדחה</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            אין פניות
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>מנויים</CardTitle>
                  <CardDescription>ניהול מנויים והרשאות משתמשים</CardDescription>
                </div>
                <Button onClick={() => { setSelectedUser(null); setShowSubDialog(true); }} className="bg-[#1e3a5f] gap-2">
                  <Plus className="w-4 h-4" />
                  מנוי חדש
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-right">משתמש</TableHead>
                        <TableHead className="text-right">מבצעים</TableHead>
                        <TableHead className="text-right">תאריך התחלה</TableHead>
                        <TableHead className="text-right">תאריך סיום</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubs.map((sub) => {
                        const userCampaigns = campaigns.filter(c => c.owner_id === sub.user_id);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sub.user_name}</p>
                                <p className="text-sm text-gray-500">{sub.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {userCampaigns.length} / {sub.max_campaigns}
                            </TableCell>
                            <TableCell>{sub.start_date ? moment(sub.start_date).format('DD/MM/YY') : '-'}</TableCell>
                            <TableCell>{sub.end_date ? moment(sub.end_date).format('DD/MM/YY') : 'ללא הגבלה'}</TableCell>
                            <TableCell>{getStatusBadge(sub.status)}</TableCell>
                            <TableCell>
                              <Select
                                value={sub.status}
                                onValueChange={(value) => updateSubMutation.mutate({ id: sub.id, data: { status: value } })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">פעיל</SelectItem>
                                  <SelectItem value="expired">פג תוקף</SelectItem>
                                  <SelectItem value="suspended">מושהה</SelectItem>
                                  <SelectItem value="pending">ממתין</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredSubs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            אין מנויים
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>כל המבצעים</CardTitle>
                <CardDescription>צפייה בכל המבצעים במערכת</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-right">שם מבצע</TableHead>
                        <TableHead className="text-right">בעלים</TableHead>
                        <TableHead className="text-right">תלמידים</TableHead>
                        <TableHead className="text-right">נקודות</TableHead>
                        <TableHead className="text-right">פרסים</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">נוצר</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell className="text-sm text-gray-500">{campaign.owner_email}</TableCell>
                          <TableCell>{campaign.total_students || 0}</TableCell>
                          <TableCell>{campaign.total_points_distributed || 0}</TableCell>
                          <TableCell>{campaign.total_prizes_redeemed || 0}</TableCell>
                          <TableCell>
                            <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                              {campaign.is_active ? 'פעיל' : 'לא פעיל'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {moment(campaign.created_date).format('DD/MM/YY')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {campaigns.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            אין מבצעים
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Subscription Dialog */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>יצירת מנוי חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>בחר משתמש</Label>
              <Select 
                value={selectedUser?.id || ''} 
                onValueChange={(id) => setSelectedUser(allUsers.find(u => u.id === id))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר משתמש" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>מספר מבצעים מותר</Label>
              <Input
                type="number"
                value={subFormData.max_campaigns}
                onChange={(e) => setSubFormData({...subFormData, max_campaigns: parseInt(e.target.value) || 1})}
                min={1}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>תאריך התחלה</Label>
                <Input
                  type="date"
                  value={subFormData.start_date}
                  onChange={(e) => setSubFormData({...subFormData, start_date: e.target.value})}
                />
              </div>
              <div>
                <Label>תאריך סיום</Label>
                <Input
                  type="date"
                  value={subFormData.end_date}
                  onChange={(e) => setSubFormData({...subFormData, end_date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label>סכום ששולם</Label>
              <Input
                type="number"
                value={subFormData.price_paid}
                onChange={(e) => setSubFormData({...subFormData, price_paid: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div>
              <Label>הערות</Label>
              <Textarea
                value={subFormData.notes}
                onChange={(e) => setSubFormData({...subFormData, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubDialog(false)}>ביטול</Button>
            <Button onClick={handleCreateSubscription} className="bg-[#1e3a5f]" disabled={!selectedUser || createSubMutation.isPending}>
              {createSubMutation.isPending ? 'יוצר...' : 'צור מנוי'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}