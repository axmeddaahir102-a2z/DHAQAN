import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Store, 
  Clock, 
  Calendar, 
  Lock, 
  LogOut, 
  Wallet, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatCurrency } from '../../lib/security';

interface HeaderProps {
  onOpenAdminAuth: () => void;
  onOpenQuickStock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAdminAuth, onOpenQuickStock }) => {
  const { 
    state, 
    currentUserRole, 
    setCurrentUserRole, 
    isAdminAuthenticated, 
    setIsAdminAuthenticated,
    getCashBalance
  } = useStore();

  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('so-SO', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const lowStockCount = state.products.filter(p => p.active && p.currentStock <= p.minStockLevel).length;
  const cashBal = getCashBalance();

  const handleRoleToggle = () => {
    if (currentUserRole === 'OPERATOR') {
      if (isAdminAuthenticated) {
        setCurrentUserRole('ADMIN');
      } else if (onOpenAdminAuth) {
        onOpenAdminAuth();
      }
    } else {
      setCurrentUserRole('OPERATOR');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentUserRole('OPERATOR');
  };

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a7b07] flex items-center justify-center text-white shadow-md font-bold text-xl tracking-tight">
              DK
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                  {state.settings.businessName || 'DHAQAN-KAABA'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-[#1a7b07]/10 text-[#1a7b07] border border-[#1a7b07]/20">
                  {currentUserRole === 'ADMIN' ? 'Maamulaha (Admin)' : 'Qasnajiga (Sales)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {state.settings.businessName} • Nidaamka Xisaabaadka & Kaydka
              </p>
            </div>
          </div>

          {/* Center Info / Real-time clock */}
          <div className="hidden md:flex items-center space-x-6 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{date}</span>
              <span className="text-slate-300">|</span>
              <Clock className="w-3.5 h-3.5 text-[#1a7b07]" />
              <span className="font-mono font-medium text-slate-800">{time}</span>
            </div>

            {currentUserRole === 'ADMIN' && (
              <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-200/60">
                <Wallet className="w-3.5 h-3.5 text-[#1a7b07]" />
                <span className="font-medium">Qasnadda:</span>
                <span className="font-bold text-[#1a7b07] font-mono">
                  {formatCurrency(cashBal, state.settings.currencySymbol)}
                </span>
              </div>
            )}

            {lowStockCount > 0 && (
              <button 
                onClick={onOpenQuickStock}
                className="flex items-center space-x-1.5 bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-lg border border-amber-200/80 hover:bg-amber-100 transition cursor-pointer"
                title="Badeecadaha kaydkoodu yar yahay"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="font-semibold">{lowStockCount} Kayd Yar</span>
              </button>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2.5">
            {currentUserRole === 'OPERATOR' ? (
              <button
                id="btn-switch-admin"
                onClick={handleRoleToggle}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#1a7b07] hover:bg-[#146205] active:scale-98 transition shadow-xs cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Gala Maamulka (Admin Area)</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-switch-sales"
                  onClick={() => setCurrentUserRole('OPERATOR')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-98 transition cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-[#1a7b07]" />
                  <span>Shaashadda Iibka (Sales)</span>
                </button>
                <button
                  id="btn-admin-logout"
                  onClick={handleAdminLogout}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-98 transition border border-rose-200/60 cursor-pointer"
                  title="Ka bax Maamulka"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ka bax</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
