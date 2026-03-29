import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsTab() {
  const queryClient = useQueryClient();
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: '',
    logo_url: '',
    admin_code: '',
    primary_color: '#1e3a5f',
    secondary_color: '#d4af37'
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => base44.entities.Settings.list(),
  });

  const setting = settings?.[0];

  useEffect(() => {
    if (setting) {
      setFormData({
        campaign_name: setting.campaign_name || '',
        logo_url: setting.logo_url || '',
        admin_code: setting.admin_code || '',
        primary_color: setting.primary_color || '#1e3a5f',
        secondary_color: setting.secondary_color || '#d4af37'
      });
    }
  }, [setting]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (setting) {
        return base44.entities.Settings.update(setting.id, data);
      } else {
        return base44.entities.Settings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success('ההגדרות נשמרו בהצלחה');
    }
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
      toast.success('הלוגו הועלה בהצלחה');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1e3a5f]">הגדרות כלליות</CardTitle>
          <CardDescription>התאם את המערכת לצרכי התלמוד תורה</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-1">
              <Label>לוגו התלמוד תורה</Label>
              <p className="text-sm text-gray-500 mb-3">יוצג במסך הראשי</p>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                  disabled={isUploadingLogo}
                />
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
                  </div>
                )}
              </div>
            </div>
            {formData.logo_url && (
              <div className="w-24 h-24 rounded-xl overflow-hidden border">
                <img 
                  src={formData.logo_url} 
                  alt="לוגו"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Campaign Name */}
          <div>
            <Label>שם המבצע</Label>
            <Input
              value={formData.campaign_name}
              onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
              placeholder="לדוגמה: מבצע נקודות זכות"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1e3a5f]">קוד גישה ראשי</CardTitle>
          <CardDescription>קוד זה ישמש לכניסת מנהל וגם לכניסת מוכר</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>קוד גישה למנהל מבצע</Label>
            <div className="relative mt-2">
              <Input
                type={showAdminCode ? 'text' : 'password'}
                value={formData.admin_code}
                onChange={(e) => setFormData({...formData, admin_code: e.target.value})}
                placeholder="הקלד קוד גישה..."
                className="pl-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowAdminCode(!showAdminCode)}
              >
                {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              קוד זה מאפשר כניסה הן כמנהל והן כמוכר. ניתן להוסיף אנשי צוות נוספים בלשונית "אנשי צוות".
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={() => saveMutation.mutate(formData)}
        className="w-full sm:w-auto bg-[#1e3a5f] gap-2"
        disabled={saveMutation.isPending}
      >
        <Save className="w-4 h-4" />
        שמור הגדרות
      </Button>
    </div>
  );
}