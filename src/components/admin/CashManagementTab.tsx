import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  History
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatCurrency, getTodayDateString } from '../../lib/security';

export const CashManagementTab: React.FC = () => {
  const { state, getCashBalance, addManualCashTransaction } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  
  // Modals
  const [showInModal, setShowInModal] = useState(false);
  const [showOutModal, setShowOutModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentCashBalance = getCashBalance();

  // Inflows & Outflows Calculations
  const totalInflows = state.cashTransactions
    .filter(t => t.direction === 'IN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflows = state.cashTransactions
    .filter(t => t.direction === 'OUT')
    .reduce((sum, t) => sum + t.amount, 0);

  // Detailed breakdowns
  const salesCashIn = state.cashTransactions
    .filter(t => t.type === 'SALE_INFLOW')
    .reduce((sum, t) => sum + t.amount, 0);

  const arCollectedIn = state.cashTransactions
    .filter(t => t.type === 'RECEIVABLE_COLLECTION')
    .reduce((sum, t) => sum + t.amount, 0);

  const setupCashIn = state.cashTransactions
    .filter(t => t.type === 'OPENING_BALANCE')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesCashOut = state.cashTransactions
    .filter(t => t.type === 'EXPENSE_OUTFLOW')
    .reduce((sum, t) => sum + t.amount, 0);

  const purchasesCashOut = state.cashTransactions
    .filter(t => t.type === 'PURCHASE_OUTFLOW')
    .reduce((sum, t) => sum + t.amount, 0);

  const apPaidOut = state.cashTransactions
    .filter(t => t.type === 'SUPPLIER_PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = state.cashTransactions.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      t.description.toLowerCase().includes(term) ||
      (t.reference && t.reference.toLowerCase().includes(term));
    const matchesDir = filterDirection === 'ALL' || t.direction === filterDirection;
    return matchesSearch && matchesDir;
  });

  const handleManualTransaction = (direction: 'IN' | 'OUT', e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setToast({ type: 'error', text: 'Fadlan geli lacag sax ah oo ka weyn eber.' });
      return;
    }

    if (!description.trim()) {
      setToast({ type: 'error', text: 'Fadlan qor sababta lacagta loo geliyay ama looga saaray qasnadda.' });
      return;
    }

    const res = addManualCashTransaction({
      direction,
      amount: amtNum,
      description: description.trim(),
      reference: reference.trim() || undefined,
    });

    if (res.success) {
      setToast({ 
        type: 'success', 
        text: direction === 'IN' 
          ? `Lacagta ${formatCurrency(amtNum)} si guul leh ayaa loogu daray qasnadda.` 
          : `Lacagta ${formatCurrency(amtNum)} si guul leh ayaa looga saaray qasnadda.`
      });
      setShowInModal(false);
      setShowOutModal(false);
      setAmount('');
      setDescription('');
      setReference('');
    } else {
      setToast({ type: 'error', text: res.error || 'Khalad ayaa dhacay.' });
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

      {/* Main Cash Balance Hero Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-[#1a7b07]" />
            <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">
              Qasnadda & Dhaqdhaqaaqa Kaashka (Cash Flow)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Xisaabinta tooska ah ee lacagta caddaanka ah ee hadda ku jirta qasnadda.
          </p>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-[#1a7b07]">
              {formatCurrency(currentCashBalance)}
            </span>
            <span className="text-xs text-slate-500 font-medium">Kaashka Hadda Yaalla</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setAmount('');
              setDescription('');
              setReference('');
              setShowInModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Geli Lacag (Cash In)</span>
          </button>

          <button
            onClick={() => {
              setAmount('');
              setDescription('');
              setReference('');
              setShowOutModal(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
            <span>Ka Saar Lacag (Cash Out)</span>
          </button>
        </div>
      </div>

      {/* Inflow vs Outflow Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Total Inflows */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs sm:text-sm">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Lacagaha Soo Galay Qasnadda (Inflows)</span>
            </div>
            <span className="font-mono font-black text-sm text-emerald-700">
              +{formatCurrency(totalInflows)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Iibka Kaashka ah (Cash Sales):</span>
              <span className="font-mono font-bold text-slate-900">+{formatCurrency(salesCashIn)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Daymaha Macaamiisha laga Soo Ururiyay (AR):</span>
              <span className="font-mono font-bold text-slate-900">+{formatCurrency(arCollectedIn)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Kaashka Bilowga (Setup Opening Balance):</span>
              <span className="font-mono font-bold text-slate-900">+{formatCurrency(setupCashIn)}</span>
            </div>
          </div>
        </div>

        {/* Total Outflows */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs sm:text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>Lacagaha Ka Baxay Qasnadda (Outflows)</span>
            </div>
            <span className="font-mono font-black text-sm text-rose-700">
              -{formatCurrency(totalOutflows)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Iibsashada Alaabta (Purchases Cash Out):</span>
              <span className="font-mono font-bold text-slate-900">-{formatCurrency(purchasesCashOut)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Kharashaadka Maalinlaha ah (Operating Expenses):</span>
              <span className="font-mono font-bold text-slate-900">-{formatCurrency(expensesCashOut)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Daymaha Qaybiyeyaasha La Bixiyay (AP Payments):</span>
              <span className="font-mono font-bold text-slate-900">-{formatCurrency(apPaidOut)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-[#1a7b07]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Diiwaanka Dhaqdhaqaaqa Kaashka ({state.cashTransactions.length})
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Raadi faahfaahin..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
              />
            </div>

            {/* Filter Direction */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setFilterDirection('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterDirection === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Dhammaan
              </button>
              <button
                onClick={() => setFilterDirection('IN')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterDirection === 'IN' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Soo Galay
              </button>
              <button
                onClick={() => setFilterDirection('OUT')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  filterDirection === 'OUT' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                Ka Baxay
              </button>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs font-medium">Wax dhaqdhaqaaq ah lama helin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                  <th className="p-3 font-semibold">Taariikh & Saacad</th>
                  <th className="p-3 font-semibold">Faahfaahinta Dhaqdhaqaaqa</th>
                  <th className="p-3 font-semibold">Tixraac</th>
                  <th className="p-3 font-semibold text-center">Nooca</th>
                  <th className="p-3 text-right font-semibold">Lacagta ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-slate-600 font-mono">
                      {tx.date} <span className="text-slate-400 text-[10px]">{tx.time}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {tx.description}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {tx.reference || '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.direction === 'IN' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {tx.direction === 'IN' ? 'SOO GALAY' : 'KA BAXAY'}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-mono font-black text-sm ${
                      tx.direction === 'IN' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {tx.direction === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Cash In */}
      {showInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">Geli Lacag Qasnadda (Cash In)</h3>
              </div>
              <button onClick={() => setShowInModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleManualTransaction('IN', e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lacagta La Geliyay ($ Amount) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm font-bold font-mono text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sababta / Faahfaahinta (Reason) *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Lacag maalgashi oo dheeraad ah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tixraac (Reference)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Rasiid #123"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  Geli Qasnadda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cash Out */}
      {showOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-700">
                <Minus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">Ka Saar Lacag Qasnadda (Cash Out)</h3>
              </div>
              <button onClick={() => setShowOutModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleManualTransaction('OUT', e)} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lacagta Laga Saaray ($ Amount) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm font-bold font-mono text-rose-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sababta / Faahfaahinta (Reason) *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Lacag la geeyay bangiga / qof loo dhiibay"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tixraac (Reference)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. Bank slip #456"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
                >
                  Ka Saar Qasnadda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
