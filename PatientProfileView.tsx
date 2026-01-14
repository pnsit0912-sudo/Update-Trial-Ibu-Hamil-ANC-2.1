
import React, { useState } from 'react';
import { User, ANCVisit, DeliveryData } from './types';
import { calculatePregnancyProgress, getRiskCategory } from './utils';
import { 
  X, Baby, Calendar, MapPin, Activity, Stethoscope, 
  Heart, Droplets, AlertCircle, ClipboardCheck, ArrowLeft, Phone, Info,
  ShieldCheck, CheckCircle, BookOpen, ShieldAlert, Edit3, Trash2, History, Scale, Ruler, UserCircle, MessageCircle
} from 'lucide-react';

interface PatientProfileViewProps {
  patient: User;
  visits: ANCVisit[];
  onClose: () => void;
  onEditVisit?: (visit: ANCVisit) => void;
  onDeleteVisit?: (visitId: string) => void;
  onEditDelivery?: (delivery: DeliveryData) => void;
  onDeleteDelivery?: (deliveryId: string) => void;
  isStaff?: boolean;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({ 
  patient, visits, onClose, onEditVisit, onDeleteVisit, onEditDelivery, onDeleteDelivery, isStaff = false 
}) => {
  const [activeTab, setActiveTab] = useState<'ANC' | 'BABY'>('ANC');
  const progress = calculatePregnancyProgress(patient.hpht);
  const patientVisits = visits
    .filter(v => v.patientId === patient.id)
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  
  const latestVisit = patientVisits[0];
  const risk = getRiskCategory(patient.totalRiskScore, latestVisit);

  const handleWhatsAppClick = () => {
    // Format nomor: hilangkan karakter non-digit, ganti 0 di depan dengan 62
    let phone = patient.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1);
    }
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-10 duration-700 w-full max-w-7xl mx-auto">
      {/* Modal Close Trigger */}
      <div className="absolute top-6 right-6 z-[60]">
        <button 
          onClick={onClose}
          className="p-4 bg-white/90 backdrop-blur shadow-2xl text-slate-400 hover:bg-slate-900 hover:text-white rounded-[1.5rem] transition-all border border-gray-100 flex items-center justify-center group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-xl rounded-[4rem] md:rounded-[5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-8 border-white p-6 md:p-14 space-y-10 md:space-y-14 overflow-hidden">
        
        {/* HEADER AREA */}
        <div className="bg-white/80 p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-white flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            <div className={`w-28 h-28 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-4xl md:text-6xl font-black ${risk.color} shadow-2xl ring-8 ring-white shrink-0`}>
              {patient.name.charAt(0)}
            </div>
            <div className="text-center md:text-left">
               <h2 className="text-3xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{patient.name}</h2>
               <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                 <div className="px-5 py-2 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] shadow-inner">
                    G{patient.pregnancyNumber} P{patient.parityP} A{patient.parityA}
                 </div>
                 <div className={`px-6 py-2.5 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] shadow-lg border-2 ${risk.color}`}>
                    Triase {risk.label}
                 </div>
               </div>
            </div>
          </div>

