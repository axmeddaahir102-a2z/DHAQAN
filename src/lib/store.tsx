import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppState,
  Product,
  SaleInvoice,
  SaleItem,
  Purchase,
  PurchaseItem,
  Expense,
  CashTransaction,
  AccountsReceivable,
  ReceivablePayment,
  AccountsPayable,
  PayablePayment,
  StockMovement,
  BusinessSettings,
  InitialSetupData,
  UserRole,
} from '../types';
import { DEFAULT_SETTINGS, INITIAL_HAIR_CARE_PRODUCTS, createInitialCleanState } from './initialData';
import { generateId, getTodayDateString, getCurrentTimeString, hashPassword, generateSalt } from './security';

const STORAGE_KEY = 'DHAQAN_KAABA_RETAIL_V2';

interface ProfitReportData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  salesCount: number;
  salesList: SaleInvoice[];
  expensesList: Expense[];
}

interface StoreContextType {
  state: AppState;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (auth: boolean) => void;

  // Sales (Employee & Admin)
  createSale: (saleData: {
    customerPhone: string;
    customerName?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    paymentStatus: 'PAID' | 'CREDIT';
    creditNote?: string;
    createdBy?: UserRole;
  }) => { success: boolean; error?: string; invoice?: SaleInvoice };

  // Purchases (Admin)
  createPurchase: (purchaseData: {
    supplierName?: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    paymentStatus: 'PAID' | 'CREDIT';
    notes?: string;
    date?: string;
  }) => { success: boolean; error?: string; purchase?: Purchase };

  // Expenses (Admin)
  createExpense: (expenseData: {
    category: string;
    description: string;
    amount: number;
    date?: string;
    notes?: string;
  }) => { success: boolean; error?: string; expense?: Expense };

  // Cash Management (Admin)
  addManualCashTransaction: (data: {
    direction: 'IN' | 'OUT';
    amount: number;
    description: string;
    reference?: string;
  }) => { success: boolean; error?: string };

  // Accounts Receivable / Customer Debt (Admin)
  collectReceivablePayment: (data: {
    receivableId: string;
    amount: number;
    notes?: string;
    date?: string;
  }) => { success: boolean; error?: string };

  // Accounts Payable / Supplier Debt (Admin)
  paySupplierDebt: (data: {
    payableId: string;
    amount: number;
    notes?: string;
    date?: string;
  }) => { success: boolean; error?: string };

  // Inventory / Products (Admin)
  adjustProductStock: (productId: string, newStock: number, reason: string) => { success: boolean; error?: string };
  updateProductInfo: (productId: string, costPrice: number, minStockLevel: number) => { success: boolean; error?: string };
  addProduct: (data: { name: string; costPrice: number; initialStock?: number; minStockLevel?: number }) => { success: boolean; error?: string; product?: Product };

  // Initial Setup & Settings
  completeInitialSetup: (setupData: InitialSetupData, newPassword?: string) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  setAdminPassword: (newPassword: string) => Promise<boolean>;

  // Financial Calculators
  getCashBalance: () => number;
  getInventoryValue: () => number;
  getTotalReceivables: () => number;
  getTotalPayables: () => number;
  getProfitReport: (startDate?: string, endDate?: string) => ProfitReportData;

