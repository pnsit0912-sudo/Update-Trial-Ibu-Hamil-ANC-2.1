
import React from 'react';
import { LogOut, CheckCircle, ChevronLeft, X } from 'lucide-react';
import { NAVIGATION } from './constants';
import { UserRole } from './types';

interface SidebarProps {
  currentView: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  userRole: UserRole;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  onLogout, 
  userRole, 
  isOpen,
  onToggle 
}) => {
  const filteredNav = NAVIGATION.filter(n => n.roles.includes(userRole));

  return (
    <>
      {/* Backdrop for Pop-up mode on small screens */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm z-[100] lg:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      <aside className={`no-print fixed inset-y-0 left-0 z-[101] w-72 md:w-80 bg-white border-r border-gray-100 transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6 md:p-10">
          <div className="flex items-center justify-between mb-10 md:mb-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 md:p-3 rounded-2xl text-white shadow-xl rotate-3">
                <CheckCircle size={18} className="md:w-5 md:h-5" />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tighter">Smart ANC</span>
            </div>
            <button 
              onClick={onToggle}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl lg:hidden"
            >
              <X size={18} />
            </button>
            <button 
              onClick={onToggle}
              className="hidden lg:flex p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all group"
            >
              <ChevronLeft size={20} className={`transition-transform duration-500 ${!isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 no-scrollbar">
            {filteredNav.map(nav => (
              <button 
                key={nav.path} 
                onClick={() => onNavigate(nav.path)} 
                className={`w-full flex items-center gap-4 px-4 py-3 md:px-5 md:py-3.5 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all group ${
                  currentView === nav.path 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-indigo-600'
                }`}
              >
                <span className="transition-transform group-hover:scale-110 shrink-0">{nav.icon}</span>
                <span className="truncate">{nav.name}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <button 
              onClick={onLogout} 
              className="w-full flex items-center gap-4 px-4 py-3.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} className="shrink-0" /> Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
