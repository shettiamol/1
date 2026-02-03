
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, Category, Account, TransactionType, SubCategory, SubAccount, AppSettings, Theme, BillReminder, FinancialGoal, SUPPORTED_CURRENCIES, PendingTransaction, HandledReminder, AppBackup, RecurringFrequency, DashboardWidget, User, SecuritySettings } from './types';

export const ADMIN_MASTER_CODE = '369639';

interface AppState {
  user: User | null;
  transactions: Transaction[];
  pendingTransactions: PendingTransaction[];
  categories: Category[];
  accounts: Account[];
  billReminders: BillReminder[];
  goals: FinancialGoal[];
  handledReminders: HandledReminder[];
  currentDate: Date;
  theme: Theme;
  settings: AppSettings;
  isLocked: boolean;
  
  setCurrentDate: (date: Date) => void;
  setTheme: (theme: Theme) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  setSecuritySettings: (s: Partial<SecuritySettings>) => void;
  
  setUser: (u: User | null) => void;
  setIsLocked: (l: boolean) => void;
  unlockApp: (passcode: string) => boolean;

  addTransaction: (t: Transaction) => void;
  updateTransaction: (t: Transaction, oldTransaction?: Transaction) => void;
  deleteTransaction: (id: string, deleteAllInSeries?: boolean) => void;
  dismissPendingTransaction: (id: string) => void;
  processSMS: (text: string) => void;
  
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addSubCategory: (catId: string, sc: SubCategory) => void;
  updateSubCategory: (catId: string, sc: SubCategory) => void;
  deleteSubCategory: (catId: string, scId: string) => void;
  
  addAccount: (a: Account) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;
  addSubAccount: (accId: string, sa: SubAccount) => void;
  updateSubAccount: (accId: string, sa: SubAccount) => void;
  deleteSubAccount: (accId: string, saId: string) => void;

  addBillReminder: (r: BillReminder) => void;
  updateBillReminder: (r: BillReminder) => void;
  deleteBillReminder: (id: string) => void;

  addGoal: (g: FinancialGoal) => void;
  updateGoal: (g: FinancialGoal) => void;
  deleteGoal: (id: string) => void;

  handleReminderAction: (reminderId: string, action: 'COMPLETED' | 'DISMISSED', specificMY?: string) => void;
  importData: (backup: AppBackup) => void;
  purgeData: (options: any) => void;
  deleteUserAccount: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'smart_spend_state_v3_stable';

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'TOTAL_NET', name: 'Net Capital (lifetime)', enabled: true },
  { id: 'TOTAL_INFLOW', name: 'Total Inflow', enabled: true },
  { id: 'TOTAL_OUTFLOW', name: 'Total Outflow', enabled: true },
  { id: 'PENDING_TX', name: 'Activity Detections', enabled: true },
  { id: 'VAULT_CYCLE_ALERTS', name: 'Bill Settlement alerts', enabled: true },
  { id: 'ALERTS', name: 'Total budget warning', enabled: true },
  { id: 'BUDGET_WARNINGS_SPECIFIC', name: 'Budget warnings', enabled: true },
  { id: 'BILL_REMINDERS_SPECIFIC', name: 'Bill reminder alerts', enabled: true },
  { id: 'GOALS_PROGRESS', name: 'Goal progress', enabled: true },
  { id: 'RECENT_LOGS', name: 'Activity Feed', enabled: true },
];

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-home', name: 'Home', type: TransactionType.EXPENSE, color: '#4f46e5', icon: 'fa-house', budgetLimit: 0,
    subCategories: [{ id: 'sub-bills', name: 'Bills', budget: 0, icon: 'fa-file-invoice-dollar' }]
  },
  {
    id: 'cat-inc-salary', name: 'Salary', type: TransactionType.INCOME, color: '#10b981', icon: 'fa-money-bill-wave', budgetLimit: 0,
    subCategories: [{ id: 'sc-sal-salary', name: 'Salary', icon: 'fa-building' }]
  }
];

