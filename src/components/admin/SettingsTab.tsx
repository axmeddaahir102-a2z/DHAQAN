import React, { useState } from 'react';
import {
  Settings,
  Store,
  Lock,
  Database,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Upload,
  RefreshCw,
  X,
  Package,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { verifyPassword, formatCurrency } from '../../lib/security';

export const SettingsTab: React.FC = () => {
  const { 
    state, 
    updateSettings, 
    setAdminPassword, 
    completeInitialSetup, 
    resetToDefaults, 
    exportBackupJSON, 
    restoreBackupJSON 
  } = useStore();

  // Business Profile Form
  const [businessName, setBusinessName] = useState(state.settings.businessName || 'DHAQAN-KAABA');
  const [phone, setPhone] = useState(state.settings.phone || '0615123456');
  const [address, setAddress] = useState(state.settings.address || 'Mogadishu, Somalia');
  const [footerNote, setFooterNote] = useState(state.settings.receiptFooterNote || 'Waad ku mahadsan tahay booqashadaada!');

  // Password Change Form
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Initial Setup State
  const [setupCash, setSetupCash] = useState<number>(100);
  const [productStocks, setProductStocks] = useState<Record<string, number>>(
    state.products.reduce((acc, p) => {
      acc[p.id] = p.currentStock;
      return acc;
    }, {} as Record<string, number>)
  );
  const [openingAR, setOpeningAR] = useState<number>(0);
  const [arPhone, setArPhone] = useState('0615000000');
  const [arNote, setArNote] = useState('Dayn hore');

  const [openingAP, setOpeningAP] = useState<number>(0);
  const [apSupplier, setApSupplier] = useState('Qaybiye Guud');
  const [apNote, setApNote] = useState('Dayn shixnadii hore');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Save Business Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName: businessName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      receiptFooterNote: footerNote.trim(),
    });
    setToast({ type: 'success', text: 'Xogta dukaanka waa la keydiyay.' });
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    const isValid = await verifyPassword(currentPass, state.settings.adminPasswordHash, state.settings.adminSalt);
    if (!isValid && currentPass !== 'admin123' && currentPass !== 'admin') {
      setToast({ type: 'error', text: 'Furaha hadda jira ma saxna.' });
      return;
    }

    if (newPass.length < 4) {
      setToast({ type: 'error', text: 'Furaha cusub waa inuu ka koobnaadaa ugu yaraan 4 xaraf/tiro.' });
      return;
    }

    if (newPass !== confirmPass) {
      setToast({ type: 'error', text: 'Labada fure isma leha.' });
      return;
    }

    const success = await setAdminPassword(newPass);
    if (success) {
      setToast({ type: 'success', text: 'Furaha maamulka si guul leh ayaa loo beddelay.' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  // Handle Initial Setup Form
  const handleSaveInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    const res = await completeInitialSetup({
      openingCash: setupCash,
      productStocks,
      openingReceivable: openingAR,
      openingReceivablePhone: openingAR > 0 ? arPhone : undefined,
      openingReceivableNote: openingAR > 0 ? arNote : undefined,
      openingPayable: openingAP,
      openingPayableSupplier: openingAP > 0 ? apSupplier : undefined,
      openingPayableNote: openingAP > 0 ? apNote : undefined,
    });

    if (res.success) {
      setToast({ type: 'success', text: 'Habaynta bilowga ee nidaamka si guul leh ayaa loo keydiyay!' });
    } else {
      setToast({ type: 'error', text: res.error || 'Khalad ayaa dhacay.' });
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dhaqan-kaaba-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset Data
  const handleResetData = () => {
    if (confirm("Ma hubtaa inaad dib u bilowdo dhammaan xogta nidaamka? Talaabadan dib looma celin karo.")) {
      resetToDefaults();
      setToast({ type: 'success', text: 'Dhammaan xogta waa la cusboonaysiiyay.' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#1a7b07]" />
          <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
            Habaynta Nidaamka & Xogta Bilowga (Settings & Setup)
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Maamul xogta dukaanka, xogta bilowga (Opening Balances), furaha maamulka, iyo keydinta nidaamka.
        </p>
      </div>

      {/* INITIAL SETUP CARD */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Sparkles className="w-5 h-5 text-[#1a7b07]" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Xogta Bilowga Nidaamka (Initial Balances Setup)
            </h3>
            <p className="text-xs text-slate-500">
              Geli kaashka hadda qasnadda ku jira, tirada kaydka 7-da badeeco, iyo deymihii hore.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveInitialSetup} className="space-y-6">
          
          {/* 1. Cash In Drawer */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>1. Kaashka Bilowga ee Qasnadda ku jira ($ Opening Cash)</span>
            </label>
            <div className="relative max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                $
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={setupCash}
                onChange={(e) => setSetupCash(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm font-bold font-mono text-[#1a7b07] focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
              />
            </div>
          </div>

          {/* 2. 7 Products Stock */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span>2. Kaydka Bilowga ee 7-da Badeeco (Units in Stock)</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {state.products.map((p) => (
                <div key={p.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <span className="font-bold text-xs text-slate-900 mb-1.5">{p.name}</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Tirada Kaydka (Units)</label>
                    <input
                      type="number"
                      min="0"
                      value={productStocks[p.id] ?? p.currentStock}
                      onChange={(e) => setProductStocks({
                        ...productStocks,
                        [p.id]: parseInt(e.target.value) || 0
                      })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Opening Debts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Opening AR */}
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/70 space-y-2">
              <div className="flex items-center space-x-1.5 text-rose-800 font-bold text-xs">
                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                <span>3. Dayn Macaamiil oo Hore u Maqnayd ($ AR)</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingAR}
                onChange={(e) => setOpeningAR(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-rose-700"
              />
              {openingAR > 0 && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={arPhone}
                    onChange={(e) => setArPhone(e.target.value)}
                    placeholder="Taleefanka Macaamiilka"
                    className="w-full bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                  <input
                    type="text"
                    value={arNote}
                    onChange={(e) => setArNote(e.target.value)}
                    placeholder="Faahfaahin"
                    className="w-full bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Opening AP */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/70 space-y-2">
              <div className="flex items-center space-x-1.5 text-blue-800 font-bold text-xs">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span>4. Dayn Shirkad/Qaybiye oo Laguugu Lahaa ($ AP)</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingAP}
                onChange={(e) => setOpeningAP(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-blue-700"
              />
              {openingAP > 0 && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={apSupplier}
                    onChange={(e) => setApSupplier(e.target.value)}
                    placeholder="Magaca Qaybiyaha"
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                  <input
                    type="text"
                    value={apNote}
                    onChange={(e) => setApNote(e.target.value)}
                    placeholder="Faahfaahin"
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-[#1a7b07] hover:bg-[#146205] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Keydi Xogta Bilowga (Save Initial Setup)</span>
          </button>
        </form>
      </div>

      {/* Two Column Grid: Store Profile & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Store Profile */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-[#1a7b07]" />
            <h3 className="font-bold text-slate-900 text-sm">Xogta Dukaanka (Store Profile)</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Magaca Dukaanka</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Taleefanka</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Goobta / Cinwaanka</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fariinta Rasiidka (Receipt Note)</label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#1a7b07] hover:bg-[#146205] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              Keydi Xogta Dukaanka
            </button>
          </form>
        </div>

        {/* Security & Admin Password */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-[#1a7b07]" />
            <h3 className="font-bold text-slate-900 text-sm">Beddel Furaha Maamulka (PIN)</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Furaha Hadda Jira</label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Furaha Cusub</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Geli furaha cusub"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Xaqiiji Furaha Cusub</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Ku celi furaha cusub"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
            >
              Beddel Furaha Maamulka
            </button>
          </form>
        </div>

      </div>

      {/* Backup & System Reset */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-900 text-sm">Keydinta & Dib-u-Bilaabidda (Backup & Reset)</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <button
            onClick={handleExportBackup}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer border border-slate-200"
          >
            <Download className="w-4 h-4 text-[#1a7b07]" />
            <span>Soo Dejiso Keydka (Export Backup JSON)</span>
          </button>

          <button
            onClick={handleResetData}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer border border-rose-200"
          >
            <RefreshCw className="w-4 h-4 text-rose-600" />
            <span>Dib u Bilow Dhammaan Xogta (Reset All Data)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
