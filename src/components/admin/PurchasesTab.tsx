import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  X,
  Package,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Purchase } from '../../types';
import { formatCurrency, getTodayDateString } from '../../lib/security';

export const PurchasesTab: React.FC = () => {
  const { state, createPurchase } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Form State
  const [purchaseDate, setPurchaseDate] = useState(getTodayDateString());
  const [supplierName, setSupplierName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'CREDIT'>('PAID');
  const [notes, setNotes] = useState('');
  
  // Single or multiple product purchase lines
  const [purchaseLines, setPurchaseLines] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([
    { productId: state.products[0]?.id || '', quantity: 10, unitCost: state.products[0]?.costPrice || 1.90 }
  ]);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredPurchases = state.purchases.filter(p => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return p.purchaseNumber.toLowerCase().includes(term) ||
           (p.supplierName && p.supplierName.toLowerCase().includes(term));
  });

  const totalPurchasesCost = filteredPurchases.reduce((sum, p) => sum + p.totalCost, 0);

  // Calculate purchase form total
  const formGrandTotal = purchaseLines.reduce((sum, line) => sum + (line.quantity * line.unitCost), 0);

  const handleAddLine = () => {
    const defaultP = state.products[0];
    if (!defaultP) return;
    setPurchaseLines([...purchaseLines, { productId: defaultP.id, quantity: 10, unitCost: defaultP.costPrice }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (purchaseLines.length <= 1) return;
    setPurchaseLines(purchaseLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: 'productId' | 'quantity' | 'unitCost', value: any) => {
    const updated = [...purchaseLines];
    if (field === 'productId') {
      const prod = state.products.find(p => p.id === value);
      updated[idx].productId = value;
      if (prod) {
        updated[idx].unitCost = prod.costPrice;
      }
    } else if (field === 'quantity') {
      updated[idx].quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === 'unitCost') {
      updated[idx].unitCost = Math.max(0, parseFloat(value) || 0);
    }
    setPurchaseLines(updated);
  };

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (purchaseLines.length === 0) {
      setToast({ type: 'error', text: 'Fadlan ku dar ugu yaraan hal badeeco.' });
      return;
    }

    const res = createPurchase({
      supplierName: supplierName.trim() || 'Qaybiye',
      paymentStatus,
      notes: notes.trim(),
      date: purchaseDate,
      items: purchaseLines.map(line => ({
        productId: line.productId,
        quantity: line.quantity,
        unitCost: line.unitCost,
      })),
    });

    if (res.success && res.purchase) {
      setToast({ type: 'success', text: `Alaabta ${res.purchase.purchaseNumber} si guul leh ayaa loo diiwaangeliyay, kaydkiina waa kordhay!` });
      setShowAddModal(false);
      setSupplierName('');
      setNotes('');
      setPaymentStatus('PAID');
      setPurchaseLines([{ productId: state.products[0]?.id || '', quantity: 10, unitCost: state.products[0]?.costPrice || 1.90 }]);
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
            <Truck className="w-5 h-5 text-[#1a7b07]" />
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Alaab Soo Gelin / Iibsashada (Purchases)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Diiwaangeli badeecadaha cusub ee la soo iibiyay, qiimaha iibsiga (Cost Price), iyo kordhinta kaydka.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right flex-1 sm:flex-initial">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Wadarta Iibsiga</span>
            <span className="text-base font-black font-mono text-slate-900">
              {formatCurrency(totalPurchasesCost)}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 bg-[#1a7b07] hover:bg-[#146205] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Soo Geli Alaab Cusub</span>
          </button>
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Raadi iibsi # ama Qaybiye..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
          />
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-medium">Weli wax alaab ah lama soo gelin.</p>
            <p className="text-[11px] text-slate-400">Guji "Soo Geli Alaab Cusub" si aad kayd cusub u diiwaangeliso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                  <th className="p-3 font-semibold">Tirada #</th>
                  <th className="p-3 font-semibold">Taariikh</th>
                  <th className="p-3 font-semibold">Qaybiyaha / Source</th>
                  <th className="p-3 font-semibold">Badeecadaha & Tirada</th>
                  <th className="p-3 text-right font-semibold">Wadarta Qiimaha ($)</th>
                  <th className="p-3 text-center font-semibold">Nooca Bixinta</th>
                  <th className="p-3 text-center font-semibold">Faahfaahin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {purchase.purchaseNumber}
                    </td>
                    <td className="p-3 text-slate-600 font-mono">
                      {purchase.date}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {purchase.supplierName || 'Qaybiye'}
                    </td>
                    <td className="p-3 text-slate-700">
                      <span className="font-semibold text-slate-900">{purchase.items.length} nooc: </span>
                      <span className="text-[11px] text-slate-500">
                        {purchase.items.map(i => `${i.productName} (${i.quantity}x$${i.unitCost})`).join(', ')}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(purchase.totalCost)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        purchase.paymentStatus === 'CREDIT' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {purchase.paymentStatus === 'CREDIT' ? 'Dayn (AP)' : 'Kaash (Paid)'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedPurchase(purchase)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                        title="Eeg Faahfaahinta"
                      >
                        <FileText className="w-4 h-4 text-[#1a7b07]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record New Purchase */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-[#1a7b07]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Soo Geli Alaab Cusub (New Stock Purchase)
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taariikhda Iibsiga (Date) *
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qaybiyaha / Shirkadda (Supplier)
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Shirkadda Guud"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                  />
                </div>
              </div>

              {/* Purchase Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Badeecadaha La Soo Iibiyay (Items) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-bold text-[#1a7b07] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ku dar badeeco kale</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto p-1">
                  {purchaseLines.map((line, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Badeecada</label>
                        <select
                          value={line.productId}
                          onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-900"
                        >
                          {state.products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tirada</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qiimaha ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitCost}
                          onChange={(e) => handleLineChange(idx, 'unitCost', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-mono font-bold text-[#1a7b07]"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        {purchaseLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Payment Method */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-900">Wadarta Kharashka Iibsiga:</span>
                <span className="font-mono font-black text-base text-[#1a7b07]">
                  {formatCurrency(formGrandTotal)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xaaladda Lacag-Bixinta *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('PAID')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      paymentStatus === 'PAID'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>La Bixiyay (Kaash Baa Baxay)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('CREDIT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      paymentStatus === 'CREDIT'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Dayn (Waa Laguugu Leeyahay)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faahfaahin Dheeraad ah (Notes)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Qaybinta 1-aad ee bishan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1a7b07] hover:bg-[#146205] transition cursor-pointer shadow-xs"
                >
                  Xaqiiji & Kordhi Kaydka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Purchase Details */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Faahfaahinta: {selectedPurchase.purchaseNumber}
              </h3>
              <button onClick={() => setSelectedPurchase(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Taariikh:</span>
                <span className="font-bold text-slate-800">{selectedPurchase.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Qaybiyaha:</span>
                <span className="font-bold text-slate-800">{selectedPurchase.supplierName || 'Qaybiye'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nooca Bixinta:</span>
                <span className="font-bold">{selectedPurchase.paymentStatus === 'PAID' ? 'La Bixiyay' : 'Dayn (AP)'}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-700 mb-1.5">Badeecadaha:</p>
                <div className="space-y-1">
                  {selectedPurchase.items.map((item, i) => (
                    <div key={i} className="flex justify-between bg-slate-50 p-2 rounded-lg">
                      <span>{item.productName} ({item.quantity} xabbo)</span>
                      <span className="font-mono font-bold">{formatCurrency(item.totalCost)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm">
                <span>Wadarta Guud:</span>
                <span className="font-mono text-[#1a7b07]">{formatCurrency(selectedPurchase.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
