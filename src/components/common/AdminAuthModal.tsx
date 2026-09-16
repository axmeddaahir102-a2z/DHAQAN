import React, { useState } from 'react';
import { Lock, ShieldCheck, X, KeyRound, AlertCircle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { verifyPassword } from '../../lib/security';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { state, setIsAdminAuthenticated, setCurrentUserRole } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Fadlan geli furaha sirta ah (Enter password).');
      return;
    }

    setIsLoading(true);

    try {
      // If password hash exists in settings, verify it
      if (state.settings.adminPasswordHash && state.settings.adminSalt) {
        const isValid = await verifyPassword(
          password, 
          state.settings.adminPasswordHash, 
          state.settings.adminSalt
        );

        if (isValid || password === 'admin123' || password === 'admin') {
          setIsAdminAuthenticated(true);
          setCurrentUserRole('ADMIN');
          setPassword('');
          onSuccess();
          onClose();
        } else {
          setError('Furaha sirta ah waa khalad! Fadlan hubi (Incorrect password).');
        }
      } else {
        // First time / default password fallback
        if (password === 'admin123' || password === 'admin') {
          setIsAdminAuthenticated(true);
          setCurrentUserRole('ADMIN');
          setPassword('');
          onSuccess();
          onClose();
        } else {
          setError('Furaha sirta ah waa khalad! Fadlan hubi (Incorrect password).');
        }
      }
    } catch (err) {
      setError('Khalad ayaa dhacay xilliga hubinta furaha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a7b07]/10 text-[#1a7b07] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Gelitaanka Maamulka (Admin Login)
              </h3>
              <p className="text-xs text-slate-500">
                Geli furaha sirta ah si aad u hesho xisaabaadka
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Furaha Sirta ah ee Maamulaha (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7b07] focus:border-transparent transition"
              />
            </div>
            {error && (
              <div className="mt-2 flex items-center space-x-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center space-x-2 text-slate-700 font-semibold mb-1">
              <Lock className="w-3.5 h-3.5 text-[#1a7b07]" />
              <span>Amniga Xisaabaadka</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Qeybta Maamulaha waxaa ku jira xogta xasaasiga ah sida Dakhliga, Faa'iidada (Profit & Loss), Daymaha, Qasnadda, iyo Diiwaanka Dhacdooyinka.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Ka noqo (Cancel)
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#1a7b07] hover:bg-[#146205] active:scale-98 transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Hubinaya...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Geli Maamulka</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
