// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { base44 } from '@/api/base44Client';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Plus, Edit, Trash2, Users } from 'lucide-react';
// import { toast } from 'sonner';

// export default function ClassesTab() {
//   const queryClient = useQueryClient();
//   const [showAddDialog, setShowAddDialog] = useState(false);
//   const [showEditDialog, setShowEditDialog] = useState(false);
//   const [selectedClass, setSelectedClass] = useState(null);
//   const [formData, setFormData] = useState({
//     class_name: '',
//     class_number: '',
//     grade: '',
//     teacher_name: ''
//   });
//   const [formErrors, setFormErrors] = useState({});

//   const { data: classes = [] } = useQuery({
//     queryKey: ['classes'],
//     queryFn: () => base44.entities.Class.list(),
//   });

//   const { data: students = [] } = useQuery({
//     queryKey: ['students'],
//     queryFn: () => base44.entities.Student.list(),
//   });

//   const createClassMutation = useMutation({
//     mutationFn: (data) => base44.entities.Class.create(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries(['classes']);
//       setShowAddDialog(false);
//       resetForm();
//       toast.success('הכיתה נוספה בהצלחה');
//     }
//   });

//   const updateClassMutation = useMutation({
//     mutationFn: ({ id, data }) => base44.entities.Class.update(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries(['classes']);
//       setShowEditDialog(false);
//       toast.success('הכיתה עודכנה בהצלחה');
//     }
//   });

//   const deleteClassMutation = useMutation({
//     mutationFn: (id) => base44.entities.Class.delete(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries(['classes']);
//       toast.success('הכיתה נמחקה בהצלחה');
//     }
//   });

//   const resetForm = () => {
//     setFormData({ class_name: '', class_number: '', grade: '', teacher_name: '' });
//     setFormErrors({});
//   };

//   const extractLetterAndNumber = (text, type) => {
//     if (!text) return '';
//     if (type === 'letter') {
//       const match = text.match(/[א-ת]/);
//       return match ? match[0] : '';
//     } else {
//       const match = text.match(/\d+/);
//       return match ? match[0] : '';
//     }
//   };

//   // const validateForm = () => {
//   //   const errors = {};

//   //   const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
//   //   const cleanClassNumber = extractLetterAndNumber(formData.class_number, 'number');

//   //   if (!cleanClassName) errors.class_name = 'שם הכיתה הוא שדה חובה (אות אחת)';
//   //   if (!cleanClassNumber) errors.class_number = 'מספר הכיתה הוא שדה חובה';

//   //   const fullName = `${cleanClassName}-${cleanClassNumber}`;
//   //   if (cleanClassName && cleanClassNumber && classes.some(c => c.name === fullName && c.id !== selectedClass?.id)) {
//   //     errors.class_name = 'כיתה זו כבר קיימת במערכת';
//   //   }

//   //   setFormErrors(errors);
//   //   return Object.keys(errors).length === 0;
//   // };
//   const validateForm = () => {
//     const errors = {};

//     const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
//     const cleanClassNumberRaw = extractLetterAndNumber(formData.class_number, 'number');
//     const cleanClassNumber = cleanClassNumberRaw ? Number(cleanClassNumberRaw) : null;

//     // אות חובה
//     if (!cleanClassName) {
//       errors.class_name = 'שם הכיתה הוא שדה חובה (אות אחת)';
//     }

//     // בדיקת כפילויות חכמה
//     const classExists = classes.some(c => {
//       const existingNumberRaw = extractLetterAndNumber(c.class_number, 'number');
//       const existingNumber = existingNumberRaw ? Number(existingNumberRaw) : null;

//       // אם לשתיהן אין מספר
//       if (cleanClassNumber === null && existingNumber === null) {
//         return c.class_name === cleanClassName && c.id !== selectedClass?.id;
//       }

//       // אם לשתיהן יש מספר
//       if (cleanClassNumber !== null && existingNumber !== null) {
//         return (
//           c.class_name === cleanClassName &&
//           existingNumber === cleanClassNumber &&
//           c.id !== selectedClass?.id
//         );
//       }

//       // אחרת – לא כפילות
//       return false;
//     });