  // Data management
  resetToDefaults: () => void;
  exportBackupJSON: () => string;
  restoreBackupJSON: (jsonString: string) => { success: boolean; error?: string };
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure the 7 standard products exist
        if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
          // If already saved with products, return parsed state
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage', e);
    }
    return createInitialCleanState();
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('OPERATOR');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }, [state]);

  // Cash balance calculation
  const getCashBalance = useCallback((): number => {
    return state.cashTransactions.reduce((acc, tx) => {
      return tx.direction === 'IN' ? acc + tx.amount : acc - tx.amount;
    }, 0);
  }, [state.cashTransactions]);

  // Inventory value calculation
  const getInventoryValue = useCallback((): number => {
    return state.products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  }, [state.products]);

  // Total receivables (money owed to shop)
  const getTotalReceivables = useCallback((): number => {
    return state.accountsReceivable.reduce((acc, ar) => {
      if (ar.status !== 'PAID') {
        return acc + ar.outstandingBalance;
      }
      return acc;
    }, 0);
  }, [state.accountsReceivable]);

  // Total payables (money shop owes)
  const getTotalPayables = useCallback((): number => {
    return state.accountsPayable.reduce((acc, ap) => {
      if (ap.status !== 'PAID') {
        return acc + ap.outstandingBalance;
      }
      return acc;
    }, 0);
  }, [state.accountsPayable]);

  // Profit Report calculation
  const getProfitReport = useCallback((startDate?: string, endDate?: string): ProfitReportData => {
    const filterByDate = (dateStr: string) => {
      if (!startDate && !endDate) return true;
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    };

    const matchingSales = state.sales.filter(s => filterByDate(s.date));
    const matchingExpenses = state.expenses.filter(e => filterByDate(e.date));

    const revenue = matchingSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const cogs = matchingSales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = revenue - cogs;
    const totalExpenses = matchingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      salesCount: matchingSales.length,
      salesList: matchingSales,
      expensesList: matchingExpenses,
    };
  }, [state.sales, state.expenses]);

  // ==========================================
  // CREATE SALE (Fast, Simple, Exact Formula)
  // ==========================================
  const createSale = useCallback((saleData: {
    customerPhone: string;
    customerName?: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
    paymentStatus: 'PAID' | 'CREDIT';
    creditNote?: string;
    createdBy?: UserRole;
  }) => {
    const dateToday = getTodayDateString();
    const timeNow = getCurrentTimeString();
    const role = saleData.createdBy || currentUserRole;

    if (!saleData.items || saleData.items.length === 0) {
      return { success: false, error: 'Fadlan ku dar ugu yaraan hal badeeco qaansheegta.' };
    }

    if (!saleData.customerPhone || saleData.customerPhone.trim() === '') {
      return { success: false, error: 'Fadlan geli lambarka taleefanka macaamiilka.' };
    }

    // Verify stock availability
    for (const item of saleData.items) {
      const prod = state.products.find(p => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Badeecada lama helin.` };
      }
      if (item.quantity <= 0) {
        return { success: false, error: `Tirada ${prod.name} waa inay ka weynaataa eber.` };
      }
      if (item.unitPrice < 0 || isNaN(item.unitPrice)) {
        return { success: false, error: `Qiimaha iibka ee ${prod.name} ma noqon karo wax ka yar eber.` };
      }
      if (prod.currentStock < item.quantity) {
        return {
          success: false,
          error: `Kaydka ${prod.name} kuma filna! Kaydka yaala: ${prod.currentStock} xabbo, Tirada aad rabto: ${item.quantity} xabbo.`,
        };
      }
    }

    // Generate Invoice number
    const seq = state.settings.nextInvoiceNumber;
    const invNumber = `${state.settings.invoicePrefix}${String(seq).padStart(5, '0')}`;

    // Process line items & COGS
    let subtotal = 0;
    let totalCost = 0;
    const saleItems: SaleItem[] = [];

    for (const item of saleData.items) {
      const prod = state.products.find(p => p.id === item.productId)!;
      const unitCost = prod.costPrice; // Cost at time of sale
      const unitPrice = item.unitPrice; // Selling price entered at sale
      const lineTotal = item.quantity * unitPrice;
      const lineCostTotal = item.quantity * unitCost;
      const lineProfit = lineTotal - lineCostTotal;

      subtotal += lineTotal;
      totalCost += lineCostTotal;

      saleItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitCost,
        unitPrice,
        lineTotal,
        lineCostTotal,
        lineProfit,
      });
    }

    const grandTotal = subtotal;
    const grossProfit = grandTotal - totalCost;
    const isPaid = saleData.paymentStatus === 'PAID';

    const invoiceId = generateId('inv_');
    const newInvoice: SaleInvoice = {
      id: invoiceId,
      invoiceNumber: invNumber,
      date: dateToday,
      time: timeNow,
      customerPhone: saleData.customerPhone.trim(),
      customerName: saleData.customerName?.trim() || '',
      items: saleItems,
      subtotal,
      grandTotal,
      totalCost,
      grossProfit,
      paymentStatus: saleData.paymentStatus,
      creditNote: saleData.creditNote?.trim(),
      createdBy: role,
      createdAt: `${dateToday} ${timeNow}`,
    };

    // Update Product Stock & Stock Movement records
    const newStockMovements: StockMovement[] = [];
    const updatedProducts = state.products.map(prod => {
      const foundItem = saleItems.find(i => i.productId === prod.id);
      if (foundItem) {
        const prevStock = prod.currentStock;
        const newStock = prevStock - foundItem.quantity;

        newStockMovements.push({
          id: generateId('sm_'),
          productId: prod.id,
          productName: prod.name,
          date: dateToday,
          time: timeNow,
          transactionType: 'SALE',
          referenceNumber: invNumber,
          quantityIn: 0,
          quantityOut: foundItem.quantity,
          previousStock: prevStock,
          currentStock: newStock,
          notes: `Iibka ${invNumber} (${saleData.customerPhone})`,
          createdAt: `${dateToday} ${timeNow}`,
        });

        return {
          ...prod,
          currentStock: newStock,
          updatedAt: `${dateToday} ${timeNow}`,
        };
      }
      return prod;
    });

    // If Paid: Increase Cash
    let newCashTransactions = [...state.cashTransactions];
    if (isPaid && grandTotal > 0) {
      const currentCash = getCashBalance();
      const newCashTx: CashTransaction = {
        id: generateId('ctx_'),
        date: dateToday,
        time: timeNow,
        type: 'SALE_INFLOW',
        direction: 'IN',
        amount: grandTotal,
        description: `Dakhliga Iibka ${invNumber} (${saleData.customerPhone})`,
        reference: invNumber,
        runningBalance: currentCash + grandTotal,
        createdAt: `${dateToday} ${timeNow}`,
      };
      newCashTransactions = [newCashTx, ...newCashTransactions];
    }

    // If Credit: Create Accounts Receivable record
    let newAccountsReceivable = [...state.accountsReceivable];
    if (!isPaid && grandTotal > 0) {
      const arRecord: AccountsReceivable = {
        id: generateId('ar_'),
        customerPhone: saleData.customerPhone.trim(),
        customerName: saleData.customerName?.trim() || '',
        saleId: invoiceId,
        invoiceNumber: invNumber,
        originalAmount: grandTotal,
        amountPaid: 0,
        outstandingBalance: grandTotal,
        date: dateToday,
        status: 'OUTSTANDING',
        description: saleData.creditNote || `Dayn iibka ${invNumber}`,
        createdAt: `${dateToday} ${timeNow}`,
      };
      newAccountsReceivable = [arRecord, ...newAccountsReceivable];
    }

    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        nextInvoiceNumber: prev.settings.nextInvoiceNumber + 1,
      },
      products: updatedProducts,
      sales: [newInvoice, ...prev.sales],
      cashTransactions: newCashTransactions,
      accountsReceivable: newAccountsReceivable,
      stockMovements: [...newStockMovements, ...prev.stockMovements],
    }));

    return { success: true, invoice: newInvoice };
  }, [state, currentUserRole, getCashBalance]);

  // ==========================================
  // PURCHASES / ALAAB SOO GELIN (Admin)
  // ==========================================
  const createPurchase = useCallback((purchaseData: {
    supplierName?: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    paymentStatus: 'PAID' | 'CREDIT';
    notes?: string;
    date?: string;
  }) => {
    const dateToday = purchaseData.date || getTodayDateString();
    const timeNow = getCurrentTimeString();

    if (!purchaseData.items || purchaseData.items.length === 0) {
      return { success: false, error: 'Fadlan ku dar ugu yaraan hal badeeco.' };
    }

    let totalCost = 0;
    const purchaseItems: PurchaseItem[] = [];

    for (const item of purchaseData.items) {
      const prod = state.products.find(p => p.id === item.productId);
      if (!prod) return { success: false, error: 'Badeecada lama helin.' };
      if (item.quantity <= 0) return { success: false, error: 'Tirada waa inay ka weynaataa eber.' };
      if (item.unitCost < 0) return { success: false, error: 'Qiimaha ma noqon karo wax ka yar eber.' };

      const lineTotal = item.quantity * item.unitCost;
      totalCost += lineTotal;

      purchaseItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: lineTotal,
      });
    }

    const seq = state.settings.nextPurchaseNumber;
    const purNumber = `${state.settings.purchasePrefix}${String(seq).padStart(5, '0')}`;
    const purchaseId = generateId('pur_');

    const newPurchase: Purchase = {
      id: purchaseId,
      purchaseNumber: purNumber,
      date: dateToday,
      supplierName: purchaseData.supplierName?.trim() || 'Qaybiye',
      items: purchaseItems,
      totalCost,
      paymentStatus: purchaseData.paymentStatus,
      notes: purchaseData.notes?.trim(),
      createdAt: `${dateToday} ${timeNow}`,
    };

    // Update Product Stock and Cost Price
    const newStockMovements: StockMovement[] = [];
    const updatedProducts = state.products.map(prod => {
      const foundItem = purchaseItems.find(i => i.productId === prod.id);
      if (foundItem) {
        const prevStock = prod.currentStock;
        const newStock = prevStock + foundItem.quantity;

        newStockMovements.push({
          id: generateId('sm_'),
          productId: prod.id,
          productName: prod.name,
          date: dateToday,
          time: timeNow,
          transactionType: 'PURCHASE',
          referenceNumber: purNumber,
          quantityIn: foundItem.quantity,
          quantityOut: 0,
          previousStock: prevStock,
          currentStock: newStock,
          notes: `Soo gelinta ${purNumber} (${purchaseData.supplierName || 'Qaybiye'})`,
          createdAt: `${dateToday} ${timeNow}`,
        });

        return {
          ...prod,
          costPrice: foundItem.unitCost, // Update latest cost price
          currentStock: newStock,
          updatedAt: `${dateToday} ${timeNow}`,
        };
      }
      return prod;
    });

    // If Paid: Decrease Cash
    let newCashTransactions = [...state.cashTransactions];
    if (purchaseData.paymentStatus === 'PAID' && totalCost > 0) {
      const currentCash = getCashBalance();
      const newCashTx: CashTransaction = {
        id: generateId('ctx_'),
        date: dateToday,
        time: timeNow,
        type: 'PURCHASE_OUTFLOW',
        direction: 'OUT',
        amount: totalCost,
        description: `Iibsiga Alaabta ${purNumber} (${purchaseData.supplierName || 'Qaybiye'})`,
        reference: purNumber,
        runningBalance: currentCash - totalCost,
        createdAt: `${dateToday} ${timeNow}`,
      };
      newCashTransactions = [newCashTx, ...newCashTransactions];
    }

    // If Credit: Increase Accounts Payable
    let newAccountsPayable = [...state.accountsPayable];
    if (purchaseData.paymentStatus === 'CREDIT' && totalCost > 0) {
      const apRecord: AccountsPayable = {
        id: generateId('ap_'),
        supplierName: purchaseData.supplierName?.trim() || 'Qaybiye',
        purchaseId: purchaseId,
        purchaseNumber: purNumber,
        originalAmount: totalCost,
        amountPaid: 0,
        outstandingBalance: totalCost,
        date: dateToday,
        status: 'OUTSTANDING',
        description: purchaseData.notes || `Dayn badeeco ${purNumber}`,
        createdAt: `${dateToday} ${timeNow}`,
      };
      newAccountsPayable = [apRecord, ...newAccountsPayable];
    }

    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        nextPurchaseNumber: prev.settings.nextPurchaseNumber + 1,
      },
      products: updatedProducts,
      purchases: [newPurchase, ...prev.purchases],
      cashTransactions: newCashTransactions,
      accountsPayable: newAccountsPayable,
      stockMovements: [...newStockMovements, ...prev.stockMovements],
    }));

    return { success: true, purchase: newPurchase };
  }, [state, getCashBalance]);

  // ==========================================
  // EXPENSES / KHARASHAADKA (Admin)
  // ==========================================
  const createExpense = useCallback((expenseData: {
    category: string;
    description: string;
    amount: number;
    date?: string;
    notes?: string;
  }) => {
    const dateToday = expenseData.date || getTodayDateString();
    const timeNow = getCurrentTimeString();

    if (expenseData.amount <= 0) {
      return { success: false, error: 'Lacagta kharashka waa inay ka weynaataa eber.' };
    }
    if (!expenseData.description.trim()) {
      return { success: false, error: 'Fadlan qor faahfaahinta kharashka.' };
    }

    const expenseId = generateId('exp_');
    const newExpense: Expense = {
      id: expenseId,
      date: dateToday,
      category: expenseData.category,
      description: expenseData.description.trim(),
      amount: expenseData.amount,
      notes: expenseData.notes?.trim(),
      createdAt: `${dateToday} ${timeNow}`,
    };

    // Decrease Cash
    const currentCash = getCashBalance();
    const newCashTx: CashTransaction = {
      id: generateId('ctx_'),
      date: dateToday,
      time: timeNow,
      type: 'EXPENSE_OUTFLOW',
      direction: 'OUT',
      amount: expenseData.amount,
      description: `Kharash: ${expenseData.category} - ${expenseData.description.trim()}`,
      runningBalance: currentCash - expenseData.amount,
      createdAt: `${dateToday} ${timeNow}`,
    };

    setState(prev => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      cashTransactions: [newCashTx, ...prev.cashTransactions],
    }));

    return { success: true, expense: newExpense };
  }, [getCashBalance]);

  // ==========================================
  // MANUAL CASH TRANSACTIONS (Admin)
  // ==========================================
  const addManualCashTransaction = useCallback((data: {
    direction: 'IN' | 'OUT';
    amount: number;
    description: string;
    reference?: string;
  }) => {
    const dateToday = getTodayDateString();
    const timeNow = getCurrentTimeString();

    if (data.amount <= 0) {
      return { success: false, error: 'Lacagta waa inay ka weynaataa eber.' };
    }
    if (!data.description.trim()) {
      return { success: false, error: 'Fadlan qor sababta lacagta.' };
    }

    const currentCash = getCashBalance();
    const newBalance = data.direction === 'IN' ? currentCash + data.amount : currentCash - data.amount;

    const newTx: CashTransaction = {
      id: generateId('ctx_'),
      date: dateToday,
      time: timeNow,
      type: data.direction === 'IN' ? 'MANUAL_CASH_IN' : 'MANUAL_CASH_OUT',
      direction: data.direction,
      amount: data.amount,
      description: data.description.trim(),
      reference: data.reference?.trim(),
      runningBalance: newBalance,
      createdAt: `${dateToday} ${timeNow}`,
    };

    setState(prev => ({
      ...prev,
      cashTransactions: [newTx, ...prev.cashTransactions],
    }));

    return { success: true };
  }, [getCashBalance]);

  // ==========================================
  // COLLECT RECEIVABLE DEBT (Admin)
  // ==========================================
  const collectReceivablePayment = useCallback((data: {
    receivableId: string;
    amount: number;
    notes?: string;
    date?: string;
  }) => {
    const dateToday = data.date || getTodayDateString();
    const timeNow = getCurrentTimeString();

    const ar = state.accountsReceivable.find(r => r.id === data.receivableId);
    if (!ar) return { success: false, error: 'Diiwaanka deynta lama helin.' };
    if (data.amount <= 0) return { success: false, error: 'Lacagtu waa inay ka weynaataa eber.' };
    if (data.amount > ar.outstandingBalance) {
      return { success: false, error: 'Lacagtu kama badnaan karto baaqiga deynta hadhay.' };
    }

    const newPaid = ar.amountPaid + data.amount;
    const newBalance = ar.originalAmount - newPaid;
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    const paymentRecord: ReceivablePayment = {
      id: generateId('recpay_'),
      receivableId: ar.id,
      amount: data.amount,
      date: dateToday,
      notes: data.notes?.trim(),
      createdAt: `${dateToday} ${timeNow}`,
    };

    // Increase Cash
    const currentCash = getCashBalance();
    const cashTx: CashTransaction = {
      id: generateId('ctx_'),
      date: dateToday,
      time: timeNow,
      type: 'RECEIVABLE_COLLECTION',
      direction: 'IN',
      amount: data.amount,
      description: `Qabashada Daynta: ${ar.customerPhone} (Qaansheegta: ${ar.invoiceNumber || 'Hore'})`,
      reference: ar.invoiceNumber,
      runningBalance: currentCash + data.amount,
      createdAt: `${dateToday} ${timeNow}`,
    };

    setState(prev => ({
      ...prev,
      accountsReceivable: prev.accountsReceivable.map(r => r.id === ar.id ? {
        ...r,
        amountPaid: newPaid,
        outstandingBalance: newBalance,
        status: newStatus,
      } : r),
      receivablePayments: [paymentRecord, ...prev.receivablePayments],
      cashTransactions: [cashTx, ...prev.cashTransactions],
    }));

    return { success: true };
  }, [state.accountsReceivable, getCashBalance]);

  // ==========================================
  // PAY SUPPLIER DEBT (Admin)
  // ==========================================
  const paySupplierDebt = useCallback((data: {
    payableId: string;
    amount: number;
    notes?: string;
    date?: string;
  }) => {
    const dateToday = data.date || getTodayDateString();
    const timeNow = getCurrentTimeString();

    const ap = state.accountsPayable.find(p => p.id === data.payableId);
    if (!ap) return { success: false, error: 'Diiwaanka deynta shirkadda lama helin.' };
    if (data.amount <= 0) return { success: false, error: 'Lacagtu waa inay ka weynaataa eber.' };
    if (data.amount > ap.outstandingBalance) {
      return { success: false, error: 'Lacagtu kama badnaan karto deynta laguugu leeyahay.' };
    }

    const newPaid = ap.amountPaid + data.amount;
    const newBalance = ap.originalAmount - newPaid;
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    const paymentRecord: PayablePayment = {
      id: generateId('paypmt_'),
      payableId: ap.id,
      amount: data.amount,
      date: dateToday,
      notes: data.notes?.trim(),
      createdAt: `${dateToday} ${timeNow}`,
    };

    // Decrease Cash
    const currentCash = getCashBalance();
    const cashTx: CashTransaction = {
      id: generateId('ctx_'),
      date: dateToday,
      time: timeNow,
      type: 'SUPPLIER_PAYMENT',
      direction: 'OUT',
      amount: data.amount,
      description: `Bixinta Daynta Qaybiyaha: ${ap.supplierName} (${ap.purchaseNumber || 'Hore'})`,
      reference: ap.purchaseNumber,
      runningBalance: currentCash - data.amount,
      createdAt: `${dateToday} ${timeNow}`,
    };

    setState(prev => ({
      ...prev,
      accountsPayable: prev.accountsPayable.map(p => p.id === ap.id ? {
        ...p,
        amountPaid: newPaid,
        outstandingBalance: newBalance,
        status: newStatus,
      } : p),
      payablePayments: [paymentRecord, ...prev.payablePayments],
      cashTransactions: [cashTx, ...prev.cashTransactions],
    }));

    return { success: true };
  }, [state.accountsPayable, getCashBalance]);

  // ==========================================
  // INVENTORY ADJUSTMENT & PRODUCT MASTER (Admin)
  // ==========================================
  const adjustProductStock = useCallback((productId: string, newStock: number, reason: string) => {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return { success: false, error: 'Badeecada lama helin.' };
    if (newStock < 0) return { success: false, error: 'Tirada cusub ma noqon karto mid ka yar eber.' };

    const dateToday = getTodayDateString();
    const timeNow = getCurrentTimeString();
    const diff = newStock - prod.currentStock;
    if (diff === 0) return { success: true };

    const movType = diff > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    const movement: StockMovement = {
      id: generateId('sm_'),
      productId: prod.id,
      productName: prod.name,
      date: dateToday,
      time: timeNow,
      transactionType: movType,
      quantityIn: diff > 0 ? diff : 0,
      quantityOut: diff < 0 ? Math.abs(diff) : 0,
      previousStock: prod.currentStock,
      currentStock: newStock,
      notes: reason || 'Saxitaanka Kaydka (Stock Adjustment)',
      createdAt: `${dateToday} ${timeNow}`,
    };

    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? {
        ...p,
        currentStock: newStock,
        updatedAt: `${dateToday} ${timeNow}`,
      } : p),
      stockMovements: [movement, ...prev.stockMovements],
    }));

    return { success: true };
  }, [state.products]);

  const updateProductInfo = useCallback((productId: string, costPrice: number, minStockLevel: number) => {
    if (costPrice < 0) return { success: false, error: 'Qiimaha ma noqon karo mid ka yar eber.' };

    const dateToday = getTodayDateString();
    const timeNow = getCurrentTimeString();

    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? {
        ...p,
        costPrice,
        minStockLevel: minStockLevel >= 0 ? minStockLevel : p.minStockLevel,
        updatedAt: `${dateToday} ${timeNow}`,
      } : p),
    }));

    return { success: true };
  }, []);

  const addProduct = useCallback((data: { name: string; costPrice: number; initialStock?: number; minStockLevel?: number }) => {
    if (!data.name.trim()) return { success: false, error: 'Fadlan qor magaca badeecada.' };
    if (data.costPrice < 0) return { success: false, error: 'Qiimaha ma noqon karo wax ka yar eber.' };

    const dateToday = getTodayDateString();
    const timeNow = getCurrentTimeString();
    const initialQty = data.initialStock || 0;

    const newProd: Product = {
      id: generateId('prod_'),
      name: data.name.trim(),
      costPrice: data.costPrice,
      currentStock: initialQty,
      minStockLevel: data.minStockLevel || 5,
      active: true,
      createdAt: `${dateToday} ${timeNow}`,
      updatedAt: `${dateToday} ${timeNow}`,
    };

    let newMovements = [...state.stockMovements];
    if (initialQty > 0) {
      newMovements = [{
        id: generateId('sm_'),
        productId: newProd.id,
        productName: newProd.name,
        date: dateToday,
        time: timeNow,
        transactionType: 'OPENING',
        quantityIn: initialQty,
        quantityOut: 0,
        previousStock: 0,
        currentStock: initialQty,
        notes: 'Kayd Bilow',
        createdAt: `${dateToday} ${timeNow}`,
      }, ...newMovements];
    }

    setState(prev => ({
      ...prev,
      products: [...prev.products, newProd],
      stockMovements: newMovements,
    }));

    return { success: true, product: newProd };
  }, [state.stockMovements]);

  // ==========================================
  // INITIAL SETUP WIZARD (Admin)
  // ==========================================
  const completeInitialSetup = useCallback(async (setupData: InitialSetupData, newPassword?: string) => {
    const dateToday = getTodayDateString();
    const timeNow = getCurrentTimeString();

    // 1. Password hashing
    let passwordHash = state.settings.adminPasswordHash;
    let passwordSalt = state.settings.adminSalt;

    if (newPassword && newPassword.trim().length >= 4) {
      passwordSalt = generateSalt();
      passwordHash = await hashPassword(newPassword.trim(), passwordSalt);
    } else if (!passwordHash) {
      // default initial admin password is "admin"
      passwordSalt = generateSalt();
      passwordHash = await hashPassword('admin', passwordSalt);
    }

    // 2. Set opening cash
    const cashTxs: CashTransaction[] = [];
    if (setupData.openingCash > 0) {
      cashTxs.push({
        id: generateId('ctx_'),
        date: dateToday,
        time: timeNow,
        type: 'OPENING_BALANCE',
        direction: 'IN',
        amount: setupData.openingCash,
        description: 'Kaashka Bilowga Ganacsiga (Opening Cash)',
        runningBalance: setupData.openingCash,
        createdAt: `${dateToday} ${timeNow}`,
      });
    }

    // 3. Set opening product stock
    const stockMovements: StockMovement[] = [];
    const updatedProducts = state.products.map(p => {
      const stock = setupData.productStocks[p.id] !== undefined ? setupData.productStocks[p.id] : p.currentStock;
      if (stock > 0) {
        stockMovements.push({
          id: generateId('sm_'),
          productId: p.id,
          productName: p.name,
          date: dateToday,
          time: timeNow,
          transactionType: 'OPENING',
          quantityIn: stock,
          quantityOut: 0,
          previousStock: 0,
          currentStock: stock,
          notes: 'Kaydka Bilowga (Opening Stock Setup)',
          createdAt: `${dateToday} ${timeNow}`,
        });
      }
      return {
        ...p,
        currentStock: stock,
        updatedAt: `${dateToday} ${timeNow}`,
      };
    });

    // 4. Set opening Accounts Receivable
    const receivables: AccountsReceivable[] = [];
    if (setupData.openingReceivable > 0) {
      receivables.push({
        id: generateId('ar_'),
        customerPhone: setupData.openingReceivablePhone?.trim() || 'Macaamiil Hore',
        customerName: 'Dayn Hore',
        originalAmount: setupData.openingReceivable,
        amountPaid: 0,
        outstandingBalance: setupData.openingReceivable,
        date: dateToday,
        status: 'OUTSTANDING',
        description: setupData.openingReceivableNote || 'Dayn hore oo macaamiil lagu lahaa',
        createdAt: `${dateToday} ${timeNow}`,
      });
    }

    // 5. Set opening Accounts Payable
    const payables: AccountsPayable[] = [];
    if (setupData.openingPayable > 0) {
      payables.push({
        id: generateId('ap_'),
        supplierName: setupData.openingPayableSupplier?.trim() || 'Qaybiye Hore',
        originalAmount: setupData.openingPayable,
        amountPaid: 0,
        outstandingBalance: setupData.openingPayable,
        date: dateToday,
        status: 'OUTSTANDING',
        description: setupData.openingPayableNote || 'Dayn hore oo qaybiye lagu lahaa',
        createdAt: `${dateToday} ${timeNow}`,
      });
    }

    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        hasCompletedSetup: true,
        adminPasswordHash: passwordHash,
        adminSalt: passwordSalt,
      },
      products: updatedProducts,
      cashTransactions: [...cashTxs, ...prev.cashTransactions],
      accountsReceivable: [...receivables, ...prev.accountsReceivable],
      accountsPayable: [...payables, ...prev.accountsPayable],
      stockMovements: [...stockMovements, ...prev.stockMovements],
    }));

    return { success: true };
  }, [state]);

  const updateSettings = useCallback((newSettings: Partial<BusinessSettings>) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  }, []);

  const setAdminPassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!newPassword || newPassword.trim().length < 4) return false;
    const salt = generateSalt();
    const hash = await hashPassword(newPassword.trim(), salt);
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        adminPasswordHash: hash,
        adminSalt: salt,
      },
    }));
    return true;
  }, []);

  const resetToDefaults = useCallback(() => {
    const clean = createInitialCleanState();
    setState(clean);
    setIsAdminAuthenticated(false);
    setCurrentUserRole('OPERATOR');
  }, []);

  const exportBackupJSON = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const restoreBackupJSON = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.settings || !Array.isArray(parsed.products)) {
        return { success: false, error: 'Xogta faylku maaha mid sax ah.' };
      }
      setState(parsed);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Faylka JSON waa khaldan yahay.' };
    }
  }, []);

  return (
    <StoreContext.Provider
      value={{
        state,
        currentUserRole,
        setCurrentUserRole,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        createSale,
        createPurchase,
        createExpense,
        addManualCashTransaction,
        collectReceivablePayment,
        paySupplierDebt,
        adjustProductStock,
        updateProductInfo,
        addProduct,
        completeInitialSetup,
        updateSettings,
        setAdminPassword,
        getCashBalance,
        getInventoryValue,
        getTotalReceivables,
        getTotalPayables,
        getProfitReport,
        resetToDefaults,
        exportBackupJSON,
        restoreBackupJSON,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
