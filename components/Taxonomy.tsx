
import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../store';
import { TransactionType, Category, SubCategory } from '../types';

const ICONS = [
  'fa-utensils', 'fa-house', 'fa-car', 'fa-shopping-cart', 'fa-heart', 
  'fa-plane', 'fa-film', 'fa-gamepad', 'fa-graduation-cap', 'fa-briefcase', 
  'fa-money-bill-wave', 'fa-piggy-bank', 'fa-wallet', 'fa-credit-card', 
  'fa-building-columns', 'fa-vault', 'fa-receipt', 'fa-file-invoice-dollar', 
  'fa-hand-holding-dollar', 'fa-sack-dollar', 'fa-gem', 'fa-chart-line', 
  'fa-gift', 'fa-mobile-screen', 'fa-laptop', 'fa-bus', 'fa-train', 
  'fa-bicycle', 'fa-dumbbell', 'fa-stethoscope', 'fa-shield-halved', 'fa-box',
  'fa-coffee', 'fa-pizza-slice', 'fa-bowl-food', 'fa-gas-pump', 'fa-pills'
];

const Taxonomy: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, theme, settings, updateSettings, addSubCategory, updateSubCategory, deleteSubCategory } = useAppState();
  const [tab, setTab] = useState<TransactionType>(TransactionType.EXPENSE);
  
  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  
  // Expansion state
  const [expandedCatIds, setExpandedCatIds] = useState<Set<string>>(new Set());

  // Edit states
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingSub, setEditingSub] = useState<{parentId: string, sub: SubCategory} | null>(null);

  // Form states
  const [catForm, setCatForm] = useState({ name: '', budget: '0', icon: 'fa-box', color: '#6366f1' });
  const [subForm, setSubForm] = useState({ name: '', budget: '0', icon: 'fa-tag' });
  
  const [isCatIconDropdownOpen, setIsCatIconDropdownOpen] = useState(false);
  const [isSubIconDropdownOpen, setIsSubIconDropdownOpen] = useState(false);

  const catIconRef = useRef<HTMLDivElement>(null);
  const subIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (catIconRef.current && !catIconRef.current.contains(e.target as Node)) setIsCatIconDropdownOpen(false);
      if (subIconRef.current && !subIconRef.current.contains(e.target as Node)) setIsSubIconDropdownOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedCatIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCatIds(newSet);
  };

  const openCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, budget: cat.budgetLimit.toString(), icon: cat.icon, color: cat.color });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', budget: '0', icon: 'fa-box', color: '#6366f1' });
    }
    setIsCatModalOpen(true);
  };

  const openSubModal = (parentId: string, sub?: SubCategory) => {
    if (sub) {
      setEditingSub({ parentId, sub });
      setSubForm({ name: sub.name, budget: (sub.budget || 0).toString(), icon: sub.icon || 'fa-tag' });
    } else {
      setEditingSub({ parentId, sub: { id: '', name: '', budget: 0, icon: 'fa-tag' } });
      setSubForm({ name: '', budget: '0', icon: 'fa-tag' });
    }
    setIsSubModalOpen(true);
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    const newLimit = parseFloat(catForm.budget) || 0;
    
    // Check if new limit is less than current sum of subcategories (Expense only)
    if (editingCat && tab === TransactionType.EXPENSE) {
      const currentSubsTotal = editingCat.subCategories.reduce((sum, s) => sum + (s.budget || 0), 0);
      if (newLimit < currentSubsTotal) {
        alert(`Constraint Error: Main budget cannot be less than the sum of active branch budgets (${settings.currencySymbol}${currentSubsTotal.toLocaleString()}).`);
        return;
      }
    }

    const payload: Category = {
      id: editingCat?.id || Math.random().toString(36).substr(2, 9),
      name: catForm.name,
      type: tab,
      color: catForm.color,
      icon: catForm.icon,
      budgetLimit: tab === TransactionType.EXPENSE ? newLimit : 0,
      subCategories: editingCat?.subCategories || []
    };
    if (editingCat) updateCategory(payload);
    else addCategory(payload);
    setIsCatModalOpen(false);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    const parent = categories.find(c => c.id === editingSub.parentId);
    if (!parent) return;

    const newSubBudget = parseFloat(subForm.budget) || 0;
    const otherSubsTotal = parent.subCategories
      .filter(s => s.id !== editingSub.sub.id)
      .reduce((sum, s) => sum + (s.budget || 0), 0);

    // Validation: Sum of sub budgets cannot exceed parent budget (Expense only)
    if (tab === TransactionType.EXPENSE && (otherSubsTotal + newSubBudget > parent.budgetLimit)) {
      alert(`sub categories budget can not exceed main account budget - ${parent.budgetLimit}`);
      return;
    }

    const payload: SubCategory = {
      id: editingSub.sub.id || Math.random().toString(36).substr(2, 9),
      name: subForm.name,
      budget: tab === TransactionType.EXPENSE ? newSubBudget : 0,
      icon: subForm.icon
    };
    if (editingSub.sub.id) updateSubCategory(editingSub.parentId, payload);
    else addSubCategory(editingSub.parentId, payload);
    setIsSubModalOpen(false);
  };

  return (
    <div className="p-6 pb-32 h-full overflow-y-auto hide-scrollbar">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Categories</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget Taxonomy</p>
        </div>
        <button 
          onClick={() => openCatModal()} 
          className="w-12 h-12 gradient-purple rounded-2xl flex items-center justify-center text-white smooth-deep-shadow transition-transform active:scale-90"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6 shadow-inner">
        <button onClick={() => setTab(TransactionType.EXPENSE)} className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all rounded-xl ${tab === TransactionType.EXPENSE ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Expenditure</button>
        <button onClick={() => setTab(TransactionType.INCOME)} className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all rounded-xl ${tab === TransactionType.INCOME ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Revenue</button>
      </div>

      {tab === TransactionType.EXPENSE && (
        <div className="mb-8 p-6 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-bell text-indigo-500 text-xs"></i>
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 tracking-widest">Global Alert Threshold</span>
            </div>
            <span className="text-xs font-black text-indigo-500" style={{ fontFamily: 'JetBrains Mono' }}>{settings.budgetAlertThreshold}%</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={settings.budgetAlertThreshold}
            onChange={(e) => updateSettings({ budgetAlertThreshold: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-4 leading-relaxed">
            Automatic alerts will trigger when spending reaches <span className="text-indigo-500">{settings.budgetAlertThreshold}%</span> of any category's assigned budget.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {categories.filter(c => c.type === tab).map(cat => (
          <div key={cat.id} className="space-y-2">
            {/* Category Row */}
            <div 
              onClick={() => toggleExpand(cat.id)}
              className={`p-4 rounded-[1.5rem] border flex items-center justify-between cursor-pointer transition-all ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-100 shadow-sm'} ${expandedCatIds.has(cat.id) ? 'ring-2 ring-indigo-500/20' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: cat.color }}>
                  <i className={`fa-solid ${cat.icon}`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black dark:text-white leading-tight">{cat.name}</p>
                    <i className={`fa-solid fa-chevron-down text-[8px] text-slate-400 transition-transform ${expandedCatIds.has(cat.id) ? 'rotate-180' : ''}`}></i>
                  </div>
                  {tab === TransactionType.EXPENSE && (
                    <p className="text-[10px] font-bold text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>
                      {settings.currencySymbol}{cat.budgetLimit.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => openSubModal(cat.id)} className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center text-[10px]"><i className="fa-solid fa-plus"></i></button>
                <button onClick={() => openCatModal(cat)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center text-[10px]"><i className="fa-solid fa-pencil"></i></button>
                <button onClick={() => { if(confirm('Purge category?')) deleteCategory(cat.id) }} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center text-[10px]"><i className="fa-solid fa-trash-can"></i></button>
              </div>
            </div>

            {/* Sub-Categories List (Animated) */}
            <div className={`grid transition-all duration-300 ease-in-out ${expandedCatIds.has(cat.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="ml-8 pt-2 space-y-2 pb-1">
                  {cat.subCategories.length === 0 ? (
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest py-2 px-4">No Sub-categories</p>
                  ) : (
                    cat.subCategories.map(sub => (
                      <div key={sub.id} className={`p-3 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50/50 border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-[10px]">
                            <i className={`fa-solid ${sub.icon || 'fa-tag'}`}></i>
                          </div>
                          <div>
                            <p className="text-xs font-black dark:text-slate-300">{sub.name}</p>
                            {tab === TransactionType.EXPENSE && (
                              <p className="text-[9px] font-bold text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>
                                {settings.currencySymbol}{(sub.budget || 0).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openSubModal(cat.id, sub)} className="w-7 h-7 rounded-lg text-slate-300 hover:text-indigo-500 transition-colors"><i className="fa-solid fa-pencil text-[10px]"></i></button>
                          <button onClick={() => { if(confirm('Purge sub-category?')) deleteSubCategory(cat.id, sub.id) }} className="w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleSaveCat} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">{editingCat ? 'Modify Class' : 'Define Class'}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="relative" ref={catIconRef}>
                  <button type="button" onClick={() => setIsCatIconDropdownOpen(!isCatIconDropdownOpen)} className="w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-inner">
                    <i className={`fa-solid ${catForm.icon} text-xl`}></i>
                  </button>
                  {isCatIconDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[240px] bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 grid grid-cols-5 gap-1 rounded-2xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                      {ICONS.map(i => (
                        <button key={i} type="button" onClick={() => { setCatForm({...catForm, icon: i}); setIsCatIconDropdownOpen(false); }} className={`w-full aspect-square flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${catForm.icon === i ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                          <i className={`fa-solid ${i}`}></i>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Category Label</label>
                  <input type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="e.g. Dining" required />
                </div>
              </div>
              
              {tab === TransactionType.EXPENSE && (
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Master Budget ({settings.currencySymbol})</label>
                  <input type="number" value={catForm.budget} onChange={e => setCatForm({...catForm, budget: e.target.value})} onFocus={e => e.currentTarget.select()} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                </div>
              )}

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Visual Branding</label>
                <input type="color" value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} className="w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none cursor-pointer" />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px]">Cancel</button>
              <button type="submit" className="flex-2 gradient-purple text-white px-8 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Commit</button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Category Modal */}
      {isSubModalOpen && editingSub && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleSaveSub} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight">{editingSub.sub.id ? 'Modify Branch' : 'New Branch'}</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="relative" ref={subIconRef}>
                  <button type="button" onClick={() => setIsSubIconDropdownOpen(!isSubIconDropdownOpen)} className="w-full aspect-square rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-inner">
                    <i className={`fa-solid ${subForm.icon} text-xl`}></i>
                  </button>
                  {isSubIconDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-[240px] bg-white dark:bg-slate-800 border dark:border-slate-700 p-2 grid grid-cols-5 gap-1 rounded-2xl shadow-2xl z-10 max-h-48 overflow-y-auto hide-scrollbar">
                      {ICONS.map(i => (
                        <button key={i} type="button" onClick={() => { setSubForm({...subForm, icon: i}); setIsSubIconDropdownOpen(false); }} className={`w-full aspect-square flex items-center justify-center rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm ${subForm.icon === i ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>
                          <i className={`fa-solid ${i}`}></i>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-3">
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Sub-Category Label</label>
                  <input type="text" value={subForm.name} onChange={e => setSubForm({...subForm, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="e.g. Coffee" required />
                </div>
              </div>
              
              {tab === TransactionType.EXPENSE && (
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 ml-1 block">Branch Budget ({settings.currencySymbol})</label>
                  <input type="number" value={subForm.budget} onChange={e => setSubForm({...subForm, budget: e.target.value})} onFocus={e => e.currentTarget.select()} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                </div>
              )}
            </div>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setIsSubModalOpen(false)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px]">Cancel</button>
              <button type="submit" className="flex-2 gradient-purple text-white px-8 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Commit</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Taxonomy;
