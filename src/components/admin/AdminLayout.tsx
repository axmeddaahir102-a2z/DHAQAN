import React, { useState } from 'react';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { DashboardTab } from './DashboardTab';
import { InventoryTab } from './InventoryTab';
import { SalesManagementTab } from './SalesManagementTab';
import { PurchasesTab } from './PurchasesTab';
import { ExpensesTab } from './ExpensesTab';
import { CashManagementTab } from './CashManagementTab';
import { AccountsReceivableTab } from './AccountsReceivableTab';
import { AccountsPayableTab } from './AccountsPayableTab';
import { ProfitLossTab } from './ProfitLossTab';
import { SettingsTab } from './SettingsTab';

export const AdminLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('DASHBOARD');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <DashboardTab onNavigate={setActiveTab} />;
      case 'INVENTORY':
        return <InventoryTab />;
      case 'SALES':
        return <SalesManagementTab />;
      case 'PURCHASES':
        return <PurchasesTab />;
      case 'CASH':
        return <CashManagementTab />;
      case 'RECEIVABLES':
        return <AccountsReceivableTab />;
      case 'PAYABLES':
        return <AccountsPayableTab />;
      case 'EXPENSES':
        return <ExpensesTab />;
      case 'PROFIT':
        return <ProfitLossTab />;
      case 'SETTINGS':
        return <SettingsTab />;
      default:
        return <DashboardTab onNavigate={setActiveTab} />;
    }
  };

  const mobileTabs: Array<{ id: AdminTab; label: string }> = [
    { id: 'DASHBOARD', label: 'Dulmar' },
    { id: 'INVENTORY', label: 'Kaydka' },
    { id: 'SALES', label: 'Iibka' },
    { id: 'PURCHASES', label: 'Iibsashada' },
    { id: 'CASH', label: 'Qasnadda' },
    { id: 'RECEIVABLES', label: 'Daynta AR' },
    { id: 'PAYABLES', label: 'Daynta AP' },
    { id: 'EXPENSES', label: 'Kharash' },
    { id: 'PROFIT', label: 'Faa\'iido' },
    { id: 'SETTINGS', label: 'Habayn' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4.25rem)] bg-slate-50">
      {/* Desktop Sidebar */}
      <AdminSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Mobile Horizontal Navigation */}
      <div className="md:hidden bg-white border-b border-slate-200 p-2 overflow-x-auto flex space-x-1.5 scrollbar-none">
        {mobileTabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === item.id ? 'bg-[#1a7b07] text-white shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
        {renderActiveTab()}
      </main>
    </div>
  );
};
