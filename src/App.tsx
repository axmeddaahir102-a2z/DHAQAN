import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { Header } from './components/common/Header';
import { AdminAuthModal } from './components/common/AdminAuthModal';
import { QuickStockModal } from './components/operator/QuickStockModal';
import { OperatorSalesScreen } from './components/operator/OperatorSalesScreen';
import { AdminLayout } from './components/admin/AdminLayout';

function MainApp() {
  const { currentUserRole } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-[#1a7b07]/20 selection:text-[#1a7b07]">
      {/* Universal Top Header */}
      <Header
        onOpenAdminAuth={() => setShowAuthModal(true)}
        onOpenQuickStock={() => setShowStockModal(true)}
      />

      {/* Main Role-Specific View */}
      <div className="flex-1 flex flex-col">
        {currentUserRole === 'OPERATOR' ? (
          <OperatorSalesScreen />
        ) : (
          <AdminLayout />
        )}
      </div>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />

      {/* Quick Stock Lookup Modal */}
      <QuickStockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
