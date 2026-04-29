import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, UserCog, Shield, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function StaffTab() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showCode, setShowCode] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    role: 'seller',
    access_code: '',
    phone: '',
    is_active: true
  });
  const [formErrors, setFormErrors] = useState({});

  const { data: staffList = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
  });

  const createStaffMutation = useMutation({
    mutationFn: (data) => base44.entities.Staff.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setShowAddDialog(false);
      resetForm();
      toast.success('איש הצוות נוסף בהצלחה');
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Staff.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setShowEditDialog(false);
      toast.success('איש הצוות עודכן בהצלחה');
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id) => base44.entities.Staff.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      toast.success('איש הצוות נמחק בהצלחה');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'seller',
      access_code: '',
      phone: '',
      is_active: true
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'שם חובה';
    }
    
    if (!formData.access_code.trim()) {
      errors.access_code = 'קוד גישה חובה';
    } else if (formData.access_code.length < 4) {
      errors.access_code = 'קוד גישה חייב להכיל לפחות 4 תווים';
    } else if (staffList.some(s => s.access_code === formData.access_code && s.id !== selectedStaff?.id)) {
      errors.access_code = 'קוד גישה כבר קיים במערכת';
    }
    
    if (formData.phone && !/^0\d{8,9}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      errors.phone = 'מספר טלפון לא תקין';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData({ ...formData, access_code: code });
    setFormErrors({ ...formErrors, access_code: undefined });
  };

  const toggleShowCode = (id) => {
    setShowCode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddStaff = () => {
    if (!validateForm()) return;
    createStaffMutation.mutate(formData);
  };

  const handleEditStaff = () => {
    if (!validateForm()) return;
    updateStaffMutation.mutate({ id: selectedStaff.id, data: formData });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-[#1e3a5f] flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            ניהול אנשי צוות
          </CardTitle>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2 bg-[#1e3a5f]">
            <Plus className="w-4 h-4" />
            הוסף איש צוות
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-right">שם</TableHead>
                <TableHead className="text-right">תפקיד</TableHead>
                <TableHead className="text-right">קוד גישה</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.map((staff) => (
                <TableRow key={staff.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-right">{staff.name}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={staff.role === 'admin' ? 'bg-[#1e3a5f]' : 'bg-[#d4af37] text-[#1e3a5f]'}>
                      {staff.role === 'admin' ? (
                        <><Shield className="w-3 h-3 ml-1" /> מנהל</>
                      ) : (
                        <><ShoppingBag className="w-3 h-3 ml-1" /> מוכר</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-mono">
                        {showCode[staff.id] ? staff.access_code : '••••'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleShowCode(staff.id)}
                      >
                        {showCode[staff.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{staff.phone || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={staff.is_active !== false ? 'default' : 'secondary'}>
                      {staff.is_active !== false ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setFormData({
                            name: staff.name,
                            role: staff.role,
                            access_code: staff.access_code,
                            phone: staff.phone || '',
                            is_active: staff.is_active !== false
                          });
                          setFormErrors({});
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm('האם למחוק את איש הצוות?')) {
                            deleteStaffMutation.mutate(staff.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {staffList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    לא נמצאו אנשי צוות
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת איש צוות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={formErrors.name ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.parentElement?.parentElement?.querySelector('input[placeholder="קוד גישה"]')?.focus();
                  }
                }}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label>תפקיד</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">מנהל</SelectItem>
                  <SelectItem value="seller">מוכר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>קוד גישה *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.access_code}
                  onChange={(e) => setFormData({...formData, access_code: e.target.value})}
                  placeholder="קוד גישה"
                  className={formErrors.access_code ? 'border-red-500' : ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('input[placeholder="05XXXXXXXX"]')?.focus();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  צור קוד
                </Button>
              </div>
              {formErrors.access_code && (
                <p className="text-red-500 text-sm mt-1">{formErrors.access_code}</p>
              )}
            </div>
            <div>
              <Label>טלפון</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                dir="ltr"
                placeholder="05XXXXXXXX"
                className={formErrors.phone ? 'border-red-500' : ''}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStaff()}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>ביטול</Button>
            <Button onClick={handleAddStaff} className="bg-[#1e3a5f]">
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת איש צוות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={formErrors.name ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.parentElement?.parentElement?.querySelector('input')?.focus();
                  }
                }}
              />
              {formErrors.name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <Label>תפקיד</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">מנהל</SelectItem>
                  <SelectItem value="seller">מוכר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>קוד גישה *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.access_code}
                  onChange={(e) => setFormData({...formData, access_code: e.target.value})}
                  className={formErrors.access_code ? 'border-red-500' : ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.parentElement?.parentElement?.parentElement?.querySelector('input[dir="ltr"]')?.focus();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  צור קוד
                </Button>
              </div>
              {formErrors.access_code && (
                <p className="text-red-500 text-sm mt-1">{formErrors.access_code}</p>
              )}
            </div>
            <div>
              <Label>טלפון</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                dir="ltr"
                className={formErrors.phone ? 'border-red-500' : ''}
                onKeyDown={(e) => e.key === 'Enter' && handleEditStaff()}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label>פעיל</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ביטול</Button>
            <Button 
              onClick={handleEditStaff} 
              className="bg-[#1e3a5f]"
            >
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}