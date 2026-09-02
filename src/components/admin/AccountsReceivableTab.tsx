import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  FileText
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { AccountsReceivable } from '../../types';
import { formatCurrency } from '../../lib/security';

export const AccountsReceivableTab: React.FC = () => {
  const { state, collectReceivablePayment, getTotalReceivables } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUTSTANDING' | 'PARTIALLY_PAID' | 'PAID'>('ALL');

  // Modal
  const [selectedAR, setSelectedAR] = useState<AccountsReceivable | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectNote, setCollectNote] = useState<string>('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalOutstanding = getTotalReceivables();

  const filteredAR = state.accountsReceivable.filter(ar => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      ar.customerPhone.includes(term) ||
      (ar.customerName && ar.customerName.toLowerCase().includes(term)) ||
      (ar.invoiceNumber && ar.invoiceNumber.toLowerCase().includes(term)) ||
      (ar.notes && ar.notes.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'ALL' || ar.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCollect = (ar: AccountsReceivable) => {
    setSelectedAR(ar);
    setCollectAmount(ar.outstandingBalance.toString());
    setCollectNote('');
  };

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!selectedAR) return;

    const amtNum = parseFloat(collectAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setToast({ type: 'error', text: 'Fadlan geli lacag sax ah.' });
      return;
    }

    if (amtNum > selectedAR.outstandingBalance) {
      setToast({ type: 'error', text: `Lacagtu kama badnaan karto daynta hadhay (${formatCurrency(selectedAR.outstandingBalance)}).` });
      return;
    }

    const res = collectReceivablePayment({
      receivableId: selectedAR.id,
      amount: amtNum,
      notes: collectNote.trim(),
    });

    if (res.success) {
      setToast({ type: 'success', text: `Lacagta ${formatCurrency(amtNum)} si guul leh ayaa loo qabtay, qasnaddana waa ku korodhay!` });
      setSelectedAR(null);
      setCollectAmount('');
      setCollectNote('');
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

      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-rose-600" />
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Daynta Macaamiisha (Accounts Receivable)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Diiwaanka lacagaha daynta ah ee macaamiisha lagu leeyahay iyo qabashada lacag-bixinta.
          </p>
        </div>

        <div className="bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200 text-right w-full sm:w-auto">
          <span className="text-[10px] uppercase font-bold text-rose-800 block">
            Wadarta Daynta Maqan (Total AR)
          </span>
          <span className="text-xl font-black font-mono text-rose-700">
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Table & Filter Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Raadi Tel ama Invoice #..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Dhammaan ({state.accountsReceivable.length})
            </button>
            <button
              onClick={() => setStatusFilter('OUTSTANDING')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'OUTSTANDING' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Maqan (Unpaid)
            </button>
            <button
              onClick={() => setStatusFilter('PARTIALLY_PAID')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'PARTIALLY_PAID' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Qayb Bixisay
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'PAID' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Dhammaatay
            </button>
          </div>
        </div>

        {filteredAR.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs font-medium">Wax deyn ah lama helin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                  <th className="p-3 font-semibold">Taleefanka / Macaamiilka</th>
                  <th className="p-3 font-semibold">Qaansheeg #</th>
                  <th className="p-3 font-semibold">Taariikh</th>
                  <th className="p-3 font-semibold">Faahfaahin / Xusid</th>
                  <th className="p-3 text-right font-semibold">Wadarta Daynta</th>
                  <th className="p-3 text-right font-semibold">La Bixiyay</th>
                  <th className="p-3 text-right font-semibold">Deynta Hadhay</th>
                  <th className="p-3 text-center font-semibold">Xaaladda</th>
                  <th className="p-3 text-center font-semibold">Ficil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAR.map((ar) => (
                  <tr key={ar.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900 font-mono">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ar.customerPhone}</span>
                      </div>
                      {ar.customerName && <p className="text-[11px] font-sans font-normal text-slate-500">{ar.customerName}</p>}
                    </td>
                    <td className="p-3 font-mono text-slate-600 font-bold">
                      {ar.invoiceNumber || '-'}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {ar.date}
                    </td>
                    <td className="p-3 text-slate-700 max-w-[200px] truncate">
                      {ar.notes || ar.description || '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(ar.originalAmount)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700">
                      {formatCurrency(ar.amountPaid)}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-rose-700">
                      {formatCurrency(ar.outstandingBalance)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ar.status === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : ar.status === 'PARTIALLY_PAID' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {ar.status === 'PAID' ? 'La Bixiyay' : ar.status === 'PARTIALLY_PAID' ? 'Qayb' : 'Maqan'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {ar.status !== 'PAID' && (
                        <button
                          onClick={() => openCollect(ar)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
                        >
                          Qabo Lacag
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Collect Debt Payment */}
      {selectedAR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Qabo Lacagta Daynta: {selectedAR.customerPhone}
              </h3>
              <button onClick={() => setSelectedAR(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectSubmit} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Wadarta Daynta Asalka ah:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(selectedAR.originalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Deynta Hadda Hadhay:</span>
                  <span className="font-mono font-extrabold text-rose-700">{formatCurrency(selectedAR.outstandingBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lacagta Macaamiilku Keenay ($ Amount) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedAR.outstandingBalance}
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm font-bold font-mono text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faahfaahin / Note (Tixraac)
                </label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  placeholder="e.g. Bixiyay qaybtii 1-aad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAR(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  Xaqiiji & Geli Qasnadda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
