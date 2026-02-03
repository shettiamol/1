
import React, { useState, useRef } from 'react';
import { useAppState } from '../store';
import { TransactionType, Transaction } from '../types';
import TransactionModal from './TransactionModal';

const Logs: React.FC = () => {
  const { transactions, categories, accounts, deleteTransaction, currentDate, setCurrentDate, theme, settings } = useAppState();
  const [view, setView] = useState<'DAILY' | 'CALENDAR'>('DAILY');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const changeMonth = (offset: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setCurrentDate(nextDate);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('ALL');
    setFilterType('ALL');
    setStartDate('');
    setEndDate('');
  };

  const isFiltered = searchQuery !== '' || filterCategory !== 'ALL' || filterType !== 'ALL' || startDate !== '' || endDate !== '';

  const filteredMonthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    let matchesDate = false;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date(8640000000000000);
      matchesDate = d >= start && d <= end;
    } else {
      matchesDate = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = filterCategory === 'ALL' || t.categoryId === filterCategory;
    const matchesType = filterType === 'ALL' || t.type === filterType;
    return matchesDate && matchesSearch && matchesCategory && matchesType;
  });

  const monthIncome = filteredMonthTxs.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
  const monthExpense = filteredMonthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  const grouped = filteredMonthTxs.reduce((acc: any, t) => {
    const dateStr = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(t);
    return acc;
  }, {});

  const toggleExpand = (id: string) => setExpandedTxId(expandedTxId === id ? null : id);

  const handleDateClick = (dateStr: string) => {
    const targetDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    setView('DAILY');
    setTimeout(() => {
      const element = scrollRefs.current[targetDate];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleDelete = (t: Transaction) => {
    if (t.recurringGroupId) {
      const mode = window.confirm("This transaction is part of a recurring series. Delete the ENTIRE series? (Select Cancel to delete ONLY this instance)");
      deleteTransaction(t.id, mode);
    } else {
      if (confirm('Purge log?')) deleteTransaction(t.id);
    }
    setExpandedTxId(null);
  };

  const getAccountLabel = (t: Transaction) => {
    const acc = accounts.find(a => a.id === t.accountId);
    const sub = acc?.subAccounts.find(s => s.id === t.subAccountId);
    if (!acc) return 'Unknown';
    return sub ? `${acc.name} (${sub.name})` : acc.name;
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];
    const todayStr = new Date().toISOString().split('T')[0];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-20 opacity-20 bg-slate-50/50 dark:bg-slate-900/50"></div>);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayTxs = filteredMonthTxs.filter(t => t.date === dateStr);
      const dayIncome = dayTxs.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
      const dayExpense = dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
      const isToday = todayStr === dateStr;
      days.push(
        <div key={day} onClick={() => dayTxs.length > 0 && handleDateClick(dateStr)} className={`h-20 border-b border-r border-slate-50 dark:border-slate-800/30 p-2 flex flex-col justify-between transition-all ${dayTxs.length > 0 ? 'cursor-pointer hover:bg-indigo-50/50' : ''} ${isToday ? 'bg-indigo-50/20' : ''}`}>
          <span className={`text-[9px] font-black ${isToday ? 'text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md' : 'text-slate-400'}`}>{day}</span>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            {dayIncome > 0 && <div className="text-[7px] font-black text-emerald-500 text-right">+{dayIncome.toFixed(0)}</div>}
            {dayExpense > 0 && <div className="text-[7px] font-black text-rose-500 text-right">-{dayExpense.toFixed(0)}</div>}
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-7 border-t border-l border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/20">
        {['S','M','T','W','T','F','S'].map(d => <div key={d} className="h-8 flex items-center justify-center text-[8px] font-black text-slate-300 uppercase">{d}</div>)}
        {days}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-slate-900' : 'bg-[#F8F9FD]'}`}>
      <div className="p-6 pb-4 sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400"><i className="fa-solid fa-chevron-left"></i></button>
          <div className="text-center">
            <span className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white block">{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 hover:opacity-70 transition-opacity"
            >
              Goto Present Day
            </button>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 text-slate-400"><i className="fa-solid fa-chevron-right"></i></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-500/5 p-3 rounded-2xl text-center">
            <span className="text-[8px] font-black text-emerald-500 uppercase block mb-1">Inflow</span>
            <span className="text-[10px] font-bold text-emerald-600">{settings.currencySymbol}{monthIncome.toLocaleString()}</span>
          </div>
          <div className="bg-rose-50 dark:bg-rose-500/5 p-3 rounded-2xl text-center">
            <span className="text-[8px] font-black text-rose-500 uppercase block mb-1">Outflow</span>
            <span className="text-[10px] font-bold text-rose-600">{settings.currencySymbol}{monthExpense.toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Net</span>
            <span className={`text-[10px] font-bold ${monthBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{settings.currencySymbol}{monthBalance.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
           <button onClick={() => setView('DAILY')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'DAILY' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>List View</button>
           <button onClick={() => setView('CALENDAR')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'CALENDAR' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Calendar</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-24 pt-6 px-4">
        <button onClick={isFiltered ? resetFilters : () => setIsFilterModalOpen(true)} className={`fixed bottom-20 left-4 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg z-40 transition-all ${isFiltered ? 'bg-rose-500' : 'gradient-purple'}`}><i className={`fa-solid ${isFiltered ? 'fa-xmark' : 'fa-magnifying-glass'}`}></i></button>

        {view === 'DAILY' ? (
          Object.keys(grouped).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateStr => (
            <div key={dateStr} ref={el => { scrollRefs.current[dateStr] = el; }} className="mb-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="px-2 py-2 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{dateStr}</div>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
              </div>
              <div className="space-y-2.5">
                {grouped[dateStr].map((t: Transaction) => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  const isExpanded = expandedTxId === t.id;
                  const colorClass = t.type === TransactionType.INCOME ? 'text-emerald-500' : t.type === TransactionType.EXPENSE ? 'text-rose-500' : 'text-blue-500';
                  const bgClass = t.type === TransactionType.INCOME ? 'bg-emerald-50' : t.type === TransactionType.EXPENSE ? 'bg-rose-50' : 'bg-blue-50';
                  const accountLabel = getAccountLabel(t);

                  return (
                    <div key={t.id} className="group overflow-hidden">
                      <div onClick={() => toggleExpand(t.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${isExpanded ? 'border-indigo-500 shadow-lg bg-white dark:bg-slate-800 scale-[1.01]' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 shadow-sm bg-white/50 dark:bg-slate-800/30'}`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm ${bgClass} ${colorClass}`}>
                              <i className={`fa-solid ${cat?.icon || (t.type === TransactionType.TRANSFER ? 'fa-right-left' : 'fa-receipt')}`}></i>
                           </div>
                           <div className="max-w-[160px]">
                              <div className="flex items-center gap-1.5 mb-2">
                                <p className="text-[11px] font-black text-slate-800 dark:text-white leading-none truncate">{t.title}</p>
                                {t.recurringGroupId && <i className="fa-solid fa-repeat text-[7px] text-indigo-400"></i>}
                                {t.location && <i className="fa-solid fa-location-dot text-[7px] text-emerald-500"></i>}
                              </div>
                              <div className="flex flex-col gap-2">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate leading-none">{cat?.name || 'Protocol Transfer'} • {t.time}</span>
                                <span className="text-[7.5px] font-black text-indigo-500/60 uppercase tracking-tighter truncate leading-none">{accountLabel}</span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div className="flex flex-col items-end gap-1.5">
                            <p className={`text-[12px] font-black ${colorClass}`} style={{ fontFamily: 'JetBrains Mono' }}>
                               {t.type === TransactionType.INCOME ? '+' : t.type === TransactionType.EXPENSE ? '-' : '•'}{settings.currencySymbol}{t.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1">
                               {t.attachment && <i className="fa-solid fa-paperclip text-[8px] text-indigo-400"></i>}
                            </div>
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-b-2xl border-x border-b border-indigo-500 p-5 space-y-5 shadow-inner">
                           {t.description && (
                             <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 italic px-2 leading-relaxed">"{t.description}"</p>
                           )}
                           
                           {t.location && (
                             <div className="px-2">
                               <a 
                                 href={`https://www.google.com/maps?q=${t.location.lat},${t.location.lng}`} 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-2 text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20 active:scale-95 transition-all"
                               >
                                 <i className="fa-solid fa-map-location-dot text-xs"></i>
                                 View spending location on maps
                               </a>
                             </div>
                           )}

                           {t.attachment && (
                             <div className="relative group/img cursor-zoom-in" onClick={() => setSelectedImage(t.attachment)}>
                                <img src={t.attachment} className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700" alt="Receipt" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 flex items-center justify-center transition-all">
                                   <i className="fa-solid fa-magnifying-glass-plus text-white opacity-0 group-hover/img:opacity-100 scale-50 group-hover/img:scale-100 transition-all"></i>
                                </div>
                             </div>
                           )}

                           <div className="flex gap-2">
                              <button onClick={() => setEditingTransaction(t)} className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Modify</button>
                              <button onClick={() => handleDelete(t)} className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase border border-rose-100 active:scale-95 transition-all">Purge</button>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : renderCalendar()}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedImage(null)}>
           <div className="relative w-full max-w-lg aspect-square">
              <img src={selectedImage} className="w-full h-full object-contain rounded-2xl" alt="Receipt Fullscreen" />
              <button className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center backdrop-blur-md"><i className="fa-solid fa-xmark"></i></button>
           </div>
        </div>
      )}

      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95">
             <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">Ledger Search</h2>
             <input type="text" placeholder="Keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-5 py-3.5 text-xs font-bold outline-none border border-slate-100 dark:border-slate-700 mb-6" />
             <div className="grid grid-cols-2 gap-3 mb-8">
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-3 text-[10px] font-bold outline-none border border-slate-100"><option value="ALL">All Types</option><option value={TransactionType.EXPENSE}>Expense</option><option value={TransactionType.INCOME}>Income</option><option value={TransactionType.TRANSFER}>Transfer</option></select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-3 py-3 text-[10px] font-bold outline-none border border-slate-100"><option value="ALL">All Categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
             </div>
             <div className="flex gap-3">
                <button onClick={resetFilters} className="flex-1 py-4 text-rose-500 font-bold uppercase text-[10px]">Reset</button>
                <button onClick={() => setIsFilterModalOpen(false)} className="flex-2 gradient-purple text-white px-8 py-4 rounded-2xl font-bold uppercase text-[10px]">Apply</button>
             </div>
          </div>
        </div>
      )}

      {editingTransaction && <TransactionModal isOpen={!!editingTransaction} onClose={() => { setEditingTransaction(null); setExpandedTxId(null); }} editingTransaction={editingTransaction} />}
    </div>
  );
};

export default Logs;
