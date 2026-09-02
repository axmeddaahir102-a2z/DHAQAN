import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  X
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { SaleInvoice } from '../../types';
import { formatCurrency } from '../../lib/security';
import { InvoiceReceiptModal } from '../common/InvoiceReceiptModal';

export const SalesManagementTab: React.FC = () => {
  const { state } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'CREDIT'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [printingInvoice, setPrintingInvoice] = useState<SaleInvoice | null>(null);

  const filteredSales = state.sales.filter(s => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term ||
      s.invoiceNumber.toLowerCase().includes(term) ||
      s.customerPhone.toLowerCase().includes(term) ||
      (s.customerName && s.customerName.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'ALL' || s.paymentStatus === statusFilter;
    const matchesDate = !dateFilter || s.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCOGS = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
  const totalGrossProfit = totalSalesRevenue - totalCOGS;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header & Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-[#1a7b07]" />
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Diiwaanka Iibka (Sales History)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dhammaan iibkii dhacay, dakhliga guud, qiimaha badeecada (COGS), iyo faa'iidada guud (Gross Profit).
          </p>
        </div>

        {/* Totals Summary */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Dakhliga Guud</span>
            <span className="text-base font-black font-mono text-slate-900">
              {formatCurrency(totalSalesRevenue)}
            </span>
          </div>
          <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Faa'iidada Guud</span>
            <span className="text-base font-black font-mono text-[#1a7b07]">
              {formatCurrency(totalGrossProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Table Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Raadi Invoice # ama Taleefan..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
              />
            </div>

            {/* Date filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dhammaan ({state.sales.length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'PAID' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kaash
            </button>
            <button
              onClick={() => setStatusFilter('CREDIT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'CREDIT' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dayn
            </button>
          </div>
        </div>

        {/* Sales Table */}
        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-xs font-medium">Wax iib ah lama helin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                  <th className="p-3 font-semibold">Qaansheeg #</th>
                  <th className="p-3 font-semibold">Taariikh & Saacad</th>
                  <th className="p-3 font-semibold">Macaamiilka Tel</th>
                  <th className="p-3 font-semibold">Faahfaahinta Badeecadaha</th>
                  <th className="p-3 text-right font-semibold">Iibka ($)</th>
                  <th className="p-3 text-right font-semibold text-slate-500">Joogta (COGS)</th>
                  <th className="p-3 text-right font-semibold text-emerald-700">Faa'iido ($)</th>
                  <th className="p-3 text-center font-semibold">Xaaladda</th>
                  <th className="p-3 text-center font-semibold">Rasiid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-3 text-slate-600 font-mono">
                      {sale.date} <span className="text-slate-400 text-[10px]">{sale.time}</span>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-800">
                      {sale.customerPhone}
                    </td>
                    <td className="p-3 text-slate-700">
                      <p className="font-semibold text-slate-900">{sale.items.length} badeeco</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                        {sale.items.map(i => `${i.productName} (${i.quantity}x$${i.unitPrice})`).join(', ')}
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {formatCurrency(sale.totalCost)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      +{formatCurrency(sale.grossProfit)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        sale.paymentStatus === 'CREDIT' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {sale.paymentStatus === 'CREDIT' ? 'Dayn' : 'Kaash'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setPrintingInvoice(sale)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#1a7b07]" />
                        <span>Daabac</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Receipt Modal */}
      {printingInvoice && (
        <InvoiceReceiptModal
          invoice={printingInvoice}
          isOpen={!!printingInvoice}
          onClose={() => setPrintingInvoice(null)}
        />
      )}

    </div>
  );
};
