
import React, { useState } from 'react';
import { useAppState, ADMIN_MASTER_CODE } from '../store';

const AuthView: React.FC = () => {
  const { setUser, theme } = useAppState();
  const [formData, setFormData] = useState({
    name: '',
    bypassCode: '',
    approved: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const generateBypassCodes = () => {
    const codes = [];
    for (let i = 0; i < 50; i++) {
      codes.push(Math.floor(100000 + Math.random() * 900000).toString());
    }
    return codes;
  };

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.approved) {
      alert("Please approve the data protocol to continue.");
      return;
    }

    if (formData.bypassCode.length < 4) {
      alert("Bypass code must be at least 4 digits for encryption entropy.");
      return;
    }

    setIsLoading(true);
    
    // Brief simulation for protocol synchronization
    setTimeout(() => {
      setIsLoading(false);
      
      const isMaster = formData.bypassCode === ADMIN_MASTER_CODE;

      setUser({
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name || (isMaster ? 'Protocol Master' : 'Standard Node'),
        email: '', // Simplified - no longer required
        mobile: '', // Simplified - no longer required
        accessCodes: isMaster ? [ADMIN_MASTER_CODE, ...generateBypassCodes()] : [formData.bypassCode],
        isMaster: isMaster
      });
      
      alert(isMaster ? "Protocol: Master Access Synchronized." : "Protocol: Identity Enrolled.");
    }, 800);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 pb-12 overflow-y-auto hide-scrollbar ${theme === 'dark' ? 'bg-slate-900' : 'bg-[#F8F9FD]'}`}>
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 gradient-purple rounded-[2.2rem] flex items-center justify-center text-white text-3xl smooth-deep-shadow mx-auto mb-6 transform hover:rotate-6 transition-all duration-500">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>SmartSpend</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 opacity-80">Ledger Enrollment</p>
        </div>

        <div className={`rounded-[3rem] p-10 border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-100 shadow-2xl shadow-indigo-100/50'}`}>
          <form onSubmit={handleInitialize} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Label</label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border border-transparent focus:border-indigo-500/30 rounded-2xl pl-12 pr-5 py-4 text-xs font-bold outline-none transition-all" 
                  placeholder="Your Name" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Personal Bypass Code</label>
              <div className="relative">
                <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                <input 
                  type="password" 
                  required 
                  value={formData.bypassCode} 
                  onChange={(e) => setFormData({...formData, bypassCode: e.target.value.replace(/\D/g, '')})} 
                  className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border border-transparent focus:border-indigo-500/30 rounded-2xl pl-12 pr-5 py-4 text-xs font-bold outline-none transition-all tracking-[0.3em]" 
                  placeholder="••••" 
                />
              </div>
              <p className="text-[7px] text-slate-400 uppercase font-bold ml-1 tracking-wider">Numeric key for app lock security</p>
            </div>

            <div 
              className="pt-2 flex items-start gap-3 cursor-pointer select-none group"
              onClick={() => setFormData({...formData, approved: !formData.approved})}
            >
              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${formData.approved ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-slate-50'}`}>
                {formData.approved && <i className="fa-solid fa-check text-[8px] text-white"></i>}
              </div>
              <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed group-hover:text-indigo-500 transition-colors">
                I approve the encrypted storage of my financial records on this device.
              </p>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full gradient-purple text-white font-black py-5 rounded-[2rem] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em] group"
              >
                {isLoading ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Initialize Protocol
                    <i className="fa-solid fa-arrow-right-long group-hover:translate-x-1 transition-transform"></i>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-12 text-center opacity-20">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em]">Local-Only Encryption Active</p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
