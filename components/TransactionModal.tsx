
import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../store';
import { Transaction, TransactionType, PendingTransaction, BillReminder, RecurringFrequency } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction;
  pendingTransaction?: PendingTransaction;
  prefillBill?: Partial<BillReminder & { accountId?: string; subAccountId?: string; monthYear?: string }>;
}

const FREQUENCIES: { value: RecurringFrequency; label: string; icon: string }[] = [
  { value: 'DAILY', label: '1D', icon: 'fa-sun' },
  { value: 'WEEKLY', label: '7D', icon: 'fa-calendar-week' },
  { value: 'MONTHLY', label: '1M', icon: 'fa-calendar-day' },
  { value: 'YEARLY', label: '1Y', icon: 'fa-calendar' }
];

const TransactionModal: React.FC<Props> = ({ isOpen, onClose, editingTransaction, pendingTransaction, prefillBill }) => {
  const { categories, accounts, addTransaction, updateTransaction, dismissPendingTransaction, settings, handleReminderAction } = useAppState();
  
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [subAccountId, setSubAccountId] = useState('');
  
  const [toAccountId, setToAccountId] = useState('');
  const [toSubAccountId, setToSubAccountId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [recurringEndMonth, setRecurringEndMonth] = useState('');
  const [attachment, setAttachment] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [isAccessingHardware, setIsAccessingHardware] = useState<'CAMERA' | 'GALLERY' | 'GEO' | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const isNewEntry = !editingTransaction && !pendingTransaction && !prefillBill;
    if (isOpen && isNewEntry && type === TransactionType.INCOME && !categoryId) {
      setCategoryId('cat-inc-salary');
      setSubCategoryId('sc-sal-salary');
    }
  }, [type, isOpen, editingTransaction, pendingTransaction, prefillBill, categoryId]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
      
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(editingTransaction.amount.toString());
        setCategoryId(editingTransaction.categoryId || '');
        setSubCategoryId(editingTransaction.subCategoryId || '');
        setAccountId(editingTransaction.accountId);
        setSubAccountId(editingTransaction.subAccountId || '');
        setToAccountId(editingTransaction.toAccountId || '');
        setToSubAccountId(editingTransaction.toSubAccountId || '');
        setTitle(editingTransaction.title);
        setDescription(editingTransaction.description);
        setDate(editingTransaction.date);
        setTime(editingTransaction.time);
        setIsRecurring(editingTransaction.isRecurring);
        setRecurringFrequency(editingTransaction.recurringFrequency || 'MONTHLY');
        setRecurringEndMonth(editingTransaction.recurringEndMonth || '');
        setAttachment(editingTransaction.attachment);
        setLocation(editingTransaction.location);
      } else if (pendingTransaction) {
        setType(pendingTransaction.type);
        setAmount(pendingTransaction.amount.toString());
        setTitle(pendingTransaction.suggestedTitle);
        setDescription(pendingTransaction.rawText);
        setDate(pendingTransaction.date);
        setTime(pendingTransaction.time);
        setAccountId(accounts[0]?.id || '');
        setSubAccountId(accounts[0]?.subAccounts[0]?.id || '');
        setIsRecurring(false);
        setAttachment(undefined);
        setLocation(undefined);
      } else if (prefillBill) {
        const isCycleSettlement = prefillBill.id?.startsWith('vault-');
        setType(isCycleSettlement ? TransactionType.TRANSFER : TransactionType.EXPENSE);
        setAmount(prefillBill.amount?.toString() || '');
        setTitle(prefillBill.title || '');
        
        if (isCycleSettlement) {
          setToAccountId(prefillBill.accountId || '');
          setToSubAccountId(prefillBill.subAccountId || '');
          const otherAcc = accounts.find(a => a.id !== prefillBill.accountId) || accounts[0];
          setAccountId(otherAcc?.id || '');
          setSubAccountId(otherAcc?.subAccounts[0]?.id || '');
        } else {
          setAccountId(prefillBill.accountId || accounts[0]?.id || '');
          setSubAccountId(prefillBill.subAccountId || accounts[0]?.subAccounts[0]?.id || '');
        }
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().slice(0, 5));
        setIsRecurring(false);
        setAttachment(undefined);
        setLocation(undefined);
      } else {
        setType(TransactionType.EXPENSE);
        setAmount('');
        setTitle('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().slice(0, 5));
        setAccountId(accounts[0]?.id || '');
        setSubAccountId(accounts[0]?.subAccounts[0]?.id || '');
        setCategoryId('');
        setSubCategoryId('');
        setRecurringFrequency('MONTHLY');
        setIsRecurring(false);
        setAttachment(undefined);
        setLocation(undefined);
        const sixMonthsOut = new Date();
        sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);
        setRecurringEndMonth(sixMonthsOut.toISOString().slice(0, 7));
      }
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editingTransaction, pendingTransaction, prefillBill, accounts]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIsAccessingHardware(null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsAccessingHardware('GEO');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsAccessingHardware(null);
      },
      (err) => {
        setIsAccessingHardware(null);
        alert("Location Error: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const triggerHardware = (type: 'CAMERA' | 'GALLERY') => {
    setIsAccessingHardware(type);
    if (type === 'CAMERA') cameraInputRef.current?.click();
    else galleryInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      alert("Please configure a source vault before logging.");
      return;
    }

    const transaction: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      title,
      description,
      date,
      time,
      amount: parseFloat(amount) || 0,
      type,
      categoryId: type !== TransactionType.TRANSFER ? categoryId : undefined,
      subCategoryId: type !== TransactionType.TRANSFER ? subCategoryId : undefined,
      accountId,
      subAccountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      toSubAccountId: type === TransactionType.TRANSFER ? toSubAccountId : undefined,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      recurringEndMonth: isRecurring ? recurringEndMonth : undefined,
      attachment,
      location
    };

    if (editingTransaction) {
      updateTransaction(transaction, editingTransaction);
    } else {
      addTransaction(transaction);
      if (pendingTransaction) dismissPendingTransaction(pendingTransaction.id);
      if (prefillBill?.id) handleReminderAction(prefillBill.id, 'COMPLETED', prefillBill.monthYear);
    }
    handleClose();
  };

  if (!shouldRender) return null;

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedToAccount = accounts.find(a => a.id === toAccountId);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end">
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      ></div>

      <div 
        className={`relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-[3rem] shadow-2xl transition-transform duration-300 ease-out overflow-hidden flex flex-col ${isAnimating ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '92vh' }}
      >
        <div className="flex flex-col items-center pt-4 pb-2 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-6"></div>
          <div className="w-full px-8 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
              {editingTransaction ? 'Revise Entry' : 'Commit Entry'}
            </h2>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto hide-scrollbar px-8 pb-12 pt-4 space-y-8">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shadow-inner border border-slate-200/50 dark:border-slate-700/50">
            {(Object.values(TransactionType)).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-3.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all ${type === t ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t === TransactionType.EXPENSE ? 'Outflow' : t === TransactionType.INCOME ? 'Inflow' : 'Shift'}
              </button>
            ))}
          </div>

          <div className="text-center space-y-2 py-4">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Magnitude</label>
             <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-black text-indigo-500">{settings.currencySymbol}</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full max-w-[200px] bg-transparent text-center text-5xl font-black outline-none border-b-2 border-transparent focus:border-indigo-100 transition-all dark:text-white" 
                  placeholder="0.00" 
                  autoFocus
                  required 
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Date</label>
              <div className="relative">
                <i className="fa-solid fa-calendar-day absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl pl-10 pr-4 py-3.5 text-xs font-bold outline-none transition-all" required />
              </div>
            </div>
            <div className="relative group">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Timestamp</label>
              <div className="relative">
                <i className="fa-solid fa-clock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl pl-10 pr-4 py-3.5 text-xs font-bold outline-none transition-all" required />
              </div>
            </div>
          </div>

          {type !== TransactionType.TRANSFER && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in">
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-3.5 text-xs font-bold outline-none border border-slate-100 dark:border-slate-700" required>
                  <option value="">Select Category</option>
                  {categories.filter(c => c.type === type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub-Category</label>
                <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-4 py-3.5 text-xs font-bold outline-none border border-slate-100 dark:border-slate-700">
                  <option value="">None</option>
                  {selectedCategory?.subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 space-y-4">
            <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-vault"></i> {type === TransactionType.TRANSFER ? 'Source Vault' : 'Primary Vault'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold outline-none border border-slate-100 dark:border-slate-700" required>
                <option value="">Account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={subAccountId} onChange={(e) => setSubAccountId(e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold outline-none border border-slate-100 dark:border-slate-700" required>
                <option value="">Branch</option>
                {selectedAccount?.subAccounts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {type === TransactionType.TRANSFER && (
            <div className="p-6 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 space-y-4 animate-in slide-in-from-bottom-4">
               <h3 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-arrow-right-long"></i> Target Vault
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold outline-none border border-indigo-100/50 dark:border-indigo-500/20" required>
                    <option value="">Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select value={toSubAccountId} onChange={(e) => setToSubAccountId(e.target.value)} className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold outline-none border border-indigo-100/50 dark:border-indigo-500/20" required>
                    <option value="">Branch</option>
                    {selectedToAccount?.subAccounts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
               <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
               <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-5 py-3.5 text-xs font-bold outline-none border border-slate-100 dark:border-slate-700" placeholder="e.g. Utility Payment" required />
            </div>
            <div className="space-y-1.5">
               <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Memo</label>
               <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl px-5 py-3.5 text-xs font-bold outline-none border border-slate-100 dark:border-slate-700 min-h-[80px]" placeholder="Specific details..."></textarea>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hardware Interface</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                onClick={() => triggerHardware('CAMERA')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed transition-all active:scale-95 ${isAccessingHardware === 'CAMERA' ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'}`}
              >
                <i className={`fa-solid ${isAccessingHardware === 'CAMERA' ? 'fa-circle-notch animate-spin' : 'fa-camera'} text-indigo-500 mb-2`}></i>
                <span className="text-[7px] font-black uppercase">Camera</span>
              </button>
              <button 
                type="button" 
                onClick={() => triggerHardware('GALLERY')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed transition-all active:scale-95 ${isAccessingHardware === 'GALLERY' ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'}`}
              >
                <i className={`fa-solid ${isAccessingHardware === 'GALLERY' ? 'fa-circle-notch animate-spin' : 'fa-image'} text-indigo-500 mb-2`}></i>
                <span className="text-[7px] font-black uppercase">Archive</span>
              </button>
              <button 
                type="button" 
                onClick={captureLocation}
                disabled={isAccessingHardware === 'GEO'}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed transition-all active:scale-95 ${location ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : isAccessingHardware === 'GEO' ? 'bg-indigo-50 border-indigo-400 animate-pulse' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'}`}
              >
                <i className={`fa-solid ${isAccessingHardware === 'GEO' ? 'fa-satellite-dish animate-spin' : location ? 'fa-location-dot' : 'fa-compass'} ${location ? 'text-emerald-500' : 'text-indigo-500'} mb-2`}></i>
                <span className="text-[7px] font-black uppercase">{isAccessingHardware === 'GEO' ? 'Tagging...' : location ? 'Tagged' : 'Geo-Tag'}</span>
              </button>
            </div>
            
            <input type="file" ref={galleryInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
            <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

            {attachment && (
              <div className="relative mt-4 group animate-in zoom-in-95">
                <img src={attachment} className="w-full h-48 object-cover rounded-2xl border-2 border-indigo-500/20 shadow-lg" alt="Attachment" />
                <button type="button" onClick={() => setAttachment(undefined)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-90"><i className="fa-solid fa-trash-can text-xs"></i></button>
              </div>
            )}
            
            {location && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10 animate-in slide-in-from-top-1">
                 <i className="fa-solid fa-location-dot text-emerald-500 text-xs"></i>
                 <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                    Satellite Sync: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                 </span>
                 <button type="button" onClick={() => setLocation(undefined)} className="ml-auto text-rose-400 hover:text-rose-600"><i className="fa-solid fa-xmark text-xs"></i></button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs ${isRecurring ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-slate-300'}`}>
                      <i className="fa-solid fa-repeat"></i>
                   </div>
                   <div>
                     <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest block">Recurring Protocol</span>
                     <p className="text-[7px] font-bold text-slate-400 uppercase">Automatic Cycle Entry</p>
                   </div>
                </div>
                <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${isRecurring ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>

             {isRecurring && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                   <div className="space-y-2">
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                      <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
                        {FREQUENCIES.map((f) => (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => setRecurringFrequency(f.value)}
                            className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${recurringFrequency === f.value ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            <i className={`fa-solid ${f.icon} text-[10px]`}></i>
                            <span className="text-[8px] font-black">{f.label}</span>
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="p-4 rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-2">Protocol Termination</label>
                      <input type="month" value={recurringEndMonth} onChange={(e) => setRecurringEndMonth(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white rounded-xl px-4 py-3 text-xs font-black outline-none border border-transparent focus:border-indigo-100" required={isRecurring} />
                   </div>
                </div>
             )}
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full gradient-purple text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-indigo-500/20 active:scale-90 transition-all uppercase tracking-[0.2em] text-[11px]">
               Sync to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
