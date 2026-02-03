
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../store';
import { BillReminder } from '../types';

const ICONS = [
  'fa-file-invoice-dollar', 'fa-bolt', 'fa-faucet', 'fa-wifi', 'fa-mobile-screen',
  'fa-house', 'fa-car', 'fa-credit-card', 'fa-graduation-cap', 'fa-heart-pulse',
  'fa-shield-halved', 'fa-tv', 'fa-gas-pump', 'fa-trash-can', 'fa-newspaper',
  'fa-building-columns', 'fa-cart-shopping', 'fa-dumbbell', 'fa-briefcase'
];

const Reminders: React.FC = () => {
  const { billReminders, addBillReminder, updateBillReminder, deleteBillReminder, theme, settings } = useAppState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    dueDay: string;
    alertDaysBefore: string;
    amount: string;
    icon: string;
  }>({
    title: '',
    dueDay: '1',
    alertDaysBefore: '3',
    amount: '0',
    icon: 'fa-file-invoice-dollar'
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setIsIconDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (reminder?: BillReminder) => {
    if (reminder) {
      setEditingId(reminder.id);
      setFormData({
        title: reminder.title,
        dueDay: reminder.dueDay.toString(),
        alertDaysBefore: (reminder.alertDaysBefore || 3).toString(),
        amount: (reminder.amount || 0).toString(),
        icon: reminder.icon || 'fa-file-invoice-dollar'
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', dueDay: '1', alertDaysBefore: '3', amount: '0', icon: 'fa-file-invoice-dollar' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const reminder: BillReminder = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      title: formData.title || 'Untitled Bill',
      dueDay: parseInt(formData.dueDay) || 1,
      alertDaysBefore: parseInt(formData.alertDaysBefore) || 0,
      amount: parseFloat(formData.amount) || 0,
      icon: formData.icon,
      createdAt: new Date().toISOString()
    };

    if (editingId) updateBillReminder(reminder);
    else addBillReminder(reminder);
    setIsModalOpen(false);
  };

  const today = new Date();
  const todayDay = today.getDate();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });

  return (
    <div className="p-6 pb-32 h-full overflow-y-auto hide-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-2 dark:text-white">Bill Reminders</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fiscal Deadlines</p>
        </div>
        <button onClick={() => openModal()} className="w-12 h-12 gradient-purple rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none transition-transform active:scale-90">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="space-y-4">
        {billReminders.length === 0 ? (
          <div className="text-center py-20 px-8 opacity-40">
            <i className="fa-solid fa-calendar-check text-4xl mb-4"></i>
            <p className="text-xs font-black uppercase tracking-widest">No reminders established</p>
          </div>
        ) : (
          billReminders.sort((a,b) => a.dueDay - b.dueDay).map(rem => {
            const daysLeft = rem.dueDay - todayDay;
            const isSoon = rem.dueDay > todayDay && daysLeft <= (rem.alertDaysBefore || 0);
            const isDueToday = rem.dueDay === todayDay;
            const isOverdue = rem.dueDay < todayDay;

            return (
              <div key={rem.id} className={`p-6 rounded-[2.5rem] border transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDueToday ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : isSoon ? 'bg-amber-400 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                          <i className={`fa-solid ${rem.icon || 'fa-file-invoice-dollar'}`}></i>
                       </div>
                       <div>
                          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">{rem.title}</h3>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                            {currentMonthName} {rem.dueDay}
                          </span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       {rem.amount !== undefined && <span className="font-black text-slate-800 dark:text-white" style={{fontFamily:'JetBrains Mono'}}>{settings.currencySymbol}{rem.amount.toLocaleString()}</span>}
                       <div className="flex gap-2">
                          <button onClick={() => openModal(rem)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-300 hover:text-indigo-500 flex items-center justify-center transition-colors"><i className="fa-solid fa-pen text-[10px]"></i></button>
                          <button onClick={() => { if(confirm('Purge this reminder?')) deleteBillReminder(rem.id) }} className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-colors"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                       <i className="fa-solid fa-clock text-[9px] text-slate-300"></i>
                       <span className={`text-[9px] font-black uppercase tracking-widest ${isDueToday ? 'text-rose-500 animate-pulse' : isSoon ? 'text-amber-500' : isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                          {isDueToday ? 'DUE TODAY' : isOverdue ? 'OVERDUE' : isSoon ? `${daysLeft} DAYS REMAINING` : `Upcoming`}
                       </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <i className="fa-solid fa-bell text-[9px] text-indigo-400"></i>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          Alert {rem.alertDaysBefore || 0}d Before
                       </span>
                    </div>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in fade-in zoom-in-95 my-auto">
            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">{editingId ? 'Edit Reminder' : 'New Reminder'}</h2>
            
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="relative" ref={iconPickerRef}>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Icon</label>
                  <button 
                    type="button" 
                    onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
                    className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-inner border border-transparent hover:border-indigo-500/20 transition-all"
                  >
                    <i className={`fa-solid ${formData.icon} text-xl`}></i>
                  </button>
                  {isIconDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 grid grid-cols-4 gap-2 rounded-2xl shadow-2xl z-[120] max-h-48 overflow-y-auto hide-scrollbar">
                      {ICONS.map(icon => (
                        <button 
                          key={icon} 
                          type="button" 
                          onClick={() => { setFormData({...formData, icon}); setIsIconDropdownOpen(false); }}
                          className={`aspect-square rounded-xl flex items-center justify-center text-sm transition-all ${formData.icon === icon ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                          <i className={`fa-solid ${icon}`}></i>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Bill Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Electricity" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-4 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 transition-all" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Due Day (1-31)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="31" 
                    value={formData.dueDay} 
                    onChange={e => setFormData({...formData, dueDay: e.target.value})} 
                    onFocus={e => e.currentTarget.select()} 
                    className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-4 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 transition-all" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Alert Lead (Days)</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={formData.alertDaysBefore} 
                    onChange={e => setFormData({...formData, alertDaysBefore: e.target.value})} 
                    onFocus={e => e.currentTarget.select()} 
                    className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-4 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 transition-all" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Estimated Amount ({settings.currencySymbol})</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                  onFocus={e => e.currentTarget.select()} 
                  className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-4 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 transition-all" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancel</button>
              <button type="submit" className="flex-2 gradient-purple text-white px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-transform">Commit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Reminders;
