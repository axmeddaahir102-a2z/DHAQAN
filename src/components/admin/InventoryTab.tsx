import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Sliders,
  CheckCircle2,
  X,
  AlertCircle,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/security';

export const InventoryTab: React.FC = () => {
  const { state, adjustProductStock, updateProductInfo, addProduct, getInventoryValue } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  
  // Form states
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newMinStock, setNewMinStock] = useState<number>(5);

  const [adjustStockVal, setAdjustStockVal] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');

  const [addName, setAddName] = useState('');
  const [addCost, setAddCost] = useState<number>(1.90);
  const [addInitialStock, setAddInitialStock] = useState<number>(0);
  const [addMinAlert, setAddMinAlert] = useState<number>(5);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalInvValue = getInventoryValue();
  const totalStockCount = state.products.reduce((sum, p) => sum + p.currentStock, 0);

  const filteredProducts = state.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Open Edit Modal
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setNewCostPrice(p.costPrice);
    setNewMinStock(p.minStockLevel);
  };

  // Open Adjust Modal
  const openAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustStockVal(p.currentStock);
    setAdjustReason('');
  };

  // Save Edit Info
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (newCostPrice < 0) {
      setToast({ type: 'error', text: 'Qiimaha ma noqon karo wax ka yar eber.' });
      return;
    }

    const res = updateProductInfo(editingProduct.id, newCostPrice, newMinStock);
    if (res.success) {
      setToast({ type: 'success', text: `Xogta ${editingProduct.name} waa la cusboonaysiiyay.` });
      setEditingProduct(null);
    }
  };

  // Save Stock Adjustment
  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    if (adjustStockVal < 0) {
      setToast({ type: 'error', text: 'Tirada kaydka ma noqon karto wax ka yar eber.' });
      return;
    }

    const res = adjustProductStock(adjustingProduct.id, adjustStockVal, adjustReason.trim());
    if (res.success) {
      setToast({ type: 'success', text: `Kaydka ${adjustingProduct.name} waa la saxay: ${adjustStockVal} xabbo.` });
      setAdjustingProduct(null);
    }
  };

  // Save Add Product
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setToast({ type: 'error', text: 'Fadlan geli magaca badeecada.' });
      return;
    }

    const res = addProduct({
      name: addName.trim(),
      costPrice: addCost,
      initialStock: addInitialStock,
      minStockLevel: addMinAlert,
    });

    if (res.success) {
      setToast({ type: 'success', text: `Badeecada ${addName} waa lagu daray nidaamka.` });
      setShowAddModal(false);
      setAddName('');
      setAddCost(1.90);
      setAddInitialStock(0);
      setAddMinAlert(5);
    } else {
      setToast({ type: 'error', text: res.error || 'Khalad ayaa dhacay.' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Toast notification */}
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

      {/* Top Banner: Inventory Valuation & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-[#1a7b07]" />
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Alaabta & Kaydka (Hair Care Inventory)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maamulka 7-da badeeco, tirada kaydka, qiimaha iibsiga (Cost Price), iyo qiimaha guud ee maalgashiga.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Inventory Valuation Card */}
          <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-right flex-1 sm:flex-initial">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">
              Qiimaha Guud ee Kaydka (Value)
            </span>
            <span className="text-lg font-black font-mono text-[#1a7b07]">
              {formatCurrency(totalInvValue)}
            </span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2.5 bg-[#1a7b07] hover:bg-[#146205] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Badeeco Cusub</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        
        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Raadi badeeco..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Wadarta Xabbadaha: <strong className="text-slate-900 font-bold">{totalStockCount} xabbo</strong>
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                <th className="p-3 font-semibold">#</th>
                <th className="p-3 font-semibold">Magaca Badeecada</th>
                <th className="p-3 text-right font-semibold">Qiimaha Joogta (Cost Price)</th>
                <th className="p-3 text-center font-semibold">Tirada Kaydka (Stock)</th>
                <th className="p-3 text-right font-semibold">Wadarta Qiimaha (Total Value)</th>
                <th className="p-3 text-center font-semibold">Digniinta (Min Alert)</th>
                <th className="p-3 text-center font-semibold">Xaaladda</th>
                <th className="p-3 text-center font-semibold">Ficilada (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product, idx) => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock <= product.minStockLevel && product.currentStock > 0;
                const productValue = product.currentStock * product.costPrice;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{product.name}</p>
                      <span className="text-[10px] text-slate-400">DHAQAN-KAABA Hair Care</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700">
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="p-3 text-center font-mono font-black text-sm text-slate-900">
                      <span className={`px-2 py-0.5 rounded ${
                        isOutOfStock ? 'bg-rose-100 text-rose-800' : isLowStock ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {product.currentStock} xabbo
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#1a7b07]">
                      {formatCurrency(productValue)}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">
                      {product.minStockLevel} xabbo
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isOutOfStock 
                          ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                          : isLowStock 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isOutOfStock ? 'Dhammaaday' : isLowStock ? 'Waa Yaryahay' : 'Waa Diyaar'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openAdjust(product)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center space-x-1"
                          title="Sax tirada kaydka"
                        >
                          <Sliders className="w-3 h-3 text-[#1a7b07]" />
                          <span>Sax Kaydka</span>
                        </button>
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Beddel qiimaha & xogta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Adjust Stock Quantity */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Sax Tirada Kaydka: {adjustingProduct.name}
              </h3>
              <button onClick={() => setAdjustingProduct(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
                <span className="text-slate-600">Kaydka Hadda Yaalla:</span>
                <span className="font-bold font-mono text-slate-900">{adjustingProduct.currentStock} xabbo</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tirada Cusub ee Dhabta ah (New Physical Stock) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustStockVal}
                  onChange={(e) => setAdjustStockVal(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sababta Saxitaanka (Reason / Note)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Tirinta dhabta ah ee bakhaarka"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1a7b07] hover:bg-[#146205] transition cursor-pointer shadow-xs"
                >
                  Keydi Saxitaanka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Cost Price & Min Alert */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Wax ka Beddel: {editingProduct.name}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qiimaha Joogta / Iibsiga ($ Cost Price) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    $
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Qiimahani wuxuu xisaabiyaa faa'iidada iibka mustaqbalka.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Heerka Digniinta Kaydka (Min Stock Alert)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Ka Noqo
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1a7b07] hover:bg-[#146205] transition cursor-pointer shadow-xs"
                >
                  Keydi Isbeddelka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Ku Dar Badeeco Cusub (Add Product)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Magaca Badeecada (Product Name) *
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Saliid 1000ml"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qiimaha Joogta ($ Cost) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={addCost}
                    onChange={(e) => setAddCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kaydka Bilowga (Initial Qty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addInitialStock}
                    onChange={(e) => setAddInitialStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Digniinta Kaydka (Min Alert)
                </label>
                <input
                  type="number"
                  min="1"
                  value={addMinAlert}
                  onChange={(e) => setAddMinAlert(parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1a7b07] hover:bg-[#146205] transition cursor-pointer shadow-xs"
                >
                  Ku Dar Nidaamka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
