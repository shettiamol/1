
import React from 'react';
import { useAppState } from '../store';

interface DataPoint {
  label: string;
  income: number;
  expense: number;
}

interface Props {
  data: DataPoint[];
}

const GroupedBarChart: React.FC<Props> = ({ data }) => {
  const { settings, theme } = useAppState();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-30">
        <i className="fa-solid fa-chart-column text-4xl mb-3"></i>
        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Historical Streams</p>
      </div>
    );
  }

  const chartHeight = 200;
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense, 1000)));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-end justify-around gap-6 h-[260px] pt-8 pb-10 px-4">
        {data.map((d, i) => {
          const incHeight = (d.income / maxVal) * chartHeight;
          const expHeight = (d.expense / maxVal) * chartHeight;

          return (
            <div key={i} className="flex flex-col items-center gap-3 flex-1 min-w-[50px] group">
              <div className="flex items-end gap-1.5 relative h-[200px]">
                {/* Income Bar */}
                <div 
                  className="w-4 rounded-t-lg transition-all duration-1000 ease-out relative"
                  style={{ 
                    height: `${Math.max(incHeight, 4)}px`, 
                    backgroundColor: settings.incomeColor,
                    boxShadow: `0 4px 12px ${settings.incomeColor}33`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    <span className="text-[7px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded shadow-lg">
                      {settings.currencySymbol}{d.income.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Expense Bar */}
                <div 
                  className="w-4 rounded-t-lg transition-all duration-1000 ease-out relative"
                  style={{ 
                    height: `${Math.max(expHeight, 4)}px`, 
                    backgroundColor: settings.expenseColor,
                    boxShadow: `0 4px 12px ${settings.expenseColor}33`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none translate-y-[-100%]">
                    <span className="text-[7px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-lg">
                      {settings.currencySymbol}{d.expense.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter whitespace-nowrap">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: settings.incomeColor }}></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Inflow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: settings.expenseColor }}></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Outflow</span>
        </div>
      </div>
    </div>
  );
};

export default GroupedBarChart;
