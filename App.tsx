
import React, { useEffect, useState } from 'react';
import { AppProvider, useAppState } from './store';
import { AppTab, Transaction, PendingTransaction, BillReminder } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Logs from './components/Logs';
import Taxonomy from './components/Taxonomy';
import Vaults from './components/Vaults';
import SettingsView from './components/SettingsView';
import TransactionModal from './components/TransactionModal';
import Reminders from './components/Reminders';
import Goals from './components/Goals';
import AccountAnalysis from './components/AccountAnalysis';
import DataManagement from './components/DataManagement';
import AuthView from './components/AuthView';
import SecurityView from './components/SecurityView';
import LockScreen from './components/LockScreen';
import Analysis from './components/Analysis';
import CycleExplorer from './components/CycleExplorer';

const AppContent: React.FC = () => {
  const { theme, settings, user, isLocked } = useAppState();
  const [activeTab, setActiveTab] = useState<AppTab>('DASH');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | undefined>(undefined);
  const [prefillBill, setPrefillBill] = useState<Partial<BillReminder> | undefined>(undefined);

  // Synchronize dark mode and request permissions
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [theme]);

  // Handle immediate Auth/Lock check
  if (!user) {
    return <AuthView />;
  }

  if (isLocked && settings.security.passcode) {
    return <LockScreen />;
  }

  const openNewTransaction = () => {
    setEditingTransaction(undefined);
    setPendingTransaction(undefined);
    setPrefillBill(undefined);
    setIsModalOpen(true);
  };

  const openReviewPending = (pt: PendingTransaction) => {
    setEditingTransaction(undefined);
    setPendingTransaction(pt);
    setPrefillBill(undefined);
    setIsModalOpen(true);
  };

  const openCompleteBill = (bill: Partial<BillReminder>) => {
    setEditingTransaction(undefined);
    setPendingTransaction(undefined);
    setPrefillBill(bill);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
    setPendingTransaction(undefined);
    setPrefillBill(undefined);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'DASH': return <Dashboard onReviewPending={openReviewPending} onCompleteBill={openCompleteBill} />;
      case 'LOGS': return <Logs />;
      case 'ANALYSIS': return <Analysis />;
      case 'TYPES': return <Taxonomy />;
      case 'VAULTS': return <Vaults />;
      case 'REMINDERS': return <Reminders />;
      case 'GOALS': return <Goals />;
      case 'ACC_ANALYSIS': return <AccountAnalysis />;
      case 'CYCLES': return <CycleExplorer onCompleteBill={openCompleteBill} />;
      case 'DATA_OPS': return <DataManagement />;
      case 'SECURITY': return <SecurityView />;
      case 'SETTINGS': return <SettingsView onTabChange={setActiveTab} />;
      default: return <Dashboard onReviewPending={openReviewPending} onCompleteBill={openCompleteBill} />;
    }
  };

  return (
    <div 
      className={`flex flex-col h-full w-full max-w-md mx-auto relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-[#F8F9FD] text-slate-800'}`}
      style={{ fontFamily: settings.fontFamily }}
    >
      <Header onSettingsClick={() => setActiveTab('SETTINGS')} />
      
      <main className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
        {renderContent()}
      </main>

      {['DASH', 'LOGS'].includes(activeTab) && (
        <button 
          onClick={openNewTransaction}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 w-12 h-12 gradient-purple rounded-full flex items-center justify-center text-white text-xl smooth-deep-shadow active:scale-90 transition-transform z-40"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      )}

      <nav 
        className={`flex items-center justify-around px-1 z-50 ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-slate-100'} backdrop-blur-md border-t flex-none`}
        style={{ 
          height: 'calc(3.5rem + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)' 
        }}
      >
        <NavButton active={activeTab === 'DASH'} icon="fa-gauge-high" label="Main" onClick={() => setActiveTab('DASH')} />
        <NavButton active={activeTab === 'LOGS'} icon="fa-list-ul" label="Logs" onClick={() => setActiveTab('LOGS')} />
        <NavButton active={activeTab === 'ANALYSIS'} icon="fa-chart-pie" label="Flow" onClick={() => setActiveTab('ANALYSIS')} />
        <NavButton active={activeTab === 'ACC_ANALYSIS'} icon="fa-building-columns" label="Vaults" onClick={() => setActiveTab('ACC_ANALYSIS')} />
        <NavButton active={activeTab === 'CYCLES'} icon="fa-bell" label="Alerts" onClick={() => setActiveTab('CYCLES')} />
      </nav>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        editingTransaction={editingTransaction}
        pendingTransaction={pendingTransaction}
        prefillBill={prefillBill}
      />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, icon: string, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => {
  const { theme } = useAppState();
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-500/10' : ''}`}>
      <div className={`transition-all duration-300 ${active ? 'text-indigo-500 scale-110' : theme === 'dark' ? 'text-slate-500' : 'text-slate-300'}`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <span className={`text-[7.5px] font-black uppercase tracking-wider ${active ? 'text-indigo-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-300'}`}>
        {label}
      </span>
    </button>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
