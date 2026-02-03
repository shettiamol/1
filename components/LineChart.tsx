
import React from 'react';
import { useAppState } from '../store';
import { TransactionType } from '../types';

interface DataPoint {
  label: string;
  income: number;
  expense: number;
}

interface Props {
  data: DataPoint[];
  variant?: 'LINE' | 'AREA';
  singleSeries?: boolean;
  singleSeriesType?: TransactionType;
}

const LineChart: React.FC<Props> = ({ 
  data, 
  variant = 'AREA', 
  singleSeries = false,
  singleSeriesType = TransactionType.EXPENSE
}) => {
  const { settings, theme } = useAppState();

  const width = 400;
  const height = 240;
  const padding = 40;

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense, 100)));
  const stepX = (width - padding * 2) / (data.length > 1 ? data.length - 1 : 1);

  const getY = (val: number) => height - padding - (val / maxVal) * (height - padding * 2);
  const getX = (index: number) => padding + index * stepX;

  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.expense)}`).join(' ');

  const incomeArea = `${padding},${height - padding} ${incomePoints} ${width - padding},${height - padding}`;
  const expenseArea = `${padding},${height - padding} ${expensePoints} ${width - padding},${height - padding}`;

  const renderIncome = !singleSeries || singleSeriesType === TransactionType.INCOME;
  const renderExpense = !singleSeries || singleSeriesType === TransactionType.EXPENSE;

  return (
    <div className="w-full animate-in fade-in zoom-in-95">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={settings.incomeColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={settings.incomeColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={settings.expenseColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={settings.expenseColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line
              x1={padding}
              y1={getY(maxVal * p)}
              x2={width - padding}
              y2={getY(maxVal * p)}
              stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'}
              strokeWidth="1"
            />
            <text
              x={padding - 5}
              y={getY(maxVal * p)}
              textAnchor="end"
              alignmentBaseline="middle"
              className="text-[8px] font-black fill-slate-300"
              style={{ fontFamily: 'JetBrains Mono' }}
            >
              {Math.round((maxVal * p) / 1000)}k
            </text>
          </g>
        ))}

        {/* Areas */}
        {variant === 'AREA' && (
          <>
            {renderIncome && <polygon points={incomeArea} fill="url(#incomeGrad)" />}
            {renderExpense && <polygon points={expenseArea} fill="url(#expenseGrad)" />}
          </>
        )}

        {/* Lines */}
        {renderIncome && (
          <polyline
            points={incomePoints}
            fill="none"
            stroke={settings.incomeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
        )}
        {renderExpense && (
          <polyline
            points={expensePoints}
            fill="none"
            stroke={settings.expenseColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
        )}

        {/* X-Axis Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={height - padding + 20}
            textAnchor="middle"
            className="text-[7px] font-black fill-slate-400 uppercase tracking-tighter"
          >
            {d.label.length > 8 ? d.label.substring(0, 7) + '..' : d.label}
          </text>
        ))}

        {/* Data Points */}
        {data.map((d, i) => (
          <g key={i}>
            {renderIncome && (
              <circle
                cx={getX(i)}
                cy={getY(d.income)}
                r="3"
                fill="white"
                stroke={settings.incomeColor}
                strokeWidth="1.5"
                className="drop-shadow-md"
              />
            )}
            {renderExpense && (
              <circle
                cx={getX(i)}
                cy={getY(d.expense)}
                r="3"
                fill="white"
                stroke={settings.expenseColor}
                strokeWidth="1.5"
                className="drop-shadow-md"
              />
            )}
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      {!singleSeries && (
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.incomeColor }}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: settings.expenseColor }}></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expenditure</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineChart;