//     if (classExists) {
//       errors.class_name = 'כיתה זו כבר קיימת במערכת';
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   // const handleAddClass = () => {
//   //   if (validateForm()) {
//   //     const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
//   //     const cleanClassNumber = extractLetterAndNumber(formData.class_number, 'number');
//   //     const dataToSave = {
//   //       name: `${cleanClassName}-${cleanClassNumber}`,
//   //       class_name: cleanClassName,
//   //       class_number: cleanClassNumber,
//   //       grade: formData.grade || cleanClassName,
//   //       teacher_name: formData.teacher_name || ''
//   //     };
//   //     createClassMutation.mutate(dataToSave);
//   //   }
//   // };
//   const handleAddClass = () => {
//     if (validateForm()) {
//       const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
//       const cleanClassNumberRaw = extractLetterAndNumber(formData.class_number, 'number');
//       const cleanClassNumber = cleanClassNumberRaw ? Number(cleanClassNumberRaw) : '';

//       const dataToSave = {
//         name: cleanClassNumber !=='' ? `${cleanClassName}-${cleanClassNumber}` : cleanClassName,
//         class_name: cleanClassName,
//         class_number: cleanClassNumber,
//         grade: formData.grade || cleanClassName,
//         teacher_name: formData.teacher_name || ''
//       };

//       createClassMutation.mutate(dataToSave);
//     }
//   };

//   // const handleUpdateClass = () => {
//   //   if (validateForm()) {
//   //     const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
//   //     const cleanClassNumber = extractLetterAndNumber(formData.class_number, 'number');
//   //     const dataToSave = {
//   //       name: `${cleanClassName}-${cleanClassNumber}`,
//   //       class_name: cleanClassName,
//   //       class_number: cleanClassNumber,
//   //       grade: formData.grade || cleanClassName,
//   //       teacher_name: formData.teacher_name || ''
//   //     };
//   //     updateClassMutation.mutate({ id: selectedClass.id, data: dataToSave });
//   //   }
//   // };
//   const handleUpdateClass = () => {
//     if (validateForm()) {
//       const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
//       const cleanClassNumberRaw = extractLetterAndNumber(formData.class_number, 'number');
//       const cleanClassNumber = cleanClassNumberRaw ? Number(cleanClassNumberRaw) : '';

//       const dataToSave = {
//         name: cleanClassNumber !== '' ? `${cleanClassName}-${cleanClassNumber}` : cleanClassName,
//         class_name: cleanClassName,
//         class_number: cleanClassNumber,
//         grade: formData.grade || cleanClassName,
//         teacher_name: formData.teacher_name || ''
//       };

//       updateClassMutation.mutate({ id: selectedClass.id, data: dataToSave });
//     }
//   };

//   const getStudentCount = (classId) => {
//     return students.filter(s => s.class_id === classId).length;
//   };

