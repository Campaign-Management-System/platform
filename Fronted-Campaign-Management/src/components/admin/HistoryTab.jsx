import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowUpCircle, ArrowDownCircle, Gift, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

// Set moment locale to show correct times
moment.locale('he');

export default function HistoryTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const allTransactions = await base44.entities.Transaction.list();
      for (const transaction of allTransactions) {
        await base44.entities.Transaction.delete(transaction.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      toast.success('ההיסטוריה נוקתה בהצלחה');
    },
    onError: () => {
      toast.error('אירעה שגיאה בניקוי ההיסטוריה');
    }
  });

  const typeConfig = {
    add: { 
      label: 'הוספת איסרים', 
      icon: ArrowUpCircle, 
      color: 'bg-green-100 text-green-800',
      iconColor: 'text-green-500'
    },
    subtract: { 
      label: 'הורדת איסרים', 
      icon: ArrowDownCircle, 
      color: 'bg-red-100 text-red-800',
      iconColor: 'text-red-500'
    },
    prize_redemption: { 
      label: 'מימוש פרס', 
      icon: Gift, 
      color: 'bg-purple-100 text-purple-800',
      iconColor: 'text-purple-500'
    },
    card_replacement: { 
      label: 'החלפת כרטיס', 
      icon: RefreshCw, 
      color: 'bg-blue-100 text-blue-800',
      iconColor: 'text-blue-500'
    },
    student_deleted: { 
  label: 'מחיקת תלמיד', 
  icon: Trash2, 
  color: 'bg-orange-100 text-orange-800',
  iconColor: 'text-orange-500'
} 
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.card_number?.includes(search);
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-[#1e3a5f]">היסטוריית פעולות</CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה? פעולה זו אינה ניתנת לביטול.')) {
                clearHistoryMutation.mutate();
              }
            }}
            disabled={clearHistoryMutation.isPending}
          >
            <Trash2 className="w-4 h-4 ml-2" />
            נקה היסטוריה
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חיפוש לפי שם או מספר כרטיס..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="סוג פעולה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הפעולות</SelectItem>
              <SelectItem value="add">הוספת איסרים</SelectItem>
              <SelectItem value="subtract">הורדת איסרים</SelectItem>
              <SelectItem value="prize_redemption">מימוש פרס</SelectItem>
              <SelectItem value="card_replacement">החלפת כרטיס</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-right w-[120px]">תאריך</TableHead>
                <TableHead className="text-right w-[150px]">תלמיד</TableHead>
                <TableHead className="text-right w-[140px]">פעולה</TableHead>
                <TableHead className="text-right w-[80px]">שינוי</TableHead>
                <TableHead className="text-right w-[80px]">יתרה</TableHead>
                <TableHead className="text-right">הערה</TableHead>
                <TableHead className="text-right w-[100px]">בוצע ע"י</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const config = typeConfig[transaction.type] || typeConfig.add;
                const Icon = config.icon;
                
                return (
                  <TableRow key={transaction.id} className="hover:bg-gray-50">
                    <TableCell className="text-sm text-gray-500 w-[120px] text-right">
                     {moment.utc(transaction.created_date).local().format('DD/MM/YY HH:mm')}
                    </TableCell>
                    <TableCell className="w-[150px] text-right">
                      <div>
                        <span className="font-medium block">{transaction.student_name}</span>
                        <span className="text-xs text-gray-400 block font-mono">
                          ****{transaction.card_number?.slice(-4) || ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[140px] text-right">
                      <Badge className={config.color}>
                        <Icon className={`w-3 h-3 ml-1 ${config.iconColor}`} />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[80px] text-right">
                      <span className={transaction.points_change >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {transaction.points_change >= 0 ? '+' : ''}{transaction.points_change}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-[#1e3a5f] w-[80px] text-right">
                      {transaction.points_after}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 text-right">
                      <div className="max-w-[200px] truncate">
                        {transaction.prize_name || transaction.note || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 w-[100px] text-right">
                      {transaction.performed_by || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    לא נמצאו פעולות
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          סה"כ: {filteredTransactions.length} פעולות
        </p>
      </CardContent>
    </Card>
  );
}