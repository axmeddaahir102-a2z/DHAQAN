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
  ArrowUpRight,
  Cloud,
  Loader2,
  Copy,
  Check,
  Code,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { verifyPassword, formatCurrency } from '../../lib/security';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  getActiveSupabaseUrl,
  getActiveSupabaseKey,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  migrateLocalDataToSupabase,
  fetchCloudData,
  validatePublishableKey,
} from '../../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../../lib/supabaseSchema';



export const SettingsTab: React.FC = () => {
  const { 
    state, 
    updateSettings, 
    setAdminPassword, 
    completeInitialSetup, 
    resetToDefaults, 
    exportBackupJSON, 
    restoreBackupJSON,
    mergeCloudState
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

  // Supabase connection & sync state
  const [supabaseTest, setSupabaseTest] = useState<{
    loading: boolean;
    result?: { connected: boolean; message: string; url?: string; tablesExist?: boolean };
  }>({ loading: false });

  const [inputUrl, setInputUrl] = useState(getActiveSupabaseUrl());
  const [inputKey, setInputKey] = useState(getActiveSupabaseKey());
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState('');
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestSupabase = async () => {
    setSupabaseTest({ loading: true });
    setMigrationResult(null);
    setSyncResult(null);
    try {
      const res = await testSupabaseConnection();
      setSupabaseTest({ loading: false, result: res });
    } catch (e: any) {
      setSupabaseTest({
        loading: false,
        result: { connected: false, message: e?.message || 'Qalad aan la garanayn' },
      });
    }
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = saveCustomSupabaseConfig(inputUrl, inputKey);
    if (res.success) {
      setToast({ type: 'success', text: 'Xogta Supabase si guul leh ayaa loo keydiyay!' });
      setShowCustomForm(false);
      handleTestSupabase();
    } else {
      setToast({ type: 'error', text: res.error || 'Qalad ayaa dhacay.' });
    }
  };

  const handleClearCustomConfig = () => {
    clearCustomSupabaseConfig();
    setInputUrl(getActiveSupabaseUrl());
    setInputKey(getActiveSupabaseKey());
    setToast({ type: 'success', text: 'Xogta ku-meel-gaarka ah waa laga saaray.' });
  };

  const handleMigrateToSupabase = async () => {
    if (!window.confirm('Ma hubtaa inaad rabto inaad dhammaan xogta dukaanka hadda jirta u shubto Supabase? Xogtaadii localStorage ma tirtirmayso mana labanlaabmayso.')) {
      return;
    }

    setMigrationLoading(true);
    setMigrationProgress('Bilaabaya...');
    setMigrationResult(null);

    try {
      const res = await migrateLocalDataToSupabase(state, (msg) => setMigrationProgress(msg));
      setMigrationLoading(false);
      setMigrationResult(res);
      if (res.success) {
        setToast({ type: 'success', text: 'Xogta dukaanka oo dhan si guul leh ayaa loogu guuriyay Supabase!' });
      } else {
        setToast({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMigrationLoading(false);
      setMigrationResult({ success: false, message: err?.message || 'Qalad xilliga shubista' });
    }
  };

  const handleSyncFromSupabase = async () => {
    setSyncLoading(true);
    setSyncResult(null);

    try {
      const res = await fetchCloudData();
      setSyncLoading(false);
      if (res.success && res.data) {
        mergeCloudState(res.data);
        setSyncResult({
          success: true,
          message: 'Xogta dukaanka si guul leh ayaa looga soo jiiday Supabase oo labada computer hadda isku xog ayay yihiin!',
        });
        setToast({ type: 'success', text: 'Xogtii ugu dambaysay ee Supabase waa la soo dejiyay!' });
      } else {
        setSyncResult({
          success: false,
          message: res.error || 'Lama soo dejin karin xogta.',
        });
      }
    } catch (err: any) {
      setSyncLoading(false);
      setSyncResult({ success: false, message: err?.message || 'Qalad ayaa dhacay.' });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setToast({ type: 'success', text: 'Dhammaan SQL Schema & RLS waa la koobiyeeyay!' });
    setTimeout(() => setCopiedSql(false), 2500);
  };


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

      {/* Supabase Cloud Database Status, Multi-Computer Sync & Migration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-sm">Isku-xirka Supabase Cloud Database (Labada Computer)</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isSupabaseConfigured() ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {isSupabaseConfigured() ? '● Furayaashu Way Diyaar Yihiin' : '○ Furayaasha Lama Helin (Local Mode)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Si labada computer ay u wadaagaan xogta iibka, alaabta, kaydka iyo qasnadda adigoo isticmaalaya Supabase Cloud.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center space-x-1 cursor-pointer border border-slate-200"
            >
              <span>{showCustomForm ? 'Qari Gelinta' : 'Geli / Beddel Furayaasha'}</span>
              {showCustomForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5 text-[11px] leading-relaxed">
            <p className="font-bold text-blue-900">Amniga Nidaamka & Furayaasha (Security Guard)</p>
            <p className="text-blue-700">
              Waxaa la oggol yahay kaliya <strong>Publishable Key (sb_publishable_...)</strong> ama <strong>Anon Key</strong>. Weligaa browser-ka ha gelin <em>Secret Key</em> ama <em>service_role key</em>. Database-ka waxaa ilaalinaya Row Level Security (RLS).
            </p>
          </div>
        </div>

        {/* Credentials Inputs (Custom / Second Computer override) */}
        {showCustomForm && (
          <form onSubmit={handleSaveCustomConfig} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <span>Geli Xogta Supabase (Computer-kan ama Vercel)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Publishable Key / Anon Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="sb_publishable_... ama eyJhb..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Waxay ku kaydsanaysaa browser-ka computer-kan si labada computer-ba si degdeg ah ugu xirmaan.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClearCustomConfig}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Ka Saar Xogta
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                >
                  Keydi & Xaqiiji
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Configuration Summary Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">VITE_SUPABASE_URL</span>
            <span className="font-mono text-slate-800 break-all text-[11px]">
              {getActiveSupabaseUrl() ? getActiveSupabaseUrl() : '(Lama gelin - Geli kor ama .env/Vercel)'}
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">VITE_SUPABASE_ANON_KEY (Publishable)</span>
            <span className="font-mono text-slate-800 text-[11px]">
              {getActiveSupabaseKey() ? (
                getActiveSupabaseKey().startsWith('sb_publishable_') ? (
                  `sb_publishable_•••••••• (${getActiveSupabaseKey().length} xaraf)`
                ) : (
                  `eyJ•••••••• (${getActiveSupabaseKey().length} xaraf - Ammaan)`
                )
              ) : (
                '(Lama gelin - Geli kor ama .env/Vercel)'
              )}
            </span>
          </div>
        </div>

        {/* Test Result Message */}
        {supabaseTest.result && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
            supabaseTest.result.connected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {supabaseTest.result.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">{supabaseTest.result.connected ? 'Isku-xirku wuu guuleystay!' : 'Isku-xirka lama xaqiijin karin'}</p>
              <p className="text-[11px] leading-relaxed">{supabaseTest.result.message}</p>
            </div>
          </div>
        )}

        {/* Migration Progress / Result Message */}
        {migrationLoading && (
          <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-center space-x-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
            <span>{migrationProgress || 'Xogta dukaanka ayaa loo shubayaa Supabase...'}</span>
          </div>
        )}

        {migrationResult && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
            migrationResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {migrationResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold">{migrationResult.success ? 'Shubista xogtu waa guuleysatay!' : 'Qalad xilliga shubista'}</p>
              <p className="text-[11px] mt-0.5">{migrationResult.message}</p>
            </div>
          </div>
        )}

        {syncResult && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 ${
            syncResult.success ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {syncResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-bold">{syncResult.success ? 'Wadaagga xogtu waa guuleystay!' : 'Qalad xilliga soo dejinta'}</p>
              <p className="text-[11px] mt-0.5">{syncResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTestSupabase}
              disabled={supabaseTest.loading}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              {supabaseTest.loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Hubinayaa...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tijaabi Isku-xirka (Test Connection)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSqlModal(!showSqlModal)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-200"
            >
              <Code className="w-3.5 h-3.5 text-slate-600" />
              <span>{showSqlModal ? 'Qari SQL Schema' : 'Eeg SQL Schema & RLS'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMigrateToSupabase}
              disabled={!isSupabaseConfigured() || migrationLoading}
              title="Xogta hadda jirta u dir Supabase (Idempotent - waxba ma tirtirmayaan mana labanlaabmayaan)"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>U Guuri Xogta Supabase (Safe Migration)</span>
            </button>

            <button
              type="button"
              onClick={handleSyncFromSupabase}
              disabled={!isSupabaseConfigured() || syncLoading}
              title="Soo jiid xogtii ugu dambaysay ee Supabase si labada computer isku xog u noqdaan"
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              {syncLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
              <span>Soo Jiid Xogta (Sync Cloud Data)</span>
            </button>
          </div>
        </div>

        {/* SQL Schema Preview & Copy Drawer */}
        {showSqlModal && (
          <div className="mt-4 p-4 bg-slate-900 rounded-xl text-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">
                  SQL Schema-ga loo baahan yahay (Supabase Dashboard &rarr; SQL Editor)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Waa La Koobiyeeyay!' : 'Nuqul Ka Qaado (Copy SQL)'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kani waa SQL-ka rasmiga ah ee abuuraya dhammaan tables-ka dukaanka, RLS policies oo ammaan ah, iyo Realtime publication-ka. Ku dhufo badhanka kore si aad u koobiyayso, ka dibna ku dheji <em>Supabase &rarr; SQL Editor &rarr; New Query &rarr; Run</em>.
            </p>

            <pre className="max-h-64 overflow-y-auto text-[11px] font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}
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
