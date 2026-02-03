
import React, { useRef, useState } from 'react';
import { useAppState } from '../store';
import { AppBackup } from '../types';

const DataManagement: React.FC = () => {
  const { 
    theme, 
    settings, 
    transactions, 
    categories, 
    accounts, 
    billReminders, 
    goals, 
    handledReminders, 
    importData 
  } = useAppState();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // CSV Export Filter State
  const [exportMode, setExportMode] = useState<'ALL' | 'PERIOD'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name || 'N/A';
  const getSubCategoryName = (catId?: string, subId?: string) => {
    if (!catId || !subId) return 'N/A';
    return categories.find(c => c.id === catId)?.subCategories.find(s => s.id === subId)?.name || 'N/A';
  };
  const getAccountName = (id?: string) => accounts.find(a => a.id === id)?.name || 'N/A';
  const getSubAccountName = (accId?: string, subId?: string) => {
    if (!accId || !subId) return 'N/A';
    return accounts.find(a => a.id === accId)?.subAccounts.find(s => s.id === subId)?.name || 'N/A';
  };

  const exportToCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      let dataToExport = transactions;
      
      if (exportMode === 'PERIOD' && startDate && endDate) {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        dataToExport = transactions.filter(t => {
          const d = new Date(t.date + 'T00:00:00');
          return d >= start && d <= end;
        });
      }

      const headers = [
        'ID', 'Title', 'Date', 'Time', 'Amount', 'Type', 
        'Category', 'Sub-Category', 'Account', 'Sub-Account', 'Description'
      ];

      const rows = dataToExport.map(t => [
        `"${t.id}"`,
        `"${t.title}"`,
        `"${t.date}"`,
        `"${t.time}"`,
        t.amount,
        `"${t.type}"`,
        `"${getCategoryName(t.categoryId)}"`,
        `"${getSubCategoryName(t.categoryId, t.subCategoryId)}"`,
        `"${getAccountName(t.accountId)}"`,
        `"${getSubAccountName(t.accountId, t.subAccountId)}"`,
        `"${t.description?.replace(/"/g, '""') || ''}"`
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `smartspend_extract_${exportMode === 'ALL' ? 'full' : `${startDate}_to_${endDate}`}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.click();
      setIsExporting(false);
    }, 800);
  };

  const generateBackupFile = () => {
    setIsExporting(true);
    setTimeout(() => {
      // Comprehensive blueprint capturing ALL application state
      const backup: AppBackup = {
        transactions,
        categories,
        accounts,
        billReminders,
        goals,
        handledReminders,
        settings,
        version: '2.1.0'
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `smartspend_backup_complete_${new Date().toISOString().split('T')[0]}.json`);
      link.click();
      setIsExporting(false);
    }, 800);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Robustness check for required fields
        if (!json.transactions || !json.categories || !json.accounts) {
          throw new Error("Invalid structure");
        }
        setTimeout(() => {
          importData(json);
          setIsImporting(false);
          alert("Master Ledger Synchronized. All categories, accounts, goals, and history restored.");
        }, 1200);
      } catch (err) {
        setIsImporting(false);
        alert("Integrity Check Failed: The selected file is not a valid SmartSpend blueprint.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 pb-32 animate-in fade-in">
      <div className="mb-10">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Data Operations</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Synchronizer</p>
      </div>

      <div className="space-y-8">
        {/* 1. Master JSON Blueprint */}
        <section className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <i className="fa-solid fa-box-archive"></i>
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest">JSON Blueprint</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Complete State Snapshot</p>
            </div>
          </div>

          <button 
            onClick={generateBackupFile}
            disabled={isExporting}
            className="w-full py-5 gradient-purple text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl shadow-xl active:scale-95 disabled:opacity-50 transition-all"
          >
            {isExporting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Generate Complete Backup'}
          </button>
          
          <div className="mt-4 p-4 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10">
             <p className="text-[8px] font-medium text-indigo-600 dark:text-indigo-400 uppercase leading-relaxed text-center">
                Contains ALL Categories, Budgets, Vaults, Cycles, Goals, and Settings.
             </p>
          </div>
        </section>

        {/* 2. Detailed CSV Extraction */}
        <section className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <i className="fa-solid fa-file-csv"></i>
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest">CSV Extraction</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Granular Activity Export</p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-6 shadow-inner">
             <button 
               onClick={() => setExportMode('ALL')} 
               className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${exportMode === 'ALL' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
             >
                All Data
             </button>
             <button 
               onClick={() => setExportMode('PERIOD')} 
               className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${exportMode === 'PERIOD' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
             >
                By Period
             </button>
          </div>

          {exportMode === 'PERIOD' && (
            <div className="grid grid-cols-2 gap-3 mb-6 animate-in slide-in-from-top-2">
               <div>
                 <label className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1 block">Start Date</label>
                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white rounded-xl px-3 py-3 text-[10px] font-bold outline-none border border-slate-100 dark:border-slate-800" />
               </div>
               <div>
                 <label className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-1 block">End Date</label>
                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white rounded-xl px-3 py-3 text-[10px] font-bold outline-none border border-slate-100 dark:border-slate-800" />
               </div>
            </div>
          )}

          <button 
            onClick={exportToCSV}
            disabled={isExporting || (exportMode === 'PERIOD' && (!startDate || !endDate))}
            className="w-full py-5 border-2 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all active:scale-95 disabled:opacity-30"
          >
            {isExporting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'Extract Detailed CSV'}
          </button>
          
          <p className="mt-4 text-[7.5px] font-medium text-slate-400 uppercase text-center tracking-widest leading-relaxed">
            Exports 11 data fields per row for external analysis.
          </p>
        </section>

        {/* 3. Restoration Hub */}
        <section className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
              <i className="fa-solid fa-upload"></i>
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest">Restoration Hub</h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Deploy Blueprint File</p>
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full py-10 bg-slate-50 dark:bg-slate-900 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:text-indigo-500 transition-all group active:scale-95 disabled:opacity-50"
          >
            {isImporting ? (
              <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <i className="fa-solid fa-file-import text-3xl opacity-50 group-hover:opacity-100 transition-opacity"></i>
                <span>Choose Blueprint (.JSON)</span>
              </div>
            )}
          </button>
        </section>
      </div>
    </div>
  );
};

export default DataManagement;
