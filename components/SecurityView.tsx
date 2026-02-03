
import React, { useState, useEffect } from 'react';
import { useAppState } from '../store';

const SecurityView: React.FC = () => {
  const { theme, settings, setSecuritySettings, user } = useAppState();
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [passcodeType, setPasscodeType] = useState<'NEW' | 'CONFIRM'>('NEW');
  const [tempPasscode, setTempPasscode] = useState('');
  const [currentInput, setCurrentInput] = useState('');
  const [isCodesVisible, setIsCodesVisible] = useState(false);
  const [isHardwareCapable, setIsHardwareCapable] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>('default');

  useEffect(() => {
    // Check for biometric hardware presence
    if (window.PublicKeyCredential) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsHardwareCapable(available));
    }
    
    // Check Notification Status
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert("System Error: This browser does not support desktop notifications.");
      return;
    }
    Notification.requestPermission().then(permission => {
      setNotificationStatus(permission);
      if (permission === 'granted') {
        new Notification("Protocol Sync", { body: "System notifications are now synchronized with SmartSpend.", icon: 'https://cdn-icons-png.flaticon.com/512/5511/5511413.png' });
      }
    });
  };

  const toggleBiometrics = async () => {
    if (!settings.security.biometricsEnabled && isHardwareCapable) {
       alert("System: Requesting hardware biometric enrollment...");
       // Simulation of enrollment
       setTimeout(() => {
         setSecuritySettings({ biometricsEnabled: true });
         alert("Biometric signature synchronized.");
       }, 1000);
    } else {
       setSecuritySettings({ biometricsEnabled: !settings.security.biometricsEnabled });
    }
  };

  const handlePasscodeStart = () => {
    setPasscodeType('NEW');
    setCurrentInput('');
    setTempPasscode('');
    setIsPasscodeModalOpen(true);
  };

  const onNumberClick = (num: string) => {
    const nextInput = currentInput + num;
    if (nextInput.length <= 4) {
      setCurrentInput(nextInput);
      if (nextInput.length === 4) {
        if (passcodeType === 'NEW') {
          setTempPasscode(nextInput);
          setPasscodeType('CONFIRM');
          setCurrentInput('');
        } else {
          if (nextInput === tempPasscode) {
            setSecuritySettings({ passcode: nextInput });
            setIsPasscodeModalOpen(false);
            alert("Security Protocol Established.");
          } else {
            alert("Mismatch detected. Restarting protocol.");
            setPasscodeType('NEW');
            setCurrentInput('');
            setTempPasscode('');
          }
        }
      }
    }
  };

  const handleDisablePasscode = () => {
    if (window.confirm("WARNING: Disabling the passcode reduces ledger security. Continue?")) {
      setSecuritySettings({ passcode: undefined, biometricsEnabled: false });
    }
  };

  const downloadCodes = () => {
    if (!user?.accessCodes) return;
    const content = `SMARTSPEND ACCESS CODES\nIdentity: ${user.name}\nGenerated on Setup\n\nCodes:\n${user.accessCodes.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartspend_bypass_codes_${user.id}.txt`;
    link.click();
  };

  return (
    <div className="p-6 pb-32 animate-in fade-in">
      <div className="mb-10">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Security Hub</h1>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Configuration</p>
      </div>

      <div className="space-y-6">
        {/* Passcode Control */}
        <section className={`p-6 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500 shadow-sm">
                <i className="fa-solid fa-lock"></i>
              </div>
              <div>
                <h3 className="text-xs font-black dark:text-slate-100 uppercase tracking-tight">App Passcode</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {settings.security.passcode ? 'Status: Active' : 'Status: Disabled'}
                </p>
              </div>
            </div>
          </div>

          {settings.security.passcode ? (
            <div className="space-y-3">
              <button 
                onClick={handlePasscodeStart}
                className="w-full py-4 bg-slate-50 dark:bg-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                Reset Passcode
              </button>
              <button 
                onClick={handleDisablePasscode}
                className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-rose-400"
              >
                Disable App Lock
              </button>
            </div>
          ) : (
            <button 
              onClick={handlePasscodeStart}
              className="w-full py-5 gradient-purple text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
            >
              Enable Passcode
            </button>
          )}
        </section>

        {/* Biometrics Toggle */}
        {settings.security.passcode && (
          <section className={`p-6 rounded-[2.5rem] border animate-in slide-in-from-top-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isHardwareCapable ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'}`}>
                  <i className="fa-solid fa-fingerprint"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black dark:text-slate-100 uppercase tracking-tight">Biometric Entry</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {isHardwareCapable ? 'FaceID / Fingerprint Ready' : 'Hardware Not Detected'}
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleBiometrics}
                disabled={!isHardwareCapable && !settings.security.biometricsEnabled}
                className={`w-12 h-6 rounded-full relative transition-all ${settings.security.biometricsEnabled ? 'bg-indigo-50' : 'bg-slate-200 dark:bg-slate-600'} disabled:opacity-30`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.security.biometricsEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          </section>
        )}

        {/* Notification Management */}
        <section className={`p-6 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${notificationStatus === 'granted' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-300'}`}>
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black dark:text-slate-100 uppercase tracking-tight">System Notifications</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Permission: <span className={notificationStatus === 'granted' ? 'text-emerald-500' : 'text-rose-500'}>{notificationStatus.toUpperCase()}</span>
                  </p>
                </div>
             </div>
             {notificationStatus !== 'granted' && (
               <button 
                 onClick={requestNotificationPermission}
                 className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
               >
                 Authorize
               </button>
             )}
          </div>
          <p className="mt-4 text-[7px] font-medium text-slate-400 uppercase tracking-[0.05em] leading-relaxed px-1">
            Required for bill reminders and budget threshold alerts. Direct SMS access is restricted by browsers for privacy; use Dashboard Clipboard Sync for message tracking.
          </p>
        </section>

        {/* Bypass Access Codes - Restricted to Master Admin */}
        {user?.isMaster && (
          <section className={`p-6 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 shadow-sm">
                  <i className="fa-solid fa-key"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black dark:text-slate-100 uppercase tracking-tight">Bypass Access Codes</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Permanent Protocol Keys</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
               <button 
                onClick={() => setIsCodesVisible(!isCodesVisible)}
                className="w-full py-4 bg-slate-50 dark:bg-slate-700 rounded-2xl text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center justify-center gap-2"
               >
                  <i className={`fa-solid ${isCodesVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  {isCodesVisible ? 'Hide Private Keys' : 'Reveal Access Codes'}
               </button>
               
               {isCodesVisible && (
                 <div className="animate-in fade-in slide-in-from-top-2">
                   <div className="grid grid-cols-4 gap-2 h-48 overflow-y-auto hide-scrollbar p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4">
                      {user?.accessCodes.map((code, idx) => (
                        <span key={idx} className="text-[10px] font-black text-center text-slate-500 py-1" style={{fontFamily:'JetBrains Mono'}}>{code}</span>
                      ))}
                   </div>
                   <button 
                    onClick={downloadCodes}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                   >
                      Download Protocol Sheet (.TXT)
                   </button>
                 </div>
               )}
            </div>
          </section>
        )}

        <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 flex items-start gap-4">
          <i className="fa-solid fa-circle-exclamation text-amber-500 mt-1"></i>
          <p className="text-[9px] font-medium text-amber-700 dark:text-amber-400 leading-relaxed uppercase">
            {user?.isMaster ? 'Access codes can bypass app lock if you forget your primary passcode. Keep them stored in a secure physical location.' : 'App security protocol is active. Contact your system administrator for bypass assistance if required.'}
          </p>
        </div>
      </div>

      {/* Passcode Input Modal */}
      {isPasscodeModalOpen && (
        <div className="fixed inset-0 z-[250] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-8">
           <div className="text-center mb-12">
              <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-white text-2xl mb-6 mx-auto">
                 <i className="fa-solid fa-key"></i>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
                 {passcodeType === 'NEW' ? 'Create Passcode' : 'Confirm Passcode'}
              </h2>
              <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Enter 4 digits to secure ledger</p>
           </div>

           <div className="flex gap-4 mb-16">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${currentInput.length > i ? 'bg-white border-white scale-125' : 'border-white/20'}`}
                ></div>
              ))}
           </div>

           <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((n, i) => {
                if (n === '') return <div key={i}></div>;
                if (n === 'del') return (
                  <button 
                    key={i} 
                    onClick={() => setCurrentInput(prev => prev.slice(0, -1))}
                    className="w-full aspect-square rounded-full flex items-center justify-center text-white/40 text-lg active:bg-white/10"
                  >
                    <i className="fa-solid fa-delete-left"></i>
                  </button>
                );
                return (
                  <button 
                    key={i} 
                    onClick={() => onNumberClick(n.toString())}
                    className="w-full aspect-square rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-2xl font-black transition-all active:bg-white active:text-slate-900 active:scale-90"
                  >
                    {n}
                  </button>
                );
              })}
           </div>

           <button 
            onClick={() => setIsPasscodeModalOpen(false)}
            className="mt-12 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-white transition-colors"
           >
             Cancel Protocol
           </button>
        </div>
      )}
    </div>
  );
};

export default SecurityView;
