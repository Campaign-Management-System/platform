import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Star, Shield, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // דפים שלא צריכים תפריט ניווט
  const noNavPages = [
    'CampaignPortal', 
    'StudentPortal', 
    'SellerPanel', 
    'CampaignManager',
    'CampaignView',
    'AdminLogin'
  ];

  const showNav = !noNavPages.includes(currentPageName) && 
                  !location.pathname.startsWith('/campaign/');

  return (
    <div dir="rtl">
      {showNav && (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Landing')} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8a] flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#d4af37]" />
                </div>
                <span className="font-bold text-xl text-[#1e3a5f] hidden sm:block">נקודות זכות</span>
              </Link>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-4">
                <Link to={createPageUrl('Landing')}>
                  <Button variant="ghost">ראשי</Button>
                </Link>
                <Link to={createPageUrl('Demo')}>
                  <Button variant="ghost">הדגמה</Button>
                </Link>
                <Link to={createPageUrl('AdminLogin')}>
                  <Button variant="outline" className="gap-2">
                    <Shield className="w-4 h-4" />
                    כניסת מנהל
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t">
                <div className="flex flex-col gap-2">
                  <Link to={createPageUrl('Landing')} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Home className="w-4 h-4 ml-2" />
                      ראשי
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Demo')} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">הדגמה</Button>
                  </Link>
                  <Link to={createPageUrl('AdminLogin')} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Shield className="w-4 h-4" />
                      כניסת מנהל
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}
      
      {children}
      <Toaster position="top-center" richColors />
    </div>
  );
}