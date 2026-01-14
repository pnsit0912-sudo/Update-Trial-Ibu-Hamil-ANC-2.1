
import React, { useState, useMemo } from 'react';
import { 
  Users, Edit3, Activity, Download, Eye, ChevronDown, 
  UserX, AlertCircle, Search, Filter, X, MapPin, ShieldAlert, Baby, PartyPopper, RefreshCcw
} from 'lucide-react';
import { User, ANCVisit, UserRole } from './types';
import { getRiskCategory } from './utils';
import { WILAYAH_DATA } from './constants';

interface PatientListProps {
  users: User[];
  visits: ANCVisit[];
  onEdit: (u: User) => void;
  onAddVisit: (u: User) => void;
  onViewProfile: (userId: string) => void;
  onDeletePatient: (userId: string) => void;
  onDeleteVisit: (visitId: string) => void;
  onToggleVisitStatus: (visitId: string) => void;
  onRecordDelivery?: (u: User) => void;
  onStartNewPregnancy?: (u: User) => void;
  currentUserRole: UserRole;
  searchFilter: string;
}

export const PatientList: React.FC<PatientListProps> = ({ 
  users, visits, onEdit, onAddVisit, onViewProfile, searchFilter, onRecordDelivery, onStartNewPregnancy, currentUserRole 
}) => {
  const [displayLimit, setDisplayLimit] = useState(10);
  const [localSearch, setLocalSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const today = new Date().toISOString().split('T')[0];

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.role !== UserRole.USER) return false;
      
      const pVisits = visits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
      const latest = pVisits[0];
      const risk = getRiskCategory(u.totalRiskScore, latest);
      const isMissed = latest && latest.nextVisitDate < today && !u.isDelivered;

      const combinedSearch = (searchFilter + ' ' + localSearch).toLowerCase().trim();
      const matchesSearch = u.name.toLowerCase().includes(combinedSearch) || u.id.toLowerCase().includes(combinedSearch);
      
      const matchesRisk = riskFilter === 'ALL' || risk.label === riskFilter;
      
      const matchesStatus = statusFilter === 'ALL' || 
                           (statusFilter === 'MANGKIR' && isMissed) || 
                           (statusFilter === 'HAMIL' && !u.isDelivered) ||
                           (statusFilter === 'BERSALIN' && u.isDelivered);

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [users, searchFilter, localSearch, riskFilter, statusFilter, visits, today]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Database Terpadu Pasien</h2>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Ditemukan {filteredUsers.length} Pasien</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input type="text" placeholder="Cari Nama / ID..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs" />
          </div>
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-14 pr-10 py-4 bg-gray-50 border-none rounded-2xl font-black text-[10px] uppercase appearance-none outline-none">
              <option value="ALL">Semua Kondisi</option>
              <option value="HAMIL">Sedang Hamil (ANC)</option>
              <option value="BERSALIN">Sudah Bersalin</option>
              <option value="MANGKIR">Mangkir Kontrol</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50/50">
              <tr className="text-[9px] font-black uppercase text-gray-400 border-b border-gray-100">
                <th className="px-12 py-8">Identitas</th>
                <th className="px-12 py-8">Status Medis</th>
                <th className="px-12 py-8">Kondisi</th>
                <th className="px-12 py-8 text-center">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.slice(0, displayLimit).map(u => {
                const pVisits = visits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
                const latest = pVisits[0];
                const risk = getRiskCategory(u.totalRiskScore, latest);
                const isMissed = latest && latest.nextVisitDate < today && !u.isDelivered;

                return (
                  <tr key={u.id} className="hover:bg-indigo-50/5 transition-all group">
                    <td className="px-12 py-9">
                      <div className="flex items-center gap-5">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${u.isDelivered ? 'bg-emerald-500 text-white' : 'bg-indigo-50 text-indigo-600'}`}>{u.name.charAt(0)}</div>
                         <div>
                            <p className="font-black text-gray-900 text-base leading-none uppercase">{u.name}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{u.kelurahan}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-12 py-9">
                      {u.isDelivered ? (
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 w-fit">
                          <p className="text-[10px] font-black uppercase flex items-center gap-2"><PartyPopper size={12}/> Bersalin: {u.deliveryData?.classification}</p>
                          <p className="text-[8px] font-bold mt-0.5">{u.deliveryData?.babyWeight} gram</p>
                        </div>
                      ) : (
                        <div className={`px-4 py-2 rounded-xl border w-fit ${risk.color}`}>
                          <p className="text-[10px] font-black uppercase">Kehamilan {risk.label}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-12 py-9">
                      {isMissed && <span className="px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded-lg animate-pulse">MANGKIR</span>}
                      {!isMissed && !u.isDelivered && <span className="text-[10px] font-black text-indigo-600 uppercase">Dalam Pantauan</span>}
                    </td>
                    <td className="px-12 py-9 text-center">
                      <div className="flex items-center justify-center gap-2">
                         <button onClick={() => onViewProfile(u.id)} className="p-4 bg-gray-100 text-gray-400 rounded-2xl hover:text-indigo-600 shadow-sm" title="Lihat Profil"><Eye size={16}/></button>
                         {u.isDelivered ? (
                            <button onClick={() => onStartNewPregnancy?.(u)} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg flex items-center gap-2" title="Mulai Kehamilan Baru">
                               <RefreshCcw size={16}/> <span className="text-[10px] font-black uppercase hidden xl:block">Hamil Lagi?</span>
                            </button>
                         ) : (
                           <>
                             <button onClick={() => onAddVisit(u)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg" title="Input ANC"><Activity size={16}/></button>
                             <button onClick={() => onRecordDelivery?.(u)} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg" title="Catat Kelahiran"><Baby size={16}/></button>
                           </>
                         )}
                         <button onClick={() => onEdit(u)} className="p-4 bg-white border border-gray-100 text-gray-400 rounded-2xl" title="Edit Data"><Edit3 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
