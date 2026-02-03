
import React, { useState } from 'react';
import { useAppState } from '../store';
import { FinancialGoal } from '../types';

const Goals: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, accounts, settings, theme } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Partial<FinancialGoal> | null>(null);

  const openModal = (goal?: FinancialGoal) => {
    setEditingGoal(goal || { name: '', targetAmount: 0, currentAmount: 0, deadline: '', alertDaysBefore: 3, icon: 'fa-bullseye' });
    setIsModalOpen(true);
  };

  const saveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const goal: FinancialGoal = {
      id: (editingGoal as FinancialGoal).id || Math.random().toString(36).substr(2, 9),
      name: editingGoal.name || 'New Goal',
      targetAmount: editingGoal.targetAmount || 0,
      currentAmount: editingGoal.currentAmount || 0,
      deadline: editingGoal.deadline || '',
      alertDaysBefore: editingGoal.alertDaysBefore ?? 3,
      icon: editingGoal.icon || 'fa-bullseye',
      imageUrl: editingGoal.imageUrl,
      linkedSubAccountId: editingGoal.linkedSubAccountId
    };

    if ((editingGoal as FinancialGoal).id) updateGoal(goal);
    else addGoal(goal);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 pb-32 overflow-y-auto hide-scrollbar h-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Aspirations</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth Targets</p>
        </div>
        <button onClick={() => openModal()} className="w-12 h-12 gradient-purple rounded-2xl flex items-center justify-center text-white shadow-xl">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="space-y-8">
        {goals.map(goal => {
          let currentAmount = goal.currentAmount;
          let linkedName = 'Manual';

          if (goal.linkedSubAccountId) {
            const linkedAcc = accounts.flatMap(a => a.subAccounts).find(sa => sa.id === goal.linkedSubAccountId);
            if (linkedAcc) {
              currentAmount = linkedAcc.balance;
              linkedName = linkedAcc.name;
            }
          }

          const progress = (currentAmount / goal.targetAmount) * 100;
          const deadlineDate = goal.deadline ? new Date(goal.deadline) : new Date();
          const diffDays = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={goal.id} className={`group rounded-[2.5rem] border overflow-hidden transition-all hover:shadow-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
              {goal.imageUrl ? (
                <div className="h-44 w-full relative overflow-hidden">
                  <img src={goal.imageUrl} className="w-full h-full object-cover" alt={goal.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 text-white flex flex-col justify-end p-6">
                     <span className="font-black text-2xl drop-shadow-md">{goal.name}</span>
                     <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Linked to: {linkedName}</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 pb-2">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <i className={`fa-solid ${goal.icon} text-2xl`}></i>
                     </div>
                     <div>
                        <span className="font-black text-2xl dark:text-white block leading-none mb-1">{goal.name}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Linked to: {linkedName}</span>
                     </div>
                  </div>
                </div>
              )}

              <div className="p-6 pt-4">
                 <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Milestone</span>
                       <span className="text-xl font-black tracking-tight dark:text-white" style={{ fontFamily: 'JetBrains Mono' }}>{settings.currencySymbol}{currentAmount.toLocaleString()} <span className="text-slate-400 text-sm font-bold">/ {settings.currencySymbol}{goal.targetAmount.toLocaleString()}</span></span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-xs font-black px-4 py-1.5 rounded-2xl border ${progress >= 100 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'}`}>
                          {Math.round(progress)}%
                       </span>
                    </div>
                 </div>

                 <div className={`w-full h-3 rounded-full overflow-hidden mb-8 ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <div 
                      className="h-full gradient-purple rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                 </div>

                 <div className="flex justify-between items-center pt-5 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                       <i className="fa-solid fa-calendar-day text-[10px] text-slate-300"></i>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${diffDays <= goal.alertDaysBefore && diffDays >= 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-300'}`}>
                          {diffDays > 0 ? `${diffDays} Days Remaining` : diffDays === 0 ? 'Deadline Today' : 'Milestone Passed'}
                       </span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => openModal(goal)} className="w-10 h-10 rounded-xl text-slate-300 hover:text-indigo-500"><i className="fa-solid fa-pen text-sm"></i></button>
                       <button onClick={() => deleteGoal(goal.id)} className="w-10 h-10 rounded-xl text-slate-300 hover:text-rose-500"><i className="fa-solid fa-trash-can text-sm"></i></button>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && editingGoal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={saveGoal} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-sm p-8 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">Milestone Config</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Goal Descriptor</label>
                <input type="text" value={editingGoal.name} onChange={e => setEditingGoal({...editingGoal, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="e.g. New Home" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Target Amount</label>
                  <input type="number" value={editingGoal.targetAmount} onChange={e => setEditingGoal({...editingGoal, targetAmount: parseFloat(e.target.value) || 0})} onFocus={e => e.currentTarget.select()} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" required />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Deadline</label>
                  <input type="date" value={editingGoal.deadline} onChange={e => setEditingGoal({...editingGoal, deadline: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" required />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Alert Lead (Days)</label>
                <input type="number" min="0" value={editingGoal.alertDaysBefore} onChange={e => setEditingGoal({...editingGoal, alertDaysBefore: parseInt(e.target.value) || 0})} onFocus={e => e.currentTarget.select()} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" required />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Vault Link (Auto-Track)</label>
                <select 
                  value={editingGoal.linkedSubAccountId || ''} 
                  onChange={e => setEditingGoal({...editingGoal, linkedSubAccountId: e.target.value || undefined})}
                  className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="">Manual Progress</option>
                  {accounts.map(a => (
                    <optgroup key={a.id} label={a.name}>
                      {a.subAccounts.map(sa => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              {!editingGoal.linkedSubAccountId && (
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Manual Contribution</label>
                  <input type="number" value={editingGoal.currentAmount} onChange={e => setEditingGoal({...editingGoal, currentAmount: parseFloat(e.target.value) || 0})} onFocus={e => e.currentTarget.select()} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px]">Abandon</button>
              <button type="submit" className="flex-2 gradient-purple text-white px-8 py-3 rounded-2xl font-bold uppercase text-[10px]">Commit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Goals;