          <div className="flex bg-slate-50 p-2.5 rounded-[2.5rem] shadow-inner relative z-10 border border-slate-100">
            <button 
              onClick={() => setActiveTab('ANC')}
              className={`px-6 md:px-10 py-3 md:py-5 rounded-[2rem] text-[10px] md:text-[13px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'ANC' ? 'bg-white text-indigo-600 shadow-[0_8px_16px_rgba(0,0,0,0.08)] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Catatan ANC
            </button>
            <button 
              onClick={() => setActiveTab('BABY')}
              className={`px-6 md:px-10 py-3 md:py-5 rounded-[2rem] text-[10px] md:text-[13px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'BABY' ? 'bg-white text-indigo-600 shadow-[0_8px_16px_rgba(0,0,0,0.08)] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Riwayat Bayi
            </button>
          </div>
          <Activity size={300} className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none text-slate-900 rotate-12" />
        </div>

        {activeTab === 'ANC' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-14">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-8 md:space-y-12">
              <div className="bg-indigo-600 p-10 md:p-14 rounded-[3.5rem] md:rounded-[4.5rem] text-white shadow-[0_32px_64px_-16px_rgba(79,70,229,0.3)] relative overflow-hidden group">
                <div className="flex items-center gap-4 opacity-70 mb-12">
                  <Activity size={20} strokeWidth={3} />
                  <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em]">Kondisi Kehamilan</h3>
                </div>
                
                <div className="space-y-10 relative z-10">
                  <div>
                    <p className="text-[10px] md:text-[12px] font-black uppercase opacity-60 tracking-widest mb-2">Usia Hamil</p>
                    <p className="text-5xl md:text-7xl font-black tracking-tighter">{progress?.weeks || '0'} Minggu</p>
                  </div>
                  <div>
                    <p className="text-[10px] md:text-[12px] font-black uppercase opacity-60 tracking-widest mb-2">HPL (Hari Lahir)</p>
                    <p className="text-2xl md:text-4xl font-black tracking-tighter leading-tight">{progress?.hpl || 'N/A'}</p>
                  </div>
                </div>
                <Baby size={280} className="absolute -right-16 -bottom-16 opacity-10 pointer-events-none rotate-6 group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
              </div>

              {/* CARD: LOKASI DOMISILI */}
              <div className="bg-slate-50/50 p-10 rounded-[3.5rem] border border-white shadow-sm space-y-10">
                <div className="flex items-center gap-4 text-slate-400">
                  <MapPin size={20} strokeWidth={3} />
                  <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em]">Lokasi Domisili</h3>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Alamat Lengkap</p>
                  <p className="text-sm md:text-lg font-bold text-slate-700 leading-relaxed uppercase">{patient.address}, {patient.kelurahan}</p>
                </div>
              </div>

              {/* CARD: KONTAK PASIEN (NEW FEATURE) */}
              <div className="bg-emerald-50/50 p-10 rounded-[3.5rem] border border-emerald-100/50 shadow-sm space-y-8">
                <div className="flex items-center gap-4 text-emerald-600 opacity-70">
                  <Phone size={20} strokeWidth={3} />
                  <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em]">Kontak Pasien</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                     <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Nomor Telepon / WhatsApp</p>
                     <p className="text-2xl font-black text-emerald-900 tracking-tight">{patient.phone}</p>
                  </div>
                  <button 
                    onClick={handleWhatsAppClick}
                    className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center gap-3"
                  >
                    <MessageCircle size={18} /> Chat WhatsApp
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - LOGS */}
            <div className="lg:col-span-8 space-y-10 md:space-y-12">
              <div className="flex items-center gap-6 px-4">
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                  <ClipboardCheck size={32} strokeWidth={3} />
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Log Pemeriksaan</h3>
              </div>

              <div className="space-y-8 max-h-[1000px] overflow-y-auto no-scrollbar pr-2">
                {patientVisits.length === 0 ? (
                  <div className="bg-slate-50/50 p-24 rounded-[4rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center">
                    <Activity size={64} className="text-slate-200 mb-6 animate-pulse" />
                    <h4 className="text-xl md:text-3xl font-black text-slate-300 uppercase tracking-widest">Belum Ada Kunjungan</h4>
                  </div>
                ) : (
                  patientVisits.map((visit) => (
                    <div key={visit.id} className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:scale-[1.01] transition-all duration-500">
                      <div className="bg-slate-50/70 px-8 md:px-12 py-6 md:py-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                          <Calendar size={20} className="text-indigo-600" />
                          <p className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{new Date(visit.visitDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex flex-wrap justify-center gap-3">
                            <span className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase shadow-sm">BB: {visit.weight}Kg</span>
                            <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">TD: {visit.bloodPressure}</span>
                          </div>
                          {isStaff && (
                            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                              <button 
                                onClick={() => onEditVisit?.(visit)}
                                className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                title="Edit Kunjungan"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => onDeleteVisit?.(visit.id)}
                                className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                title="Hapus Kunjungan"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-10 md:p-14">
                        <div className="flex gap-4 items-start">
                           <Info size={24} className="text-slate-300 shrink-0 mt-1" />
                           <p className="text-sm md:text-xl font-bold text-slate-500 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                             "{visit.nakesNotes || 'Tidak ada catatan medis spesifik untuk kunjungan ini.'}"
                           </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
             <div className="flex items-center gap-6 px-4">
               <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                 <History size={32} strokeWidth={3} />
               </div>
               <h3 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter">Riwayat Kelahiran</h3>
             </div>

             <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto no-scrollbar">
                 <table className="w-full text-left min-w-[1200px]">
                   <thead className="bg-slate-50/50 text-[11px] font-black uppercase text-slate-400 border-b border-slate-100 tracking-[0.2em]">
                     <tr>
                       <th className="px-12 py-10">Tgl Lahir</th>
                       <th className="px-12 py-10">Bayi & Kelamin</th>
                       <th className="px-12 py-10">Status Medis</th>
                       <th className="px-12 py-10 text-center">Antropometri</th>
                       <th className="px-12 py-10">Klasifikasi</th>
                       <th className="px-12 py-10">Keterangan</th>
                       {isStaff && <th className="px-12 py-10 text-right">Aksi</th>}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {[...(patient.pregnancyHistory || [])].reverse().map((baby, idx) => (
                       <tr key={baby.id || idx} className="hover:bg-slate-50/50 transition-all group">
                         <td className="px-12 py-10">
                           <div className="flex items-center gap-4">
                             <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                               <Calendar size={18} className="text-slate-300" />
                             </div>
                             <p className="font-black text-slate-900 uppercase tracking-tight text-lg">{new Date(baby.deliveryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                           </div>
                         </td>
                         <td className="px-12 py-10">
                           <div className="flex items-center gap-5">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${baby.babyGender === 'L' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-pink-500 text-white shadow-pink-200'}`}>
                               {baby.babyGender}
                             </div>
                             <div>
                               <p className="font-black text-slate-900 uppercase tracking-tighter text-lg leading-none mb-1">{baby.babyName || 'Newborn Patient'}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{baby.babyGender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-12 py-10">
                           <div className="space-y-2.5">
                             <div className="flex items-center gap-3">
                               <UserCircle size={14} className="text-indigo-400" />
                               <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${baby.motherStatus === 'SEHAT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>Ibu: {baby.motherStatus}</span>
                             </div>
                             <div className="flex items-center gap-3">
                               <Baby size={14} className="text-indigo-400" />
                               <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${baby.babyStatus === 'HIDUP_SEHAT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>Bayi: {baby.babyStatus.replace('_', ' ')}</span>
                             </div>
                           </div>
                         </td>
                         <td className="px-12 py-10 text-center">
                           <div className="flex justify-center gap-4">
                             <div className="bg-white px-5 py-3 rounded-2xl text-center border border-slate-100 shadow-sm min-w-[80px]">
                               <Scale size={16} className="mx-auto mb-2 text-slate-300" />
                               <p className="text-lg font-black text-slate-900 leading-none">{baby.babyWeight}<span className="text-[10px] opacity-30 ml-1">g</span></p>
                             </div>
                             <div className="bg-white px-5 py-3 rounded-2xl text-center border border-slate-100 shadow-sm min-w-[80px]">
                               <Ruler size={16} className="mx-auto mb-2 text-slate-300" />
                               <p className="text-lg font-black text-slate-900 leading-none">{baby.babyHeight}<span className="text-[10px] opacity-30 ml-1">cm</span></p>
                             </div>
                           </div>
                         </td>
                         <td className="px-12 py-10">
                           <div className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 text-center shadow-lg ${
                             baby.classification === 'NORMAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' : 
                             baby.classification === 'BBLR' ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50' : 
                             'bg-red-50 text-red-600 border-red-100 shadow-red-50'
                           }`}>
                             {baby.classification}
                           </div>
                         </td>
                         <td className="px-12 py-10 max-w-[250px]">
                           <p className="text-sm font-bold text-slate-500 uppercase leading-relaxed line-clamp-3 italic opacity-60 group-hover:opacity-100 transition-opacity">
                             {baby.condition || 'No extra medical notes provided for this delivery event.'}
                           </p>
                         </td>
                         {isStaff && (
                           <td className="px-12 py-10 text-right">
                             <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => onDeleteDelivery?.(baby.id)}
                                 className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                                 title="Hapus Riwayat Kelahiran"
                               >
                                 <Trash2 size={18} />
                               </button>
                             </div>
                           </td>
                         )}
                       </tr>
                     ))}
                     {(!patient.pregnancyHistory || patient.pregnancyHistory.length === 0) && (
                       <tr>
                         <td colSpan={isStaff ? 7 : 6} className="py-32 text-center">
                           <div className="bg-slate-50 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner border border-slate-100">
                             <Baby size={64} />
                           </div>
                           <h4 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Belum Ada Riwayat Kelahiran</h4>
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
