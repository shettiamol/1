
import React from 'react';
import { useAppState } from '../store';
import { Category } from '../types';

interface ColumnChartItem extends Category {
  amount: number;
  share: number;
}

interface Props {
  data: ColumnChartItem[];
  total: number;
}

const ColumnChart: React.FC<Props> = ({ data, total }) => {
  const { settings, theme } = useAppState();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 opacity-30">
        <i className="fa-solid fa-chart-column text-4xl mb-3"></i>
        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Data Streams</p>
      </div>
    );
  }

  const chartHeight = 200;
  const maxVal = Math.max(...data.map(item => item.amount));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-end justify-around gap-2 h-[240px] pt-8 pb-10 px-2 overflow-x-auto hide-scrollbar">
        {data.map((item) => {
          const barHeight = maxVal > 0 ? (item.amount / maxVal) * chartHeight : 0;
          return (
            <div key={item.id} className="flex flex-col items-center flex-1 min-w-[45px] group">
              <div className="relative w-full flex flex-col items-center">
                 {/* Value Tooltip on Hover */}
                 <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    <span className="text-[9px] font-black bg-slate-800 text-white px-2 py-1 rounded-lg shadow-xl">
                      {settings.currencySymbol}{item.amount.toLocaleString()}
                    </span>
                 </div>
                 
                 {/* Vertical Bar */}
                 <div 
                   className="w-full max-w-[24px] rounded-t-xl transition-all duration-1000 ease-out relative group-hover:scale-x-110 origin-bottom"
                   style={{ 
                     height: `${Math.max(barHeight, 4)}px`, 
                     backgroundColor: item.color,
                     boxShadow: `0 4px 15px ${item.color}33`
                   }}
                 >
                   <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                 </div>
              </div>

              {/* Icon & Label */}
              <div className="mt-3 flex flex-col items-center gap-1">
                 <div 
                   className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] shadow-sm"
                   style={{ backgroundColor: item.color }}
                 >
                   <i className={`fa-solid ${item.icon}`}></i>
                 </div>
                 <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter truncate w-12 text-center">
                   {item.name}
                 </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend Info */}
      <div className="flex justify-center items-center gap-4 mt-2 px-4">
         <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Highest: {settings.currencySymbol}{maxVal.toLocaleString()}</span>
         </div>
      </div>
    </div>
  );
};

export default ColumnChart;
