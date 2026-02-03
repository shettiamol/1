
import React, { useMemo } from 'react';
import { useAppState } from '../store';
import { TransactionType } from '../types';
import LineChart from './LineChart';

const TrendAnalysis: React.FC = () => {
  const { transactions, settings, theme, currentDate, setCurrentDate } = useAppState();

  const changeMonth = (offset: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + offset);
    setCurrentDate(nextDate);
  };

  const trendData = useMemo(() => {
    if (transactions.length === 0) return [];
    
    // Find the absolute earliest transaction to show "all data from path"
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const startMonth = minDate.getMonth();
    const startYear = minDate.getFullYear();
    
    const endMonth = currentDate.getMonth();
    const endYear = currentDate.getFullYear();
    
    const result = [];
    let curr = new Date(startYear, startMonth, 1);
    const end = new Date(endYear, endMonth, 1);

    while (curr <= end) {
      const m = curr.getMonth();
      const y = curr.getFullYear();
      
      const mIn = transactions
        .filter(t => {
          const td = new Date(t.date);
          return t.type === TransactionType.INCOME && td.getMonth() === m && td.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);
        
      const mOut = transactions
        .filter(t => {
          const td = new Date(t.date);
          return t.type === TransactionType.EXPENSE && td.getMonth() === m && td.getFullYear() === y;
        })
        .reduce((s, t) => s + t.amount, 0);

      result.push({
        label: curr.toLocaleString('default', { month: 'short', year: '2-digit' }),
        income: mIn,
        expense: mOut
      });
      
      curr.setMonth(curr.getMonth() + 1);
    }
    
    // If the list is too long for the SVG chart (e.g. > 12 months), 
    // we might want to slice it, but user asked for "all data".
    // The LineChart will scale horizontally.
    return result;
  }, [transactions, currentDate]);

  const latestStats = trendData.length > 0 ? trendData[trendData.length - 1] : { income: 0, expense: 0 };
  const netMargin = latestStats.income - latestStats.expense;
  const marginColor = netMargin >= 0 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div className="p-6 pb-32 h-full overflow-y-auto hide-scrollbar animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Capital Path</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Historical Trajectory</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
           <button onClick={() => changeMonth(-1)} className="p-2 text-slate-300 hover:text-indigo-500"><i className="fa-solid fa-chevron-left text-xs"></i></button>
           <span className="text-[10px] font-black uppercase tracking-tighter px-2">To {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
           <button onClick={() => changeMonth(1)} className="p-2 text-slate-300 hover:text-indigo-500"><i className="fa-solid fa-chevron-right text-xs"></i></button>
        </div>
      </div>

      <div className={`p-6 rounded-[2.5rem] border mb-8 ${theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} overflow-x-auto`}>
        <div style={{ minWidth: trendData.length > 12 ? `${trendData.length * 40}px` : '100%' }}>
          <LineChart data={trendData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] mb-1">Latest Net Margin</span>
            <span className={`text-xl font-black ${marginColor}`} style={{ fontFamily: 'JetBrains Mono' }}>
              {netMargin >= 0 ? '+' : ''}{settings.currencySymbol}{netMargin.toLocaleString()}
            </span>
          </div>
          <div className="text-right">
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Inflow vs Outflow</span>
             <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${(latestStats.income + latestStats.expense) > 0 ? (latestStats.income / (latestStats.income + latestStats.expense)) * 100 : 0}%` }}
                ></div>
             </div>
          </div>
        </div>

        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 mt-4">Historical Performance</h3>
        
        {trendData.length === 0 ? (
          <div className="text-center py-10 opacity-20">
            <p className="text-[10px] font-black uppercase tracking-widest">No history recorded yet</p>
          </div>
        ) : (
          trendData.map((d, i) => {
            const diff = d.income - d.expense;
            const pct = d.expense > 0 ? (diff / d.expense) * 100 : 0;
            return (
              <div key={i} className={`p-5 rounded-[2rem] border transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-slate-800/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex justify-between items-center`}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 tracking-widest">{d.label} Summary</span>
                  <div className="flex items-center gap-3 mt-1">
                     <span className="text-[10px] font-bold text-emerald-500">+{settings.currencySymbol}{d.income.toLocaleString()}</span>
                     <span className="text-[10px] font-bold text-rose-500">-{settings.currencySymbol}{d.expense.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-black ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} style={{ fontFamily: 'JetBrains Mono' }}>
                    {diff >= 0 ? '+' : ''}{settings.currencySymbol}{diff.toLocaleString()}
                  </span>
                  <span className="text-[7px] font-black uppercase text-slate-400 block tracking-widest mt-0.5">
                     {pct > 0 ? '+' : ''}{pct.toFixed(1)}% yield
                  </span>
                </div>
              </div>
            );
          }).reverse()
        )}
      </div>
    </div>
  );
};

export default TrendAnalysis;
