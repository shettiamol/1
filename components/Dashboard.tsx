
import React, { useState, useMemo } from 'react';
import { useAppState } from '../store';
import { TransactionType, PendingTransaction, BillReminder, Transaction, DashboardWidget, FinancialGoal, Account, SubAccount } from '../types';

const Dashboard: React.FC<{ 
  onReviewPending: (pt: PendingTransaction) => void,
  onCompleteBill: (bill: Partial<BillReminder>) => void 
}> = ({ onReviewPending, onCompleteBill }) => {
  const { 
    transactions, 
    pendingTransactions,
    categories, 
    billReminders, 
    accounts, 
    goals,
    currentDate, 
    theme, 
    settings, 
    updateSettings,
    handledReminders,
    handleReminderAction,
    dismissPendingTransaction,
    deleteGoal,
    processSMS
  } = useAppState();
  
  const [isManagingWidgets, setIsManagingWidgets] = useState(false);
  const [activeBreachId, setActiveBreachId] = useState<string | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [showSMSInfo, setShowSMSInfo] = useState(false);

  const toggleWidget = (id: string) => {
    const updatedWidgets = settings.dashboardWidgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    );
    updateSettings({ dashboardWidgets: updatedWidgets });
  };

  const handleSyncClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        processSMS(text);
        alert("System synchronized with clipboard message.");
      } else {
        alert("Clipboard is empty. Copy an SMS or message first.");
      }
    } catch (err) {
      alert("Permission required to access system messages clipboard.");
    }
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

  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const todayDay = today.getDate();
  const currentMY = `${today.getMonth() + 1}-${today.getFullYear()}`;

  const getNetBalance = (txs: Transaction[]) => {
    return txs.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) return acc + t.amount;
      if (t.type === TransactionType.EXPENSE) return acc - t.amount;
      return acc;
    }, 0);
  };

  const endOfViewedMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
  const historyTxs = transactions.filter(t => new Date(t.date + 'T00:00:00') <= endOfViewedMonth);

  const monthTxs = historyTxs.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  const monthInflow = monthTxs.filter(t => t.type === TransactionType.INCOME).reduce((s,t) => s + t.amount, 0);
  const monthOutflow = monthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t) => s + t.amount, 0);
  const monthNet = monthInflow - monthOutflow;

  const runningNet = getNetBalance(historyTxs);
  const runningInflow = historyTxs.filter(t => t.type === TransactionType.INCOME).reduce((s,t) => s + t.amount, 0);
  const runningOutflow = historyTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s,t) => s + t.amount, 0);

  const currentMonthName = currentDate.toLocaleString('en-US', { month: 'long' });

  const alerts = useMemo(() => {
    const items: any[] = [];
    
    // Budget Alert
    if (settings.budgetAlertEnabled && monthInflow > 0) {
      const thresholdVal = monthInflow * (settings.budgetAlertThreshold / 100);
      if (monthOutflow > thresholdVal) {
        const handled = handledReminders.some(h => h.reminderId === 'budget-overflow' && h.monthYear === currentMY);
        if (!handled) {
          items.push({
            id: 'budget-overflow',
            type: 'CRITICAL',
            msg: `Budget Warning`,
            icon: 'fa-triangle-exclamation',
            source: 'BUDGET',
            data: { title: `Overall burn rate is above ${settings.budgetAlertThreshold}% of income.`, monthYear: currentMY }
          });
        }
      }
    }

    // Goal Deadlines Alert
    goals.forEach(goal => {
      if (!goal.deadline) return;
      const deadlineDate = new Date(goal.deadline);
      const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= (goal.alertDaysBefore ?? 3) && diffDays >= -30) {
        const alertId = `goal-near-${goal.id}`;
        const handled = handledReminders.some(h => h.reminderId === alertId);
        if (!handled) {
          items.push({
            id: alertId,
            type: diffDays <= 2 ? 'CRITICAL' : 'WARNING',
            msg: `Goal Milestone Approaching`,
            icon: 'fa-bullseye',
            source: 'GOAL_DEADLINE',
            data: { title: `${goal.name} deadline is ${diffDays === 0 ? 'today' : diffDays < 0 ? 'passed' : `in ${diffDays} days`}.`, monthYear: currentMY }
          });
        }
      }
    });

    return items;
  }, [monthInflow, monthOutflow, settings.budgetAlertThreshold, settings.budgetAlertEnabled, handledReminders, currentMY, goals, today]);

  const billAlertsList = useMemo(() => {
    return billReminders.filter(rem => {
      const handled = handledReminders.some(h => h.reminderId === rem.id && h.monthYear === currentMY);
      if (handled) return false;
      const isDue = rem.dueDay === todayDay;
      const isSoon = rem.dueDay > todayDay && (rem.dueDay - todayDay) <= rem.alertDaysBefore;
      const isOverdue = rem.dueDay < todayDay;
      return isDue || isSoon || isOverdue;
    });
  }, [billReminders, handledReminders, currentMY, todayDay]);

  const budgetBreaches = useMemo(() => {
    const breaches: { id: string, name: string, icon: string, usage: number, limit: number, color: string, spent: number, parentName?: string }[] = [];
    const threshold = settings.budgetAlertThreshold / 100;

    categories.forEach(cat => {
      const handled = handledReminders.some(h => h.reminderId === `budget-cat-${cat.id}` && h.monthYear === currentMY);
      if (!handled && cat.type === TransactionType.EXPENSE && cat.budgetLimit > 0) {
        const spent = monthTxs.filter(t => t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0);
        const usage = spent / cat.budgetLimit;
        if (usage >= threshold) breaches.push({ id: `budget-cat-${cat.id}`, name: cat.name, icon: cat.icon, usage, limit: cat.budgetLimit, color: cat.color, spent });
      }
      cat.subCategories.forEach(sub => {
        const handledSub = handledReminders.some(h => h.reminderId === `budget-sub-${sub.id}` && h.monthYear === currentMY);
        if (!handledSub && sub.budget && sub.budget > 0) {
          const spent = monthTxs.filter(t => t.subCategoryId === sub.id).reduce((s, t) => s + t.amount, 0);
          const usage = spent / sub.budget;
          if (usage >= threshold) breaches.push({ id: `budget-sub-${sub.id}`, name: sub.name, icon: sub.icon || 'fa-tag', usage, limit: sub.budget, color: cat.color, spent, parentName: cat.name });
        }
      });
    });
    return breaches;
  }, [categories, monthTxs, handledReminders, currentMY, settings.budgetAlertThreshold]);

  const cycleAlerts = useMemo(() => {
    const results: { sub: SubAccount, due: number, dueDate: Date, cycleStart: Date, cycleEnd: Date, isPaid: boolean }[] = [];
    accounts.forEach(acc => {
      acc.subAccounts.forEach(sub => {
        if (sub.billingCycle?.enabled) {
          const bc = sub.billingCycle;
          const startDay = bc.startDay || 27;
          let activeStart = new Date(today.getFullYear(), today.getMonth(), startDay);
          if (today < activeStart) activeStart = new Date(today.getFullYear(), today.getMonth() - 1, startDay);
          
          let outstandingStart = new Date(activeStart);
          outstandingStart.setMonth(outstandingStart.getMonth() - 1);
          let outstandingEnd = new Date(activeStart.getTime() - 1000);
          const dueDate = new Date(outstandingEnd);
          dueDate.setDate(dueDate.getDate() + bc.dueDaysAfterEnd);

          const subTxs = transactions.filter(t => (t.subAccountId === sub.id || t.toSubAccountId === sub.id));
          const stmtSpending = subTxs.filter(t => {
            const td = new Date(t.date + 'T00:00:00');
            return (t.type === TransactionType.EXPENSE || (t.type === TransactionType.TRANSFER && t.subAccountId === sub.id)) && td >= outstandingStart && td <= outstandingEnd;
          }).reduce((s, t) => s + t.amount, 0);
          const stmtPayments = subTxs.filter(t => {
            const td = new Date(t.date + 'T00:00:00');
            return (t.type === TransactionType.INCOME || (t.type === TransactionType.TRANSFER && t.toSubAccountId === sub.id)) && td >= outstandingStart && td <= dueDate;
          }).reduce((s, t) => s + t.amount, 0);

          const outstandingDue = Math.max(0, stmtSpending - stmtPayments);
          if (outstandingDue > 0) {
            results.push({ 
              sub, 
              due: outstandingDue, 
              dueDate, 
              cycleStart: outstandingStart,
              cycleEnd: outstandingEnd,
              isPaid: false 
            });
          }
        }
      });
    });
    return results;
  }, [accounts, transactions, today]);

  const renderWidget = (widgetId: string) => {
    const widget = settings.dashboardWidgets.find(w => w.id === widgetId);
    if (!widget || !widget.enabled) return null;

    const miniCard = (label: string, value: number, icon: string, color: string, variant: 'emerald' | 'rose' | 'indigo' | 'slate') => {
      const colors = {
        emerald: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/5 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/10',
        rose: 'bg-rose-50 text-rose-500 dark:bg-rose-500/5 dark:text-rose-400 border-rose-100 dark:border-rose-500/10',
        indigo: 'bg-indigo-50 text-indigo-500 dark:bg-indigo-500/5 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/10',
        slate: 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-100 dark:border-slate-700'
      };
      
      return (
        <div key={widgetId} className={`py-3 px-5 rounded-[2.25rem] border ${colors[variant]} animate-in zoom-in-95 flex flex-col justify-center min-h-[72px] relative overflow-hidden group`}>
           <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
              <i className={`fa-solid ${icon} text-xl`}></i>
           </div>
           <div>
              <span className="text-[8px] font-black uppercase tracking-widest block mb-0.5 opacity-70">{label}</span>
              <h3 className="text-lg font-black" style={{ fontFamily: 'JetBrains Mono' }}>
                {settings.currencySymbol}{value.toLocaleString()}
              </h3>
           </div>
        </div>
      );
    };

    switch (widgetId) {
      case 'TOTAL_NET':
        return (
          <div key="TOTAL_NET" className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in space-y-0.5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
              <i className="fa-solid fa-vault text-3xl"></i>
            </div>
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 ml-0.5">
              Net Capital (lifetime)
            </p>
            <h1 className="text-3xl font-extrabold tracking-tighter dark:text-white">
              {settings.currencySymbol}{runningNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h1>
          </div>
        );
      case 'TOTAL_INFLOW': return miniCard('Total Inflow', runningInflow, 'fa-arrow-trend-up', '#10b981', 'emerald');
      case 'TOTAL_OUTFLOW': return miniCard('Total Outflow', runningOutflow, 'fa-arrow-trend-down', '#ef4444', 'rose');
      
      case 'MONTHLY_NET':
        return (
          <div key="MONTHLY_NET" className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in space-y-0.5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:opacity-20 transition-opacity">
              <i className="fa-solid fa-calendar-check text-3xl"></i>
            </div>
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 ml-0.5">
              {currentMonthName} Net
            </p>
            <h1 className={`text-3xl font-extrabold tracking-tighter ${monthNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {settings.currencySymbol}{monthNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h1>
          </div>
        );
      case 'MONTHLY_INFLOW': return miniCard(`${currentMonthName} Inflow`, monthInflow, 'fa-circle-down', '#10b981', 'emerald');
      case 'MONTHLY_OUTFLOW': return miniCard(`${currentMonthName} Outflow`, monthOutflow, 'fa-circle-up', '#ef4444', 'rose');

      case 'BILL_REMINDERS_SPECIFIC':
        if (billAlertsList.length === 0) return null;
        return (
          <div key="BILL_REMINDERS_SPECIFIC" className="space-y-3 animate-in slide-in-from-top-2">
             <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Bill reminder alerts</p>
             {billAlertsList.map(rem => {
               const isDue = rem.dueDay === todayDay;
               const isOverdue = rem.dueDay < todayDay;
               const daysLeft = rem.dueDay - todayDay;
               const dueDateLabel = new Date(today.getFullYear(), today.getMonth(), rem.dueDay).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
               const isExpanded = activeAlertId === rem.id;

               return (
                 <div 
                   key={rem.id} 
                   onClick={() => setActiveAlertId(isExpanded ? null : rem.id)}
                   className={`flex flex-col gap-4 p-6 rounded-[2.5rem] border cursor-pointer transition-all ${isDue || isOverdue ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/10' : 'bg-sky-50/40 border-sky-100/50 dark:bg-sky-500/5 dark:border-sky-500/10 shadow-sm'}`}
                 >
                    <div className="flex justify-between items-center">
                       <h4 className="text-[11px] font-black dark:text-white uppercase tracking-tight">{rem.title}</h4>
                       <p className="text-[14px] font-black text-slate-800 dark:text-slate-100" style={{fontFamily:'JetBrains Mono'}}>{settings.currencySymbol}{rem.amount?.toLocaleString()}</p>
                    </div>
                    <div>
                       <p className={`text-[9px] font-black uppercase tracking-widest ${isDue || isOverdue ? 'text-rose-600' : 'text-sky-600/70'}`}>
                         Due: {dueDateLabel} - {isOverdue ? 'OVERDUE' : `${Math.abs(daysLeft)}D ${daysLeft < 0 ? 'Ago' : 'Left'}`}
                       </p>
                    </div>
                    {isExpanded && (
                      <div className="flex gap-2 animate-in slide-in-from-top-1">
                         <button 
                           onClick={(e) => { e.stopPropagation(); onCompleteBill(rem); }} 
                           className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${isDue || isOverdue ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-indigo-500 text-white shadow-indigo-200'}`}
                         >
                            Settle
                         </button>
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleReminderAction(rem.id, 'DISMISSED', currentMY); }} 
                           className="flex-1 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform"
                         >
                            Dismiss
                         </button>
                      </div>
                    )}
                 </div>
               );
             })}
          </div>
        );

      case 'BUDGET_WARNINGS_SPECIFIC':
        if (budgetBreaches.length === 0) return null;
        return (
          <div key="BUDGET_WARNINGS_SPECIFIC" className="space-y-3 animate-in fade-in">
             <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Budget warnings</p>
             <div className="p-6 rounded-[2.5rem] bg-amber-50/40 dark:bg-amber-500/5 border border-amber-100/50 dark:border-amber-500/10 shadow-sm space-y-5">
              {budgetBreaches.map((b, i) => {
                const isExpanded = activeBreachId === b.id;
                return (
                  <div 
                      key={i} 
                      className="space-y-3 p-1 relative group cursor-pointer"
                      onClick={() => setActiveBreachId(isExpanded ? null : b.id)}
                  >
                      <div className="flex justify-between items-center px-1">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <i className={`fa-solid ${b.icon} text-[10px]`} style={{ color: b.color }}></i>
                              <span className="text-[11px] font-black uppercase dark:text-white">
                                {b.parentName ? `${b.parentName} > ` : ''}{b.name}
                              </span>
                            </div>
                        </div>
                        {isExpanded ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleReminderAction(b.id, 'DISMISSED', currentMY); }}
                              className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center animate-in zoom-in-50"
                            >
                              <i className="fa-solid fa-xmark text-[10px]"></i>
                            </button>
                        ) : (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${b.usage >= 1 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-white'}`}>
                              {(b.usage * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-1000 ${b.usage >= 1 ? 'bg-rose-500' : 'bg-amber-400'}`} 
                            style={{ width: `${Math.min(100, b.usage * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Limit: {settings.currencySymbol}{b.limit.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total: {settings.currencySymbol}{b.spent.toLocaleString()}</span>
                      </div>
                  </div>
                );
              })}
             </div>
          </div>
        );

      case 'VAULT_CYCLE_ALERTS':
        if (cycleAlerts.length === 0) return null;
        return (
          <div key="VAULT_CYCLE_ALERTS" className="space-y-3 animate-in slide-in-from-top-2">
             <p className="text-[10px] font-black tracking-widest uppercase text-indigo-500 ml-1">Bill Settlement alerts</p>
             {cycleAlerts.map((cycle, idx) => {
               const isExpanded = activeCycleId === cycle.sub.id;
               const rangeStr = `${cycle.cycleStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${cycle.cycleEnd.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
               return (
                 <div 
                   key={idx} 
                   onClick={() => setActiveCycleId(isExpanded ? null : cycle.sub.id)}
                   className="p-6 rounded-[2.5rem] bg-indigo-50/40 border border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/20 flex flex-col gap-4 cursor-pointer hover:shadow-sm transition-all"
                 >
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
                             <i className={`fa-solid ${cycle.sub.icon || 'fa-credit-card'}`}></i>
                          </div>
                          <div>
                             <h4 className="text-[11px] font-black uppercase dark:text-white leading-tight">{cycle.sub.name}</h4>
                             <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                               Due: {cycle.dueDate.toLocaleDateString('en-US', { day:'numeric', month:'short' })} (Cycle: {rangeStr})
                             </p>
                          </div>
                       </div>
                       <span className="text-sm font-black text-rose-500" style={{fontFamily:'JetBrains Mono'}}>
                          {settings.currencySymbol}{cycle.due.toLocaleString()}
                       </span>
                    </div>
                    {isExpanded && (
                      <div className="flex gap-2 animate-in slide-in-from-top-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteBill({
                              id: `vault-cycle-${cycle.sub.id}`,
                              title: `${cycle.sub.name} Cycle Settlement`,
                              amount: cycle.due,
                              accountId: accounts.find(a => a.id === cycle.sub.id) ? cycle.sub.id : accounts.find(a => a.subAccounts.some(s => s.id === cycle.sub.id))?.id,
                              subAccountId: cycle.sub.id,
                              monthYear: currentMY
                            });
                          }}
                          className="flex-1 py-3 bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                        >
                          Settle
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReminderAction(`vault-cycle-${cycle.sub.id}`, 'DISMISSED', currentMY);
                          }}
                          className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                 </div>
               );
             })}
          </div>
        );

      case 'ALERTS':
        if (alerts.length === 0) return null;
        return (
          <div key="ALERTS" className="space-y-3 animate-in slide-in-from-top-2">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">total budget warning...</p>
            {alerts.map((alert, idx) => {
              const isExpanded = activeAlertId === alert.id;
              
              if (alert.id === 'budget-overflow') {
                const usage = monthOutflow / (monthInflow || 1);
                return (
                  <div 
                    key={idx} 
                    onClick={() => setActiveAlertId(isExpanded ? null : alert.id)}
                    className="p-6 rounded-[2.5rem] bg-rose-50 border border-rose-100 dark:bg-rose-500/10 border-rose-500/20 space-y-4 cursor-pointer"
                  >
                     <div className="flex justify-between items-center px-1">
                        <p className="text-[11px] font-black uppercase dark:text-white leading-tight">monthly expense is above {settings.budgetAlertThreshold}% of monthly income</p>
                        {isExpanded ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleReminderAction(alert.id, 'DISMISSED', alert.data?.monthYear); }}
                            className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center animate-in zoom-in-50"
                          >
                            <i className="fa-solid fa-xmark text-[10px]"></i>
                          </button>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-rose-500 text-white">
                             {(usage * 100).toFixed(0)}%
                          </span>
                        )}
                     </div>
                     <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-rose-500 transition-all duration-1000" 
                           style={{ width: `${Math.min(100, usage * 100)}%` }}
                        ></div>
                     </div>
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Income: {settings.currencySymbol}{monthInflow.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Expense: {settings.currencySymbol}{monthOutflow.toLocaleString()}</span>
                     </div>
                  </div>
                );
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => setActiveAlertId(isExpanded ? null : alert.id)}
                  className={`flex flex-col gap-3 p-5 rounded-[2.25rem] border cursor-pointer ${alert.type === 'CRITICAL' ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/10' : 'bg-amber-50 border-amber-100 dark:bg-amber-500/10'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${alert.type === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                      <i className={`fa-solid ${alert.icon} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${alert.type === 'CRITICAL' ? 'text-rose-600' : 'text-amber-600'}`}>{alert.msg}</span>
                       <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mt-0.5">{alert.data?.title}</p>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="flex gap-2 animate-in slide-in-from-top-1">
                      <button onClick={(e) => { e.stopPropagation(); handleReminderAction(alert.id, 'DISMISSED', alert.data?.monthYear); }} className="flex-1 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-400 text-[9px] font-black uppercase border border-slate-100 dark:border-slate-700">Dismiss</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'PENDING_TX':
        return (
          <div key="PENDING_TX" className="space-y-4 animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center px-1 relative">
              <p className="text-[10px] font-black tracking-widest uppercase text-indigo-500 flex items-center gap-2">
                Activity Detections
                <button onClick={() => setShowSMSInfo(!showSMSInfo)} className="text-slate-300 hover:text-indigo-400 transition-colors">
                  <i className="fa-solid fa-circle-info text-[9px]"></i>
                </button>
              </p>
              <button 
                onClick={handleSyncClipboard}
                className="text-[8px] font-black uppercase text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-message mr-1"></i> Sync Clipboard Message
              </button>
              
              {showSMSInfo && (
                <div className="absolute top-full left-0 w-full mt-2 z-20 bg-slate-800 text-white p-3 rounded-xl text-[7px] font-black uppercase tracking-widest border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-top-1">
                   Direct SMS reading is blocked for privacy. Copy an SMS and tap Sync to track activity securely.
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {pendingTransactions.length === 0 ? (
                <div className="p-8 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 text-center opacity-40">
                   <i className="fa-solid fa-radar text-xl mb-2 text-indigo-300"></i>
                   <p className="text-[9px] font-bold uppercase tracking-widest">Scanning clipboard for activity...</p>
                </div>
              ) : (
                pendingTransactions.map(pt => (
                  <div key={pt.id} className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${pt.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                          <i className={`fa-solid ${pt.type === TransactionType.INCOME ? 'fa-circle-arrow-down' : 'fa-circle-arrow-up'}`}></i>
                        </div>
                        <div>
                          <h4 className="text-xs font-black dark:text-white uppercase mb-1">{pt.suggestedTitle}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{pt.date} • {pt.time}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-white" style={{ fontFamily: 'JetBrains Mono' }}>
                         {pt.type === TransactionType.INCOME ? '+' : '-'}{settings.currencySymbol}{pt.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onReviewPending(pt)} className="flex-1 py-3 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-500/20">Verify</button>
                      <button onClick={() => dismissPendingTransaction(pt.id)} className="flex-1 py-3 rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-600 active:scale-95 transition-all">Dismiss</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'GOALS_PROGRESS':
        if (goals.length === 0) return null;
        return (
          <div key="GOALS_PROGRESS" className="space-y-4 animate-in fade-in">
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 ml-1">Goal Progress...</p>
            {goals.map(goal => {
              const isExpanded = activeGoalId === goal.id;
              let current = goal.currentAmount;
              if (goal.linkedSubAccountId) {
                const linked = accounts.flatMap(a => a.subAccounts).find(sa => sa.id === goal.linkedSubAccountId);
                if (linked) current = linked.balance;
              }
              const progress = Math.min(100, (current / (goal.targetAmount || 1)) * 100);
              const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
              const diffDays = deadlineDate ? Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div 
                  key={goal.id} 
                  onClick={() => setActiveGoalId(isExpanded ? null : goal.id)}
                  className="p-6 rounded-[2.5rem] bg-purple-50/40 dark:bg-purple-500/5 border border-purple-100/50 dark:border-purple-500/10 shadow-sm space-y-4 cursor-pointer"
                >
                   <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-black uppercase dark:text-white tracking-tight">{goal.name}</h4>
                      <span className="text-[14px] font-black text-slate-800 dark:text-white" style={{fontFamily: 'JetBrains Mono'}}>{settings.currencySymbol}{goal.targetAmount.toLocaleString()}</span>
                   </div>
                   <div className="space-y-2">
                     <div className="h-2.5 w-full bg-white/60 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full gradient-purple rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Progress: {progress.toFixed(0)}%</span>
                        <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">{settings.currencySymbol}{current.toLocaleString()} saved</span>
                     </div>
                   </div>
                   {deadlineDate && (
                     <div className="pt-1">
                        <p className={`text-[9px] font-black uppercase tracking-widest ${diffDays !== null && diffDays <= (goal.alertDaysBefore ?? 3) ? 'text-rose-500' : 'text-slate-400'}`}>
                           Deadline: {deadlineDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {diffDays !== null ? `${Math.abs(diffDays)}D ${diffDays < 0 ? 'Passed' : 'Left'}` : 'No date'}
                        </p>
                     </div>
                   )}
                   {isExpanded && (
                     <div className="flex gap-2 pt-2 animate-in slide-in-from-top-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); /* Settle logic */ }}
                          className="flex-1 py-3 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-indigo-100"
                        >
                          Settle
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }} 
                          className="flex-1 py-3 rounded-2xl bg-white dark:bg-slate-700 text-slate-400 text-[10px] font-black uppercase border border-slate-100 dark:border-slate-600 active:scale-95 transition-all"
                        >
                          Dismiss
                        </button>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  const activeWidgets = settings.dashboardWidgets.filter(w => w.enabled);
  
  const renderGrid = () => {
    const elements = [];
    let currentPair = [];

    for (let i = 0; i < activeWidgets.length; i++) {
      const widget = activeWidgets[i];
      const isLarge = ['TOTAL_NET', 'MONTHLY_NET', 'PENDING_TX', 'ALERTS', 'GOALS_PROGRESS', 'RECENT_LOGS', 'BILL_REMINDERS_SPECIFIC', 'BUDGET_WARNINGS_SPECIFIC', 'VAULT_CYCLE_ALERTS'].includes(widget.id);
      
      if (isLarge) {
        if (currentPair.length > 0) {
          elements.push(<div key={`pair-${i}`} className="grid grid-cols-2 gap-4">{currentPair}</div>);
          currentPair = [];
        }
        const wNode = renderWidget(widget.id);
        if (wNode) elements.push(wNode);
      } else {
        const wNode = renderWidget(widget.id);
        if (wNode) {
          currentPair.push(wNode);
          if (currentPair.length === 2) {
            elements.push(<div key={`pair-${i}`} className="grid grid-cols-2 gap-4">{currentPair}</div>);
            currentPair = [];
          }
        }
      }
    }

    if (currentPair.length > 0) {
      elements.push(<div key="final-pair" className="grid grid-cols-2 gap-4">{currentPair}</div>);
    }

    return elements;
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-20">
      <div className="flex flex-col gap-6">
        {renderGrid()}
      </div>

      <div className="flex justify-center mt-4">
        <button onClick={() => setIsManagingWidgets(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 flex items-center gap-2 py-4 px-8 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 rounded-2xl transition-all">
          <i className="fa-solid fa-sliders"></i> Widget Management
        </button>
      </div>

      {isManagingWidgets && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Dashboard Protocol</h2>
              <button onClick={() => setIsManagingWidgets(false)} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-xmark text-xl"></i></button>
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
            <button onClick={() => setIsManagingWidgets(false)} className="mt-8 w-full gradient-purple text-white font-black py-4 rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-xl">Apply Calibration</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
