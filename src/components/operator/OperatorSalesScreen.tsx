import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ShoppingCart, 
  Printer, 
  Search, 
  Phone, 
  FileText, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  DollarSign
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Product, SaleInvoice } from '../../types';
import { formatCurrency } from '../../lib/security';
import { InvoiceReceiptModal } from '../common/InvoiceReceiptModal';

interface CartLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
}

export const OperatorSalesScreen: React.FC = () => {
  const { state, createSale } = useStore();
  
  // Navigation within Employee area: 'NEW_SALE' | 'SALES_HISTORY' | 'STOCK_VIEW'
  const [activeTab, setActiveTab] = useState<'NEW_SALE' | 'SALES_HISTORY' | 'STOCK_VIEW'>('NEW_SALE');

  // New Sale Form State
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [inputUnitPrice, setInputUnitPrice] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'CREDIT'>('PAID');
  const [creditNote, setCreditNote] = useState<string>('');

  // Search in History
  const [historySearch, setHistorySearch] = useState<string>('');

  // Receipt Modal State
  const [printedInvoice, setPrintedInvoice] = useState<SaleInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected product helper
  const selectedProduct = state.products.find(p => p.id === selectedProductId);

  // Cart total calculations
  const grandTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Add line to cart
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProduct) {
      setErrorMsg('Fadlan dooro badeeco (Select a product).');
      return;
    }

    if (inputQuantity <= 0 || isNaN(inputQuantity)) {
      setErrorMsg('Fadlan geli tiro sax ah (Enter a valid quantity).');
      return;
    }

    const priceNum = parseFloat(inputUnitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMsg('Fadlan geli qiimaha iibka ee xabbadkiiba (Enter selling price per unit).');
      return;
    }

    // Check stock
    const existingInCart = cart.find(i => i.productId === selectedProduct.id);
    const totalNeeded = (existingInCart ? existingInCart.quantity : 0) + inputQuantity;

    if (selectedProduct.currentStock < totalNeeded) {
      setErrorMsg(`Kaydka ${selectedProduct.name} kuma filna! Kaydka yaalla: ${selectedProduct.currentStock} xabbo.`);
      return;
    }

    if (existingInCart) {
      setCart(cart.map(item => item.productId === selectedProduct.id ? {
        ...item,
        quantity: item.quantity + inputQuantity,
        unitPrice: priceNum, // update price to latest entered
      } : item));
    } else {
      setCart([...cart, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: inputQuantity,
        unitPrice: priceNum,
        availableStock: selectedProduct.currentStock,
      }]);
    }

    // Reset line input
    setSelectedProductId('');
    setInputQuantity(1);
    setInputUnitPrice('');
  };

  // Remove item from cart
  const handleRemoveItem = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  // Reset entire form
  const handleResetForm = () => {
    setCart([]);
    setSelectedProductId('');
    setInputQuantity(1);
    setInputUnitPrice('');
    setCustomerPhone('');
    setCustomerName('');
    setPaymentStatus('PAID');
    setCreditNote('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Save Sale
  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (cart.length === 0) {
      setErrorMsg('Fadlan ku dar ugu yaraan hal badeeco qaansheegta.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMsg('Fadlan geli lambarka taleefanka macaamiilka (Customer phone).');
      return;
    }

    if (paymentStatus === 'CREDIT' && !creditNote.trim()) {
      setErrorMsg('Fadlan qor faahfaahinta deynta (yaa qaatay ama sababta).');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = createSale({
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim() || undefined,
        items: cart.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        paymentStatus,
        creditNote: creditNote.trim() || undefined,
        createdBy: 'OPERATOR',
      });

      if (!result.success || !result.invoice) {
        setErrorMsg(result.error || 'Khalad ayaa dhacay xilliga kaydinta iibka.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Iibka ${result.invoice.invoiceNumber} si guul leh ayaa loo kaydiyay!`);
      setPrintedInvoice(result.invoice);
      setShowReceiptModal(true);
      handleResetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Khalad ayaa dhacay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Sales History
  const filteredSales = state.sales.filter(s => {
    const term = historySearch.toLowerCase().trim();
    if (!term) return true;
    return s.invoiceNumber.toLowerCase().includes(term) ||
           s.customerPhone.includes(term) ||
           (s.customerName && s.customerName.toLowerCase().includes(term));
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header & Navigation Tabs */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-[#1a7b07]/10 text-[#1a7b07] flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  QAYBTA SHAQAALAHA (SALES)
                </h1>
                <span className="bg-[#1a7b07]/10 text-[#1a7b07] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#1a7b07]/20">
                  DHAQAN-KAABA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Shaashadda diiwaangelinta iibka degdegga ah iyo eegista kaydka badeecadaha
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto border border-slate-200">
            <button
              onClick={() => setActiveTab('NEW_SALE')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'NEW_SALE'
                  ? 'bg-[#1a7b07] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Iib Cusub (New Sale)</span>
            </button>
            <button
              onClick={() => setActiveTab('SALES_HISTORY')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'SALES_HISTORY'
                  ? 'bg-[#1a7b07] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Iibkii Hore ({state.sales.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('STOCK_VIEW')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'STOCK_VIEW'
                  ? 'bg-[#1a7b07] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Kaydka Alaabta</span>
            </button>
          </div>
        </div>

        {/* Global Alert Messages */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs sm:text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: NEW SALE / IIB CUSUB */}
        {/* ============================================================ */}
        {activeTab === 'NEW_SALE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Product Selection & Line Item Entry */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
                  <Package className="w-4 h-4 text-[#1a7b07]" />
                  <h2 className="font-bold text-slate-900 text-sm">
                    Dooro Badeecada & Qiimaha (Add Product)
                  </h2>
                </div>

                <form onSubmit={handleAddToCart} className="space-y-4">
                  {/* Product Dropdown (The 7 Products) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Badeecada (Product) *
                    </label>
                    <select
                      id="select-product"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 focus:border-[#1a7b07] transition cursor-pointer"
                    >
                      <option value="">-- Dooro mid ka mid ah 7-da badeeco --</option>
                      {state.products.filter(p => p.active).map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Information Badge */}
                  {selectedProduct && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600">Kaydka Hadda Yaalla:</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                        selectedProduct.currentStock <= 0 
                          ? 'bg-rose-100 text-rose-800' 
                          : selectedProduct.currentStock <= selectedProduct.minStockLevel 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedProduct.currentStock} xabbo
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantity Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tirada (Quantity) *
                      </label>
                      <input
                        id="input-quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={inputQuantity}
                        onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 focus:border-[#1a7b07] transition"
                        placeholder="1"
                      />
                    </div>

                    {/* Selling Price Input (Required per sale) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Qiimaha Xabbada ($) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                          $
                        </div>
                        <input
                          id="input-unit-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={inputUnitPrice}
                          onChange={(e) => setInputUnitPrice(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3.5 py-2.5 text-xs sm:text-sm font-bold font-mono text-[#1a7b07] focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 focus:border-[#1a7b07] transition"
                          placeholder="e.g. 5.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line Total Preview */}
                  {inputQuantity > 0 && inputUnitPrice && !isNaN(parseFloat(inputUnitPrice)) && (
                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                      <span className="text-emerald-900 font-medium">Isugeynta Xariiqdan:</span>
                      <span className="font-mono font-extrabold text-sm text-[#1a7b07]">
                        {formatCurrency(inputQuantity * parseFloat(inputUnitPrice))}
                      </span>
                    </div>
                  )}

                  <button
                    id="btn-add-to-cart"
                    type="submit"
                    className="w-full bg-[#1a7b07] hover:bg-[#146205] active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ku Dar Qaansheegta (Add to Invoice)</span>
                  </button>
                </form>
              </div>

              {/* Fast 7-Product Selection Cards */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                  7-da Badeeco ee DHAQAN-KAABA (Quick Pick)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {state.products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setInputQuantity(1);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition flex flex-col justify-between cursor-pointer ${
                        selectedProductId === p.id 
                          ? 'border-[#1a7b07] bg-[#1a7b07]/5 ring-1 ring-[#1a7b07]' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-semibold text-xs text-slate-900 truncate">
                        {p.name}
                      </span>
                      <span className={`text-[11px] font-mono mt-1 ${
                        p.currentStock <= 0 ? 'text-rose-600 font-bold' : 'text-slate-500'
                      }`}>
                        Kaydka: {p.currentStock} xabbo
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Invoice Details, Cart Items & Payment */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between min-h-[500px]">
                
                <div>
                  {/* Cart Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#1a7b07]" />
                      <h2 className="font-bold text-slate-900 text-sm">
                        Qaansheegta Hadda Socota ({cart.length} Badeeco)
                      </h2>
                    </div>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer"
                      >
                        Tirtir Dhammaan (Clear)
                      </button>
                    )}
                  </div>

                  {/* Cart Table */}
                  {cart.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                      <p className="text-xs font-medium">Qaansheegtu waa faaruq.</p>
                      <p className="text-[11px] text-slate-400">Dooro badeeco bidixda ku taal si aad u bilowdo iibka.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-2 font-semibold">Badeecada</th>
                            <th className="pb-2 text-center font-semibold">Tirada</th>
                            <th className="pb-2 text-right font-semibold">Qiimaha</th>
                            <th className="pb-2 text-right font-semibold">Wadarta</th>
                            <th className="pb-2 text-center font-semibold">Ka Saar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cart.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="py-2.5 font-semibold text-slate-800">
                                {item.productName}
                              </td>
                              <td className="py-2.5 text-center font-mono font-bold">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 text-right font-mono text-slate-600">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                              <td className="py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  title="Ka saar qaansheegta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Bottom Checkout Controls */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  {/* Total Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-bold text-slate-700">Wadarta Guud ee Iibka (Total):</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-[#1a7b07]">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>

                  {/* Customer Information & Payment Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Taleefanka Macaamiilka (Customer Phone) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <input
                          id="input-customer-phone"
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 0615123456"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 focus:border-[#1a7b07] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nooca Bixinta (Payment Status) *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
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
                          <span>La Bixiyay (Kaash)</span>
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
                          <Clock className="w-3.5 h-3.5" />
                          <span>Dayn (Credit)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Credit Note (If Dayn selected) */}
                  {paymentStatus === 'CREDIT' && (
                    <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-1.5 animate-in fade-in">
                      <label className="block text-xs font-bold text-amber-900">
                        Faahfaahinta Daynta (Yaa qaatay / Notes) *
                      </label>
                      <input
                        id="input-credit-note"
                        type="text"
                        value={creditNote}
                        onChange={(e) => setCreditNote(e.target.value)}
                        placeholder="e.g. Faadumo Xasan - waxay bixinaysaa dhammaadka bisha"
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 transition"
                      />
                    </div>
                  )}

                  {/* Save Sale Action Button */}
                  <button
                    id="btn-save-sale"
                    type="button"
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={handleSaveSale}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer ${
                      cart.length === 0 || isSubmitting
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-[#1a7b07] hover:bg-[#146205] active:scale-98 text-white'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      {isSubmitting ? 'Waa la keydinayaa...' : 'Xaqiiji & Daabac Qaansheegta (Save & Print)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SALES HISTORY / IIBKII HORE */}
        {/* ============================================================ */}
        {activeTab === 'SALES_HISTORY' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-[#1a7b07]" />
                <h2 className="font-bold text-slate-900 text-sm">
                  Diiwaanka Iibkii Hore ({state.sales.length} Qaansheeg)
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Raadi Invoice # ama Taleefan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1a7b07]/30 transition"
                />
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                <p className="text-xs font-medium">Wax iib ah lama helin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                      <th className="p-3 font-semibold">Qaansheeg #</th>
                      <th className="p-3 font-semibold">Taariikh & Saacad</th>
                      <th className="p-3 font-semibold">Macaamiilka Tel</th>
                      <th className="p-3 font-semibold">Badeecadaha</th>
                      <th className="p-3 text-right font-semibold">Wadarta ($)</th>
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
                          <span className="font-medium">{sale.items.length} nooc</span>
                          <span className="text-slate-400 text-[11px] ml-1">
                            ({sale.items.map(i => `${i.productName} (${i.quantity})`).join(', ')})
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#1a7b07]">
                          {formatCurrency(sale.grandTotal)}
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
                            onClick={() => {
                              setPrintedInvoice(sale);
                              setShowReceiptModal(true);
                            }}
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
        )}

        {/* ============================================================ */}
        {/* TAB 3: STOCK VIEW / KAYDKA ALAABTA (No cost prices!) */}
        {/* ============================================================ */}
        {activeTab === 'STOCK_VIEW' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Package className="w-4 h-4 text-[#1a7b07]" />
              <h2 className="font-bold text-slate-900 text-sm">
                Kaydka 7-da Badeeco ee DHAQAN-KAABA (Current Stock View)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {state.products.map((product) => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock <= product.minStockLevel && product.currentStock > 0;

                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                      isOutOfStock
                        ? 'bg-rose-50/50 border-rose-200'
                        : isLowStock
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {product.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {isOutOfStock ? 'Dhammaaday' : isLowStock ? 'Waa Yaryahay' : 'Waa Diyaar'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">DHAQAN-KAABA Hair Care</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">Tirada Kaydka:</span>
                      <span className={`font-mono text-base font-extrabold ${
                        isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-slate-900'
                      }`}>
                        {product.currentStock} xabbo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Invoice / Receipt Modal */}
      {showReceiptModal && printedInvoice && (
        <InvoiceReceiptModal
          invoice={printedInvoice}
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setPrintedInvoice(null);
          }}
        />
      )}
    </div>
  );
};
