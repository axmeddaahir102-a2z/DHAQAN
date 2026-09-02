import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Receipt,
  ShoppingCart,
  Percent,
  CheckCircle2,
  Package
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatCurrency, getTodayDateString } from '../../lib/security';

export const ProfitLossTab: React.FC = () => {
  const { getProfitReport } = useStore();

  const [filterPeriod, setFilterPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM'>('TODAY');
  const [customStart, setCustomStart] = useState(getTodayDateString());
  const [customEnd, setCustomEnd] = useState(getTodayDateString());

  // Determine start & end dates
  let startDate: string | undefined = undefined;
  let endDate: string | undefined = undefined;

  const todayStr = getTodayDateString();

  if (filterPeriod === 'TODAY') {
    startDate = todayStr;
    endDate = todayStr;
  } else if (filterPeriod === 'WEEK') {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    startDate = d.toISOString().split('T')[0];
    endDate = todayStr;
  } else if (filterPeriod === 'MONTH') {
    const d = new Date();
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    startDate = prefix;
    endDate = todayStr;
  } else if (filterPeriod === 'CUSTOM') {
    startDate = customStart;
    endDate = customEnd;
  }

  const report = getProfitReport(startDate, endDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header & Period Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#1a7b07]" />
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Xisaabinta Faa'iidada (Profit & Loss)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Warbixin cad oo ku salaysan: Dakhliga - Qiimaha Badeecada (COGS) - Kharashaadka = Faa'iidada Saafiga ah.
          </p>
        </div>

        {/* Period Pills */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilterPeriod('TODAY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterPeriod === 'TODAY' ? 'bg-[#1a7b07] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Maanta (Today)
          </button>
          <button
            onClick={() => setFilterPeriod('WEEK')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterPeriod === 'WEEK' ? 'bg-[#1a7b07] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toddobaadkan
          </button>
          <button
            onClick={() => setFilterPeriod('MONTH')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterPeriod === 'MONTH' ? 'bg-[#1a7b07] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bishan (This Month)
          </button>
          <button
            onClick={() => setFilterPeriod('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterPeriod === 'ALL' ? 'bg-[#1a7b07] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dhammaan
          </button>
          <button
            onClick={() => setFilterPeriod('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterPeriod === 'CUSTOM' ? 'bg-[#1a7b07] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dooro Taariikh
          </button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {filterPeriod === 'CUSTOM' && (
        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl flex items-center space-x-3 text-xs">
          <Calendar className="w-4 h-4 text-[#1a7b07]" />
          <span className="font-bold text-slate-700">Laga bilaabo:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
          />
          <span className="font-bold text-slate-700">Ilaa:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
          />
        </div>
      )}

      {/* Main Income Statement Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        
        {/* Big Net Profit Header */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
              Faa'iidada Saafiga ah ee Xilligan (Net Profit)
            </span>
            <div className={`text-3xl sm:text-4xl font-black font-mono mt-1 ${
              report.netProfit >= 0 ? 'text-[#1a7b07]' : 'text-rose-600'
            }`}>
              {report.netProfit >= 0 ? '+' : ''}{formatCurrency(report.netProfit)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Faa'iidada dhabta ah ee u hadhay meheradda markii laga jaray qiimaha alaabta iyo dhammaan kharashaadka.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Boqolleyda Faa'iidada (Margin)</span>
            <span className="text-xl font-black font-mono text-[#1a7b07]">
              {(report.revenue > 0 ? (report.netProfit / report.revenue) * 100 : 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Step-by-Step Accounting Breakdown */}
        <div className="space-y-3 divide-y divide-slate-100 text-xs sm:text-sm">
          
          {/* 1. Total Revenue */}
          <div className="pt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800">1. Dakhliga Guud ee Iibka (Total Sales / Revenue)</span>
              <span className="text-xs text-slate-400">({report.salesCount} qaansheeg)</span>
            </div>
            <span className="font-mono font-black text-slate-900 text-base">
              {formatCurrency(report.revenue)}
            </span>
          </div>

          {/* 2. COGS */}
          <div className="pt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-600">2. Qiimaha Asalka ah ee Badeecadaha La Iibiyay (COGS)</span>
            </div>
            <span className="font-mono font-bold text-slate-600">
              -{formatCurrency(report.cogs)}
            </span>
          </div>

          {/* 3. Gross Profit */}
          <div className="pt-3 flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span className="font-extrabold text-emerald-950">3. Faa'iidada Guud ee Iibka (Gross Profit = 1 − 2)</span>
            </div>
            <span className="font-mono font-black text-emerald-800 text-base">
              {formatCurrency(report.grossProfit)}
            </span>
          </div>

          {/* 4. Operating Expenses */}
          <div className="pt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              <span className="font-semibold text-slate-600">4. Kharashaadka Shaqada ee Baxay (Total Expenses)</span>
            </div>
            <span className="font-mono font-bold text-rose-600">
              -{formatCurrency(report.totalExpenses)}
            </span>
          </div>

          {/* 5. Net Profit Line */}
          <div className="pt-4 flex items-center justify-between bg-[#1a7b07]/10 p-4 rounded-xl border border-[#1a7b07]/20">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#1a7b07]" />
              <div>
                <span className="font-black text-slate-900 text-sm sm:text-base">5. Faa'iidada Saafiga ah (Net Profit = 3 − 4)</span>
                <p className="text-[11px] text-slate-500">Lacagta saafiga ah ee soo hoyatay</p>
              </div>
            </div>
            <span className={`font-mono font-black text-lg sm:text-xl ${
              report.netProfit >= 0 ? 'text-[#1a7b07]' : 'text-rose-600'
            }`}>
              {report.netProfit >= 0 ? '+' : ''}{formatCurrency(report.netProfit)}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
