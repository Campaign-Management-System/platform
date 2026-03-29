import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Gift, Star, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PrizesTab() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_cost: 0,
    stock: 0,
    is_available: true,
    image_url: ''
  });

  const { data: prizes = [] } = useQuery({
    queryKey: ['prizes'],
    queryFn: () => base44.entities.Prize.list(),
  });

  const createPrizeMutation = useMutation({
    mutationFn: (data) => base44.entities.Prize.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prizes']);
      setShowAddDialog(false);
      resetForm();
      toast.success('הפרס נוסף בהצלחה');
    }
  });

  const updatePrizeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Prize.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prizes']);
      setShowEditDialog(false);
      toast.success('הפרס עודכן בהצלחה');
    }
  });

  const deletePrizeMutation = useMutation({
    mutationFn: (id) => base44.entities.Prize.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['prizes']);
      toast.success('הפרס נמחק בהצלחה');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      points_cost: 0,
      stock: 0,
      is_available: true,
      image_url: ''
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success('התמונה הועלתה בהצלחה');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-[#1e3a5f]">ניהול פרסים</CardTitle>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2 bg-[#1e3a5f]">
            <Plus className="w-4 h-4" />
            הוסף פרס
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prizes.map((prize, index) => (
            <motion.div
              key={prize.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`overflow-hidden ${!prize.is_available ? 'opacity-60' : ''}`}>
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {prize.image_url ? (
                    <img 
                      src={prize.image_url} 
                      alt={prize.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  {!prize.is_available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold">לא זמין</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg text-[#1e3a5f]">{prize.name}</h3>
                  {prize.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{prize.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-[#d4af37]">
                      <Star className="w-5 h-5 fill-[#d4af37]" />
                      <span className="font-bold text-lg">{prize.points_cost}</span>
                    </div>
                   <span className={`text-sm ${prize.stock <= 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
  {prize.stock <= 0 ? 'אזל מהמלאי!' : `במלאי: ${prize.stock}`}
</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPrize(prize);
                        setFormData({
                          name: prize.name,
                          description: prize.description || '',
                          points_cost: prize.points_cost,
                          stock: prize.stock || 0,
                          is_available: prize.is_available !== false,
                          image_url: prize.image_url || ''
                        });
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      עריכה
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (confirm('האם למחוק את הפרס?')) {
                          deletePrizeMutation.mutate(prize.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {prizes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>לא נמצאו פרסים</p>
            <Button 
              onClick={() => { resetForm(); setShowAddDialog(true); }}
              className="mt-4 bg-[#1e3a5f]"
            >
              הוסף פרס ראשון
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => { setShowAddDialog(false); setShowEditDialog(false); }}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showEditDialog ? 'עריכת פרס' : 'הוספת פרס חדש'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="text-center">
              {formData.image_url ? (
                <div className="relative inline-block">
                  <img 
                    src={formData.image_url} 
                    alt="תמונת פרס"
                    className="w-32 h-32 object-cover rounded-xl"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2"
                    onClick={() => document.getElementById('prize-image').click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <div 
                  className={`w-32 h-32 mx-auto bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors ${isUploadingImage ? 'pointer-events-none' : ''}`}
                  onClick={() => document.getElementById('prize-image').click()}
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  ) : (
                    <ImagePlus className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )}
              <input
                id="prize-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
              />
              <p className="text-xs text-gray-500 mt-2">{isUploadingImage ? 'מעלה תמונה...' : 'לחץ להעלאת תמונה'}</p>
            </div>

            <div>
              <Label>שם הפרס</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.querySelector('textarea')?.focus();
                  }
                }}
              />
            </div>
            <div>
              <Label>תיאור</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.querySelector('input[type="number"]')?.focus();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>עלות באיסרים</Label>
                <Input
                  type="number"
                  value={formData.points_cost}
                  onChange={(e) => setFormData({...formData, points_cost: parseInt(e.target.value) || 0})}
                  min={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.parentElement?.nextElementSibling?.querySelector('input')?.focus();
                    }
                  }}
                />
              </div>
              <div>
                <Label>כמות במלאי</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  min={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (showEditDialog) {
                        updatePrizeMutation.mutate({ id: selectedPrize.id, data: formData });
                      } else {
                        createPrizeMutation.mutate(formData);
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>פרס זמין</Label>
              <Switch
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({...formData, is_available: checked})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setShowEditDialog(false); }}>
              ביטול
            </Button>
            <Button 
              onClick={() => {
                if (showEditDialog) {
                  updatePrizeMutation.mutate({ id: selectedPrize.id, data: formData });
                } else {
                  createPrizeMutation.mutate(formData);
                }
              }} 
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