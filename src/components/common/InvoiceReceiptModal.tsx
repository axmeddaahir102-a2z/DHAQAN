import React, { useRef } from 'react';
import { Printer, X, FileText } from 'lucide-react';
import { SaleInvoice } from '../../types';
import { formatCurrency } from '../../lib/security';
import { useStore } from '../../lib/store';

interface InvoiceReceiptModalProps {
  invoice: SaleInvoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({ invoice, isOpen, onClose }) => {
  const { state } = useStore();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isCredit = invoice.paymentStatus === 'CREDIT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header (Not printed) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1a7b07]/10 text-[#1a7b07] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                Rasiidka: {invoice.invoiceNumber}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isCredit ? 'Iib Dayn ah (Credit Sale)' : 'Iib Kaash ah (Cash Sale)'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#1a7b07] hover:bg-[#146205] active:scale-98 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Daabac (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area - 80mm POS Receipt Style */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div 
            ref={printRef}
            className="printable-area bg-white p-5 rounded-xl shadow-md border border-slate-200 w-full max-w-[340px] font-mono text-xs text-slate-900"
          >
            {/* Store Brand Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h1 className="font-extrabold text-base tracking-tight text-slate-950">
                {state.settings.businessName || 'DHAQAN-KAABA'}
              </h1>
              <p className="text-[11px] text-slate-600 font-sans">{state.settings.address || 'Mogadishu, Somalia'}</p>
              <p className="text-[11px] text-slate-600 font-sans">Tel: {state.settings.phone || '0615123456'}</p>
            </div>

            {/* Receipt Meta */}
            <div className="space-y-1 pb-2.5 mb-2.5 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Qaansheeg #:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taariikh:</span>
                <span>{invoice.date} {invoice.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Macaamiilka Tel:</span>
                <span className="font-semibold">{invoice.customerPhone}</span>
              </div>
              {invoice.customerName && invoice.customerName !== 'Macaamil' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Magaca:</span>
                  <span>{invoice.customerName}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Nooca Iibka:</span>
                <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                  isCredit ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {isCredit ? 'DAYN (CREDIT)' : 'KAASH (CASH)'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="pb-3 mb-3 border-b border-dashed border-slate-300">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="pb-1 font-semibold">Badeeco</th>
                    <th className="pb-1 text-center font-semibold">Tiro</th>
                    <th className="pb-1 text-right font-semibold">Qiimo</th>
                    <th className="pb-1 text-right font-semibold">Wadarta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1 pr-1 font-medium max-w-[120px] truncate">
                        {item.productName}
                      </td>
                      <td className="py-1 text-center font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-1 text-right font-mono text-slate-600">
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-1 text-right font-mono font-semibold">
                        {item.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grand Total */}
            <div className="space-y-1.5 pb-3 mb-3 border-b border-dashed border-slate-300 text-xs">
              <div className="flex justify-between text-sm font-bold pt-1 text-slate-950">
                <span>WADARTA GUUD:</span>
                <span className="font-mono text-[#1a7b07]">
                  {formatCurrency(invoice.grandTotal)}
                </span>
              </div>

              {isCredit && (
                <div className="pt-2 mt-2 bg-amber-50 p-2 rounded border border-amber-200 text-[11px] font-sans">
                  <p className="font-bold text-amber-900 mb-0.5">Xogta Daynta:</p>
                  <p className="text-amber-800 text-[10px] leading-tight">
                    {invoice.creditNote || 'Dayn ku xusan diiwaanka macaamiilka.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Notes */}
            <div className="text-center pt-1 text-[11px] text-slate-500 font-sans">
              <p className="font-semibold text-slate-700">
                {state.settings.receiptFooterNote || 'Waad ku mahadsan tahay booqashadaada!'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Alaabta la iibsaday laguma celin karo caddaan la'aan.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
