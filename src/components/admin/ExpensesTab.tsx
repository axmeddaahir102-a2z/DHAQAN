import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Expense } from '../../types';
import { formatCurrency, getTodayDateString } from '../../lib/security';

export const ExpensesTab: React.FC = () => {
  const { state, createExpense } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [expDate, setExpDate] = useState(getTodayDateString());
  const [category, setCategory] = useState('Kiro (Rent)');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = [
    'Kiro (Rent)',
    'Koronto & Biyo (Utilities)',
    'Mushahar (Salaries)',
    'Gaadiid & Shidaal (Transport)',
    'Cunto & Qado (Refreshments)',
    'Xayeysiis (Marketing)',
    'Kharash Kale (Other)'
  ];

  const filteredExpenses = state.expenses.filter(e => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      e.category.toLowerCase().includes(term) ||
      e.description.toLowerCase().includes(term);
    const matchesCat = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setToast({ type: 'error', text: 'Fadlan geli lacag sax ah oo ka weyn eber.' });
      return;
    }

    if (!description.trim()) {
      setToast({ type: 'error', text: 'Fadlan qor faahfaahinta kharashka.' });
      return;
    }

    const res = createExpense({
      date: expDate,
      category,
      amount: amtNum,
      description: description.trim(),
    });

    if (res.success && res.expense) {
      setToast({ type: 'success', text: `Kharashka ${formatCurrency(amtNum)} si guul leh ayaa loo qoray, qasnaddana waa laga jaray!` });
      setShowAddModal(false);
      setAmount('');
      setDescription('');
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
            <Receipt className="w-5 h-5 text-rose-600" />
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Kharashaadka Shaqada (Operating Expenses)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Diiwaangeli kharashaadka maalinlaha ah sida kirada, korontada, gaadiidka, iyo mushaharaadka.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 text-right flex-1 sm:flex-initial">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">Wadarta Kharashaadka</span>
            <span className="text-base font-black font-mono text-rose-700">
              {formatCurrency(totalExpensesAmount)}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Qor Kharash Cusub</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
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
              placeholder="Raadi kharash..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="ALL">Dhammaan Qaybaha (All Categories)</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs font-medium">Wax kharash ah lama helin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                  <th className="p-3 font-semibold">Tirada #</th>
                  <th className="p-3 font-semibold">Taariikh</th>
                  <th className="p-3 font-semibold">Qaybta (Category)</th>
                  <th className="p-3 font-semibold">Faahfaahinta Kharashka</th>
                  <th className="p-3 text-right font-semibold">Lacagta ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      EXP-{(idx + 1).toString().padStart(4, '0')}
                    </td>
                    <td className="p-3 text-slate-600 font-mono">
                      {exp.date}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {exp.category}
                    </td>
                    <td className="p-3 text-slate-700">
                      {exp.description}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-rose-700">
                      -{formatCurrency(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-rose-700">
                <Receipt className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">Diiwaangeli Kharash Cusub</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taariikhda (Date) *
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qaybta (Category) *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lacagta Kharashka ($ Amount) *
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
                  Faahfaahinta Kharashka (Description) *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Kirada dukaanka bisha Febraayo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
                >
                  Keydi & Ka Jar Qasnadda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
