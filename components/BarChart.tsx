
import React from 'react';
import { useAppState } from '../store';
import { Category } from '../types';

interface BarChartItem extends Category {
  amount: number;
  share: number;
}

interface Props {
  data: BarChartItem[];
  total: number;
}

const BarChart: React.FC<Props> = ({ data, total }) => {
  const { settings, theme } = useAppState();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-30">
        <i className="fa-solid fa-chart-column text-4xl mb-3"></i>
        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Data Streams</p>
      </div>
    );
  }

  // Find max value to scale the bars correctly relative to each other or the budget
  const maxVal = Math.max(...data.map(item => Math.max(item.amount, item.budgetLimit)));

  return (
    <div className="space-y-6 py-2 animate-in fade-in slide-in-from-bottom-4">
      {data.map((item) => {
        const hasBudget = item.budgetLimit > 0;
        const budgetUsage = hasBudget ? (item.amount / item.budgetLimit) * 100 : 0;
        const relativeWidth = maxVal > 0 ? (item.amount / maxVal) * 100 : 0;
        const budgetMarkerPos = maxVal > 0 && hasBudget ? (item.budgetLimit / maxVal) * 100 : 0;

        return (
          <div key={item.id} className="group">
            <div className="flex justify-between items-end mb-2 px-1">
              <div className="flex items-center gap-3">
                <div 
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-xs shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: item.color, boxShadow: `0 4px 12px ${item.color}33` }}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-wider dark:text-slate-100">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                      {item.share.toFixed(1)}% Share
                    </span>
                    {hasBudget && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                        <span className={`text-[8px] font-black uppercase ${budgetUsage > 100 ? 'text-rose-500' : 'text-indigo-400'}`}>
                          {budgetUsage.toFixed(0)}% Budget
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black dark:text-white leading-none mb-0.5" style={{ fontFamily: 'JetBrains Mono' }}>
                  {settings.currencySymbol}{item.amount.toLocaleString()}
                </p>
                {hasBudget && (
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                    Limit: {settings.currencySymbol}{item.budgetLimit.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className={`h-5 w-full rounded-2xl overflow-hidden relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {/* Budget Marker Line */}
              {hasBudget && budgetMarkerPos < 100 && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600 z-10 opacity-50"
                  style={{ left: `${budgetMarkerPos}%` }}
                >
                  <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-inherit"></div>
                </div>
              )}

              {/* Main Spending Bar */}
              <div 
                className="h-full rounded-2xl transition-all duration-1000 ease-out relative"
                style={{ 
                  width: `${Math.max(relativeWidth, 2)}%`, 
                  backgroundColor: item.color,
                  boxShadow: `0 0 20px ${item.color}33`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                {budgetUsage > 100 && (
                  <div className="absolute inset-0 animate-pulse bg-rose-500/20"></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
