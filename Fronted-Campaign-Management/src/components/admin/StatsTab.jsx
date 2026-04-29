import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, Award, Trophy, TrendingUp } from 'lucide-react';

export default function StatsTab() {
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => base44.entities.Student.list(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => base44.entities.Class.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 500),
  });

  const { data: prizes = [] } = useQuery({
    queryKey: ['prizes'],
    queryFn: () => base44.entities.Prize.list(),
  });

  // Points by class
  const pointsByClass = classes.map(cls => {
    const classStudents = students.filter(s => s.class_id === cls.id);
    const totalPoints = classStudents.reduce((sum, s) => sum + (s.points || 0), 0);
    return {
      name: cls.name,
      points: totalPoints,
      students: classStudents.length
    };
  }).sort((a, b) => b.points - a.points);

  // Transaction types distribution
  const transactionTypes = transactions.reduce((acc, t) => {
    const type = t.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeLabels = {
    add: 'הוספת נקודות',
    subtract: 'הורדת נקודות',
    prize_redemption: 'מימוש פרס',
    card_replacement: 'החלפת כרטיס'
  };

  const transactionData = Object.entries(transactionTypes).map(([type, count]) => ({
    name: typeLabels[type] || type,
    value: count
  }));

  // Prize redemption stats
  const prizeRedemptions = transactions
    .filter(t => t.type === 'prize_redemption')
    .reduce((acc, t) => {
      const name = t.prize_name || 'אחר';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

  const prizeData = Object.entries(prizeRedemptions)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top students
  const topStudents = [...students]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 10);

  const COLORS = ['#1e3a5f', '#2d5a8a', '#d4af37', '#4a7c9b', '#6b9bba', '#8cbcd9'];

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || '-';
  };

  return (
    <div className="space-y-6">
      {/* Points by Class */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1e3a5f]">נקודות לפי כיתה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pointsByClass} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip 
                  formatter={(value, name) => [value.toLocaleString(), name === 'points' ? 'נקודות' : 'תלמידים']}
                  labelFormatter={(label) => `כיתה ${label}`}
                />
                <Bar dataKey="points" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-[#1e3a5f]">התפלגות פעולות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {transactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Prizes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-[#1e3a5f]">פרסים פופולריים</CardTitle>
          </CardHeader>
          <CardContent>
            {prizeData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prizeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'מימושים']} />
                    <Bar dataKey="count" fill="#d4af37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                אין נתוני מימוש פרסים עדיין
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1e3a5f] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#d4af37]" />
            מובילי הנקודות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topStudents.map((student, index) => (
              <div 
                key={student.id}
                className={`p-4 rounded-xl text-center ${
                  index === 0 ? 'bg-gradient-to-br from-[#d4af37] to-[#c9a32f] text-white' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                  'bg-gray-100'
                }`}
              >
                <div className="text-3xl font-bold mb-2">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>
                <p className="font-medium truncate">{student.first_name} {student.last_name}</p>
                <p className="text-sm opacity-80">{getClassName(student.class_id)}</p>
                <p className={`text-xl font-bold mt-2 ${index < 3 ? '' : 'text-[#1e3a5f]'}`}>
                  {student.points || 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}