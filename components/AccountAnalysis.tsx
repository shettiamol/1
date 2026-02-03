
import React, { useState, useMemo } from 'react';
import { useAppState } from '../store';
import { TransactionType, Transaction, Account, SubAccount } from '../types';

/**
 * AccountAnalysis Component
 * High-precision ledger for account hierarchy and monthly balances.
 */
const AccountAnalysis: React.FC = () => {
  const { transactions, accounts, categories, settings, currentDate, setCurrentDate, theme } = useAppState();
  const [viewTab, setViewTab] = useState<'OVERALL' | 'MONTHLY'>('OVERALL');
  
  const [expandedAccId, setExpandedAccId] = useState<string | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  const changeMonth = (offset: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setCurrentDate(nextDate);
  };

  /**
   * Comprehensive Balance Calculator
   */
  const getSubAccountBalance = (subAccId: string, txList: Transaction[]) => {
    return txList.reduce((acc, t) => {
      // Incoming
      if (t.type === TransactionType.INCOME && t.subAccountId === subAccId) return acc + t.amount;
      if (t.type === TransactionType.TRANSFER && t.toSubAccountId === subAccId) return acc + t.amount;
      // Outgoing
      if (t.type === TransactionType.EXPENSE && t.subAccountId === subAccId) return acc - t.amount;
      if (t.type === TransactionType.TRANSFER && t.subAccountId === subAccId) return acc - t.amount;
      return acc;
    }, 0);
  };

  const renderStatBox = (label: string, value: number, colorClass: string) => (
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[10px] font-bold ${colorClass}`} style={{ fontFamily: 'JetBrains Mono' }}>
        {settings.currencySymbol}{value.toLocaleString()}
      </span>
    </div>
  );

  const filteredTransactions = useMemo(() => {
    if (viewTab === 'MONTHLY') {
      return transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });
    }
    return transactions;
  }, [viewTab, transactions, currentDate]);

  const hasTransactions = (subAccountId: string) => {
    return transactions.some(t => 
      t.subAccountId === subAccountId || 
      t.toSubAccountId === subAccountId
    );
  };

  const activeAccounts = useMemo(() => {
    return accounts.filter(acc => acc.subAccounts.some(sub => hasTransactions(sub.id)));
  }, [accounts, transactions]);

  /**
   * Render helper for individual transaction items
   */
  const renderTxItem = (t: Transaction, currentSubId: string) => {
    const cat = categories.find(c => c.id === t.categoryId);
    const isMoneyIn = (t.type === TransactionType.INCOME && t.subAccountId === currentSubId) || 
                     (t.type === TransactionType.TRANSFER && t.toSubAccountId === currentSubId);
    
    return (
      <div key={t.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700 flex flex-col gap-1 text-[10px] shadow-sm">
        <div className="flex justify-between items-start">
          <span className="font-black dark:text-slate-200 leading-tight truncate flex-1 pr-2">{t.title}</span>
          <span className={`font-black whitespace-nowrap ${isMoneyIn ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontFamily: 'JetBrains Mono' }}>
            {isMoneyIn ? '+' : '-'}{settings.currencySymbol}{t.amount.toLocaleString()}
          </span>
        </div>
        <div className="text-[7px] text-slate-400 uppercase tracking-tighter">
          {new Date(t.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} ({cat?.name || 'Protocol Transfer'})
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto hide-scrollbar">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Account Explorer</h1>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-4 shadow-inner">
        {(['OVERALL', 'MONTHLY'] as const).map(tab => (
           <button 
            key={tab}
            onClick={() => {
              setViewTab(tab);
              setExpandedSubId(null);
            }} 
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl ${viewTab === tab ? 'bg-white shadow-md text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {viewTab === 'MONTHLY' && (
        <div className="flex justify-between items-center mb-6 px-1 animate-in slide-in-from-top-2">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-chevron-left text-[10px]"></i>
          </button>
          <div className="text-center">
            <span className="text-[11px] font-black uppercase tracking-widest dark:text-white block">
              {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 hover:opacity-70 transition-opacity"
            >
              Goto Present Day
            </button>
          </div>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-500 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      )}

      <div className="space-y-4">
        {activeAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
             <i className="fa-solid fa-ghost text-4xl mb-4"></i>
             <p className="text-xs font-black uppercase tracking-widest">No active account ledger records</p>
          </div>
        ) : (
          activeAccounts.map(acc => {
            const activeSubAccounts = acc.subAccounts.filter(sub => hasTransactions(sub.id));
            const subBalances = activeSubAccounts.map(sub => getSubAccountBalance(sub.id, filteredTransactions));
            const totalBalance = subBalances.reduce((s, b) => s + b, 0);
            const isExpanded = expandedAccId === acc.id;

            return (
              <div key={acc.id} className="space-y-2">
                <div 
                  onClick={() => setExpandedAccId(isExpanded ? null : acc.id)}
                  className={`p-5 rounded-[2.25rem] border transition-all cursor-pointer ${isExpanded ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-xl' : 'border-slate-100 bg-white dark:bg-slate-800/40 dark:border-slate-800'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: acc.color }}>
                        <i className={`fa-solid ${acc.icon || 'fa-building-columns'}`}></i>
                      </div>
                      <div>
                        <h3 className="text-sm font-black dark:text-white leading-none mb-1">{acc.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Master Ledger</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {renderStatBox('Balance', totalBalance, totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500')}
                      <i className={`fa-solid fa-chevron-down text-[10px] text-slate-300 mt-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2">
                      {activeSubAccounts.map((sub, idx) => {
                        const subBal = subBalances[idx];
                        const isSubExpanded = expandedSubId === sub.id;
                        
                        const subTxs = filteredTransactions
                          .filter(t => (t.subAccountId === sub.id || t.toSubAccountId === sub.id))
                          .sort((a,b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

                        const groupedTxs = subTxs.reduce((acc, t) => {
                          const d = new Date(t.date + 'T00:00:00');
                          const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(t);
                          return acc;
                        }, {} as Record<string, Transaction[]>);

                        return (
                          <div key={sub.id} className="space-y-2">
                            <div 
                              onClick={(e) => { e.stopPropagation(); setExpandedSubId(isSubExpanded ? null : sub.id); }}
                              className={`p-4 rounded-2xl border flex justify-between items-center ${isSubExpanded ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}
                            >
                               <div className="flex items-center gap-3">
                                  <i className={`fa-solid ${sub.icon || 'fa-wallet'} text-slate-400 text-xs`}></i>
                                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">{sub.name}</span>
                               </div>
                               <div className="flex items-center gap-4">
                                  {renderStatBox('Balance', subBal, subBal >= 0 ? 'text-emerald-500' : 'text-rose-500')}
                                  <i className={`fa-solid fa-chevron-down text-[8px] text-slate-300 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`}></i>
                               </div>
                            </div>

                            {isSubExpanded && (
                              <div className="ml-4 space-y-6 animate-in slide-in-from-top-2 pt-2">
                                 {viewTab === 'OVERALL' ? (
                                    Object.entries(groupedTxs).map(([monthYear, txs]) => (
                                      <div key={monthYear} className="space-y-3">
                                         <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-indigo-500/30">{monthYear}</h4>
                                         <div className="space-y-2">
                                            {(txs as Transaction[]).map(t => renderTxItem(t, sub.id))}
                                         </div>
                                      </div>
                                    ))
                                 ) : (
                                    <div className="space-y-2">
                                       {subTxs.map(t => renderTxItem(t, sub.id))}
                                    </div>
                                 )}
                                 {subTxs.length === 0 && (
                                   <p className="text-center py-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">No activity found</p>
                                 )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AccountAnalysis;
