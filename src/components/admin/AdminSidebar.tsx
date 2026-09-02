import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Receipt,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../lib/store';

export type AdminTab = 
  | 'DASHBOARD'
  | 'INVENTORY'
  | 'SALES'
  | 'PURCHASES'
  | 'CASH'
  | 'RECEIVABLES'
  | 'PAYABLES'
  | 'EXPENSES'
  | 'PROFIT'
  | 'SETTINGS';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onSelectTab }) => {
  const { state } = useStore();

  const lowStockCount = state.products.filter(p => p.active && p.currentStock <= p.minStockLevel).length;
  const overdueARCount = state.accountsReceivable.filter(ar => ar.status === 'OUTSTANDING' || ar.status === 'PARTIALLY_PAID').length;
  const overdueAPCount = state.accountsPayable.filter(ap => ap.status === 'OUTSTANDING' || ap.status === 'PARTIALLY_PAID').length;

  const menuItems = [
    { id: 'DASHBOARD' as AdminTab, label: 'Dulmar Guud (Dashboard)', icon: LayoutDashboard },
    { id: 'INVENTORY' as AdminTab, label: 'Alaabta & Kaydka (Inventory)', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'SALES' as AdminTab, label: 'Diiwaanka Iibka (Sales)', icon: ShoppingCart },
    { id: 'PURCHASES' as AdminTab, label: 'Alaab Soo Gelin (Purchases)', icon: Truck },
    { id: 'CASH' as AdminTab, label: 'Qasnadda (Cash)', icon: Wallet },
    { id: 'RECEIVABLES' as AdminTab, label: 'Daynta Macaamiisha (AR)', icon: ArrowDownLeft, badge: overdueARCount > 0 ? `${overdueARCount}` : undefined, badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'PAYABLES' as AdminTab, label: 'Daynta Ganacsiga (AP)', icon: ArrowUpRight, badge: overdueAPCount > 0 ? `${overdueAPCount}` : undefined, badgeColor: 'bg-blue-100 text-blue-800' },
    { id: 'EXPENSES' as AdminTab, label: 'Kharashaadka (Expenses)', icon: Receipt },
    { id: 'PROFIT' as AdminTab, label: 'Faa\'iidada (Profit)', icon: TrendingUp },
    { id: 'SETTINGS' as AdminTab, label: 'Habaynta & Setup (Settings)', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-3.5 space-y-4 hidden md:block">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block mb-2">
          QAYBTA MAAMULKA (ADMIN)
        </span>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id.toLowerCase()}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1a7b07] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
