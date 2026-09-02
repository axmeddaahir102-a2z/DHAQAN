import React, { useState } from 'react';
import { Search, X, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Product } from '../../types';

interface QuickStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const QuickStockModal: React.FC<QuickStockModalProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const { state } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredProducts = state.products.filter(p => {
    return !searchTerm.trim() || p.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a7b07]/10 text-[#1a7b07] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Hubinta Kaydka Yaalla (Available Stock Lookup)
              </h3>
              <p className="text-xs text-slate-500">
                Fiiri xaddiga kaydka u yaalla badeecad kasta oo ka tirsan DHAQAN-KAABA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Raadi magaca badeecada..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07] focus:bg-white transition"
              autoFocus
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Wax badeeco ah lama helin.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((p) => {
                const isLow = p.currentStock <= (p.minStockLevel || 5);
                const isOut = p.currentStock <= 0;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/70 transition"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Brand: DHAQAN-KAABA • Digniinta: {p.minStockLevel || 5} xabo
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className={`text-sm sm:text-base font-black font-mono block ${
                          isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                        }`}>
                          {p.currentStock} xabo
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isOut ? 'Dhammaatay' : isLow ? 'Kayd Yar' : 'Diyaar'}
                        </span>
                      </div>

                      {onSelectProduct && !isOut && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(p);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-[#1a7b07] hover:bg-[#146205] text-white text-xs font-bold rounded-lg transition cursor-pointer"
                        >
                          Dooro
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
