
import React, { useMemo, useState } from 'react';
import { useAppState } from '../store';
import { TransactionType, Transaction, Account, SubAccount, BillReminder } from '../types';

interface Props {
  onCompleteBill: (bill: Partial<BillReminder>) => void;
}

interface AssignedSettlement {
  transaction: Transaction;
  amountApplied: number;
}

interface CyclePeriod {
  id: string;
  start: Date;
  end: Date;
  dueDate: Date;
  spent: number;
  paid: number; // Local payments made within dates
  externalSettlements: AssignedSettlement[]; // Payments from future cycles assigned here
  cumulativeAtEnd: number; // Includes local activity + external assignments
  outstandingDebt: number; 
  isSettled: boolean;
  isCurrent: boolean;
  localTransactions: Transaction[];
}

const CycleExplorer: React.FC<Props> = ({ onCompleteBill }) => {
  const { 
    transactions, 
    accounts, 
    billReminders,
    settings, 
    theme,
    handledReminders,
    handleReminderAction
  } = useAppState();

  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDate();

  const getCycleStart = (date: Date, startDay: number) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d.getDate() < startDay) {
      d.setMonth(d.getMonth() - 1);
    }
    d.setDate(startDay);
    return d;
  };

  // SYSTEM ALERTS GENERATOR
  const allAlerts = useMemo(() => {
    const alerts: any[] = [];
    const currentMY = `${today.getMonth() + 1}-${today.getFullYear()}`;
    
    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const monthInflow = monthTxs.filter(t => t.type === TransactionType.INCOME).reduce((s,t) => s + t.amount, 0);
    const monthOutflow = monthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t) => s + t.amount, 0);

    if (settings.budgetAlertEnabled && monthInflow > 0) {
      const thresholdVal = monthInflow * (settings.budgetAlertThreshold / 100);
      if (monthOutflow > thresholdVal) {
        const handled = handledReminders.some(h => h.reminderId === 'budget-overflow' && h.monthYear === currentMY);
        if (!handled) {
          alerts.push({
            id: 'budget-overflow',
            type: 'CRITICAL',
            msg: `Budget Warning`,
            icon: 'fa-triangle-exclamation',
            source: 'BUDGET',
            data: { title: `Spending exceeds ${settings.budgetAlertThreshold}% of income.`, monthYear: currentMY }
          });
        }
      }
    }

    billReminders.forEach(rem => {
      const handled = handledReminders.some(h => h.reminderId === rem.id && h.monthYear === currentMY);
      if (handled) return;
      const isDue = rem.dueDay === todayDay;
      const isOverdue = rem.dueDay < todayDay;
      const isSoon = rem.dueDay > todayDay && (rem.dueDay - todayDay) <= rem.alertDaysBefore;
      if (isDue || isOverdue || isSoon) {
        alerts.push({
          id: rem.id,
          type: isDue || isOverdue ? 'CRITICAL' : 'WARNING',
          msg: isDue ? 'Due Today' : isOverdue ? 'Overdue' : 'Upcoming',
          icon: rem.icon || 'fa-receipt',
          source: 'BILL',
          data: { ...rem, monthYear: currentMY }
        });
      }
    });

    return alerts;
  }, [transactions, billReminders, settings, handledReminders, todayDay]);

  // WATERFALL CYCLE ENGINE WITH EXPLICIT ASSIGNMENT
  const masterLedger = useMemo(() => {
    const results: { 
      account: Account, 
      sub: SubAccount, 
      cycles: CyclePeriod[],
      totalCredit: number,
      totalDebit: number,
      totalBalance: number
    }[] = [];

    accounts.forEach(acc => {
      acc.subAccounts.forEach(sub => {
        if (!sub.billingCycle?.enabled) return;

        const bc = sub.billingCycle;
        const startDay = bc.startDay || 27;
        const subTxs = transactions.filter(t => t.subAccountId === sub.id || t.toSubAccountId === sub.id)
          .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

        // Overall Totals
        const totalCredit = subTxs.filter(t => (t.type === TransactionType.INCOME && t.subAccountId === sub.id) || (t.type === TransactionType.TRANSFER && t.toSubAccountId === sub.id))
          .reduce((s, t) => s + t.amount, 0);
        const totalDebit = subTxs.filter(t => (t.type === TransactionType.EXPENSE && t.subAccountId === sub.id) || (t.type === TransactionType.TRANSFER && t.subAccountId === sub.id))
          .reduce((s, t) => s + t.amount, 0);

        if (subTxs.length === 0) {
          results.push({ account: acc, sub, cycles: [], totalCredit, totalDebit, totalBalance: totalCredit - totalDebit });
          return;
        }

        // 1. Create Baseline Cycle Structures
        let earliestTxDate = new Date(subTxs[0].date + 'T00:00:00');
        if (isNaN(earliestTxDate.getTime())) earliestTxDate = today;
        
        let currentCycleStart = getCycleStart(earliestTxDate, startDay);
        const todayCycleStart = getCycleStart(today, startDay);
        
        const subCycles: CyclePeriod[] = [];
        let iterations = 0;
        const MAX_ITERATIONS = 240; // Max 20 years of data history

        while (currentCycleStart <= todayCycleStart && iterations < MAX_ITERATIONS) {
          iterations++;
          const currentCycleEnd = new Date(currentCycleStart);
          currentCycleEnd.setMonth(currentCycleEnd.getMonth() + 1);
          currentCycleEnd.setDate(currentCycleEnd.getDate() - 1);
          currentCycleEnd.setHours(23, 59, 59, 999);

          const cycleTxs = subTxs.filter(t => {
            const td = new Date(t.date + 'T00:00:00');
            return td >= currentCycleStart && td <= currentCycleEnd;
          });

          const spent = cycleTxs.filter(t => (t.type === TransactionType.EXPENSE || (t.type === TransactionType.TRANSFER && t.subAccountId === sub.id)))
            .reduce((s, t) => s + t.amount, 0);
          
          const paid = cycleTxs.filter(t => (t.type === TransactionType.INCOME && t.subAccountId === sub.id) || (t.type === TransactionType.TRANSFER && t.toSubAccountId === sub.id))
            .reduce((s, t) => s + t.amount, 0);

          subCycles.push({
            id: `${sub.id}-${currentCycleStart.getTime()}`,
            start: new Date(currentCycleStart),
            end: new Date(currentCycleEnd),
            dueDate: new Date(currentCycleEnd.getTime() + (bc.dueDaysAfterEnd * 86400000)),
            spent,
            paid,
            externalSettlements: [],
            cumulativeAtEnd: 0,
            outstandingDebt: 0,
            isSettled: false,
            isCurrent: today >= currentCycleStart && today <= currentCycleEnd,
            localTransactions: cycleTxs
          });

          currentCycleStart.setMonth(currentCycleStart.getMonth() + 1);
        }

        // 2. Perform Waterfall Settlement Assignment
        const allPayments = subTxs
          .filter(t => (t.type === TransactionType.INCOME && t.subAccountId === sub.id) || (t.type === TransactionType.TRANSFER && t.toSubAccountId === sub.id))
          .map(t => ({ transaction: t, available: t.amount }));

        subCycles.forEach(cycle => {
          let cycleDebtRemaining = cycle.spent;
          cycle.paid = 0;
          for (const payObj of allPayments) {
            const payDate = new Date(payObj.transaction.date + 'T00:00:00');
            if (payDate >= cycle.start && payDate <= cycle.end) {
              const applied = Math.min(cycleDebtRemaining, payObj.available);
              payObj.available -= applied;
              cycleDebtRemaining -= applied;
              cycle.paid += applied;
            }
          }

          for (const payObj of allPayments) {
            if (cycleDebtRemaining <= 0) break;
            if (payObj.available <= 0) continue;
            const payDate = new Date(payObj.transaction.date + 'T00:00:00');
            const isExternal = payDate < cycle.start || payDate > cycle.end;
            if (isExternal) {
              const applied = Math.min(cycleDebtRemaining, payObj.available);
              payObj.available -= applied;
              cycleDebtRemaining -= applied;
              cycle.externalSettlements.push({
                transaction: payObj.transaction,
                amountApplied: applied
              });
            }
          }
          cycle.outstandingDebt = cycleDebtRemaining;
          cycle.isSettled = cycleDebtRemaining <= 0;
        });

        // 3. Finalize Cumulative Totals for UI
        let rollingGlobalBalance = 0;
        subCycles.sort((a,b) => a.start.getTime() - b.start.getTime()).forEach(cycle => {
          const externalCredits = cycle.externalSettlements.reduce((s, e) => s + e.amountApplied, 0);
          rollingGlobalBalance += (cycle.paid - cycle.spent + externalCredits);
          cycle.cumulativeAtEnd = rollingGlobalBalance;
        });

        results.push({ 
          account: acc, 
          sub, 
          cycles: subCycles.reverse(), 
          totalCredit, 
          totalDebit, 
          totalBalance: totalCredit - totalDebit 
        });
      });
    });

    return results;
  }, [accounts, transactions, today]);

  const formatDateShort = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto hide-scrollbar">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Alerts</h1>
      </div>

      <div className="space-y-10">
        {allAlerts.length > 0 && (
          <div className="space-y-3">
            {allAlerts.map((alert, idx) => (
              <div key={idx} className={`p-5 rounded-[2rem] border flex items-center gap-4 ${alert.type === 'CRITICAL' ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/10' : 'bg-amber-50 border-amber-100 dark:bg-amber-500/10'}`}>
                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${alert.type === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    <i className={`fa-solid ${alert.icon} text-xs`}></i>
                 </div>
                 <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block leading-tight">{alert.msg}</span>
                    <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5">{alert.data?.title || alert.data?.name}</p>
                 </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-12">
          {masterLedger.map((vault) => (
            <div key={vault.sub.id} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg" style={{ backgroundColor: vault.account.color }}>
                        <i className={`fa-solid ${vault.sub.icon || 'fa-credit-card'}`}></i>
                      </div>
                      <div>
                        <h3 className="text-xs font-black dark:text-white uppercase leading-none mb-1">{vault.sub.name}</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Bill Activity</p>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 px-2">
                  <div className="bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 text-center">
                    <span className="text-[7px] font-black text-emerald-500 uppercase block mb-0.5">Total Inflow</span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400" style={{ fontFamily: 'JetBrains Mono' }}>
                      {settings.currencySymbol}{vault.totalCredit.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-500/5 p-3 rounded-2xl border border-rose-100 dark:border-rose-500/10 text-center">
                    <span className="text-[7px] font-black text-rose-500 uppercase block mb-0.5">Total Outflow</span>
                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400" style={{ fontFamily: 'JetBrains Mono' }}>
                      {settings.currencySymbol}{vault.totalDebit.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/5 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 text-center">
                    <span className="text-[7px] font-black text-indigo-500 uppercase block mb-0.5">Net Balance</span>
                    <span className={`text-[10px] font-black ${vault.totalBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                      {settings.currencySymbol}{vault.totalBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {vault.cycles.map((cycle) => (
                  <div 
                    key={cycle.id}
                    onClick={() => setExpandedCycleId(expandedCycleId === cycle.id ? null : cycle.id)}
                    className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${cycle.isCurrent ? 'ring-2 ring-indigo-500/30' : ''} ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className={`text-[10px] font-black uppercase tracking-widest ${cycle.isSettled ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {cycle.isCurrent ? 'Active Tracking' : cycle.isSettled ? 'Period Settled' : 'Debt Outstanding'}
                             </span>
                             {cycle.isSettled && <i className="fa-solid fa-circle-check text-emerald-500 text-[10px]"></i>}
                          </div>
                          <h4 className="text-sm font-black dark:text-slate-100 uppercase">{formatDateShort(cycle.start)} — {formatDateShort(cycle.end)}</h4>
                          {!cycle.isSettled && (
                            <p className="text-[8px] font-bold text-rose-400 uppercase mt-1.5 tracking-widest">Due Date: {formatDateShort(cycle.dueDate)}</p>
                          )}
                       </div>
                       <div className="text-right">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Due Amount</span>
                          <span className={`text-lg font-black ${cycle.isSettled ? 'text-slate-300 dark:text-slate-600' : 'text-rose-500'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                            {settings.currencySymbol}{cycle.outstandingDebt.toLocaleString()}
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                          <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Outflow Activity</span>
                          <span className="text-xs font-bold text-rose-400">{settings.currencySymbol}{cycle.spent.toLocaleString()}</span>
                       </div>
                       <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                          <span className="text-[7px] font-black text-slate-400 uppercase block mb-1">Inflow Activity</span>
                          <span className="text-xs font-bold text-emerald-400">{settings.currencySymbol}{(cycle.paid + cycle.externalSettlements.reduce((s,e) => s+e.amountApplied, 0)).toLocaleString()}</span>
                       </div>
                    </div>

                    {expandedCycleId === cycle.id && (
                      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2">
                         {!cycle.isSettled && !cycle.isCurrent && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               onCompleteBill({
                                 id: `settle-${cycle.id}`,
                                 title: `${vault.sub.name} Settlement (${formatDateShort(cycle.start)})`,
                                 amount: cycle.outstandingDebt,
                                 accountId: vault.account.id,
                                 subAccountId: vault.sub.id
                               });
                             }}
                             className="w-full py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 active:scale-95 transition-all mb-6"
                           >
                              Settle Period Owed
                           </button>
                         )}
                         
                         <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Cycle Log Details</p>
                         <div className="space-y-3">
                           {cycle.localTransactions.length === 0 && cycle.externalSettlements.length === 0 ? (
                             <p className="text-center py-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">No local entries found</p>
                           ) : (
                             <>
                               {cycle.localTransactions.map((t) => {
                                 const isMoneyIn = (t.type === TransactionType.INCOME && t.subAccountId === vault.sub.id) || 
                                                  (t.type === TransactionType.TRANSFER && t.toSubAccountId === vault.sub.id);
                                 return (
                                   <div key={t.id} className="flex justify-between items-center text-[10px]">
                                      <div className="flex items-center gap-3">
                                         <div className={`w-1.5 h-1.5 rounded-full ${isMoneyIn ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                         <div>
                                            <p className="font-black dark:text-slate-200 leading-tight">{t.title}</p>
                                            <p className="text-[7px] text-slate-400 uppercase">{formatDateShort(new Date(t.date + 'T00:00:00'))}</p>
                                         </div>
                                      </div>
                                      <span className={`font-black ${isMoneyIn ? 'text-emerald-500' : 'text-rose-400'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                                         {isMoneyIn ? '+' : '-'}{settings.currencySymbol}{t.amount.toLocaleString()}
                                      </span>
                                   </div>
                                 );
                               })}
                               {cycle.externalSettlements.map((s, idx) => (
                                 <div key={`ext-${idx}`} className="flex justify-between items-center text-[10px] p-2 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-xl border border-indigo-100/50 dark:border-indigo-500/10">
                                    <div className="flex items-center gap-3">
                                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                       <div>
                                          <p className="font-black text-indigo-600 dark:text-indigo-400 leading-tight">External Settlement: {s.transaction.title}</p>
                                          <p className="text-[7px] text-slate-400 uppercase">Paid on {formatDateShort(new Date(s.transaction.date + 'T00:00:00'))}</p>
                                       </div>
                                    </div>
                                    <span className="font-black text-emerald-500" style={{ fontFamily: 'JetBrains Mono' }}>
                                       +{settings.currencySymbol}{s.amountApplied.toLocaleString()}
                                    </span>
                                 </div>
                               ))}
                             </>
                           )}
                         </div>

                         <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Cycle Total</span>
                            <span className={`text-[10px] font-black ${cycle.cumulativeAtEnd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                               {cycle.cumulativeAtEnd >= 0 ? '+' : ''}{settings.currencySymbol}{cycle.cumulativeAtEnd.toLocaleString()}
                            </span>
                         </div>
                      </div>
                    )}
                    
                    {!expandedCycleId && (
                      <div className="flex justify-center mt-4">
                         <i className="fa-solid fa-chevron-down text-[8px] text-slate-200 group-hover:text-indigo-300 transition-colors"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CycleExplorer;
