
import React, { useMemo, useState } from 'react';
import { 
  Activity, CalendarDays, ChevronDown, FileSpreadsheet, Heart, MapPin, BarChart3, ShieldAlert
} from 'lucide-react';
import { User, ANCVisit, AppState, UserRole } from './types';
import { WILAYAH_DATA } from './constants';
import { getRiskCategory } from './utils';

interface RiskMonitoringProps {
  state: AppState;
  onViewProfile: (patientId: string) => void;
  onAddVisit: (u: User) => void;
  onToggleVisitStatus: (visitId: string) => void;
}

type StatData = { total: number, hitam: number, merah: number, kuning: number, hijau: number };

export const RiskMonitoring: React.FC<RiskMonitoringProps> = ({ state, onViewProfile, onAddVisit }) => {
  const { users, ancVisits } = state;
  const [filterKelurahan, setFilterKelurahan] = useState<string>('ALL');
  
  const currentYear = new Date().getFullYear().toString();
  const [filterYear, setFilterYear] = useState<string>(currentYear);
  const [filterQuarter, setFilterQuarter] = useState<string>('ALL');

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYear);
    ancVisits.forEach(v => years.add(new Date(v.visitDate).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [ancVisits, currentYear]);

  // OPTIMASI: Filter dan Kelompokkan kunjungan berdasarkan periode sekali saja
  const visitsByPatientInPeriod = useMemo(() => {
    const grouped: Record<string, ANCVisit[]> = {};
    ancVisits.forEach(v => {
      const date = new Date(v.visitDate);
      const year = date.getFullYear().toString();
      const month = date.getMonth(); 
      const quarter = Math.floor(month / 3) + 1;

      const matchYear = filterYear === 'ALL' || year === filterYear;
      const matchQuarter = filterQuarter === 'ALL' || quarter.toString() === filterQuarter;

      if (matchYear && matchQuarter) {
        if (!grouped[v.patientId]) grouped[v.patientId] = [];
        grouped[v.patientId].push(v);
      }
    });
    return grouped;
  }, [ancVisits, filterYear, filterQuarter]);

  // OPTIMASI: Kalkulasi analisis risiko menggunakan index periode
  const riskAnalysis = useMemo(() => {
    const patientIdsInPeriod = new Set(Object.keys(visitsByPatientInPeriod));
    const allTimePatients = users.filter(u => u.role === UserRole.USER);
    
    return allTimePatients
      .filter(u => (filterYear === 'ALL' && filterQuarter === 'ALL') ? true : patientIdsInPeriod.has(u.id))
      .map(patient => {
        const periodVisits = (visitsByPatientInPeriod[patient.id] || []).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
        const latestVisitInPeriod = periodVisits[0];
        
        const risk = getRiskCategory(patient.totalRiskScore, latestVisitInPeriod);
        
        let riskFlags: string[] = [];
        if (latestVisitInPeriod?.bloodPressure) {
          const [sys, dia] = latestVisitInPeriod.bloodPressure.split('/').map(Number);
          if (sys >= 140 || dia >= 90) riskFlags.push('Hipertensi');
        }
        if (latestVisitInPeriod?.fetalMovement === 'Kurang Aktif') riskFlags.push('Gerak Janin ↓');
        if (latestVisitInPeriod?.edema) riskFlags.push('Edema (+)');

        return { ...patient, riskLevel: risk.label, riskFlags, latestVisit: latestVisitInPeriod, priority: risk.priority };
      });
  }, [users, visitsByPatientInPeriod, filterYear, filterQuarter]);

  const statsAggregation = useMemo(() => {
    const kecStats: Record<string, StatData> = {};
    const kelStats: Record<string, StatData> = {};

    Object.keys(WILAYAH_DATA).forEach(kec => {
      kecStats[kec] = { total: 0, hitam: 0, merah: 0, kuning: 0, hijau: 0 };
      WILAYAH_DATA[kec as keyof typeof WILAYAH_DATA].forEach(kel => {
        kelStats[kel] = { total: 0, hitam: 0, merah: 0, kuning: 0, hijau: 0 };
      });
    });

    riskAnalysis.forEach(p => {
      const kec = p.kecamatan || "Pasar Minggu";
      const kel = p.kelurahan;
      const levelKey = p.riskLevel.toLowerCase() as keyof StatData;

      if (kecStats[kec]) {
        kecStats[kec].total++;
        if (typeof kecStats[kec][levelKey] === 'number') (kecStats[kec][levelKey] as number)++;
      }
      if (kelStats[kel]) {
        kelStats[kel].total++;
        if (typeof kelStats[kel][levelKey] === 'number') (kelStats[kel][levelKey] as number)++;
      }
    });

    return { kecStats, kelStats };
  }, [riskAnalysis]);

  // List untuk tampilan UI: Menyembunyikan yang sudah bersalin
  const filteredRiskListUI = useMemo(() => {
    return riskAnalysis.filter(p => 
      (filterKelurahan === 'ALL' || p.kelurahan === filterKelurahan) && !p.isDelivered
    ).sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [riskAnalysis, filterKelurahan]);

  // List untuk ekspor CSV: Termasuk yang sudah bersalin
  const filteredRiskListExport = useMemo(() => {
    return riskAnalysis.filter(p => 
      (filterKelurahan === 'ALL' || p.kelurahan === filterKelurahan)
    ).sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [riskAnalysis, filterKelurahan]);

  const handleExportReport = () => {
    const headers = [
      'Nama Pasien', 'NIK/ID', 'Kelurahan', 'Status Hamil', 'Status Risiko', 'Skor Dasar', 
      'TD Terakhir', 'Tgl Periksa Terakhir', 'Bendera Risiko'
    ];

    const rows = filteredRiskListExport.map(p => [
      `"${p.name}"`,
      `"${p.id}"`,
      `"${p.kelurahan}"`,
      p.isDelivered ? 'SUDAH BERSALIN' : 'ANC AKTIF',
      p.riskLevel,
      p.totalRiskScore + 2,
      `"${p.latestVisit?.bloodPressure || '-'}"`,
      p.latestVisit?.visitDate || '-',
      `"${((p.riskFlags as string[]).join('; '))}"`
    ].join(','));

    const summary: any[][] = [
      ['LAPORAN MONITORING RISIKO ANC & PERSALINAN'],
      [`Periode: ${filterYear === 'ALL' ? 'Semua Tahun' : filterYear} - ${filterQuarter === 'ALL' ? 'Tahunan' : 'Triwulan ' + filterQuarter}`],
      [`Wilayah: ${filterKelurahan === 'ALL' ? 'Seluruh Kelurahan' : filterKelurahan}`],
      [],
      ['RINGKASAN STATISTIK PERIODE INI'],
      ['Kategori', 'Jumlah'],
      ['Kritis (Hitam)', riskAnalysis.filter(p => p.riskLevel === 'HITAM').length],
      ['Tinggi (Merah)', riskAnalysis.filter(p => p.riskLevel === 'MERAH').length],
      ['Sedang (Kuning)', riskAnalysis.filter(p => p.riskLevel === 'KUNING').length],
      ['Stabil (Hijau)', riskAnalysis.filter(p => p.riskLevel === 'HIJAU').length],
      ['Total Pasien Dalam Periode', riskAnalysis.length],
      ['Total Sudah Bersalin', riskAnalysis.filter(p => p.isDelivered).length],
      [],
      ['DATA DETAIL PASIEN (TERMASUK ARSIP PERSALINAN)'],
      headers
    ];

    const csvContent = summary.map(r => r.join(',')).join('\n') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Monitoring_ANC_${filterYear}_Q${filterQuarter}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl border border-white flex flex-col xl:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Periode Monitoring</h2>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Optimalisasi Analisis Performa</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex-1 md:flex-none">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-4 block mb-1">Pilih Tahun</label>
            <div className="relative">
              <select 
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full md:w-40 pl-6 pr-10 py-3.5 bg-gray-50 border-none rounded-2xl font-black text-[10px] uppercase appearance-none outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              >
                <option value="ALL">Semua Tahun</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 md:flex-none">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-4 block mb-1">Pilih Triwulan</label>
            <div className="relative">
              <select 
                value={filterQuarter}
                onChange={(e) => setFilterQuarter(e.target.value)}
                className="w-full md:w-56 pl-6 pr-10 py-3.5 bg-gray-50 border-none rounded-2xl font-black text-[10px] uppercase appearance-none outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              >
                <option value="ALL">Semua Triwulan</option>
                <option value="1">Triwulan I (Jan - Mar)</option>
                <option value="2">Triwulan II (Apr - Jun)</option>
                <option value="3">Triwulan III (Jul - Sep)</option>
                <option value="4">Triwulan IV (Okt - Des)</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 md:flex-none">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-4 block mb-1">Pilih Wilayah</label>
            <div className="relative">
              <select 
                value={filterKelurahan} 
                onChange={(e) => setFilterKelurahan(e.target.value)}
                className="w-full md:w-56 pl-6 pr-10 py-3.5 bg-gray-50 border-none rounded-2xl font-black text-[10px] uppercase appearance-none outline-none focus:ring-4 focus:ring-indigo-50 transition-all"
              >
                <option value="ALL">Seluruh Kelurahan</option>
                {WILAYAH_DATA["Pasar Minggu"].map(kel => <option key={kel} value={kel}>{kel}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 md:flex-none pt-4 xl:pt-0">
             <button 
               onClick={handleExportReport}
               className="w-full xl:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center gap-3"
             >
               <FileSpreadsheet size={16} /> Tarik Data CSV
             </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 animate-in slide-in-from-left-4">
        <div className="h-px flex-1 bg-gray-100" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Data Aktif: {filterYear === 'ALL' ? 'Semua Tahun' : filterYear} 
          {filterQuarter !== 'ALL' && ` - Triwulan ${filterQuarter}`}
        </p>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Kritis (Hitam)', count: riskAnalysis.filter(p => p.riskLevel === 'HITAM').length, color: 'bg-slate-950', text: 'text-white' },
          { label: 'Tinggi (Merah)', count: riskAnalysis.filter(p => p.riskLevel === 'MERAH').length, color: 'bg-red-600', text: 'text-white' },
          { label: 'Sedang (Kuning)', count: riskAnalysis.filter(p => p.riskLevel === 'KUNING').length, color: 'bg-yellow-400', text: 'text-yellow-950' },
          { label: 'Stabil (Hijau)', count: riskAnalysis.filter(p => p.riskLevel === 'HIJAU').length, color: 'bg-emerald-500', text: 'text-white' },
        ].map((item, i) => (
          <div key={i} className={`${item.color} ${item.text} p-8 rounded-[2.5rem] shadow-xl border border-white/10 group hover:scale-105 transition-all`}>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{item.label}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-4xl font-black leading-none">{item.count}</p>
              <Activity size={24} className="opacity-30 group-hover:animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-indigo-600" size={28} />
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Analitik Beban Risiko Wilayah</h3>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 h-full">
              <div className="mb-8">
                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={16} className="text-indigo-600" /> Risk Density Kecamatan
                </h4>
              </div>

              <div className="space-y-8">
                {Object.entries(statsAggregation.kecStats).map(([kec, val]) => {
                  const stat = val as StatData;
                  const highRiskCount = stat.hitam + stat.merah;
                  const density = stat.total > 0 ? (highRiskCount / stat.total) * 100 : 0;
                  
                  return (
                    <div key={kec} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xl font-black text-gray-900 tracking-tighter">{kec}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Total: {stat.total} Pasien Terlayani</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black ${density > 30 ? 'text-red-600' : 'text-indigo-600'}`}>{density.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="h-10 w-full bg-gray-50 rounded-2xl overflow-hidden flex border border-gray-100 p-1">
                        <div className="h-full bg-slate-950 rounded-l-xl" style={{ width: `${(stat.hitam / (stat.total || 1)) * 100}%` }} />
                        <div className="h-full bg-red-500" style={{ width: `${(stat.merah / (stat.total || 1)) * 100}%` }} />
                        <div className="h-full bg-yellow-400" style={{ width: `${(stat.kuning / (stat.total || 1)) * 100}%` }} />
                        <div className="h-full bg-emerald-400 rounded-r-xl" style={{ width: `${(stat.hijau / (stat.total || 1)) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-600" /> Sebaran Risiko Per Kelurahan
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(statsAggregation.kelStats).map(([kel, val]) => {
                  const stat = val as StatData;
                  const highRiskCount = stat.hitam + stat.merah;
                  const density = stat.total > 0 ? (highRiskCount / stat.total) * 100 : 0;
                  
                  return (
                    <div key={kel} className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-xl ${density > 30 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="font-black text-gray-900 text-sm uppercase leading-none mb-1">{kel}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase">Pelayanan: {stat.total}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black ${density > 20 ? 'text-red-600' : 'text-indigo-600'}`}>{density.toFixed(0)}%</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          { col: 'bg-slate-950', val: stat.hitam, label: 'Hitam' },
                          { col: 'bg-red-500', val: stat.merah, label: 'Merah' },
                          { col: 'bg-yellow-400', val: stat.kuning, label: 'Kuning' },
                          { col: 'bg-emerald-400', val: stat.hijau, label: 'Hijau' },
                        ].map((bar, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-14 text-[8px] font-black text-gray-400 uppercase">{bar.label}</div>
                            <div className="flex-1 h-2 bg-gray-100/50 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${bar.col} transition-all duration-1000`} 
                                style={{ width: stat.total > 0 ? `${(bar.val / stat.total) * 100}%` : '0%' }}
                              />
                            </div>
                            <div className="w-4 text-[9px] font-black text-gray-900 text-right">{bar.val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
            <Heart size={28} className="text-red-600" /> Daftar Pantau Terpadu ({filteredRiskListUI.length} Pasien Aktif)
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Pasien bersalin disembunyikan otomatis untuk fokus pemantauan ANC.</p>
        </div>

        {filteredRiskListUI.length === 0 ? (
          <div className="bg-white p-20 rounded-[4rem] border-4 border-dashed border-gray-100 text-center">
            <Activity size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Tidak Ada Data Pasien Aktif Untuk Periode Ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRiskListUI.map(p => (
              <div 
                key={p.id} 
                className={`group relative p-8 rounded-[3.5rem] border-2 transition-all hover:scale-[1.02] hover:shadow-2xl ${
                  p.riskLevel === 'HITAM' ? 'bg-slate-950 border-slate-900 text-white shadow-slate-200' : 
                  p.riskLevel === 'MERAH' ? 'bg-red-50 border-red-100' : 
                  p.riskLevel === 'KUNING' ? 'bg-yellow-50 border-yellow-100' : 
                  'bg-white border-gray-50'
                }`}
              >
                <div className="mb-6">
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                    p.riskLevel === 'HITAM' ? 'bg-white/10 border-white/20 text-red-400' : 
                    p.riskLevel === 'MERAH' ? 'bg-red-500 border-red-600 text-white' : 
                    p.riskLevel === 'KUNING' ? 'bg-yellow-400 border-yellow-500 text-yellow-950' : 
                    'bg-emerald-500 border-emerald-600 text-white'
                  }`}>
                    Triase {p.riskLevel}
                  </span>
                  <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mt-3 ${p.riskLevel === 'HITAM' ? 'text-slate-500' : 'text-gray-400'}`}>
                    Kelurahan {p.kelurahan}
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className={`text-2xl font-black leading-tight tracking-tighter ${p.riskLevel === 'HITAM' ? 'text-white' : 'text-gray-900'}`}>
                    {p.name}
                  </h4>
                  <p className={`text-[10px] font-bold mt-1 ${p.riskLevel === 'HITAM' ? 'text-slate-400' : 'text-gray-500'}`}>
                     Pemeriksaan Terakhir: {p.latestVisit?.visitDate || 'Baru Terdaftar'}
                  </p>
                </div>

                <div className={`space-y-3 p-5 rounded-[1.5rem] mb-8 ${p.riskLevel === 'HITAM' ? 'bg-white/5 border border-white/10' : 'bg-white/50 border border-current/5'}`}>
                   <div className="flex flex-wrap gap-2">
                     <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${p.riskLevel === 'HITAM' ? 'bg-white/10' : 'bg-indigo-50 text-indigo-600'}`}>
                       TD: {p.latestVisit?.bloodPressure || 'N/A'}
                     </span>
                     {(p.riskFlags as string[]).map((flag, idx) => (
                       <span key={idx} className={`px-2 py-1 rounded-lg text-[10px] font-black ${p.riskLevel === 'HITAM' ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
                         {flag}
                       </span>
                     ))}
                   </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => onViewProfile(p.id)} className={`flex-1 py-4 text-[9px] font-black uppercase rounded-2xl transition-all ${p.riskLevel === 'HITAM' ? 'bg-white text-slate-900' : 'bg-indigo-600 text-white'}`}>Profil Medis</button>
                  <button onClick={() => onAddVisit(p)} className={`p-4 rounded-2xl transition-all ${p.riskLevel === 'HITAM' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-400'}`}><Activity size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
