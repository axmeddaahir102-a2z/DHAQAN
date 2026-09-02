import React from 'react';
import {
  Wallet,
  TrendingUp,
  ShoppingCart,
  Receipt,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Settings
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatCurrency, getTodayDateString } from '../../lib/security';
import { AdminTab } from './AdminSidebar';

interface DashboardTabProps {
  onNavigate: (tab: AdminTab) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onNavigate }) => {
  const { 
    state, 
    getCashBalance, 
    getInventoryValue, 
    getTotalReceivables, 
    getTotalPayables,
    getProfitReport 
  } = useStore();

  const todayStr = getTodayDateString();
  const todayReport = getProfitReport(todayStr, todayStr);

  const cashBalance = getCashBalance();
  const inventoryValue = getInventoryValue();
  const accountsReceivable = getTotalReceivables();
  const accountsPayable = getTotalPayables();

  const lowStockProducts = state.products.filter(p => p.active && p.currentStock <= p.minStockLevel);
  const recentSales = state.sales.slice(0, 5);
  const recentExpenses = state.expenses.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Initial Setup Reminder Banner if not configured yet */}
      {!state.settings.hasCompletedSetup && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1a7b07] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-sm sm:text-base">
                Ku Soo Dhawoow DHAQAN-KAABA — Bilowga Habaynta (Initial Setup)
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Fadlan geli kaashka bilowga, tirada kaydka ee 7-da badeeco, iyo deymihii hore si aad u bilowdo.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('SETTINGS')}
            className="px-4 py-2 bg-[#1a7b07] hover:bg-[#146205] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Geli Xogta Bilowga (Setup Now)</span>
          </button>
        </div>
      )}

      {/* Top 4 Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cash Balance */}
        <div 
          onClick={() => onNavigate('CASH')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#1a7b07]/50 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kaashka Qasnadda (Cash)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-[#1a7b07] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-[#1a7b07]">
              {formatCurrency(cashBalance)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Lacagta hadda qasnadda ku jirta</p>
          </div>
        </div>

        {/* 2. Today's Sales */}
        <div 
          onClick={() => onNavigate('SALES')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Iibka Maanta (Sales)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(todayReport.revenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{todayReport.salesCount} qaansheeg maanta</p>
          </div>
        </div>

        {/* 3. Today's Profit */}
        <div 
          onClick={() => onNavigate('PROFIT')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Faa'iidada Maanta (Profit)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-700">
              {formatCurrency(todayReport.netProfit)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Iibka - Qiimaha Badeecada - Kharashka</p>
          </div>
        </div>

        {/* 4. Total Inventory Value */}
        <div 
          onClick={() => onNavigate('INVENTORY')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Qiimaha Kaydka (Inventory)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(inventoryValue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">7-da badeeco ee yaalla goobta</p>
          </div>
        </div>
      </div>

      {/* Secondary 3 Metrics: AR, AP, Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Accounts Receivable */}
        <div 
          onClick={() => onNavigate('RECEIVABLES')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 block">Daynta Macaamiisha (AR)</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-1">
              {formatCurrency(accountsReceivable)}
            </div>
            <span className="text-[10px] text-slate-400">Lacagta macaamiisha lagu leeyahay</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100/70 text-rose-700 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        {/* Accounts Payable */}
        <div 
          onClick={() => onNavigate('PAYABLES')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 block">Daynta Ganacsiga (AP)</span>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">
              {formatCurrency(accountsPayable)}
            </div>
            <span className="text-[10px] text-slate-400">Lacagta qaybiyeyaasha lagu leeyahay</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Operating Expenses */}
        <div 
          onClick={() => onNavigate('EXPENSES')}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-bold text-slate-500 block">Kharashaadka Maanta</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {formatCurrency(todayReport.totalExpenses)}
            </div>
            <span className="text-[10px] text-slate-400">Kiro, Koronto, Gaadiid, iwm</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Table if any product has low stock */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/60">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Digniin: Badeecadaha Kaydkoodu Yar Yahay ({lowStockProducts.length})</span>
            </div>
            <button
              onClick={() => onNavigate('PURCHASES')}
              className="text-xs font-bold text-amber-900 hover:underline cursor-pointer"
            >
              Dalbo / Soo Geli Alaab &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map(prod => (
              <div key={prod.id} className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900">{prod.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Qiimaha Joogta: {formatCurrency(prod.costPrice)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                  prod.currentStock <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                }`}>
                  {prod.currentStock} xabbo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Section: Recent Sales & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-[#1a7b07]" />
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Iibkii ugu Dambeeyay</h3>
            </div>
            <button
              onClick={() => onNavigate('SALES')}
              className="text-xs text-[#1a7b07] hover:underline font-bold cursor-pointer"
            >
              Dhammaan ({state.sales.length}) &rarr;
            </button>
          </div>

          {recentSales.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Weli wax iib ah ma dhicin.</p>
          ) : (
            <div className="space-y-2.5">
              {recentSales.map((sale) => (
                <div key={sale.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sale.paymentStatus === 'CREDIT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {sale.paymentStatus === 'CREDIT' ? 'Dayn' : 'Kaash'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                      {sale.date} • {sale.customerPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-[#1a7b07]">
                      {formatCurrency(sale.grandTotal)}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Faa'iido: +{formatCurrency(sale.grossProfit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Kharashaadkii ugu Dambeeyay</h3>
            </div>
            <button
              onClick={() => onNavigate('EXPENSES')}
              className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
            >
              Dhammaan ({state.expenses.length}) &rarr;
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Weli wax kharash ah lama qorin.</p>
          ) : (
            <div className="space-y-2.5">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{exp.category}</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">{exp.description}</p>
                    <p className="text-slate-400 text-[10px] font-mono">{exp.date}</p>
                  </div>
                  <span className="font-mono font-black text-sm text-rose-600">
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
