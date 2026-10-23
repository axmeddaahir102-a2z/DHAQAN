import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from '../types';

// Storage keys for optional browser-side override (useful for 2nd computer or instant setup)
const LOCAL_URL_KEY = 'DHAQAN_KAABA_SUPABASE_URL';
const LOCAL_ANON_KEY = 'DHAQAN_KAABA_SUPABASE_ANON_KEY';

/**
 * Get active Supabase URL (prioritizing VITE_SUPABASE_URL, falling back to localStorage)
 */
export const getActiveSupabaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().startsWith('https://')) {
    return envUrl.trim();
  }
  try {
    const local = localStorage.getItem(LOCAL_URL_KEY);
    if (local && local.trim().startsWith('https://')) {
      return local.trim();
    }
  } catch {}
  return '';
};

/**
 * Get active Supabase Key (prioritizing VITE_SUPABASE_ANON_KEY, falling back to localStorage)
 */
export const getActiveSupabaseKey = (): string => {
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 10) {
    return envKey.trim();
  }
  try {
    const local = localStorage.getItem(LOCAL_ANON_KEY);
    if (local && local.trim().length > 10) {
      return local.trim();
    }
  } catch {}
  return '';
};

export const supabaseUrl = getActiveSupabaseUrl();
export const supabaseAnonKey = getActiveSupabaseKey();


/**
 * Check if the provided key is a Publishable Key (or standard anon key)
 * Accepts:
 *  - new format starting with "sb_publishable_"
 *  - standard JWT anon key starting with "eyJ"
 * Rejects:
 *  - secret keys (sb_secret_*, service_role)
 */
export const validatePublishableKey = (key: string): { valid: boolean; error?: string } => {
  const cleanKey = key.trim();
  if (!cleanKey) {
    return { valid: false, error: 'Fadlan geli Publishable / Anon Key.' };
  }

  // Strictly block secret keys
  if (cleanKey.startsWith('sb_secret_') || cleanKey.toLowerCase().includes('service_role')) {
    return {
      valid: false,
      error: 'DIGNIIN AMNI: Ha gelin Secret Key ama service_role key halkan! Isticmaal kaliya Publishable Key (sb_publishable_...) ama Anon Key.',
    };
  }

  // Must be sb_publishable_ or JWT format with reasonable length
  if (cleanKey.startsWith('sb_publishable_') || cleanKey.startsWith('eyJ') || cleanKey.length >= 20) {
    return { valid: true };
  }

  return {
    valid: false,
    error: 'Furaha la geliyay qaabkiisu ma saxna. Waa inuu noqdaa Publishable Key (sb_publishable_...) ama Anon Key.',
  };
};

/**
 * Save custom configuration to browser local storage
 */
export const saveCustomSupabaseConfig = (url: string, key: string): { success: boolean; error?: string } => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
    return { success: false, error: 'URL-ku waa inuu ku bilaabmaa https:// oo uu ku dhammaadaa .supabase.co' };
  }

  const keyCheck = validatePublishableKey(cleanKey);
  if (!keyCheck.valid) {
    return { success: false, error: keyCheck.error };
  }

  try {
    localStorage.setItem(LOCAL_URL_KEY, cleanUrl);
    localStorage.setItem(LOCAL_ANON_KEY, cleanKey);
    // Reinitialize singleton client
    initSupabaseClient();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Qalad ayaa dhacay marka la keydinayay' };
  }
};

/**
 * Remove custom browser configuration
 */
export const clearCustomSupabaseConfig = () => {
  try {
    localStorage.removeItem(LOCAL_URL_KEY);
    localStorage.removeItem(LOCAL_ANON_KEY);
    initSupabaseClient();
  } catch {}
};

/**
 * Check if Supabase credentials are configured
 */
export const isSupabaseConfigured = (): boolean => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseKey();
  return Boolean(url && key && validatePublishableKey(key).valid);
};

// Internal client instance
let currentClient: SupabaseClient | null = null;

export const initSupabaseClient = (): SupabaseClient | null => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseKey();

  if (url && key && validatePublishableKey(key).valid) {
    try {
      currentClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      return currentClient;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      currentClient = null;
    }
  } else {
    currentClient = null;
  }
  return null;
};

