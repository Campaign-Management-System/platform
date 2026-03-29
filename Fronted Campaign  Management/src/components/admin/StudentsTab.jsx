
import React, { useState, useRef } from 'react';
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
import CardScanner from '@/components/ui/CardScanner';
import {
  Plus,
  Search,
  Upload,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showReplaceCardDialog, setShowReplaceCardDialog] = useState(false);
  const [showBulkPointsDialog, setShowBulkPointsDialog] = useState(false);
  const [showColumnMappingDialog, setShowColumnMappingDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkPointsAmount, setBulkPointsAmount] = useState(0);
  const [bulkPointsClass, setBulkPointsClass] = useState('all');
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [isUploadMode, setIsUploadMode] = useState('new'); // 'new' or 'update'
  const fileInputRef = useRef(null); // Added for clearing file input
  const [classConflictDialog, setClassConflictDialog] = useState({
    open: false,
    conflicts: [], // רשימת כיתות לא מתאימות
  });
  const [pendingImportData, setPendingImportData] = useState([]);
  const [isCreatingClasses, setIsCreatingClasses] = useState(false);
  const [formData, setFormData] = useState({
    card_number: '',
    id_number: '',
    first_name: '',
    last_name: '',
    class_id: '',
    phone: '',
    points: 0
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });
  const handleCreateMissingClasses = async () => {
    if (isCreatingClasses) return; // 🔥 מונע לחיצה כפולה

    setIsCreatingClasses(true);

    try {
      // נביא את רשימת הכיתות המעודכנת רגע לפני יצירה
      const existingClasses = await queryClient.fetchQuery({
        queryKey: ['classes'],
      });

      const existingNames = new Set(
        existingClasses.map(c => `${c.class_name}-${c.class_number || ''}`)
      );

      for (const cls of classConflictDialog.conflicts) {
        const [classLetter, classNumber] = cls.split('-');
        const classKey = `${classLetter}-${classNumber || ''}`;

        // 🔥 בדיקה קריטית – אם כבר קיימת לא יוצרים שוב
        if (existingNames.has(classKey)) continue;

        await base44.entities.Class.create({
          name: cls,
          class_name: classLetter,
          class_number: classNumber || '',
          grade: classLetter,
          teacher_name: ''
        });

        existingNames.add(classKey); // מונע כפילות באותה ריצה
      }

      await queryClient.refetchQueries({ queryKey: ['classes'] });

      // 🔥 מביאים את הדאטה המעודכן בפועל
      const freshClasses = await queryClient.fetchQuery({
        queryKey: ['classes'],
      });

      setClassConflictDialog({ open: false, conflicts: [] });

      if (pendingImportData.length > 0) {
        const dataToProcess = [...pendingImportData];
        setPendingImportData([]);
        await handleProcessUpload(dataToProcess, freshClasses);
      }

    } catch (error) {
      console.error('Error creating missing classes:', error);
    } finally {
      setIsCreatingClasses(false);
    }
  };

  const handleBulkDelete = () => {
    setDeleteDialogOpen(true);
  };
  const createStudentMutation = useMutation({
    mutationFn: (data) => base44.entities.Student.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setShowAddDialog(false);
      resetForm();
      toast.success('התלמיד נוסף בהצלחה');
    }
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Student.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setShowEditDialog(false);
      setShowPointsDialog(false);
      setShowReplaceCardDialog(false);
      toast.success('התלמיד עודכן בהצלחה');
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (student) => {
      // 1. קודם כל יוצרים שורה בהיסטוריה עם כל פרטי התלמיד
      await base44.entities.Transaction.create({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        card_number: student.card_number,
        type: 'student_deleted', // הסוג החדש שהוספנו לעיצוב
        points_change: 0,
        points_before: student.points,
        points_after: student.points,
        note: 'תלמיד נמחק מהמערכת',
        performed_by: 'מנהל'
      });

      // 2. רק אז מוחקים את התלמיד עצמו
      return base44.entities.Student.delete(student.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['transactions']); // זה יעדכן את טאב ההיסטוריה מיד
      toast.success('התלמיד נמחק והפעולה תועדה בהיסטוריה');
    }
  });
  const bulkDeleteStudentsMutation = useMutation({
    mutationFn: async (studentsToDelete) => {
      await Promise.all(
        studentsToDelete.map(async (student) => {
          // 1️⃣ יצירת שורת היסטוריה
          await base44.entities.Transaction.create({
            student_id: student.id,
            student_name: `${student.first_name} ${student.last_name}`,
            card_number: student.card_number,
            type: 'student_deleted',
            points_change: 0,
            points_before: student.points,
            points_after: student.points,
            note: 'תלמיד נמחק מהמערכת',
            performed_by: 'מנהל'
          });

          // 2️⃣ מחיקה
          await base44.entities.Student.delete(student.id);
        })
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      queryClient.invalidateQueries(['transactions']);
      setSelectedIds([]);
      setDeleteDialogOpen(false);

      toast.success('התלמידים נמחקו והפעולה תועדה בהיסטוריה');
    }
  });
  const confirmBulkDelete = () => {
    const studentsToDelete = filteredStudents.filter(student =>
      selectedIds.includes(student.id)
    );

    bulkDeleteStudentsMutation.mutate(studentsToDelete);
  };

  const createTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
    }
  });

  const resetForm = () => {
    setFormData({
      card_number: '',
      id_number: '',
      first_name: '',
      last_name: '',
      class_id: '',
      phone: '',
      points: 0
    });

    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.card_number.trim()) {
      errors.card_number = 'מספר כרטיס חובה';
    } else if (students.some(s => s.card_number === formData.card_number && s.id !== selectedStudent?.id)) {
      errors.card_number = 'מספר כרטיס כבר קיים במערכת';
    }

    if (!formData.id_number.trim()) {
      errors.id_number = 'תעודת זהות חובה';
    } else if (!/^\d{9}$/.test(formData.id_number)) {
      errors.id_number = 'תעודת זהות חייבת להכיל 9 ספרות';
    } else if (
      students.some(
        s => s.id_number === formData.id_number && s.id !== selectedStudent?.id
      )
    ) {
      errors.id_number = 'תעודת זהות כבר קיימת במערכת';
    }

    if (!formData.first_name.trim()) {
      errors.first_name = 'שם פרטי חובה';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'שם משפחה חובה';
    }

    if (!formData.class_id) {
      errors.class_id = 'בחירת כיתה חובה';
    }

    if (formData.phone && !/^0\d{8,9}$/.test(formData.phone.replace(/[-\s]/g, ''))) {
      errors.phone = 'מספר טלפון לא תקין';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const ensureClassExists = async (className) => {
    if (!className) return '';

    const existingClass = classes.find(c => c.name === className);
    if (existingClass) {
      return existingClass.id;
    }

    const letterMatch = className.match(/[א-ת]/);
    const numberMatch = className.match(/\d+/);

    if (!letterMatch || !numberMatch) return '';

    const newClass = await base44.entities.Class.create({
      name: className,
      class_name: letterMatch[0],
      class_number: numberMatch[0],
      grade: letterMatch[0],
      teacher_name: ''
    });

    await queryClient.invalidateQueries(['classes']);
    return newClass.id;
  };

  const handleAddStudent = () => {
    if (!validateForm()) return;
    createStudentMutation.mutate(formData);
  };

  const handleEditStudent = () => {
    if (!validateForm()) return;
    updateStudentMutation.mutate({
      id: selectedStudent.id,
      data: formData
    });
  };

  const handleUpdatePoints = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const change = Number(pointsToAdd);

      if (isNaN(change)) {
        toast.error('הכנס מספר תקין');
        setIsProcessing(false);
        return;
      }

      const currentPoints = selectedStudent.points || 0;
      const newPoints = Math.max(0, currentPoints + change);
      await createTransactionMutation.mutateAsync({
        student_id: selectedStudent.id,
        student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        card_number: selectedStudent.card_number,
        type: change >= 0 ? 'add' : 'subtract',
        points_change: change,
        points_before: currentPoints,
        points_after: newPoints,
        performed_by: 'מנהל'
      });

      await updateStudentMutation.mutateAsync({
        id: selectedStudent.id,
        data: { points: newPoints }
      });

      setPointsToAdd(0);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleReplaceCard = async () => {
    if (isProcessing) return;

    if (students.some(s => s.card_number === newCardNumber && s.id !== selectedStudent.id)) {
      toast.error('מספר כרטיס כבר קיים במערכת');
      return;
    }

    setIsProcessing(true);
    try {
      await createTransactionMutation.mutateAsync({
        student_id: selectedStudent.id,
        student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
        card_number: newCardNumber,
        type: 'card_replacement',
        points_change: 0,
        points_before: selectedStudent.points || 0,
        points_after: selectedStudent.points || 0,
        note: `החלפת כרטיס מ-${selectedStudent.card_number} ל-${newCardNumber}`,
        performed_by: 'מנהל'
      });

      await updateStudentMutation.mutateAsync({
        id: selectedStudent.id,
        data: { card_number: newCardNumber }
      });

      setNewCardNumber('');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractLetterAndNumber = (text, type) => {
    if (!text) return '';
    if (type === 'letter') {
      const match = text.match(/[א-ת]/);
      return match ? match[0] : '';
    } else {
      const match = text.match(/\d+/);
      return match ? match[0] : '';
    }
  };
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s.id));
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      let text;

      try {
        const decoder = new TextDecoder('utf-8', { fatal: true });
        text = decoder.decode(arrayBuffer);
      } catch (e) {
        const decoder = new TextDecoder('windows-1255');
        text = decoder.decode(arrayBuffer);
      }

      let data = [];

      if (file.name.endsWith('.csv')) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) {
          toast.error('הקובץ ריק');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          return headers.reduce((obj, header, idx) => {
            obj[header] = values[idx] || '';
            return obj;
          }, {});
        });
      } else if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      }

      if (!Array.isArray(data) || data.length === 0) {
        toast.error('אין נתונים תקינים בקובץ');
        return;
      }

      setUploadedFileData(data);
      setColumnMapping({});
      setShowColumnMappingDialog(true);
      setShowUploadDialog(false); // Close upload dialog after file processed
    } catch (err) {
      console.error('Error reading file:', err);
      toast.error('שגיאה בקריאת הקובץ');
    }
  };

  const handleProcessUpload = async (fileData, overrideClasses = null) => {
    if (!uploadedFileData || uploadedFileData.length === 0) {
      toast.error('אין נתונים בקובץ');
      return;
    }

    const requiredFields = ['card_number', 'id_number', 'name', 'class_name', 'class_number'];

    for (const field of requiredFields) {
      if (!columnMapping[field] || columnMapping[field] === 'none') {
        toast.error('יש למפות את כל שדות החובה (כולל אות ומספר כיתה)');
        return;
      }
    }

    setIsProcessing(true);

    const processedData = [];
    const localClasses = overrideClasses || classes;
    const invalidClasses = [];
    for (const row of uploadedFileData) {
      const fullName = (row[columnMapping.name] || '').trim();
      const nameParts = fullName.split(/\s+/).filter(p => p);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const idNumber = (row[columnMapping.id_number] || '')
        .toString()
        .replace(/\D/g, '')
        .trim();

      if (!/^\d{9}$/.test(idNumber)) continue;

      let classId = '';
      let classLetter = '';
      let classNumber = '';

      // ===== טיפול בכיתה =====
      if (
        columnMapping.class_name &&
        columnMapping.class_name !== 'none'
      ) {
        const classNameRaw = (row[columnMapping.class_name] || '').toString().trim();
        classLetter = extractLetterAndNumber(classNameRaw, 'letter');

        if (
          columnMapping.class_number &&
          columnMapping.class_number !== 'none'
        ) {
          const classNumberRaw = (row[columnMapping.class_number] || '').toString().trim();
          classNumber = extractLetterAndNumber(classNumberRaw, 'number');
        }

        if (classLetter) {
          const matchingClass = localClasses.find(c =>
            c.class_name === classLetter &&
            (c.class_number || '') === (classNumber || '')
          );

          if (matchingClass) {
            classId = matchingClass.id;
            // } else {
            //   try {
            //     const newClass = await base44.entities.Class.create({
            //       name: classNumber
            //         ? `${classLetter}-${classNumber}`
            //         : `${classLetter}`,
            //       class_name: classLetter,
            //       class_number: classNumber || '',
            //       grade: classLetter,
            //       teacher_name: ''
            //     });

            //     localClasses.push(newClass);
            //     classId = newClass.id;

            //   } catch (err) {
            //     console.error('Error creating class:', err);
            //   }
            // }
          } else {
            const classKey = classNumber
              ? `${classLetter}-${classNumber}`
              : `${classLetter}`;

            if (!invalidClasses.includes(classKey)) {
              invalidClasses.push(classKey);
            }

            continue; // מדלג על התלמיד הזה כרגע
          }

        }
      }

      // ===== נקודות =====
      let points = 0;
      if (columnMapping.points && columnMapping.points !== 'none') {
        const pointsValue = row[columnMapping.points];
        if (pointsValue !== undefined && pointsValue !== null && pointsValue !== '') {
          points = parseInt(pointsValue) || 0;
        }
      }

      if ((row[columnMapping.card_number] || '').toString().trim() && firstName) {
        processedData.push({
          card_number: (row[columnMapping.card_number] || '').toString().trim(),
          id_number: idNumber,
          first_name: firstName,
          last_name: lastName,
          class_id: classId,
          phone: columnMapping.phone && columnMapping.phone !== 'none'
            ? (row[columnMapping.phone] || '').toString().trim()
            : '',
          points: points
        });
      }
    }
    if (invalidClasses.length > 0) {
      setPendingImportData(uploadedFileData);

      setClassConflictDialog({
        open: true,
        conflicts: invalidClasses,
      });

      setIsProcessing(false);
      return;
    }

    if (!processedData.length) {
      toast.error('לא קיימים נתונים תקינים בקובץ');
      setIsProcessing(false);
      return;
    }



    try {
      if (isUploadMode === 'new') {

        const existingCards = new Set(students.map(s => s.card_number));
        const existingIds = new Set(students.map(s => s.id_number));

        const newStudents = processedData.filter(item =>
          !existingCards.has(item.card_number) &&
          !existingIds.has(item.id_number)
        );

        if (newStudents.length === 0) {
          toast.error('כל התלמידים בקובץ כבר קיימים במערכת');
          setIsProcessing(false);
          return;
        }

        if (newStudents.length < processedData.length) {
          toast.warning(`${processedData.length - newStudents.length} תלמידים דולגו כי הם כבר קיימים`);
        }

        await base44.entities.Student.bulkCreate(newStudents);
        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['classes'] });

        toast.success('התלמידים הוסיפו בהצלחה');

      } else {

        const updates = [];
        const newStudentsToCreate = [];

        processedData.forEach(item => {
          const existing = students.find(s => s.card_number === item.card_number);

          if (existing) {
            const newPoints = (existing.points || 0) + item.points;

            const updateData = {
              points: newPoints,
              first_name: item.first_name,
              last_name: item.last_name,
              phone: item.phone
            };

            if (item.class_id) {
              updateData.class_id = item.class_id;
            }

            updates.push({
              id: existing.id,
              data: updateData
            });

          } else {
            newStudentsToCreate.push(item);
          }
        });

        for (const u of updates) {
          await base44.entities.Student.update(u.id, u.data);

          await new Promise(res => setTimeout(res, 300)); // 300ms בין כל בקשה
        }
        if (newStudentsToCreate.length > 0) {
          await base44.entities.Student.bulkCreate(newStudentsToCreate);
        }

        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['classes'] });

        toast.success('הנתונים עודכנו בהצלחה');
      }

      setShowColumnMappingDialog(false);
      setUploadedFileData(null);
      setColumnMapping({});

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Error processing upload:', err);
      toast.error('שגיאה בעיבוד הנתונים');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleBulkAddPoints = async () => {
    if (!selectedIds.length) {
      toast.error('לא נבחרו תלמידים');
      return;
    }

    const delta = parseInt(bulkPointsAmount, 10);

    if (isNaN(delta)) {
      toast.error('הכנס מספר תקין');
      return;
    }

    const selectedStudents = students.filter(s =>
      selectedIds.includes(s.id)
    );

    setIsProcessing(true);

    try {
      for (const student of selectedStudents) {
        const currentPoints = student.points || 0;
        const newPoints = Math.max(0, currentPoints + delta);

        await base44.entities.Student.update(student.id, {
          points: newPoints,
        });

        await base44.entities.Transaction.create({
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          card_number: student.card_number,
          type: delta >= 0 ? 'add' : 'subtract',
          points_change: delta,
          points_before: currentPoints,
          points_after: newPoints,
          performed_by: 'מנהל (עדכון מסומנים)',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast.success(`נקודות עודכנו ל-${selectedStudents.length} תלמידים`);

      setShowBulkPointsDialog(false);
      setBulkPointsAmount(0);
      setSelectedIds([]); // נקה סימון אחרי פעולה

    } catch (err) {
      console.error(err);
      toast.error('שגיאה בעדכון הנקודות');
    } finally {
      setIsProcessing(false);
    }
  };



  const filteredStudents = students.filter(s => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      s.first_name?.toLowerCase().includes(searchLower) ||
      s.last_name?.toLowerCase().includes(searchLower) ||
      s.card_number?.includes(search) ||
      s.id_number?.includes(search);
    const matchesClass = filterClass === 'all' || s.class_id === filterClass;
    return matchesSearch && matchesClass;
  });

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || '-';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          ניהול תלמידים
          <div className="flex gap-2">
            <Button onClick={() => { setShowAddDialog(true); resetForm(); }} size="sm">
              <Plus className="h-4 w-4 ml-2" />
              הוסף תלמיד
            </Button>
            <Button onClick={() => setShowUploadDialog(true)} size="sm" variant="outline">
              <Upload className="h-4 w-4 ml-2" />
              ייבוא תלמידים
            </Button>
            <Button onClick={() => queryClient.invalidateQueries(['students'])} size="sm" variant="ghost">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חפש תלמיד..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="סנן לפי כיתה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הכיתות</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedIds.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border rounded flex justify-between items-center">
            <span>
              נבחרו {selectedIds.length} תלמידים
            </span>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              מחק מסומנים
            </Button>
          </div>
        )}
        {selectedIds.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border rounded flex justify-between items-center">

            <Button
              onClick={() => setShowBulkPointsDialog(true)}
              size="sm"
              variant="outline"
            >
              עדכון נקודות למסומנים ({selectedIds.length})
            </Button>
          </div>

        )}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>

        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מספר כרטיס</TableHead>
                <TableHead>ת.ז.</TableHead>
                <TableHead>שם פרטי</TableHead>
                <TableHead>שם משפחה</TableHead>
                <TableHead>כיתה</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>נקודות</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
                <TableHead>
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === filteredStudents.length &&
                      filteredStudents.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    אין תלמידים להצגה.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.card_number}</TableCell>
                    <TableCell>{student.id_number}</TableCell>
                    <TableCell>{student.first_name}</TableCell>
                    <TableCell>{student.last_name}</TableCell>
                    <TableCell>{getClassName(student.class_id)}</TableCell>
                    <TableCell>{student.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.points || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedStudent(student);
                            setPointsToAdd(0);
                            setShowPointsDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedStudent(student);
                            setNewCardNumber(student.card_number);
                            setShowReplaceCardDialog(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedStudent(student);
                            const classIdToDisplay = student.class_id ? getClassName(student.class_id) : '';
                            setFormData({
                              card_number: student.card_number,
                              id_number: student.id_number,
                              first_name: student.first_name,
                              last_name: student.last_name,
                              class_id: classIdToDisplay,
                              phone: student.phone || '',
                              points: student.points || 0
                            });
                            setFormErrors({});
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setStudentToDelete(student);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Update or add student Dialog */}

      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setSelectedStudent(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'עריכת תלמיד' : 'הוספת תלמיד'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {showEditDialog ? (
              <div>
                <Label>מס׳ כרטיס</Label>
                <Input
                  value={formData.card_number}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            ) : (
              <div>
                <Label>מס׳ כרטיס - סרוק כרטיס</Label>
                <CardScanner
                  onCardScanned={(cardNumber) => setFormData({ ...formData, card_number: cardNumber })}
                />
                {formErrors.card_number && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.card_number}</p>
                )}
              </div>
            )}
            <div>
              <Label>תעודת זהות</Label>
              <Input
                value={formData.id_number}
                onChange={(e) =>
                  setFormData({ ...formData, id_number: e.target.value.replace(/\D/g, '') })
                }
                maxLength={9}
                className={formErrors.id_number ? 'border-red-500' : ''}
              />
              {formErrors.id_number && (
                <p className="text-red-500 text-sm mt-1">{formErrors.id_number}</p>
              )}
            </div>

            <div>
              <Label>שם פרטי</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className={formErrors.first_name ? 'border-red-500' : ''}
              />
              {formErrors.first_name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.first_name}</p>
              )}
            </div>

            <div>
              <Label>שם משפחה</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className={formErrors.last_name ? 'border-red-500' : ''}
              />
              {formErrors.last_name && (
                <p className="text-red-500 text-sm mt-1">{formErrors.last_name}</p>
              )}
            </div>

            <div>
              <Label>כיתה</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                {formErrors.class_id && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.class_id}
                  </p>
                )}
                <SelectTrigger>
                  <SelectValue placeholder="בחר כיתה" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>טלפון</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={formErrors.phone ? 'border-red-500' : ''}
              />
              {formErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setShowEditDialog(false);
              setSelectedStudent(null);
              resetForm();
            }}>
              ביטול
            </Button>
            <Button
              onClick={showEditDialog ? handleEditStudent : handleAddStudent}
              disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
            >
              {showEditDialog ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עדכן נקודות לתלמיד {selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>נקודות נוכחיות: {selectedStudent?.points || 0}</p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pointsToAdd" className="text-right">
                כמות נקודות לשינוי
              </Label>
              <Input
                id="pointsToAdd"
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdatePoints} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              עדכן נקודות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace Card Dialog */}
      <Dialog open={showReplaceCardDialog} onOpenChange={setShowReplaceCardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>החלף כרטיס לתלמיד {selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>מספר כרטיס נוכחי: {selectedStudent?.card_number}</p>
            <div>
              <Label>מס׳ כרטיס - סרוק כרטיס</Label>
              <CardScanner
                onCardScanned={(cardNumber) => setNewCardNumber(cardNumber)}
              />

              {formErrors.card_number && (
                <p className="text-red-500 text-sm mt-1">{formErrors.card_number}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleReplaceCard} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              החלף כרטיס
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ייבוא תלמידים</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>ייבא קובץ CSV או JSON עם פרטי תלמידים.</p>
            <p className="text-sm text-muted-foreground">
              ניתן לייבא תלמידים חדשים (במקרה של התנגשות במספר כרטיס, התלמיד לא יתווסף) או לעדכן תלמידים קיימים (במקרה של התנגשות, הנקודות יתווספו).
            </p>
            <div className="flex items-center gap-4">
              <Label htmlFor="upload-mode-new" className="cursor-pointer flex items-center gap-1">
                <Input
                  type="radio"
                  id="upload-mode-new"
                  name="upload-mode"
                  value="new"
                  checked={isUploadMode === 'new'}
                  onChange={() => setIsUploadMode('new')}
                  className="w-4 h-4"
                />
                הוסף תלמידים חדשים
              </Label>
              <Label htmlFor="upload-mode-update" className="cursor-pointer flex items-center gap-1">
                <Input
                  type="radio"
                  id="upload-mode-update"
                  name="upload-mode"
                  value="update"
                  checked={isUploadMode === 'update'}
                  onChange={() => setIsUploadMode('update')}
                  className="w-4 h-4"
                />
                עדכן תלמידים קיימים
              </Label>
            </div>
            <Input type="file" accept=".csv,.json" onChange={handleFileUpload} ref={fileInputRef} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowUploadDialog(false)} variant="outline">
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Mapping Dialog */}
      <Dialog open={showColumnMappingDialog} onOpenChange={setShowColumnMappingDialog}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>התאמת עמודות</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 space-y-4 overflow-y-auto pr-2 flex-1">
            <p>אנא התאם את כותרות העמודות מהקובץ לשדות המערכת:</p>
            {uploadedFileData && uploadedFileData.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="font-semibold">שדה במערכת</div>
                <div className="font-semibold">כותרת עמודה בקובץ (דוגמה: {Object.keys(uploadedFileData[0] || {}).join(', ')})</div>

                {['card_number', 'id_number', 'name', 'class_name', 'class_number', 'phone', 'points']
                  .map(field => (
                    <React.Fragment key={field}>
                      <Label className="text-right capitalize">
                        {field === 'card_number' && 'מספר כרטיס*'}
                        {field === 'id_number' && 'תעודת זהות*'}
                        {field === 'name' && 'שם מלא*'}
                        {field === 'class_name' && '*אות כיתה'}
                        {field === 'class_number' && '*מספר כיתה'}
                        {field === 'phone' && 'טלפון'}
                        {field === 'points' && 'נקודות'}
                      </Label>
                      <Select
                        value={columnMapping[field] || 'none'}
                        onValueChange={(value) => setColumnMapping({ ...columnMapping, [field]: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`בחר עמודה ל-${field}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">התעלם</SelectItem>
                          {Object.keys(uploadedFileData[0] || {}).map(header => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </React.Fragment>
                  ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">* שדות חובה</p>
          </div>
          <DialogFooter>
            <Button onClick={handleProcessUpload} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              המשך
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Points Dialog */}
      <Dialog open={showBulkPointsDialog} onOpenChange={setShowBulkPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עדכון נקודות קבוצתי</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p>הוסף נקודות לכל התלמידים בכיתה נבחרת או לכל התלמידים במערכת.</p>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkPointsAmount" className="text-right">
                כמות נקודות להוספה
              </Label>
              <Input
                id="bulkPointsAmount"
                type="number"
                value={bulkPointsAmount}
                onChange={(e) => setBulkPointsAmount(parseInt(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
            <div>
              <p>
                עדכון נקודות עבור {selectedIds.length} תלמידים שנבחרו.
              </p>

            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleBulkAddPoints} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              עדכן נקודות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* delete student Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>אישור מחיקה</DialogTitle>
          </DialogHeader>

          <p className="text-sm">
            האם אתה בטוח שברצונך למחוק את{' '}
            <strong>
              {studentToDelete?.first_name} {studentToDelete?.last_name}
            </strong>{' '}
            מהרשימה?
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setStudentToDelete(null);
              }}
            >
              ביטול
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                deleteStudentMutation.mutate(studentToDelete);
                setShowDeleteDialog(false);
                setStudentToDelete(null);
              }}
            >
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>אישור מחיקה</DialogTitle>
          </DialogHeader>

          <p>
            האם אתה בטוח שברצונך למחוק {selectedIds.length} תלמידים?
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              ביטול
            </Button>

            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
            >
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={classConflictDialog.open}
        onOpenChange={(open) =>
          setClassConflictDialog(prev => ({ ...prev, open }))
        }
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>נמצאו כיתות שלא קיימות במערכת</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {classConflictDialog.conflicts.map((cls, index) => (
              <div
                key={index}
                className="border rounded p-2 text-sm bg-gray-50"
              >
                {cls}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setClassConflictDialog({ open: false, conflicts: [] })
              }
            >
              ביטול
            </Button>
            <Button
              onClick={handleCreateMissingClasses}
              disabled={isCreatingClasses}
            >
              {isCreatingClasses ? 'יוצר כיתות...' : 'המשך'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
