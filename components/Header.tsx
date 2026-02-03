
import React from 'react';
import { useAppState } from '../store';

interface Props {
  onSettingsClick: () => void;
}

const Header: React.FC<Props> = ({ onSettingsClick }) => {
  const { theme, setTheme, user, setUser } = useAppState();

  const handleLogout = () => {
    if (window.confirm("Logout of session?")) {
      setUser(null);
    }
  };

  return (
    <header 
      className="px-5 pt-3 pb-1 flex justify-between items-center sticky top-0 z-50 bg-inherit flex-none border-b border-transparent"
      style={{ 
        paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' 
      }}
    >
      <div className="flex items-center gap-2.5">
        <div 
          onClick={handleLogout}
          className="w-9 h-9 gradient-purple rounded-xl flex items-center justify-center text-white text-base smooth-deep-shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
           <i className="fa-solid fa-bolt-lightning"></i>
        </div>
        <div>
           <h1 className={`text-[11px] font-black tracking-widest uppercase ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>SmartSpend</h1>
           <p className="text-[7px] font-bold text-indigo-500 tracking-widest uppercase opacity-70 leading-none">{user?.name || 'Elite'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
         <button 
           onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
           className={`transition-colors text-lg ${theme === 'dark' ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-300 hover:text-indigo-500'}`}
         >
           <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
         </button>
         <button 
           onClick={onSettingsClick}
           className={`transition-colors text-lg ${theme === 'dark' ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-300 hover:text-indigo-500'}`}
         >
           <i className="fa-solid fa-gear"></i>
         </button>
      </div>
    </header>
  );
};

export default Header;