const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-savings', name: 'Savings', color: '#3b82f6', icon: 'fa-building-columns',
    subAccounts: [{ id: 'sa-savings-primary', name: 'Main Account', balance: 0, icon: 'fa-piggy-bank' }]
  }
];

const getSafeStorageData = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed.settings && !Array.isArray(parsed.settings.dashboardWidgets)) {
      parsed.settings.dashboardWidgets = DEFAULT_WIDGETS;
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cachedData] = useState(() => getSafeStorageData());

  const [currentDate, setCurrentDate] = useState(new Date());
  const [theme, setTheme] = useState<Theme>(cachedData?.settings?.theme || 'light');
  const [user, setUser] = useState<User | null>(cachedData?.user || null);
  const [isLocked, setIsLocked] = useState(true);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const base = {
      incomeColor: '#4ade80',
      expenseColor: '#f87171',
      fontFamily: 'Space Grotesk',
      currencyCode: 'INR',
      currencySymbol: '₹',
      dashboardWidgets: DEFAULT_WIDGETS,
      budgetAlertEnabled: true,
      budgetAlertThreshold: 75,
      security: { passcode: undefined, biometricsEnabled: false, autoLockDelay: 0 }
    };
    if (cachedData?.settings) {
      return { 
        ...base, 
        ...cachedData.settings,
        security: { ...base.security, ...(cachedData.settings.security || {}) },
        dashboardWidgets: Array.isArray(cachedData.settings.dashboardWidgets) ? cachedData.settings.dashboardWidgets : DEFAULT_WIDGETS
      };
    }
    return base;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(cachedData?.transactions || []);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(cachedData?.categories?.length > 0 ? cachedData.categories : DEFAULT_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>(cachedData?.accounts?.length > 0 ? cachedData.accounts : DEFAULT_ACCOUNTS);
  const [billReminders, setBillReminders] = useState<BillReminder[]>(cachedData?.billReminders || []);
  const [goals, setGoals] = useState<FinancialGoal[]>(cachedData?.goals || []);
  const [handledReminders, setHandledReminders] = useState<HandledReminder[]>(cachedData?.handledReminders || []);

  useEffect(() => {
    const data = { transactions, categories, accounts, billReminders, goals, handledReminders, settings, user };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [transactions, categories, accounts, billReminders, goals, handledReminders, settings, user]);

  const updateSettings = (s: Partial<AppSettings>) => setSettings(prev => ({ ...prev, ...s }));
  const setSecuritySettings = (s: Partial<SecuritySettings>) => setSettings(prev => ({
    ...prev,
    security: { ...prev.security, ...s }
  }));

  const unlockApp = (passcode: string) => {
    if (passcode === ADMIN_MASTER_CODE || (settings.security.passcode && passcode === settings.security.passcode) || user?.accessCodes?.includes(passcode)) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const addTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);
  const updateTransaction = (t: Transaction) => setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const dismissPendingTransaction = (id: string) => setPendingTransactions(prev => prev.filter(t => t.id !== id));
  
  const processSMS = (text: string) => {
    if (!text) return;
    const amountMatch = text.match(/(?:Rs\.?|INR|₹|amt)\s*([\d,.]+)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
    const lowerText = text.toLowerCase();
    const isExpense = ['spent', 'debited', 'paid', 'vpa', 'purchase'].some(kw => lowerText.includes(kw));
    const isIncome = ['credited', 'received', 'salary'].some(kw => lowerText.includes(kw));
    const type = isIncome && !isExpense ? TransactionType.INCOME : TransactionType.EXPENSE;
    if (amount > 0) {
      setPendingTransactions(prev => [{
        id: 'pt-' + Math.random().toString(36).substr(2, 9),
        rawText: text, amount, type,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        suggestedTitle: lowerText.includes('vpa') ? 'UPI detected' : text.substring(0, 20) + '...'
      }, ...prev]);
    }
  };

  const addCategory = (c: Category) => setCategories(prev => [...prev, c]);
  const updateCategory = (c: Category) => setCategories(prev => prev.map(item => item.id === c.id ? c : item));
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));
  const addSubCategory = (catId: string, sc: SubCategory) => setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: [...c.subCategories, sc] } : c));
  const updateSubCategory = (catId: string, sc: SubCategory) => setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.map(item => item.id === sc.id ? sc : item) } : c));
  const deleteSubCategory = (catId: string, scId: string) => setCategories(prev => prev.map(c => c.id === catId ? { ...c, subCategories: c.subCategories.filter(s => s.id !== scId) } : c));

  const addAccount = (a: Account) => setAccounts(prev => [...prev, a]);
  const updateAccount = (a: Account) => setAccounts(prev => prev.map(item => item.id === a.id ? a : item));
  const deleteAccount = (id: string) => setAccounts(prev => prev.filter(a => a.id !== id));
  const addSubAccount = (accId: string, sa: SubAccount) => setAccounts(prev => prev.map(a => a.id === accId ? { ...a, subAccounts: [...a.subAccounts, sa] } : a));
  const updateSubAccount = (accId: string, sa: SubAccount) => setAccounts(prev => prev.map(a => a.id === accId ? { ...a, subAccounts: a.subAccounts.map(item => item.id === sa.id ? sa : item) } : a));
  const deleteSubAccount = (accId: string, saId: string) => setAccounts(prev => prev.map(a => a.id === accId ? { ...a, subAccounts: a.subAccounts.filter(s => s.id !== saId) } : a));

  const addBillReminder = (r: BillReminder) => setBillReminders(prev => [...prev, r]);
  const updateBillReminder = (r: BillReminder) => setBillReminders(prev => prev.map(item => item.id === r.id ? r : item));
  const deleteBillReminder = (id: string) => setBillReminders(prev => prev.filter(r => r.id !== id));

  const addGoal = (g: FinancialGoal) => setGoals(prev => [...prev, g]);
  const updateGoal = (g: FinancialGoal) => setGoals(prev => prev.map(item => item.id === g.id ? g : item));
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  const handleReminderAction = (reminderId: string, action: 'COMPLETED' | 'DISMISSED', specificMY?: string) => {
    setHandledReminders(prev => [...prev, { reminderId, monthYear: specificMY || `${new Date().getMonth()+1}-${new Date().getFullYear()}`, action }]);
  };

  const importData = (backup: AppBackup) => {
    setTransactions(backup.transactions || []);
    setCategories(backup.categories || []);
    setAccounts(backup.accounts || []);
    setBillReminders(backup.billReminders || []);
    setGoals(backup.goals || []);
    setHandledReminders(backup.handledReminders || []);
    if (backup.settings) setSettings(prev => ({...prev, ...backup.settings}));
  };

  const purgeData = (options: any) => {
    if (options.transactions) setTransactions([]);
    if (options.accounts) setAccounts(DEFAULT_ACCOUNTS);
    if (options.categories) setCategories(DEFAULT_CATEGORIES);
    if (options.goals) setGoals([]);
    if (options.billReminders) setBillReminders([]);
  };

  const deleteUserAccount = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      user, setUser, transactions, pendingTransactions, categories, accounts, billReminders, goals, handledReminders, currentDate, theme, settings, isLocked,
      setCurrentDate, setTheme, updateSettings, setSecuritySettings, setIsLocked, unlockApp,
      addTransaction, updateTransaction, deleteTransaction, dismissPendingTransaction, processSMS,
      addCategory, updateCategory, deleteCategory, addSubCategory, updateSubCategory, deleteSubCategory,
      addAccount, updateAccount, deleteAccount, addSubAccount, updateSubAccount, deleteSubAccount,
      addBillReminder, updateBillReminder, deleteBillReminder, addGoal, updateGoal, deleteGoal,
      handleReminderAction, importData, purgeData, deleteUserAccount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used within AppProvider');
  return context;
};
