import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// קוד מנהל על קבוע - ניתן לשנות
const SUPER_ADMIN_USERNAME = 'admin';
const SUPER_ADMIN_PASSWORD = 'Admin2024!';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // בדיקה אם כבר מחובר
    const isLoggedIn = sessionStorage.getItem('superAdminLoggedIn');
    if (isLoggedIn === 'true') {
      navigate(createPageUrl('SuperAdmin'));
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
      sessionStorage.setItem('superAdminLoggedIn', 'true');
      navigate(createPageUrl('SuperAdmin'));
    } else {
      setError('שם משתמש או סיסמה שגויים');
    }
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef) {
        nextRef.focus();
      } else {
        handleLogin(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-[#1e3a5f] rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-[#d4af37]" />
            </div>
            <CardTitle className="text-2xl text-[#1e3a5f]">כניסת מנהל על</CardTitle>
            <p className="text-gray-500 text-sm">פאנל ניהול המערכת</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>שם משתמש</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, document.getElementById('password-input'))}
                  placeholder="הכנס שם משתמש"
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <Label>סיסמה</Label>
                <div className="relative mt-1">
                  <Input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, null)}
                    placeholder="הכנס סיסמה"
                    className="pl-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-[#1e3a5f]">
                כניסה
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}