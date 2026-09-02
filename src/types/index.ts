// Types for DHAQAN-KAABA Hair-Care Retail Management System

export type UserRole = 'OPERATOR' | 'ADMIN';

export type PaymentStatus = 'PAID' | 'CREDIT';

export type DebtStatus = 'OUTSTANDING' | 'PARTIALLY_PAID' | 'PAID';

export type StockMovementType = 
  | 'OPENING' 
  | 'SALE' 
  | 'PURCHASE' 
  | 'ADJUSTMENT_IN' 
  | 'ADJUSTMENT_OUT';

export type CashDirection = 'IN' | 'OUT';

export type CashTxType = 
  | 'OPENING_BALANCE'
  | 'SALE_INFLOW'
  | 'RECEIVABLE_COLLECTION'
  | 'MANUAL_CASH_IN'
  | 'PURCHASE_OUTFLOW'
  | 'EXPENSE_OUTFLOW'
  | 'SUPPLIER_PAYMENT'
  | 'MANUAL_CASH_OUT';

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  currentStock: number;
  minStockLevel: number;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number; // Cost price at time of sale (for COGS)
  unitPrice: number; // Selling price entered at sale time
  lineTotal: number; // quantity * unitPrice
  lineCostTotal: number; // quantity * unitCost
  lineProfit: number; // lineTotal - lineCostTotal
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  customerPhone: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  grandTotal: number;
  totalCost: number; // COGS
  grossProfit: number; // grandTotal - totalCost
  paymentStatus: 'PAID' | 'CREDIT';
  creditNote?: string;
  createdBy: UserRole;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  date: string;
  supplierName?: string;
  items: PurchaseItem[];
  totalCost: number;
  paymentStatus: 'PAID' | 'CREDIT';
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string; // Rent, Transport, Electricity, Salary, Internet, Maintenance, Other
  description: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface CashTransaction {
  id: string;
  date: string;
  time: string;
  type: CashTxType;
  direction: CashDirection;
  amount: number;
  description: string;
  reference?: string;
  runningBalance: number;
  createdAt: string;
}

export interface AccountsReceivable {
  id: string;
  customerPhone: string;
  customerName?: string;
  saleId?: string;
  invoiceNumber?: string;
  originalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  date: string;
  status: DebtStatus;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface ReceivablePayment {
  id: string;
  receivableId: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface AccountsPayable {
  id: string;
  supplierName: string;
  purchaseId?: string;
  purchaseNumber?: string;
  originalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  date: string;
  status: DebtStatus;
  description?: string;
  notes?: string;
  createdAt: string;
}

export interface PayablePayment {
  id: string;
  payableId: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  date: string;
  time: string;
  transactionType: StockMovementType;
  referenceNumber?: string;
  quantityIn: number;
  quantityOut: number;
  previousStock: number;
  currentStock: number;
  notes?: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  phone: string;
  address: string;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  purchasePrefix: string;
  nextInvoiceNumber: number;
  nextPurchaseNumber: number;
  receiptFooterNote: string;
  hasCompletedSetup: boolean;
  adminPasswordHash: string;
  adminSalt: string;
}

export interface InitialSetupData {
  openingCash: number;
  productStocks: { [productId: string]: number };
  openingReceivable: number;
  openingReceivablePhone?: string;
  openingReceivableNote?: string;
  openingPayable: number;
  openingPayableSupplier?: string;
  openingPayableNote?: string;
}

export interface AppState {
  settings: BusinessSettings;
  products: Product[];
  sales: SaleInvoice[];
  purchases: Purchase[];
  expenses: Expense[];
  cashTransactions: CashTransaction[];
  accountsReceivable: AccountsReceivable[];
  receivablePayments: ReceivablePayment[];
  accountsPayable: AccountsPayable[];
  payablePayments: PayablePayment[];
  stockMovements: StockMovement[];
}