// Export singleton client
export const getSupabase = (): SupabaseClient | null => {
  if (!currentClient) {
    return initSupabaseClient();
  }
  return currentClient;
};

// Initial setup
initSupabaseClient();

/**
 * Test live connectivity to Supabase without altering data
 */
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
  url?: string;
  tablesExist?: boolean;
}> => {
  const url = getActiveSupabaseUrl();
  const client = getSupabase();

  if (!isSupabaseConfigured() || !client) {
    return {
      connected: false,
      message: 'Xogta Supabase lama helin. Fadlan hubi VITE_SUPABASE_URL iyo VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    // Try to query products table
    const { error: productsError } = await client.from('products').select('id').limit(1);

    if (!productsError) {
      return {
        connected: true,
        message: 'Guul! Mashruuca Supabase wuu ku xiran yahay, table-ka "products" iyo database-kuna waa diyaar.',
        url,
        tablesExist: true,
      };
    }

    // Table does not exist (PGRST204 or 42P01)
    if (productsError.code === '42P01' || productsError.code === 'PGRST204' || productsError.message.includes('does not exist')) {
      return {
        connected: true,
        message: 'Guul! Mashruuca Supabase wuu shaqaynayaa oo furahaagu waa sax, laakiin tables-ka weli laguma dhex abuurin Supabase (SQL Editor-ka ku shub).',
        url,
        tablesExist: false,
      };
    }

    // Authentication failure
    if (productsError.code === 'PGRST301' || productsError.message.includes('JWT') || productsError.message.includes('apikey')) {
      return {
        connected: false,
        message: `Khalad Publishable/Anon Key: ${productsError.message}`,
        url,
      };
    }

    return {
      connected: true,
      message: `Ku xirnaantu waa guul (${productsError.message || 'diyaar'}).`,
      url,
      tablesExist: false,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Lama xiriiri karin Supabase.',
    };
  }
};

/**
 * Idempotent Data Migration:
 * Uploads local data to Supabase using upsert (ON CONFLICT id DO UPDATE)
 * Guarantees NO DUPLICATES and DOES NOT delete anything locally.
 */
export const migrateLocalDataToSupabase = async (
  localState: AppState,
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; message: string; details?: Record<string, number> }> => {
  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Supabase ma xirna. Fadlan marka hore geli URL-ka iyo Furaha.' };
  }

  try {
    onProgress?.('Waxaa la diyaarinayaa badeecadaha...');
    const stats: Record<string, number> = {};

    // 1. Products (Upsert by id)
    if (localState.products && localState.products.length > 0) {
      const dbProducts = localState.products.map((p) => ({
        id: p.id,
        name: p.name,
        cost_price: p.costPrice,
        current_stock: p.currentStock,
        min_stock_level: p.minStockLevel,
        active: p.active,
        notes: p.notes || null,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }));

      const { error: prodErr } = await client.from('products').upsert(dbProducts, { onConflict: 'id' });
      if (prodErr) throw new Error(`Badeecadaha: ${prodErr.message}`);
      stats.products = dbProducts.length;
    }

    // 2. Settings
    if (localState.settings) {
      onProgress?.('Waxaa la dirayaa habaynta dukaanka...');
      const dbSettings = {
        id: 'settings_default',
        business_name: localState.settings.businessName,
        phone: localState.settings.phone,
        address: localState.settings.address,
        currency: localState.settings.currency,
        currency_symbol: localState.settings.currencySymbol,
        invoice_prefix: localState.settings.invoicePrefix,
        purchase_prefix: localState.settings.purchasePrefix,
        next_invoice_number: localState.settings.nextInvoiceNumber,
        next_purchase_number: localState.settings.nextPurchaseNumber,
        receipt_footer_note: localState.settings.receiptFooterNote,
        has_completed_setup: localState.settings.hasCompletedSetup,
        admin_password_hash: localState.settings.adminPasswordHash,
        admin_salt: localState.settings.adminSalt,
        updated_at: new Date().toISOString(),
      };
      await client.from('business_settings').upsert(dbSettings, { onConflict: 'id' });
      stats.settings = 1;
    }

    // 3. Sales & Sale Items
    if (localState.sales && localState.sales.length > 0) {
      onProgress?.('Waxaa la dirayaa qaansheegyada iibka...');
      const dbSales = localState.sales.map((s) => ({
        id: s.id,
        invoice_number: s.invoiceNumber,
        date: s.date,
        time: s.time,
        customer_phone: s.customerPhone,
        customer_name: s.customerName || null,
        subtotal: s.subtotal,
        grand_total: s.grandTotal,
        total_cost: s.totalCost,
        gross_profit: s.grossProfit,
        payment_status: s.paymentStatus,
        credit_note: s.creditNote || null,
        created_by: s.createdBy,
        created_at: s.createdAt,
      }));

      const { error: salesErr } = await client.from('sales').upsert(dbSales, { onConflict: 'id' });
      if (salesErr) throw new Error(`Iibka: ${salesErr.message}`);
      stats.sales = dbSales.length;

      // Sale items
      const allSaleItems: any[] = [];
      localState.sales.forEach((s) => {
        if (s.items && Array.isArray(s.items)) {
          s.items.forEach((item, idx) => {
            allSaleItems.push({
              id: `${s.id}_item_${idx}`,
              sale_id: s.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_cost: item.unitCost,
              unit_price: item.unitPrice,
              line_total: item.lineTotal,
              line_cost_total: item.lineCostTotal,
              line_profit: item.lineProfit,
            });
          });
        }
      });

      if (allSaleItems.length > 0) {
        const { error: itemErr } = await client.from('sale_items').upsert(allSaleItems, { onConflict: 'id' });
        if (itemErr) throw new Error(`Alaabta iibka: ${itemErr.message}`);
        stats.sale_items = allSaleItems.length;
      }
    }

    // 4. Purchases & Purchase Items
    if (localState.purchases && localState.purchases.length > 0) {
      onProgress?.('Waxaa la dirayaa shixnadaha...');
      const dbPurchases = localState.purchases.map((p) => ({
        id: p.id,
        purchase_number: p.purchaseNumber,
        date: p.date,
        supplier_name: p.supplierName || null,
        total_cost: p.totalCost,
        payment_status: p.paymentStatus,
        notes: p.notes || null,
        created_at: p.createdAt,
      }));

      const { error: purErr } = await client.from('purchases').upsert(dbPurchases, { onConflict: 'id' });
      if (purErr) throw new Error(`Shixnadaha: ${purErr.message}`);
      stats.purchases = dbPurchases.length;

      const allPurchaseItems: any[] = [];
      localState.purchases.forEach((p) => {
        if (p.items && Array.isArray(p.items)) {
          p.items.forEach((item, idx) => {
            allPurchaseItems.push({
              id: `${p.id}_item_${idx}`,
              purchase_id: p.id,
              product_id: item.productId,
              product_name: item.productName,
              quantity: item.quantity,
              unit_cost: item.unitCost,
              total_cost: item.totalCost,
            });
          });
        }
      });

      if (allPurchaseItems.length > 0) {
        await client.from('purchase_items').upsert(allPurchaseItems, { onConflict: 'id' });
      }
    }

    // 5. Expenses
    if (localState.expenses && localState.expenses.length > 0) {
      onProgress?.('Waxaa la dirayaa kharashaadka...');
      const dbExpenses = localState.expenses.map((e) => ({
        id: e.id,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        notes: e.notes || null,
        created_at: e.createdAt,
      }));
      await client.from('expenses').upsert(dbExpenses, { onConflict: 'id' });
      stats.expenses = dbExpenses.length;
    }

    // 6. Cash Transactions
    if (localState.cashTransactions && localState.cashTransactions.length > 0) {
      onProgress?.('Waxaa la dirayaa qasnadda...');
      const dbCash = localState.cashTransactions.map((c) => ({
        id: c.id,
        date: c.date,
        time: c.time,
        type: c.type,
        direction: c.direction,
        amount: c.amount,
        description: c.description,
        reference: c.reference || null,
        running_balance: c.runningBalance,
        created_at: c.createdAt,
      }));
      await client.from('cash_transactions').upsert(dbCash, { onConflict: 'id' });
      stats.cash_transactions = dbCash.length;
    }

    // 7. Accounts Receivable
    if (localState.accountsReceivable && localState.accountsReceivable.length > 0) {
      onProgress?.('Waxaa la dirayaa daymaha macaamiisha...');
      const dbReceivables = localState.accountsReceivable.map((ar) => ({
        id: ar.id,
        customer_phone: ar.customerPhone,
        customer_name: ar.customerName || null,
        sale_id: ar.saleId || null,
        invoice_number: ar.invoiceNumber || null,
        original_amount: ar.originalAmount,
        amount_paid: ar.amountPaid,
        outstanding_balance: ar.outstandingBalance,
        date: ar.date,
        status: ar.status,
        description: ar.description || null,
        notes: ar.notes || null,
        created_at: ar.createdAt,
      }));
      await client.from('accounts_receivable').upsert(dbReceivables, { onConflict: 'id' });
      stats.receivables = dbReceivables.length;
    }

    // 8. Receivable Payments
    if (localState.receivablePayments && localState.receivablePayments.length > 0) {
      const dbRPayments = localState.receivablePayments.map((rp) => ({
        id: rp.id,
        receivable_id: rp.receivableId,
        amount: rp.amount,
        date: rp.date,
        notes: rp.notes || null,
        created_at: rp.createdAt,
      }));
      await client.from('receivable_payments').upsert(dbRPayments, { onConflict: 'id' });
    }

    // 9. Accounts Payable
    if (localState.accountsPayable && localState.accountsPayable.length > 0) {
      onProgress?.('Waxaa la dirayaa daymaha qeybiyeyaasha...');
      const dbPayables = localState.accountsPayable.map((ap) => ({
        id: ap.id,
        supplier_name: ap.supplierName,
        purchase_id: ap.purchaseId || null,
        purchase_number: ap.purchaseNumber || null,
        original_amount: ap.originalAmount,
        amount_paid: ap.amountPaid,
        outstanding_balance: ap.outstandingBalance,
        date: ap.date,
        status: ap.status,
        description: ap.description || null,
        notes: ap.notes || null,
        created_at: ap.createdAt,
      }));
      await client.from('accounts_payable').upsert(dbPayables, { onConflict: 'id' });
      stats.payables = dbPayables.length;
    }

    // 10. Payable Payments
    if (localState.payablePayments && localState.payablePayments.length > 0) {
      const dbPPayments = localState.payablePayments.map((pp) => ({
        id: pp.id,
        payable_id: pp.payableId,
        amount: pp.amount,
        date: pp.date,
        notes: pp.notes || null,
        created_at: pp.createdAt,
      }));
      await client.from('payable_payments').upsert(dbPPayments, { onConflict: 'id' });
    }

    // 11. Stock Movements
    if (localState.stockMovements && localState.stockMovements.length > 0) {
      onProgress?.('Waxaa la dirayaa diiwaanka dhaqdhaqaaqa kaydka...');
      const dbMovements = localState.stockMovements.map((sm) => ({
        id: sm.id,
        product_id: sm.productId,
        product_name: sm.productName,
        date: sm.date,
        time: sm.time,
        transaction_type: sm.transactionType,
        reference_number: sm.referenceNumber || null,
        quantity_in: sm.quantityIn,
        quantity_out: sm.quantityOut,
        previous_stock: sm.previousStock,
        current_stock: sm.currentStock,
        notes: sm.notes || null,
        created_at: sm.createdAt,
      }));
      await client.from('stock_movements').upsert(dbMovements, { onConflict: 'id' });
      stats.stock_movements = dbMovements.length;
    }

    return {
      success: true,
      message: 'Dhammaan xogta si nabad ah ayaa loogu shubay Supabase iyada oo aan waxba laga tirtirin localStorage!',
      details: stats,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Khalad xilliga shubista: ${err?.message || 'Qalad aan la garanayn'}`,
    };
  }
};

/**
 * Fetch all data from Supabase to synchronize both computers
 */
export const fetchCloudData = async (): Promise<{ success: boolean; data?: Partial<AppState>; error?: string }> => {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase ma xirna.' };
  }

  try {
    const [
      productsRes,
      salesRes,
      saleItemsRes,
      purchasesRes,
      purchaseItemsRes,
      expensesRes,
      cashRes,
      receivablesRes,
      receivablePaymentsRes,
      payablesRes,
      payablePaymentsRes,
      stockMovementsRes,
      settingsRes,
    ] = await Promise.all([
      client.from('products').select('*').order('name', { ascending: true }),
      client.from('sales').select('*').order('created_at', { ascending: false }),
      client.from('sale_items').select('*'),
      client.from('purchases').select('*').order('created_at', { ascending: false }),
      client.from('purchase_items').select('*'),
      client.from('expenses').select('*').order('created_at', { ascending: false }),
      client.from('cash_transactions').select('*').order('created_at', { ascending: false }),
      client.from('accounts_receivable').select('*').order('created_at', { ascending: false }),
      client.from('receivable_payments').select('*'),
      client.from('accounts_payable').select('*').order('created_at', { ascending: false }),
      client.from('payable_payments').select('*'),
      client.from('stock_movements').select('*').order('created_at', { ascending: false }),
      client.from('business_settings').select('*').limit(1).maybeSingle(),
    ]);

    // Check if critical products query errored (e.g. tables don't exist yet)
    if (productsRes.error) {
      return { success: false, error: productsRes.error.message };
    }

    // Map DB items back to AppState
    const products = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      costPrice: Number(p.cost_price || 0),
      currentStock: Number(p.current_stock || 0),
      minStockLevel: Number(p.min_stock_level || 5),
      active: p.active ?? true,
      notes: p.notes,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    const saleItemsMap = new Map<string, any[]>();
    (saleItemsRes.data || []).forEach((item: any) => {
      const arr = saleItemsMap.get(item.sale_id) || [];
      arr.push({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitCost: Number(item.unit_cost || 0),
        unitPrice: Number(item.unit_price || 0),
        lineTotal: Number(item.line_total || 0),
        lineCostTotal: Number(item.line_cost_total || 0),
        lineProfit: Number(item.line_profit || 0),
      });
      saleItemsMap.set(item.sale_id, arr);
    });

    const sales = (salesRes.data || []).map((s: any) => ({
      id: s.id,
      invoiceNumber: s.invoice_number,
      date: s.date,
      time: s.time,
      customerPhone: s.customer_phone,
      customerName: s.customer_name,
      items: saleItemsMap.get(s.id) || [],
      subtotal: Number(s.subtotal || 0),
      grandTotal: Number(s.grand_total || 0),
      totalCost: Number(s.total_cost || 0),
      grossProfit: Number(s.gross_profit || 0),
      paymentStatus: s.payment_status,
      creditNote: s.credit_note,
      createdBy: s.created_by,
      createdAt: s.created_at,
    }));

    const purchaseItemsMap = new Map<string, any[]>();
    (purchaseItemsRes.data || []).forEach((item: any) => {
      const arr = purchaseItemsMap.get(item.purchase_id) || [];
      arr.push({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitCost: Number(item.unit_cost || 0),
        totalCost: Number(item.total_cost || 0),
      });
      purchaseItemsMap.set(item.purchase_id, arr);
    });

    const purchases = (purchasesRes.data || []).map((p: any) => ({
      id: p.id,
      purchaseNumber: p.purchase_number,
      date: p.date,
      supplierName: p.supplier_name,
      items: purchaseItemsMap.get(p.id) || [],
      totalCost: Number(p.total_cost || 0),
      paymentStatus: p.payment_status,
      notes: p.notes,
      createdAt: p.created_at,
    }));

    const expenses = (expensesRes.data || []).map((e: any) => ({
      id: e.id,
      date: e.date,
      category: e.category,
      description: e.description,
      amount: Number(e.amount || 0),
      notes: e.notes,
      createdAt: e.created_at,
    }));

    const cashTransactions = (cashRes.data || []).map((c: any) => ({
      id: c.id,
      date: c.date,
      time: c.time,
      type: c.type,
      direction: c.direction,
      amount: Number(c.amount || 0),
      description: c.description,
      reference: c.reference,
      runningBalance: Number(c.running_balance || 0),
      createdAt: c.created_at,
    }));

    const accountsReceivable = (receivablesRes.data || []).map((ar: any) => ({
      id: ar.id,
      customerPhone: ar.customer_phone,
      customerName: ar.customer_name,
      saleId: ar.sale_id,
      invoiceNumber: ar.invoice_number,
      originalAmount: Number(ar.original_amount || 0),
      amountPaid: Number(ar.amount_paid || 0),
      outstandingBalance: Number(ar.outstanding_balance || 0),
      date: ar.date,
      status: ar.status,
      description: ar.description,
      notes: ar.notes,
      createdAt: ar.created_at,
    }));

    const receivablePayments = (receivablePaymentsRes.data || []).map((rp: any) => ({
      id: rp.id,
      receivableId: rp.receivable_id,
      amount: Number(rp.amount || 0),
      date: rp.date,
      notes: rp.notes,
      createdAt: rp.created_at,
    }));

    const accountsPayable = (payablesRes.data || []).map((ap: any) => ({
      id: ap.id,
      supplierName: ap.supplier_name,
      purchaseId: ap.purchase_id,
      purchaseNumber: ap.purchase_number,
      originalAmount: Number(ap.original_amount || 0),
      amountPaid: Number(ap.amount_paid || 0),
      outstandingBalance: Number(ap.outstanding_balance || 0),
      date: ap.date,
      status: ap.status,
      description: ap.description,
      notes: ap.notes,
      createdAt: ap.created_at,
    }));

    const payablePayments = (payablePaymentsRes.data || []).map((pp: any) => ({
      id: pp.id,
      payableId: pp.payable_id,
      amount: Number(pp.amount || 0),
      date: pp.date,
      notes: pp.notes,
      createdAt: pp.created_at,
    }));

    const stockMovements = (stockMovementsRes.data || []).map((sm: any) => ({
      id: sm.id,
      productId: sm.product_id,
      productName: sm.product_name,
      date: sm.date,
      time: sm.time,
      transactionType: sm.transaction_type,
      referenceNumber: sm.reference_number,
      quantityIn: Number(sm.quantity_in || 0),
      quantityOut: Number(sm.quantity_out || 0),
      previousStock: Number(sm.previous_stock || 0),
      currentStock: Number(sm.current_stock || 0),
      notes: sm.notes,
      createdAt: sm.created_at,
    }));

    let settings: any = undefined;
    if (settingsRes.data) {
      const s = settingsRes.data;
      settings = {
        businessName: s.business_name || 'DHAQAN-KAABA',
        phone: s.phone || '',
        address: s.address || '',
        currency: s.currency || 'USD',
        currencySymbol: s.currency_symbol || '$',
        invoicePrefix: s.invoice_prefix || 'DK-INV-',
        purchasePrefix: s.purchase_prefix || 'DK-PO-',
        nextInvoiceNumber: s.next_invoice_number || 1001,
        nextPurchaseNumber: s.next_purchase_number || 501,
        receiptFooterNote: s.receipt_footer_note || '',
        hasCompletedSetup: s.has_completed_setup ?? true,
        adminPasswordHash: s.admin_password_hash || '',
        adminSalt: s.admin_salt || '',
      };
    }

    return {
      success: true,
      data: {
        products: products.length > 0 ? products : undefined,
        sales: sales.length > 0 ? sales : undefined,
        purchases: purchases.length > 0 ? purchases : undefined,
        expenses: expenses.length > 0 ? expenses : undefined,
        cashTransactions: cashTransactions.length > 0 ? cashTransactions : undefined,
        accountsReceivable: accountsReceivable.length > 0 ? accountsReceivable : undefined,
        receivablePayments: receivablePayments.length > 0 ? receivablePayments : undefined,
        accountsPayable: accountsPayable.length > 0 ? accountsPayable : undefined,
        payablePayments: payablePayments.length > 0 ? payablePayments : undefined,
        stockMovements: stockMovements.length > 0 ? stockMovements : undefined,
        settings,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Qalad aan la garanayn xilliga soo dejinta xogta Supabase.',
    };
  }
};
