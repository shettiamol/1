
import React, { useState, useMemo } from 'react';
import { useAppState } from '../store';
import { TransactionType } from '../types';
import ColumnChart from './ColumnChart';
import LineChart from './LineChart';
import GroupedBarChart from './GroupedBarChart';

const Analysis: React.FC = () => {
  const { transactions, categories, accounts, currentDate, setCurrentDate, theme, settings } = useAppState();
  const [tab, setTab] = useState<TransactionType>(TransactionType.EXPENSE);
  const [vizType, setVizType] = useState<'PIE' | 'BAR' | 'LINE' | 'AREA'>('PIE');
  const [mode, setMode] = useState<'DISTRIBUTION' | 'PATH' | 'YEARLY'>('DISTRIBUTION');
  
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  const changeMonth = (offset: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setCurrentDate(nextDate);
    setSelectedYear(nextDate.getFullYear());
  };

  const changeYear = (offset: number) => {
    setSelectedYear(prev => prev + offset);
  };

  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return t.type === tab && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  });

  const total = monthTxs.reduce((acc, t) => acc + t.amount, 0);

  // Filter distribution to only include categories with transactions
  const distribution = useMemo(() => {
    return categories
      .filter(c => c.type === tab)
      .map(cat => {
        const amount = monthTxs.filter(t => t.categoryId === cat.id).reduce((acc, t) => acc + t.amount, 0);
        const share = total > 0 ? (amount / total) * 100 : 0;
        return { ...cat, amount, share };
      })
      .filter(item => item.amount > 0) // Only show categories with transactions
      .sort((a, b) => b.amount - a.amount);
  }, [categories, tab, monthTxs, total]);

  let currentOffset = 0;
  const pieGradient = distribution.map(item => {
    const start = currentOffset;
    currentOffset += item.share;
    return `${item.color} ${start}% ${currentOffset}%`;
  }).join(', ');

  const toggleCat = (id: string) => {
    setExpandedCatId(expandedCatId === id ? null : id);
    setExpandedSubId(null);
  };

  const toggleSub = (id: string) => {
    setExpandedSubId(expandedSubId === id ? null : id);
  };

  const getAccountInfo = (tx: any) => {
    const acc = accounts.find(a => a.id === tx.accountId);
    const sub = acc?.subAccounts.find(s => s.id === tx.subAccountId);
    return acc ? `${acc.name}${sub ? ` (${sub.name})` : ''}` : 'Unknown Vault';
  };

  // Monthly breakdown for the selected year
  const trendData = useMemo(() => {
    const result = [];
    for (let m = 0; m < 12; m++) {
      const mIn = transactions
        .filter(t => {
          const td = new Date(t.date + 'T00:00:00');
          return t.type === TransactionType.INCOME && td.getMonth() === m && td.getFullYear() === selectedYear;
        })
        .reduce((s, t) => s + t.amount, 0);
        
      const mOut = transactions
        .filter(t => {
          const td = new Date(t.date + 'T00:00:00');
          return t.type === TransactionType.EXPENSE && td.getMonth() === m && td.getFullYear() === selectedYear;
        })
        .reduce((s, t) => s + t.amount, 0);

      result.push({
        label: new Date(selectedYear, m, 1).toLocaleString('default', { month: 'short' }),
        income: mIn,
        expense: mOut
      });
    }
    return result;
  }, [transactions, selectedYear]);

  // Yearly history breakdown
  const yearlyData = useMemo(() => {
    const years = Array.from(new Set(transactions.map(t => new Date(t.date + 'T00:00:00').getFullYear()))).sort();
    if (years.length === 0) return [];
    
    return years.map(year => {
      const yearTxs = transactions.filter(t => new Date(t.date + 'T00:00:00').getFullYear() === year);
      const income = yearTxs.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
      const expense = yearTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
      
      return {
        label: year.toString(),
        income,
        expense,
        balance: income - expense,
        yield: expense > 0 ? ((income - expense) / expense) * 100 : 0
      };
    });
  }, [transactions]);

  // Data mapped for single-series line/area chart (Categories)
  const distributionTrendData = useMemo(() => {
    return distribution.map(item => ({
      label: item.name,
      amount: item.amount
    }));
  }, [distribution]);

  return (
    <div className="p-6 pb-24 h-full overflow-y-auto hide-scrollbar">
       {/* Navigation Header */}
       <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => mode === 'DISTRIBUTION' ? changeMonth(-1) : changeYear(-1)} 
            className="p-2 text-slate-300 hover:text-indigo-500"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          
          <div className="text-center">
            <span className="font-black text-sm uppercase tracking-tighter block leading-tight">
              {mode === 'DISTRIBUTION' 
                ? currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
                : mode === 'PATH' ? `Year ${selectedYear}` : 'Annual Records'
              }
            </span>
            <button 
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedYear(now.getFullYear());
              }} 
              className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 hover:opacity-70 transition-opacity"
            >
              Reset to Now
            </button>
          </div>
          
          <button 
            onClick={() => mode === 'DISTRIBUTION' ? changeMonth(1) : changeYear(1)} 
            className="p-2 text-slate-300 hover:text-indigo-500"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        {/* Multi-Mode Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem] mb-8 shadow-inner overflow-hidden">
          <button 
            onClick={() => { setMode('DISTRIBUTION'); if (vizType === 'AREA') setVizType('PIE'); }} 
            className={`flex-1 py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-2xl ${mode === 'DISTRIBUTION' ? 'bg-white shadow-md text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-400'}`}
          >
            Categories
          </button>
          <button 
            onClick={() => { setMode('PATH'); setVizType('AREA'); }} 
            className={`flex-1 py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-2xl ${mode === 'PATH' ? 'bg-white shadow-md text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-400'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => { setMode('YEARLY'); setVizType('AREA'); }} 
            className={`flex-1 py-2.5 text-[8px] font-black uppercase tracking-wider transition-all rounded-2xl ${mode === 'YEARLY' ? 'bg-white shadow-md text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-400'}`}
          >
            Yearly
          </button>
        </div>

        {mode === 'DISTRIBUTION' && (
          <>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6 shadow-inner">
              <button onClick={() => setTab(TransactionType.EXPENSE)} className={`flex-1 py-3 text-[10px] font-black uppercase transition-all rounded-xl ${tab === TransactionType.EXPENSE ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Expense</button>
              <button onClick={() => setTab(TransactionType.INCOME)} className={`flex-1 py-3 text-[10px] font-black uppercase transition-all rounded-xl ${tab === TransactionType.INCOME ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>Income</button>
            </div>

            <div className="flex justify-end gap-2 mb-6">
               <button 
                 onClick={() => setVizType('PIE')}
                 className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${vizType === 'PIE' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
               >
                  <i className="fa-solid fa-chart-pie text-sm"></i>
               </button>
               <button 
                 onClick={() => setVizType('BAR')}
                 className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${vizType === 'BAR' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
               >
                  <i className="fa-solid fa-chart-column text-sm"></i>
               </button>
               <button 
                 onClick={() => setVizType('LINE')}
                 className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${vizType === 'LINE' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
               >
                  <i className="fa-solid fa-chart-line text-sm"></i>
               </button>
            </div>

            <div className="mb-12">
               {vizType === 'PIE' ? (
                 <div className="flex justify-center animate-in zoom-in-95">
                   <div 
                     className="relative w-64 h-64 rounded-full border-8 border-white/50 dark:border-slate-800/50 flex items-center justify-center shadow-2xl shadow-indigo-100 dark:shadow-none transition-all duration-700" 
                     style={{ background: `conic-gradient(${pieGradient || '#f1f5f9 0% 100%'})` }}
                   >
                      <div className="absolute inset-6 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Total {tab === TransactionType.EXPENSE ? 'Expense' : 'Income'}</span>
                         <span className="text-2xl font-black dark:text-white" style={{ fontFamily: 'JetBrains Mono' }}>{settings.currencySymbol}{total.toLocaleString()}</span>
                      </div>
                   </div>
                 </div>
               ) : vizType === 'BAR' ? (
                 <ColumnChart data={distribution} total={total} />
               ) : (
                 <LineChart 
                   data={distributionTrendData.map(d => ({ label: d.label, income: tab === TransactionType.INCOME ? d.amount : 0, expense: tab === TransactionType.EXPENSE ? d.amount : 0 }))} 
                   variant={vizType === 'LINE' ? 'LINE' : 'AREA'}
                   singleSeries={true}
                   singleSeriesType={tab}
                 />
               )}
            </div>

            <div className="space-y-4">
              {distribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <i className="fa-solid fa-ghost text-4xl mb-4"></i>
                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-10">No active category data for this period</p>
                </div>
              ) : (
                distribution.map(cat => {
                  const isCatExpanded = expandedCatId === cat.id;
                  // Only show sub-categories that have transactions
                  const activeSubCategories = cat.subCategories.filter(sub => {
                    return monthTxs.some(t => t.categoryId === cat.id && t.subCategoryId === sub.id);
                  });

                  return (
                    <div key={cat.id} className="flex flex-col gap-1.5">
                      <div 
                        onClick={() => toggleCat(cat.id)}
                        className={`p-5 rounded-[2.25rem] border transition-all cursor-pointer flex justify-between items-center ${isCatExpanded ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-xl scale-[1.01]' : 'border-slate-100 bg-white dark:bg-slate-800/40 dark:border-slate-800 hover:border-slate-200 shadow-sm'}`}
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white text-base shadow-lg" style={{ backgroundColor: cat.color }}>
                              <i className={`fa-solid ${cat.icon}`}></i>
                           </div>
                           <div>
                              <p className="text-sm font-black dark:text-white mb-0.5">{cat.name}</p>
                              <div className="flex items-center gap-2">
                                 <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                   <div className="h-full bg-current opacity-40" style={{ width: `${cat.share}%`, color: cat.color }}></div>
                                 </div>
                                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{cat.share.toFixed(1)}% Share</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-bold dark:text-slate-200" style={{ fontFamily: 'JetBrains Mono' }}>{settings.currencySymbol}{cat.amount.toLocaleString()}</span>
                           <i className={`fa-solid fa-chevron-right text-[10px] text-slate-300 transition-transform ${isCatExpanded ? 'rotate-90' : ''}`}></i>
                        </div>
                      </div>

                      {isCatExpanded && (
                        <div className="ml-6 space-y-2 animate-in slide-in-from-top-2">
                          {activeSubCategories.length === 0 ? (
                             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">No active sub-category transactions</span>
                             </div>
                          ) : (
                            activeSubCategories.map(sub => {
                              const isSubExpanded = expandedSubId === sub.id;
                              const subTxs = monthTxs.filter(t => t.categoryId === cat.id && t.subCategoryId === sub.id);
                              const subTotal = subTxs.reduce((s,t) => s + t.amount, 0);

                              return (
                                <div key={sub.id} className="flex flex-col gap-2">
                                  <div 
                                    onClick={() => toggleSub(sub.id)}
                                    className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${isSubExpanded ? 'bg-indigo-50 border-indigo-100 dark:bg-slate-700/50 dark:border-slate-600' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}
                                  >
                                      <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400">{sub.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold" style={{ fontFamily: 'JetBrains Mono' }}>{settings.currencySymbol}{subTotal.toLocaleString()}</span>
                                        <i className={`fa-solid fa-chevron-down text-[8px] text-slate-300 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`}></i>
                                      </div>
                                  </div>
                                  
                                  {isSubExpanded && (
                                    <div className="ml-4 p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 space-y-5 shadow-inner">
                                        {subTxs.map(t => (
                                          <div key={t.id} className="flex justify-between items-center text-[10px] border-b border-slate-50 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                                            <div className="flex flex-col gap-2">
                                                <span className="font-black dark:text-slate-300 leading-none">{t.title}</span>
                                                <span className="text-[7.5px] text-slate-400 uppercase tracking-tighter leading-none">{t.date} • {getAccountInfo(t)}</span>
                                            </div>
                                            <span className="font-black" style={{ fontFamily: 'JetBrains Mono' }}>{settings.currencySymbol}{t.amount.toLocaleString()}</span>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {mode === 'PATH' && (
          <div className="space-y-12 animate-in fade-in">
            <div>
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly Breakdown ({selectedYear})</h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setVizType('LINE')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${vizType === 'LINE' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400'}`}
                  >
                    <i className="fa-solid fa-chart-line text-[10px]"></i>
                  </button>
                  <button 
                    onClick={() => setVizType('AREA')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${vizType === 'AREA' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400'}`}
                  >
                    <i className="fa-solid fa-chart-area text-[10px]"></i>
                  </button>
                </div>
              </div>
              <div className={`p-6 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} overflow-x-auto hide-scrollbar`}>
                <div style={{ minWidth: trendData.length > 12 ? `${trendData.length * 40}px` : '100%' }}>
                  <LineChart data={trendData} variant={vizType === 'AREA' ? 'AREA' : 'LINE'} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Monthly Ledger ({selectedYear})</h3>
               <div className="grid grid-cols-1 gap-4">
                  {trendData.filter(d => d.income > 0 || d.expense > 0).length === 0 ? (
                    <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-10">No data records for {selectedYear}</p>
                  ) : (
                    trendData.filter(d => d.income > 0 || d.expense > 0).map((d, i) => {
                      const diff = d.income - d.expense;
                      const pct = d.expense > 0 ? (diff / d.expense) * 100 : 0;
                      return (
                        <div key={i} className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex justify-between items-center`}>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{d.label} Summary</span>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-[10px] font-bold text-emerald-500">+{settings.currencySymbol}{d.income.toLocaleString()}</span>
                               <span className="text-[10px] font-bold text-rose-500">-{settings.currencySymbol}{d.expense.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                             <span className={`text-sm font-black ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                                {diff >= 0 ? '+' : ''}{settings.currencySymbol}{diff.toLocaleString()}
                             </span>
                             <span className="text-[8px] font-black uppercase text-slate-400 block mt-0.5">
                               {pct > 0 ? '+' : ''}{pct.toFixed(1)}% yield
                             </span>
                          </div>
                        </div>
                      );
                    }).reverse()
                  )}
               </div>
            </div>
          </div>
        )}

        {mode === 'YEARLY' && (
          <div className="space-y-12 animate-in fade-in">
            <div>
              <div className="flex justify-between items-center mb-6 px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Annual Breakdown</h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setVizType('AREA')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${vizType === 'AREA' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400'}`}
                  >
                    <i className="fa-solid fa-chart-area text-[10px]"></i>
                  </button>
                  <button 
                    onClick={() => setVizType('LINE')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${vizType === 'LINE' ? 'bg-white shadow-sm text-indigo-500' : 'text-slate-400'}`}
                  >
                    <i className="fa-solid fa-chart-line text-[10px]"></i>
                  </button>
                </div>
              </div>
              <div className={`p-6 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} overflow-hidden`}>
                <LineChart data={yearlyData} variant={vizType === 'AREA' ? 'AREA' : 'LINE'} />
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Yearly Balance Sheets</h3>
               <div className="grid grid-cols-1 gap-4">
                  {yearlyData.length === 0 ? (
                    <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-10">No historical data records</p>
                  ) : (
                    yearlyData.map((d, i) => {
                      return (
                        <div key={i} className={`p-8 rounded-[3rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} flex flex-col gap-6`}>
                          <div className="flex justify-between items-start">
                            <div>
                               <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] block mb-2">{d.label} FISCAL YEAR</span>
                               <h2 className={`text-3xl font-black ${d.balance >= 0 ? 'dark:text-white' : 'text-rose-500'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                                 {d.balance >= 0 ? '+' : ''}{settings.currencySymbol}{d.balance.toLocaleString()}
                               </h2>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">NET BALANCE PROTOCOL</p>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${d.yield >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {d.yield >= 0 ? '+' : ''}{d.yield.toFixed(1)}% YIELD
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                             <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yearly Inflow</span>
                                <p className="text-lg font-black text-emerald-500" style={{ fontFamily: 'JetBrains Mono' }}>{settings.currencySymbol}{d.income.toLocaleString()}</p>
                             </div>
                             <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yearly Outflow</span>
                                <p className="text-lg font-black text-rose-500" style={{ fontFamily: 'JetBrains Mono' }}>{settings.currencySymbol}{d.expense.toLocaleString()}</p>
                             </div>
                          </div>

                          <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                             <div 
                               className="h-full bg-emerald-500 transition-all duration-1000" 
                               style={{ width: `${(d.income + d.expense) > 0 ? (d.income / (d.income + d.expense)) * 100 : 0}%` }}
                             ></div>
                             <div 
                               className="h-full bg-rose-500 transition-all duration-1000" 
                               style={{ width: `${(d.income + d.expense) > 0 ? (d.expense / (d.income + d.expense)) * 100 : 0}%` }}
                             ></div>
                          </div>
                        </div>
                      );
                    }).reverse()
                  )}
               </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Analysis;
