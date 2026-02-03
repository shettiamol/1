
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../store';
import { Account, SubAccount, BillingCycle } from '../types';

const ICONS = [
  'fa-building-columns', 'fa-vault', 'fa-wallet', 'fa-piggy-bank', 
  'fa-credit-card', 'fa-money-bill-wave', 'fa-landmark', 'fa-briefcase',
  'fa-sack-dollar', 'fa-gem', 'fa-chart-line', 'fa-hand-holding-dollar',
  'fa-mobile-screen', 'fa-shield-halved', 'fa-box', 'fa-basket-shopping',
  'fa-university', 'fa-coins'
];

const Vaults: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, addSubAccount, updateSubAccount, deleteSubAccount, deleteUserAccount, theme, settings } = useAppState();
  
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [expandedAccIds, setExpandedAccIds] = useState<Set<string>>(new Set());
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [editingSub, setEditingSub] = useState<{parentId: string, sub: SubAccount} | null>(null);

  const [accForm, setAccForm] = useState({ name: '', color: '#6366f1', icon: 'fa-building-columns' });
  const [subForm, setSubForm] = useState({ 
    name: '', 
    balance: '0', 
    icon: 'fa-wallet',
    cycleEnabled: false,
    startDay: '27',
    dueDaysAfterEnd: '10',
    alertDaysBefore: '3'
  });
  
  const [isAccIconDropdownOpen, setIsAccIconDropdownOpen] = useState(false);
  const [isSubIconDropdownOpen, setIsSubIconDropdownOpen] = useState(false);

  const accIconRef = useRef<HTMLDivElement>(null);
  const subIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (accIconRef.current && !accIconRef.current.contains(e.target as Node)) setIsAccIconDropdownOpen(false);
      if (subIconRef.current && !subIconRef.current.contains(e.target as Node)) setIsSubIconDropdownOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedAccIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedAccIds(newSet);
  };

  const openAccModal = (acc?: Account) => {
    if (acc) {
      setEditingAcc(acc);
      setAccForm({ name: acc.name, color: acc.color, icon: acc.icon });
    } else {
      setEditingAcc(null);
      setAccForm({ name: '', color: '#6366f1', icon: 'fa-building-columns' });
    }
    setIsAccModalOpen(true);
  };

  const openSubModal = (parentId: string, sub?: SubAccount) => {
    if (sub) {
      setEditingSub({ parentId, sub });
      const bc = sub.billingCycle;
      setSubForm({ 
        name: sub.name, 
        balance: (sub.balance ?? 0).toString(), 
        icon: sub.icon || 'fa-wallet',
        cycleEnabled: bc?.enabled || false,
        startDay: (bc?.startDay ?? 27).toString(),
        dueDaysAfterEnd: (bc?.dueDaysAfterEnd ?? 10).toString(),
        alertDaysBefore: (bc?.alertDaysBefore ?? 3).toString()
      });
    } else {
      setEditingSub({ parentId, sub: { id: '', name: '', balance: 0, icon: 'fa-wallet' } });
      setSubForm({ 
        name: '', balance: '0', icon: 'fa-wallet', cycleEnabled: false,
        startDay: '27', dueDaysAfterEnd: '10', alertDaysBefore: '3'
      });
    }
    setIsSubModalOpen(true);
  };

  const handleSaveAcc = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Account = {
      id: editingAcc?.id || Math.random().toString(36).substr(2, 9),
      name: accForm.name,
      color: accForm.color,
      icon: accForm.icon,
      subAccounts: editingAcc?.subAccounts || []
    };
    if (editingAcc) updateAccount(payload);
    else addAccount(payload);
    setIsAccModalOpen(false);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    const billingCycle: BillingCycle = {
      enabled: subForm.cycleEnabled,
      startDay: parseInt(subForm.startDay) || 27,
      dueDaysAfterEnd: parseInt(subForm.dueDaysAfterEnd) || 10,
      alertDaysBefore: parseInt(subForm.alertDaysBefore) || 3
    };

    const payload: SubAccount = {
      id: editingSub.sub.id || Math.random().toString(36).substr(2, 9),
      name: subForm.name,
      balance: parseFloat(subForm.balance) || 0,
      icon: subForm.icon,
      billingCycle
    };

    if (editingSub.sub.id) updateSubAccount(editingSub.parentId, payload);
    else addSubAccount(editingSub.parentId, payload);
    setIsSubModalOpen(false);
  };

  const handleDeleteMasterAccount = () => {
    if (window.confirm("WARNING: This will permanently delete your identity profile and ALL local financial records. Continue?")) {
      deleteUserAccount();
    }
  };

  return (
    <div className="p-6 pb-32 h-full overflow-y-auto hide-scrollbar">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Financial Vaults</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Asset Ledger</p>
        </div>
        <button 
          onClick={() => openAccModal()} 
          className="w-12 h-12 gradient-purple rounded-2xl flex items-center justify-center text-white smooth-deep-shadow transition-transform active:scale-90"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="space-y-4">
        {accounts.map(acc => {
          const totalBal = acc.subAccounts.reduce((s, sa) => s + sa.balance, 0);
          return (
            <div key={acc.id} className="space-y-2">
              <div 
                onClick={() => toggleExpand(acc.id)}
                className={`p-4 rounded-[1.5rem] border flex items-center justify-between cursor-pointer transition-all ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} ${expandedAccIds.has(acc.id) ? 'ring-2 ring-indigo-500/20' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: acc.color }}>
                    <i className={`fa-solid ${acc.icon || 'fa-building-columns'}`}></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black dark:text-white leading-none mb-1">{acc.name}</h3>
                      <i className={`fa-solid fa-chevron-down text-[8px] text-slate-400 transition-transform ${expandedAccIds.has(acc.id) ? 'rotate-180' : ''}`}></i>
                    </div>
                    <p className="text-[10px] font-bold text-indigo-500" style={{ fontFamily: 'JetBrains Mono' }}>
                      {settings.currencySymbol}{totalBal.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openSubModal(acc.id)} className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center text-[10px]"><i className="fa-solid fa-plus"></i></button>
                  <button onClick={() => openAccModal(acc)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-[10px]"><i className="fa-solid fa-pencil"></i></button>
                  <button onClick={() => { if(confirm('Purge account?')) deleteAccount(acc.id) }} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center text-[10px]"><i className="fa-solid fa-trash-can"></i></button>
                </div>
              </div>

              <div className={`grid transition-all duration-300 ease-in-out ${expandedAccIds.has(acc.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="ml-8 pt-2 space-y-2 pb-1">
                    {acc.subAccounts.map(sub => (
                      <div key={sub.id} className={`p-3 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-white/40 border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-[10px]">
                            <i className={`fa-solid ${sub.icon || 'fa-wallet'}`}></i>
                          </div>
                          <div>
                            <p className="text-xs font-black dark:text-slate-300">{sub.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[9px] font-bold text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>
                                {settings.currencySymbol}{(sub.balance ?? 0).toLocaleString()}
                              </p>
                              {sub.billingCycle?.enabled && (
                                <span className="text-[7px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 px-1 py-0.5 rounded uppercase font-black">Cycle On</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openSubModal(acc.id, sub)} className="w-7 h-7 rounded-lg text-slate-300 hover:text-indigo-500 transition-colors"><i className="fa-solid fa-pencil text-[10px]"></i></button>
                          <button onClick={() => { if(confirm('Purge sub-account?')) deleteSubAccount(acc.id, sub.id) }} className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
        <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 px-2">Danger Zone</h2>
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
        <p className="mt-4 px-6 text-[8px] font-medium text-slate-400 uppercase text-center tracking-widest leading-relaxed">
          Master deletion tools are also available in <span className="text-indigo-500 font-bold">System Settings</span>.
        </p>
      </div>

      {isAccModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleSaveAcc} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">{editingAcc ? 'Update Ledger' : 'New Ledger'}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="relative" ref={accIconRef}>
                  <button type="button" onClick={() => setIsAccIconDropdownOpen(!isAccIconDropdownOpen)} className="w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-inner">
                    <i className={`fa-solid ${accForm.icon} text-xl`}></i>
                  </button>
                  {isAccIconDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[240px] bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 grid grid-cols-5 gap-1 rounded-2xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                      {ICONS.map(i => (
                        <button key={i} type="button" onClick={() => { setAccForm({...accForm, icon: i}); setIsAccIconDropdownOpen(false); }} className={`w-full aspect-square flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${accForm.icon === i ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                          <i className={`fa-solid ${i}`}></i>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Account Name</label>
                  <input type="text" value={accForm.name} onChange={e => setAccForm({...accForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="e.g. HDFC Bank" required />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Brand Color</label>
                <input type="color" value={accForm.color} onChange={e => setAccForm({...accForm, color: e.target.value})} className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none cursor-pointer" />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setIsAccModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px]">Cancel</button>
              <button type="submit" className="flex-2 gradient-purple text-white px-8 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Commit</button>
            </div>
          </form>
        </div>
      )}

      {isSubModalOpen && editingSub && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleSaveSub} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">{editingSub.sub.id ? 'Modify Branch' : 'New Branch'}</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="relative" ref={subIconRef}>
                  <button type="button" onClick={() => setIsSubIconDropdownOpen(!isSubIconDropdownOpen)} className="w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-inner">
                    <i className={`fa-solid ${subForm.icon} text-xl`}></i>
                  </button>
                  {isSubIconDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[240px] bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 grid grid-cols-5 gap-1 rounded-2xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                      {ICONS.map(i => (
                        <button key={i} type="button" onClick={() => { setSubForm({...subForm, icon: i}); setIsSubIconDropdownOpen(false); }} className={`w-full aspect-square flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${subForm.icon === i ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                          <i className={`fa-solid ${i}`}></i>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Branch Name</label>
                  <input type="text" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" required />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Balance ({settings.currencySymbol})</label>
                <input type="number" value={subForm.balance} onChange={e => setSubForm({...subForm, balance: e.target.value})} onFocus={e => e.currentTarget.select()} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" />
              </div>

              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-200">Enable Billing Cycle</span>
                    <button type="button" onClick={() => setSubForm({...subForm, cycleEnabled: !subForm.cycleEnabled})} className={`w-10 h-5 rounded-full relative transition-colors ${subForm.cycleEnabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${subForm.cycleEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>

                 {subForm.cycleEnabled && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                       <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1 block">Cycle Start Day (Monthly)</label>
                            <input type="number" min="1" max="31" value={subForm.startDay} onChange={e => setSubForm({...subForm, startDay: e.target.value})} onFocus={e => e.currentTarget.select()} className="w-full bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold outline-none border border-slate-100" />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <div>
                             <label className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1 block">Due After (Days)</label>
                             <input type="number" min="0" value={subForm.dueDaysAfterEnd} onChange={e => setSubForm({...subForm, dueDaysAfterEnd: e.target.value})} onFocus={e => e.currentTarget.select()} className="w-full bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold outline-none border border-slate-100" />
                          </div>
                          <div>
                             <label className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1 block">Notify (Lead Days)</label>
                             <input type="number" min="0" value={subForm.alertDaysBefore} onChange={e => setSubForm({...subForm, alertDaysBefore: e.target.value})} onFocus={e => e.currentTarget.select()} className="w-full bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-[10px] font-bold outline-none border border-slate-100" />
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setIsSubModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px]">Cancel</button>
              <button type="submit" className="flex-2 gradient-purple text-white px-8 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Commit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Vaults;
