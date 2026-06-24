import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Heart, LayoutDashboard, History, User, 
  LogOut, Phone, Info, Home as HomeIcon, ShieldCheck, BookOpen
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: { children: React.ReactNode, user: any, onLogout: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = user ? [] : [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'About', path: '/about', icon: Info },
    { name: 'Contact', path: '/contact', icon: Phone },
  ];

  const authLinks = [];
  if (user) {
    if (user.role === 'admin') {
      authLinks.push({ name: 'Admin Panel', path: '/admin', icon: ShieldCheck });
    } else {
      authLinks.push(
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'History', path: '/history', icon: History },
        { name: 'Profile', path: '/profile', icon: User }
      );
    }
  }

  // Theme Sync Logic
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('themeColor') || '#3b82f6');
  
  useEffect(() => {
    // Apply theme color to CSS variables
    document.documentElement.style.setProperty('--color-brand-primary', themeColor);
    document.documentElement.style.setProperty('--color-brand-secondary', themeColor === '#3b82f6' ? '#2563eb' : themeColor);
    localStorage.setItem('themeColor', themeColor);

    // Ensure Permanent Dark Mode
    document.body.style.background = 'radial-gradient(circle at top left, #0f172a, #1e293b) fixed';
    document.body.style.color = '#e2e8f0';
  }, [themeColor]);

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' }
  ];

  return (
    <div className="min-h-screen transition-colors duration-500">
      {/* 3D Background effect */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" 
          style={{ backgroundColor: `${themeColor}20` }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" 
          style={{ backgroundColor: `${themeColor}10`, animationDelay: '2s' }} 
        />
      </div>

      {/* Navbar */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled ? "py-4 bg-slate-900/40 backdrop-blur-xl border-b border-white/5" : "py-6 bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}40` }}
            >
              <span className="text-white font-bold text-xs">H+</span>
            </div>
            <span className="text-xl font-bold tracking-tight font-display">Health.ai</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {[...navLinks, ...authLinks].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="transition-colors duration-300"
                style={{ color: location.pathname === link.path ? themeColor : 'inherit' }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            {/* Color Palette Switcher */}
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/10">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setThemeColor(c.value)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all hover:scale-125",
                    themeColor === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : ""
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold">{user.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user.role === 'admin' ? 'SYSTEM ADMIN' : 'PRO USER'}</span>
                </div>
                <Link to="/profile" className="w-10 h-10 rounded-full border-2 p-0.5 bg-slate-800 hover:scale-105 transition-transform overflow-hidden" style={{ borderColor: themeColor }}>
                   <img src={user.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} className="w-full h-full rounded-full" alt="Avatar" />
                </Link>
                <button 
                  onClick={onLogout}
                  className="p-2 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="px-6 py-2.5 text-white rounded-xl text-sm font-bold transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0" style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px ${themeColor}30` }}>
                Sign In
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 text-white/80" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-2xl pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {[...navLinks, ...authLinks].map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xl font-medium flex items-center gap-4 active:scale-95 transition-transform"
                >
                  <link.icon className="w-6 h-6 text-brand-primary" />
                  {link.name}
                </Link>
              ))}
              {user && (
                <button onClick={onLogout} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/10 text-xl font-medium text-red-500 flex items-center gap-4">
                  <LogOut className="w-6 h-6" />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-20">
        {children}
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 w-full h-8 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-8 border-t border-white/5 z-50">
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
            System: <span className="text-emerald-500">Online</span>
          </span>
        </div>
        <div className="text-[9px] text-slate-500 font-black tracking-widest uppercase truncate max-w-md md:max-w-none">
          © 2026 HEALTH.AI SYSTEM • CHETHAN, CHINMAI, INCHARA, JYOTHI
        </div>
      </footer>
    </div>
  );
}
