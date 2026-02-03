
import React, { useState, useEffect } from 'react';
import { useAppState, ADMIN_MASTER_CODE } from '../store';

const AuthView: React.FC = () => {
  const { setUser, theme } = useAppState();
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [resendTimer, setResendTimer] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '+91 ',
    otp: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleMobileChange = (val: string) => {
    if (!val.startsWith('+91 ')) {
      setFormData({ ...formData, mobile: '+91 ' });
      return;
    }
    const digits = val.slice(4).replace(/\D/g, '');
    if (digits.length <= 10) {
      setFormData({ ...formData, mobile: '+91 ' + digits });
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const mobileDigits = formData.mobile.slice(4);
    if (mobileDigits.length !== 10) {
      alert("Validation Error: Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setIsLoading(true);
    // Simulate API delay for verification packet dispatch
    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
      setResendTimer(30);
    }, 1200);
  };

  const generateBypassCodes = () => {
    const codes = [];
    const BLACKLIST = ['123456', '000000', '111111', '654321', '369639'];
    for (let i = 0; i < 200; i++) {
      let code = Math.floor(100000 + Math.random() * 900000).toString();
      while (BLACKLIST.includes(code)) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }
      codes.push(code);
    }
    return codes;
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = formData.otp;

    // Security Gate: Explicitly block default common codes
    if (enteredCode === '123456' || enteredCode === '111111') {
      alert("SECURITY GATE: Code blacklisted for insufficient entropy. Denied.");
      setFormData({ ...formData, otp: '' });
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      const isMaster = enteredCode === ADMIN_MASTER_CODE;
      const isDemoClient = enteredCode === '000000';

      if (isMaster || isDemoClient) {
        setUser({
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name || (isMaster ? 'Protocol Master' : 'Standard Node'),
          email: formData.email,
          mobile: formData.mobile,
          accessCodes: isMaster ? generateBypassCodes() : [],
          isMaster: isMaster
        });
        alert(isMaster ? "Protocol: Master Access Synchronized." : "Protocol: Identity Verified.");
      } else {
        alert("SECURITY GATE: Invalid authentication signature. Try again.");
        setFormData({ ...formData, otp: '' });
      }
    }, 800);
  };

  const triggerResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    alert("SYSTEM: Re-transmitting authorization packets...");
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 pb-12 overflow-y-auto hide-scrollbar ${theme === 'dark' ? 'bg-slate-900' : 'bg-[#F8F9FD]'}`}>
      <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-purple rounded-[2.2rem] flex items-center justify-center text-white text-3xl smooth-deep-shadow mx-auto mb-6 transform hover:rotate-6 transition-all">
            <i className="fa-solid fa-fingerprint"></i>
          </div>
          <h1 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>SmartSpend</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 opacity-80">Encryption Enrollment</p>
        </div>

        <div className={`rounded-[2.5rem] p-8 border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-2xl'}`}>
          {step === 'DETAILS' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Label</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border border-transparent focus:border-indigo-500/30 rounded-2xl px-5 py-4 text-xs font-bold outline-none transition-all" placeholder="Legal Name" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border border-transparent focus:border-indigo-500/30 rounded-2xl px-5 py-4 text-xs font-bold outline-none transition-all" placeholder="user@gateway.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Interface</label>
                <input type="tel" required value={formData.mobile} onChange={(e) => handleMobileChange(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 dark:text-white border border-transparent focus:border-indigo-500/30 rounded-2xl px-5 py-4 text-xs font-bold outline-none transition-all" placeholder="+91 0000000000" />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isLoading} className="w-full gradient-purple text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]">
                  {isLoading ? <i className="fa-solid fa-circle-notch animate-spin text-lg"></i> : 'Initialize Gateway'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6 animate-in zoom-in-95">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 text-center">
                 <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Verify Interface</p>
                 <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-relaxed px-2">Enter the authorization key sent to your mobile</p>
              </div>
              <div className="space-y-1.5">
                <input type="text" maxLength={6} required autoFocus value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-6 text-center font-black tracking-[0.5em] text-2xl dark:text-white" placeholder="••••••" />
              </div>
              <div className="space-y-3">
                <button type="submit" disabled={isLoading} className="w-full gradient-purple text-white font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]">
                  {isLoading ? <i className="fa-solid fa-circle-notch animate-spin text-lg"></i> : 'Execute Enrollment'}
                </button>
                <div className="flex flex-col items-center gap-4 pt-2">
                  <button type="button" onClick={triggerResend} disabled={resendTimer > 0} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${resendTimer > 0 ? 'text-slate-300' : 'text-indigo-500'}`}>
                    {resendTimer > 0 ? `Packet Delay: ${resendTimer}s` : 'Request Key Re-dispatch'}
                  </button>
                  <button type="button" onClick={() => setStep('DETAILS')} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Back to Identity Setup</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
