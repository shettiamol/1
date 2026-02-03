
import React, { useState } from 'react';
import { useAppState } from '../store';
import { AppTab, SUPPORTED_CURRENCIES, User, DashboardWidget } from '../types';

interface Props {
  onTabChange: (tab: AppTab) => void;
}

const SettingsView: React.FC<Props> = ({ onTabChange }) => {
  const { theme, settings, updateSettings, purgeData, user, setUser, deleteUserAccount } = useAppState();
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  
  const [editUserFormData, setEditUserFormData] = useState<User>(user || { id: '', name: '', email: '', mobile: '+91 ' });

  const fonts = [
    'Space Grotesk', 
    'Inter', 
    'JetBrains Mono', 
    'Playfair Display',
    'Montserrat',
    'Raleway',
    'Oswald',
    'Lora'
  ];

  const [purgeOptions, setPurgeOptions] = useState({
    transactions: false,
    accounts: false,
    categories: false,
    goals: false,
    billReminders: false
  });

  const handlePurge = () => {
    const hasSelected = Object.values(purgeOptions).some(v => v);
    if (!hasSelected) {
      alert("Please select at least one data type to delete.");
      return;
    }
    
    if (window.confirm("CRITICAL: Selected data will be permanently deleted. This cannot be undone. Proceed?")) {
      purgeData(purgeOptions);
      setIsPurgeModalOpen(false);
      setPurgeOptions({
        transactions: false,
        accounts: false,
        categories: false,
        goals: false,
        billReminders: false
      });
      alert("Selected records have been cleared from the local ledger.");
    }
  };

  const toggleWidget = (id: string) => {
    const updatedWidgets = settings.dashboardWidgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    updateSettings({ dashboardWidgets: updatedWidgets });
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const index = settings.dashboardWidgets.findIndex(w => w.id === id);
    if (index === -1) return;
    const newWidgets = [...settings.dashboardWidgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newWidgets.length) {
      [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
      updateSettings({ dashboardWidgets: newWidgets });
    }
  };

  const handleMobileChange = (val: string) => {
    if (!val.startsWith('+91 ')) {
      setEditUserFormData({ ...editUserFormData, mobile: '+91 ' });
      return;
    }
    const digits = val.slice(4).replace(/\D/g, '');
    if (digits.length <= 10) {
      setEditUserFormData({ ...editUserFormData, mobile: '+91 ' + digits });
    }
  };

  const handleUserUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const mobileDigits = editUserFormData.mobile.slice(4);
    if (mobileDigits.length !== 10) {
      alert("Validation Error: Please enter a valid 10-digit mobile number.");
      return;
    }
    setUser(editUserFormData);
    setIsUserEditModalOpen(false);
    alert("Identity Protocol Updated.");
  };

  const handleDeleteMasterAccount = () => {
    if (window.confirm("CRITICAL WARNING: This will permanently delete your identity profile and ALL financial records stored on this device. This operation is irreversible. Proceed with full account deletion?")) {
      deleteUserAccount();
    }
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-10">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">System Settings</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration & Controls</p>
      </div>

      <section className="space-y-10">
        {/* 1. Core Settings */}
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Core Settings</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
             <button 
                onClick={() => onTabChange('REMINDERS')}
                className={`p-5 rounded-[2rem] border flex flex-col items-center gap-3 transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <i className="fa-solid fa-bell text-rose-500 text-lg"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">Bill Alerts</span>
              </button>
              <button 
                onClick={() => onTabChange('GOALS')}
                className={`p-5 rounded-[2rem] border flex flex-col items-center gap-3 transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <i className="fa-solid fa-bullseye text-indigo-500 text-lg"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">Goals</span>
              </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => onTabChange('TYPES')}
              className={`p-3 rounded-[1.5rem] border flex flex-col items-center gap-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <i className="fa-solid fa-tags text-slate-500 text-xs"></i>
              <span className="text-[7px] font-black uppercase tracking-widest">Categories</span>
            </button>
            <button 
              onClick={() => onTabChange('VAULTS')}
              className={`p-3 rounded-[1.5rem] border flex flex-col items-center gap-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <i className="fa-solid fa-wallet text-emerald-500 text-xs"></i>
              <span className="text-[7px] font-black uppercase tracking-widest">Accounts</span>
            </button>
            <button 
              onClick={() => setIsWidgetModalOpen(true)}
              className={`p-3 rounded-[1.5rem] border flex flex-col items-center gap-2 transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <i className="fa-solid fa-sliders text-indigo-500 text-xs"></i>
              <span className="text-[7px] font-black uppercase tracking-widest">Widgets</span>
            </button>
          </div>
        </div>

        {/* 2. Budget Intelligence */}
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Budget Intelligence</h2>
          <div className={`p-6 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black dark:text-slate-100 uppercase tracking-tight">Overflow Monitor</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Alert on high burn rate</p>
              </div>
              <button 
                onClick={() => updateSettings({ budgetAlertEnabled: !settings.budgetAlertEnabled })}
                className={`w-12 h-6 rounded-full relative transition-all ${settings.budgetAlertEnabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${settings.budgetAlertEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>

            {settings.budgetAlertEnabled && (
              <div className="animate-in slide-in-from-top-2">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alert Threshold</label>
                    <span className="text-xs font-black text-indigo-500" style={{fontFamily: 'JetBrains Mono'}}>{settings.budgetAlertThreshold}%</span>
                 </div>
                 <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={settings.budgetAlertThreshold}
                  onChange={(e) => updateSettings({ budgetAlertThreshold: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                 />
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                   Triggers when monthly expenses cross {settings.budgetAlertThreshold}% of monthly income.
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. General Setting */}
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">General Setting</h2>
          <div className={`p-6 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Currency System</label>
              <select 
                value={settings.currencyCode} 
                onChange={(e) => {
                  const curr = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
                  if (curr) updateSettings({ currencyCode: curr.code, currencySymbol: curr.symbol });
                }}
                className="w-full bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border border-slate-100 dark:border-slate-600 appearance-none"
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.name} ({curr.symbol})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Typography Engine</label>
              <select 
                value={settings.fontFamily} 
                onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-700 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border border-slate-100 dark:border-slate-600 appearance-none"
                style={{ fontFamily: settings.fontFamily }}
              >
                {fonts.map(f => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Data Backup / Restore */}
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Data Backup / Restore</h2>
          <div 
            onClick={() => onTabChange('DATA_OPS')}
            className={`p-6 rounded-[2rem] border cursor-pointer group active:scale-[0.98] transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} flex items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500 shadow-sm">
                <i className="fa-solid fa-server"></i>
              </div>
              <div>
                <h3 className="text-xs font-black dark:text-slate-100 uppercase tracking-tight group-hover:text-indigo-500 transition-colors">Data Backup / Restore</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cloud Blueprints & CSV</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
          </div>
        </div>

        {/* 5. User Management */}
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">User Management</h2>
          <div className="space-y-3">
            <div 
              onClick={() => {
                if (user) setEditUserFormData(user);
                setIsUserEditModalOpen(true);
              }}
              className={`p-6 rounded-[2rem] border cursor-pointer group active:scale-[0.98] transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} flex items-center justify-between gap-4`}
            >
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full gradient-purple flex items-center justify-center text-white text-xl font-black shadow-lg">
                     {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                     <h3 className="text-sm font-black dark:text-slate-100 uppercase leading-none mb-1 group-hover:text-indigo-500 transition-colors">{user?.name}</h3>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
                  </div>
               </div>
               <i className="fa-solid fa-pen-to-square text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
            </div>
          </div>
        </div>

        {/* 6. Security and Privacy */}
        <div>
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Security and Privacy</h2>
          <div 
            onClick={() => onTabChange('SECURITY')}
            className={`p-6 rounded-[2rem] border cursor-pointer group active:scale-[0.98] transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} flex items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500 shadow-sm">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <div>
                <h3 className="text-xs font-black dark:text-slate-100 uppercase tracking-tight group-hover:text-indigo-500 transition-colors">Security Controls</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">App Lock & Biometrics</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-indigo-500 transition-colors"></i>
          </div>
        </div>

        {/* 7. Destructive Operations */}
        <div className="space-y-3">
          <button 
            onClick={() => setIsPurgeModalOpen(true)}
            className="w-full p-6 rounded-[2rem] border border-rose-100 bg-rose-50 text-rose-600 flex items-center justify-between group active:scale-95 transition-all dark:bg-rose-500/5 dark:border-rose-500/20"
          >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-trash-can"></i>
               </div>
               <div className="text-left">
                  <span className="text-xs font-black uppercase tracking-tight block">Delete Data</span>
                  <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">Selective Purge Operations</span>
               </div>
            </div>
            <i className="fa-solid fa-chevron-right text-rose-300 transition-transform group-hover:translate-x-1"></i>
          </button>

          <button 
            onClick={handleDeleteMasterAccount}
            className="w-full p-6 rounded-[2rem] border border-red-200 bg-red-50 text-red-600 flex items-center justify-between group active:scale-95 transition-all dark:bg-red-500/10 dark:border-red-500/20"
          >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-user-xmark"></i>
               </div>
               <div className="text-left">
                  <span className="text-xs font-black uppercase tracking-tight block">Delete Account</span>
                  <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">Wipe everything and Delete account</span>
               </div>
            </div>
            <i className="fa-solid fa-triangle-exclamation text-red-300"></i>
          </button>
        </div>
      </section>

      {/* Selective Purge Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-8 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Purge Protocol</h2>
                <button onClick={() => setIsPurgeModalOpen(false)} className="text-slate-300 hover:text-rose-500">
                   <i className="fa-solid fa-xmark text-xl"></i>
                </button>
             </div>
             
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Select components for permanent deletion</p>
             
             <div className="space-y-4 mb-8">
                {[
                  { id: 'transactions', label: 'Transactions', icon: 'fa-receipt' },
                  { id: 'accounts', label: 'Accounts', icon: 'fa-building-columns' },
                  { id: 'categories', label: 'Categories', icon: 'fa-tags' },
                  { id: 'goals', label: 'Goals', icon: 'fa-bullseye' },
                  { id: 'billReminders', label: 'Bill Alerts', icon: 'fa-bell' }
                ].map((opt) => (
                  <div 
                    key={opt.id}
                    onClick={() => setPurgeOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof prev] }))}
                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${purgeOptions[opt.id as keyof typeof purgeOptions] ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10' : 'border-slate-100 bg-slate-50 dark:bg-slate-800 dark:border-slate-700'}`}
                  >
                     <div className="flex items-center gap-3">
                        <i className={`fa-solid ${opt.icon} text-xs ${purgeOptions[opt.id as keyof typeof purgeOptions] ? 'text-rose-500' : 'text-slate-400'}`}></i>
                        <span className={`text-xs font-black uppercase tracking-widest ${purgeOptions[opt.id as keyof typeof purgeOptions] ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>{opt.label}</span>
                     </div>
                     <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${purgeOptions[opt.id as keyof typeof purgeOptions] ? 'border-rose-500 bg-rose-500 text-white' : 'border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600'}`}>
                        {purgeOptions[opt.id as keyof typeof purgeOptions] && <i className="fa-solid fa-check text-[10px]"></i>}
                     </div>
                  </div>
                ))}
             </div>

             <div className="flex gap-3">
                <button 
                  onClick={() => setIsPurgeModalOpen(false)}
                  className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest"
                >
                   Cancel
                </button>
                <button 
                  onClick={handlePurge}
                  className="flex-2 bg-rose-500 text-white px-8 py-4 rounded-[1.5rem] font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 dark:shadow-none active:scale-95 transition-transform"
                >
                   Confirm
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Widget Management Modal */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Dashboard Protocol</h2>
              <button onClick={() => setIsWidgetModalOpen(false)} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 max-h-[60vh] pr-1">
              {settings.dashboardWidgets.map((w, idx) => (
                <div key={w.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <button onClick={() => toggleWidget(w.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${w.enabled ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                         <i className={`fa-solid ${w.enabled ? 'fa-check' : 'fa-plus'}`}></i>
                      </button>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${w.enabled ? 'text-slate-800 dark:text-slate-100' : 'text-slate-300'}`}>{w.name}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <button onClick={() => moveWidget(w.id, 'up')} disabled={idx === 0} className="w-7 h-7 text-[10px] text-slate-400 disabled:opacity-20"><i className="fa-solid fa-chevron-up"></i></button>
                      <button onClick={() => moveWidget(w.id, 'down')} disabled={idx === settings.dashboardWidgets.length-1} className="w-7 h-7 text-[10px] text-slate-400 disabled:opacity-20"><i className="fa-solid fa-chevron-down"></i></button>
                   </div>
                </div>
              ))}
            </div>
            <button onClick={() => setIsWidgetModalOpen(false)} className="mt-8 w-full gradient-purple text-white font-black py-4 rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-xl">Apply Calibration</button>
          </div>
        </div>
      )}

      {/* User Detail Edit Modal */}
      {isUserEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <form 
            onSubmit={handleUserUpdate}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95"
           >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Identity Setup</h2>
                <button type="button" onClick={() => setIsUserEditModalOpen(false)} className="text-slate-300 hover:text-rose-500">
                   <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              <div className="space-y-4 mb-8">
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={editUserFormData.name}
                      onChange={e => setEditUserFormData({...editUserFormData, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-indigo-100 transition-all" 
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={editUserFormData.email}
                      onChange={e => setEditUserFormData({...editUserFormData, email: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-indigo-100 transition-all" 
                    />
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Mobile Number (India)</label>
                    <input 
                      type="tel" 
                      required
                      value={editUserFormData.mobile}
                      onChange={e => handleMobileChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none border border-transparent focus:border-indigo-100 transition-all" 
                    />
                 </div>
              </div>

              <div className="space-y-3">
                <button 
                  type="submit"
                  className="w-full gradient-purple text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl smooth-deep-shadow-sm active:scale-95 transition-transform"
                >
                  Sync Identity
                </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