//   const getTotalPoints = (classId) => {
//     return students
//       .filter(s => s.class_id === classId)
//       .reduce((sum, s) => sum + (s.points || 0), 0);
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex justify-between items-center">
//           <CardTitle className="text-xl text-[#1e3a5f]">ניהול כיתות</CardTitle>
//           <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2 bg-[#1e3a5f]">
//             <Plus className="w-4 h-4" />
//             הוסף כיתה
//           </Button>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="rounded-lg border overflow-x-auto">
//           <table className="w-full table-fixed">
//             <thead>
//               <tr className="bg-gray-50 border-b">
//                 <th className="text-right p-3 font-medium text-sm w-[20%]">שם הכיתה</th>
//                 <th className="text-right p-3 font-medium text-sm w-[12%]">שכבה</th>
//                 <th className="text-right p-3 font-medium text-sm w-[22%]">מחנך</th>
//                 <th className="text-right p-3 font-medium text-sm w-[15%]">תלמידים</th>
//                 <th className="text-right p-3 font-medium text-sm w-[16%]">סה"כ איסרים</th>
//                 <th className="text-right p-3 font-medium text-sm w-[15%]">פעולות</th>
//               </tr>
//             </thead>
//             <tbody>
//               {classes.map((cls) => (
//                 <tr key={cls.id} className="border-b hover:bg-gray-50">
//                   <td className="p-3 font-medium w-[20%] text-right">{cls.name}</td>
//                   <td className="p-3 w-[12%] text-right">{cls.grade || '-'}</td>
//                   <td className="p-3 w-[22%] text-right">{cls.teacher_name || '-'}</td>
//                   <td className="p-3 w-[15%]">
//                     <div className="flex items-center gap-2 justify-end">
//                       <Users className="w-4 h-4 text-gray-400" />
//                       {getStudentCount(cls.id)}
//                     </div>
//                   </td>
//                   <td className="p-3 font-bold text-[#1e3a5f] w-[16%] text-right">
//                     {getTotalPoints(cls.id).toLocaleString()}
//                   </td>
//                   <td className="p-3 w-[15%] text-right">
//                     <div className="flex gap-1 justify-end">
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         onClick={() => {
//                           setSelectedClass(cls);
//                           setFormData({
//                             class_name: cls.class_name || '',
//                             class_number: cls.class_number || '',
//                             grade: cls.grade || '',
//                             teacher_name: cls.teacher_name || ''
//                           });
//                           setShowEditDialog(true);
//                         }}
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         size="sm"
//                         variant="ghost"
//                         className="text-red-500 hover:text-red-700"
//                         onClick={() => {
//                           if (getStudentCount(cls.id) > 0) {
//                             toast.error('לא ניתן למחוק כיתה עם תלמידים');
//                             return;
//                           }
//                           if (confirm('האם למחוק את הכיתה?')) {
//                             deleteClassMutation.mutate(cls.id);
//                           }
//                         }}
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//               {classes.length === 0 && (
//                 <tr>
//                   <td colSpan={6} className="text-center py-8 text-gray-500">
//                     לא נמצאו כיתות
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </CardContent>

//       {/* Add Class Dialog */}
//       <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
//         <DialogContent dir="rtl">
//           <DialogHeader>
//             <DialogTitle>הוספת כיתה חדשה</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <Label>שם הכיתה (אות) <span className="text-red-500">*</span></Label>
//               <Input
//                 value={formData.class_name}
//                 onChange={(e) => {
//                   setFormData({ ...formData, class_name: e.target.value });
//                   if (formErrors.class_name) setFormErrors({ ...formErrors, class_name: '' });
//                 }}
//                 placeholder="לדוגמה: א"
//                 className={formErrors.class_name ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
//                     if (inputs && inputs[1]) inputs[1].focus();
//                   }
//                 }}
//               />
//               {formErrors.class_name && <p className="text-red-500 text-sm mt-1">{formErrors.class_name}</p>}
//             </div>
//             <div>
//               <Label>מספר כיתה <span className="text-red-500">*</span></Label>
//               <Input
//                 value={formData.class_number}
//                 onChange={(e) => {
//                   setFormData({ ...formData, class_number: e.target.value });
//                   if (formErrors.class_number) setFormErrors({ ...formErrors, class_number: '' });
//                 }}
//                 placeholder="לדוגמה: 1"
//                 className={formErrors.class_number ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
//                     if (inputs && inputs[2]) inputs[2].focus();
//                   }
//                 }}
//               />
//               {formErrors.class_number && <p className="text-red-500 text-sm mt-1">{formErrors.class_number}</p>}
//             </div>
//             <div>
//               <Label>שכבה</Label>
//               <Input
//                 value={formData.grade}
//                 onChange={(e) => {
//                   setFormData({ ...formData, grade: e.target.value });
//                   if (formErrors.grade) setFormErrors({ ...formErrors, grade: '' });
//                 }}
//                 placeholder="לדוגמה: א"
//                 className={formErrors.grade ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
//                     if (inputs && inputs[3]) inputs[3].focus();
//                   }
//                 }}
//               />
//               {formErrors.grade && <p className="text-red-500 text-sm mt-1">{formErrors.grade}</p>}
//             </div>
//             <div>
//               <Label>שם מחנך</Label>
//               <Input
//                 value={formData.teacher_name}
//                 onChange={(e) => {
//                   setFormData({ ...formData, teacher_name: e.target.value });
//                   if (formErrors.teacher_name) setFormErrors({ ...formErrors, teacher_name: '' });
//                 }}
//                 className={formErrors.teacher_name ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     handleAddClass();
//                   }
//                 }}
//               />
//               {formErrors.teacher_name && <p className="text-red-500 text-sm mt-1">{formErrors.teacher_name}</p>}
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowAddDialog(false)}>ביטול</Button>
//             <Button onClick={handleAddClass} className="bg-[#1e3a5f]">
//               שמור
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* Edit Class Dialog */}
//       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
//         <DialogContent dir="rtl">
//           <DialogHeader>
//             <DialogTitle>עריכת כיתה</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div>
//               <Label>שם הכיתה (אות) <span className="text-red-500">*</span></Label>
//               <Input
//                 value={formData.class_name}
//                 onChange={(e) => {
//                   setFormData({ ...formData, class_name: e.target.value });
//                   if (formErrors.class_name) setFormErrors({ ...formErrors, class_name: '' });
//                 }}
//                 placeholder="לדוגמה: א"
//                 className={formErrors.class_name ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
//                     if (inputs && inputs[1]) inputs[1].focus();
//                   }
//                 }}
//               />
//               {formErrors.class_name && <p className="text-red-500 text-sm mt-1">{formErrors.class_name}</p>}
//             </div>
//             <div>
//               <Label>מספר כיתה <span className="text-red-500">*</span></Label>
//               <Input
//                 value={formData.class_number}
//                 onChange={(e) => {
//                   setFormData({ ...formData, class_number: e.target.value });
//                   if (formErrors.class_number) setFormErrors({ ...formErrors, class_number: '' });
//                 }}
//                 placeholder="לדוגמה: 1"
//                 className={formErrors.class_number ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
//                     if (inputs && inputs[2]) inputs[2].focus();
//                   }
//                 }}
//               />
//               {formErrors.class_number && <p className="text-red-500 text-sm mt-1">{formErrors.class_number}</p>}
//             </div>
//             <div>
//               <Label>שכבה</Label>
//               <Input
//                 value={formData.grade}
//                 onChange={(e) => {
//                   setFormData({ ...formData, grade: e.target.value });
//                   if (formErrors.grade) setFormErrors({ ...formErrors, grade: '' });
//                 }}
//                 className={formErrors.grade ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
//                     if (inputs && inputs[3]) inputs[3].focus();
//                   }
//                 }}
//               />
//               {formErrors.grade && <p className="text-red-500 text-sm mt-1">{formErrors.grade}</p>}
//             </div>
//             <div>
//               <Label>שם מחנך</Label>
//               <Input
//                 value={formData.teacher_name}
//                 onChange={(e) => {
//                   setFormData({ ...formData, teacher_name: e.target.value });
//                   if (formErrors.teacher_name) setFormErrors({ ...formErrors, teacher_name: '' });
//                 }}
//                 className={formErrors.teacher_name ? 'border-red-500' : ''}
//                 onKeyDown={(e) => {
//                   if (e.key === 'Enter') {
//                     e.preventDefault();
//                     handleUpdateClass();
//                   }
//                 }}
//               />
//               {formErrors.teacher_name && <p className="text-red-500 text-sm mt-1">{formErrors.teacher_name}</p>}
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowEditDialog(false)}>ביטול</Button>
//             <Button
//               onClick={handleUpdateClass}
//               className="bg-[#1e3a5f]"
//             >
//               שמור
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </Card>
//   );
// }
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Users, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassesTab() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    class_number: '',
    grade: '',
    teacher_name: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [openGrades, setOpenGrades] = useState([]);

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const createClassMutation = useMutation({
    mutationFn: (data) => base44.entities.Class.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setShowAddDialog(false);
      resetForm();
      toast.success('הכיתה נוספה בהצלחה');
    }
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Class.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      setShowEditDialog(false);
      toast.success('הכיתה עודכנה בהצלחה');
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id) => base44.entities.Class.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes']);
      toast.success('הכיתה נמחקה בהצלחה');
    }
  });

  const resetForm = () => {
    setFormData({ class_name: '', class_number: '', grade: '', teacher_name: '' });
    setFormErrors({});
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

  const validateForm = () => {
    const errors = {};
    const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
    const cleanClassNumber = extractLetterAndNumber(formData.class_number, 'number');
    if (!cleanClassName) errors.class_name = 'שם הכיתה הוא שדה חובה (אות אחת)';
    // class_number לא חובה עכשיו, אז אין בדיקה כאן
    const fullName = `${cleanClassName}-${cleanClassNumber}`;
    if (cleanClassName && classes.some(c => c.name === fullName && c.id !== selectedClass?.id)) {
      errors.class_name = 'כיתה זו כבר קיימת במערכת';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClass = () => {
    if (validateForm()) {
      const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
      const cleanClassNumber = extractLetterAndNumber(formData.class_number, 'number');
      const dataToSave = {
        name: cleanClassNumber ? `${cleanClassName}-${cleanClassNumber}` : cleanClassName,
        class_name: cleanClassName,
        class_number: cleanClassNumber || '',
        grade: formData.grade || cleanClassName,
        teacher_name: formData.teacher_name || ''
      };
      createClassMutation.mutate(dataToSave);
    }
  };

  const handleUpdateClass = () => {
    if (validateForm()) {
      const cleanClassName = extractLetterAndNumber(formData.class_name, 'letter');
      const cleanClassNumber = extractLetterAndNumber(formData.class_number, 'number');
      const dataToSave = {
        name: cleanClassNumber ? `${cleanClassName}-${cleanClassNumber}` : cleanClassName,
        class_name: cleanClassName,
        class_number: cleanClassNumber || '',
        grade: formData.grade || cleanClassName,
        teacher_name: formData.teacher_name || ''
      };
      updateClassMutation.mutate({ id: selectedClass.id, data: dataToSave });
    }
  };

  const getStudentCount = (classId) => students.filter(s => s.class_id === classId).length;
  const getTotalPoints = (classId) => students.filter(s => s.class_id === classId).reduce((sum, s) => sum + (s.points || 0), 0);

  // toggle open/close grade
  const toggleGrade = (grade) => {
    setOpenGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
  };

  // group classes by grade
  const groupedClasses = classes.reduce((acc, cls) => {
    const grade = cls.grade || cls.class_name;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(cls);
    return acc;
  }, {});

  // sort grades and classes
  const sortedGrades = Object.keys(groupedClasses).sort((a, b) => a.localeCompare(b, 'he'));
  sortedGrades.forEach(grade => {
    groupedClasses[grade].sort((a, b) => {
      const numA = parseInt(a.class_number || '0');
      const numB = parseInt(b.class_number || '0');
      return numA - numB;
    });
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-[#1e3a5f]">ניהול כיתות</CardTitle>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2 bg-[#1e3a5f]">
            <Plus className="w-4 h-4" />
            הוסף כיתה
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedGrades.map(grade => (
          <div key={grade} className="mb-4 border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleGrade(grade)}
              className="w-full text-right p-3 bg-gray-100 hover:bg-gray-200 font-bold flex justify-between items-center"
            >
              <span>{grade}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                  openGrades.includes(grade) ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>
            {openGrades.includes(grade) && (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-right p-3 font-medium text-sm w-[20%]">שם הכיתה</th>
                    <th className="text-right p-3 font-medium text-sm w-[22%]">מחנך</th>
                    <th className="text-right p-3 font-medium text-sm w-[15%]">תלמידים</th>
                    <th className="text-right p-3 font-medium text-sm w-[16%]">סה"כ איסרים</th>
                    <th className="text-right p-3 font-medium text-sm w-[15%]">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedClasses[grade].map(cls => (
                    <tr key={cls.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-right">{cls.name}</td>
                      <td className="p-3 text-right">{cls.teacher_name || '-'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Users className="w-4 h-4 text-gray-400" />
                          {getStudentCount(cls.id)}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-[#1e3a5f] text-right">{getTotalPoints(cls.id).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedClass(cls);
                              setFormData({
                                class_name: cls.class_name || '',
                                class_number: cls.class_number || '',
                                grade: cls.grade || '',
                                teacher_name: cls.teacher_name || ''
                              });
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
                              if (getStudentCount(cls.id) > 0) {
                                toast.error('לא ניתן למחוק כיתה עם תלמידים');
                                return;
                              }
                              if (confirm('האם למחוק את הכיתה?')) {
                                deleteClassMutation.mutate(cls.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </CardContent>
      {/* Add Class Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת כיתה חדשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם הכיתה (אות) <span className="text-red-500">*</span></Label>
              <Input
                value={formData.class_name}
                onChange={(e) => {
                  setFormData({ ...formData, class_name: e.target.value });
                  if (formErrors.class_name) setFormErrors({ ...formErrors, class_name: '' });
                }}
                placeholder="לדוגמה: א"
                className={formErrors.class_name ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
                    if (inputs && inputs[1]) inputs[1].focus();
                  }
                }}
              />
              {formErrors.class_name && <p className="text-red-500 text-sm mt-1">{formErrors.class_name}</p>}
            </div>
            <div>
              <Label>מספר כיתה <span className="text-red-500">*</span></Label>
              <Input
                value={formData.class_number}
                onChange={(e) => {
                  setFormData({ ...formData, class_number: e.target.value });
                  if (formErrors.class_number) setFormErrors({ ...formErrors, class_number: '' });
                }}
                placeholder="לדוגמה: 1"
                className={formErrors.class_number ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
                    if (inputs && inputs[2]) inputs[2].focus();
                  }
                }}
              />
              {formErrors.class_number && <p className="text-red-500 text-sm mt-1">{formErrors.class_number}</p>}
            </div>
            <div>
              <Label>שכבה</Label>
              <Input
                value={formData.grade}
                onChange={(e) => {
                  setFormData({ ...formData, grade: e.target.value });
                  if (formErrors.grade) setFormErrors({ ...formErrors, grade: '' });
                }}
                placeholder="לדוגמה: א"
                className={formErrors.grade ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
                    if (inputs && inputs[3]) inputs[3].focus();
                  }
                }}
              />
              {formErrors.grade && <p className="text-red-500 text-sm mt-1">{formErrors.grade}</p>}
            </div>
            <div>
              <Label>שם מחנך</Label>
              <Input
                value={formData.teacher_name}
                onChange={(e) => {
                  setFormData({ ...formData, teacher_name: e.target.value });
                  if (formErrors.teacher_name) setFormErrors({ ...formErrors, teacher_name: '' });
                }}
                className={formErrors.teacher_name ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddClass();
                  }
                }}
              />
              {formErrors.teacher_name && <p className="text-red-500 text-sm mt-1">{formErrors.teacher_name}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>ביטול</Button>
            <Button onClick={handleAddClass} className="bg-[#1e3a5f]">
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת כיתה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>שם הכיתה (אות) <span className="text-red-500">*</span></Label>
              <Input
                value={formData.class_name}
                onChange={(e) => {
                  setFormData({ ...formData, class_name: e.target.value });
                  if (formErrors.class_name) setFormErrors({ ...formErrors, class_name: '' });
                }}
                placeholder="לדוגמה: א"
                className={formErrors.class_name ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
                    if (inputs && inputs[1]) inputs[1].focus();
                  }
                }}
              />
              {formErrors.class_name && <p className="text-red-500 text-sm mt-1">{formErrors.class_name}</p>}
            </div>
            <div>
              <Label>מספר כיתה <span className="text-red-500">*</span></Label>
              <Input
                value={formData.class_number}
                onChange={(e) => {
                  setFormData({ ...formData, class_number: e.target.value });
                  if (formErrors.class_number) setFormErrors({ ...formErrors, class_number: '' });
                }}
                placeholder="לדוגמה: 1"
                className={formErrors.class_number ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
                    if (inputs && inputs[2]) inputs[2].focus();
                  }
                }}
              />
              {formErrors.class_number && <p className="text-red-500 text-sm mt-1">{formErrors.class_number}</p>}
            </div>
            <div>
              <Label>שכבה</Label>
              <Input
                value={formData.grade}
                onChange={(e) => {
                  setFormData({ ...formData, grade: e.target.value });
                  if (formErrors.grade) setFormErrors({ ...formErrors, grade: '' });
                }}
                className={formErrors.grade ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputs = e.currentTarget.closest('.space-y-4')?.querySelectorAll('input');
                    if (inputs && inputs[3]) inputs[3].focus();
                  }
                }}
              />
              {formErrors.grade && <p className="text-red-500 text-sm mt-1">{formErrors.grade}</p>}
            </div>
            <div>
              <Label>שם מחנך</Label>
              <Input
                value={formData.teacher_name}
                onChange={(e) => {
                  setFormData({ ...formData, teacher_name: e.target.value });
                  if (formErrors.teacher_name) setFormErrors({ ...formErrors, teacher_name: '' });
                }}
                className={formErrors.teacher_name ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUpdateClass();
                  }
                }}
              />
              {formErrors.teacher_name && <p className="text-red-500 text-sm mt-1">{formErrors.teacher_name}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ביטול</Button>
            <Button
              onClick={handleUpdateClass}
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
