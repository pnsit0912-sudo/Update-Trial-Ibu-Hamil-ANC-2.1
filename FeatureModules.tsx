
import React, { useState, useMemo } from 'react';
import { HeartPulse, Printer, Download, MapPin, Phone, Mail, UserX, AlertCircle, ShieldCheck, Share2, Filter, LayoutGrid, MessageSquare, Send, CheckCircle, Fingerprint, CalendarDays, Building2, UserCircle2, QrCode, Baby, Sparkles, Scale, Info, Crosshair, Save, Megaphone, Repeat, Siren, Link } from 'lucide-react';
import QRCode from 'react-qr-code';
import { PUSKESMAS_INFO, EDUCATION_LIST } from './constants';
import { User, AppState, EducationContent, UserRole } from './types';
import { getRiskCategory } from './utils';

// ==========================================
// NEW MODULE: WA BROADCAST (BLAST)
// ==========================================

export const BroadcastModule = ({ state }: { state: AppState }) => {
  const [targetGroup, setTargetGroup] = useState<'ALL' | 'RISK_HIGH' | 'MISSED_VISIT' | 'UPCOMING_VISIT'>('ALL');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [sendingMethod, setSendingMethod] = useState<'MANUAL' | 'API'>('MANUAL');
  const [queue, setQueue] = useState<{user: User, status: 'PENDING' | 'SENT' | 'FAILED', details?: string}[]>([]);

  const today = new Date().toISOString().split('T')[0];
  
  // Hitung Tanggal Besok untuk H-1
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = tomorrowDate.toISOString().split('T')[0];

  // Logic Generate Template Default
  const getDefaultTemplate = (group: string) => {
    switch (group) {
      case 'RISK_HIGH':
        return "Halo Ibu {nama}, ini dari Puskesmas Pasar Minggu. Berdasarkan pemeriksaan terakhir, kehamilan Ibu memerlukan perhatian khusus. Mohon jangan lupa rutin kontrol sesuai jadwal ya. Sehat selalu!";
      case 'MISSED_VISIT':
        return "Halo Ibu {nama}, data kami menunjukkan Ibu melewatkan jadwal kontrol ANC tanggal {tgl_kembali}. Mohon segera datang ke Puskesmas untuk pemeriksaan demi kesehatan Ibu & Janin. Terima kasih.";
      case 'UPCOMING_VISIT':
        return "Halo Ibu {nama}, mengingatkan bahwa BESOK ({tgl_kembali}) adalah jadwal kontrol kehamilan Ibu. Mohon datang ke Puskesmas Pasar Minggu membawa buku KIA/KTP. Terima kasih.";
      default:
        return "Halo Ibu {nama}, semoga sehat selalu. Ini informasi terbaru dari Puskesmas Pasar Minggu: ...";
    }
  };

  // Logic Filtering Audience
  const generateQueue = () => {
    const activeUsers = state.users.filter(u => u.role === UserRole.USER && !u.isDelivered);
    let targetUsers: User[] = [];

    if (targetGroup === 'ALL') {
      targetUsers = activeUsers;
    } else if (targetGroup === 'RISK_HIGH') {
      targetUsers = activeUsers.filter(u => {
         const pVisits = state.ancVisits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
         const risk = getRiskCategory(u.totalRiskScore, pVisits[0]);
         return risk.label === 'MERAH' || risk.label === 'HITAM';
      });
    } else if (targetGroup === 'MISSED_VISIT') {
      targetUsers = activeUsers.filter(u => {
         const pVisits = state.ancVisits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
         const latest = pVisits[0];
         return latest && latest.nextVisitDate < today;
      });
    } else if (targetGroup === 'UPCOMING_VISIT') {
      targetUsers = activeUsers.filter(u => {
         const pVisits = state.ancVisits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
         const latest = pVisits[0];
         // Cek apakah jadwal kontrol berikutnya adalah BESOK
         return latest && latest.nextVisitDate === tomorrowString;
      });
    }

    setQueue(targetUsers.map(u => ({ user: u, status: 'PENDING' })));
    if (!messageTemplate) setMessageTemplate(getDefaultTemplate(targetGroup));
  };

  const formatMessage = (tpl: string, user: User) => {
    const pVisits = state.ancVisits.filter(v => v.patientId === user.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
    const latest = pVisits[0];
    
    return tpl
      .replace(/{nama}/g, user.name)
      .replace(/{tgl_kembali}/g, latest?.nextVisitDate || 'secepatnya');
  };

  const formatPhone = (phone: string) => {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    return p;
  };

  const handleManualSend = (idx: number) => {
    const item = queue[idx];
    const msg = formatMessage(messageTemplate, item.user);
    const phone = formatPhone(item.user.phone);
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    
    // Update status UI
    const newQueue = [...queue];
    newQueue[idx].status = 'SENT';
    setQueue(newQueue);
  };

  const handleApiBlast = async () => {
    if (!apiToken) {
      alert("Token API Fonnte belum diisi!");
      return;
    }
    
    const pendingItems = queue.filter(q => q.status === 'PENDING');
    if (pendingItems.length === 0) {
      alert("Tidak ada antrean tertunda.");
      return;
    }

    if (!confirm(`Yakin mengirim ${pendingItems.length} pesan via API Fonnte?`)) return;

    // Iterate one by one to simulate blast (Fonnte Free has delay limits usually)
    for (let i = 0; i < queue.length; i++) {
       if (queue[i].status !== 'PENDING') continue;

       const item = queue[i];
       const phone = formatPhone(item.user.phone);
       const msg = formatMessage(messageTemplate, item.user);

       try {
         const formData = new FormData();
         formData.append('target', phone);
         formData.append('message', msg);
         
         // Simulasi API Call (Uncomment below for real usage)
         const response = await fetch('https://api.fonnte.com/send', {
           method: 'POST',
           headers: { 'Authorization': apiToken },
           body: formData
         });
         const result = await response.json();
         
         setQueue(prev => {
            const n = [...prev];
            n[i].status = result.status ? 'SENT' : 'FAILED';
            n[i].details = result.reason || 'OK';
            return n;
         });

         // Delay 1s agar tidak kena rate limit
         await new Promise(r => setTimeout(r, 1000));

       } catch (err) {
         setQueue(prev => {
            const n = [...prev];
            n[i].status = 'FAILED';
            n[i].details = 'Network Error';
            return n;
         });
       }
    }
    alert("Proses Blast API Selesai.");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-emerald-600 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
              <Megaphone size={36} /> WhatsApp Broadcast
            </h2>
            <p className="text-emerald-100 font-bold uppercase text-[10px] tracking-widest mt-2">Kirim Pesan Massal ke Pasien (API Free / Gateway)</p>
         </div>
         <div className="relative z-10 flex gap-4">
            <button 
              onClick={() => setSendingMethod('MANUAL')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sendingMethod === 'MANUAL' ? 'bg-white text-emerald-600 shadow-xl' : 'bg-emerald-700 text-emerald-200'}`}
            >
              Mode Manual (Gratis)
            </button>
            <button 
              onClick={() => setSendingMethod('API')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sendingMethod === 'API' ? 'bg-white text-emerald-600 shadow-xl' : 'bg-emerald-700 text-emerald-200'}`}
            >
              Mode API (Fonnte)
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT: SETTINGS */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                 <Filter size={20} className="text-indigo-600" /> Target Audience
              </h3>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Filter Pasien</label>
                    <select 
                      value={targetGroup} 
                      onChange={(e) => {
                        setTargetGroup(e.target.value as any);
                        setMessageTemplate(getDefaultTemplate(e.target.value));
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-black text-xs outline-none"
                    >
                       <option value="ALL">Semua Ibu Hamil Aktif</option>
                       <option value="UPCOMING_VISIT">Pengingat Jadwal Besok (H-1)</option>
                       <option value="RISK_HIGH">Risiko Tinggi (Merah/Hitam)</option>
                       <option value="MISSED_VISIT">Pasien Mangkir (Lewat Jadwal)</option>
                    </select>
                 </div>
                 
                 {sendingMethod === 'API' && (
                   <div className="space-y-2 animate-in slide-in-from-top-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Token API Fonnte</label>
                      <input 
                        type="password"
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="Masukkan Token..."
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-xs outline-none"
                      />
                      <p className="text-[8px] text-gray-400 ml-4">*Dapatkan token gratis di fonnte.com</p>
                   </div>
                 )}

                 <button 
                   onClick={generateQueue}
                   className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                 >
                   <Repeat size={16} /> Generate Antrean
                 </button>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                 <MessageSquare size={20} className="text-indigo-600" /> Template Pesan
              </h3>
              <textarea 
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full h-40 p-6 bg-gray-50 border-none rounded-[2rem] font-bold text-xs outline-none resize-none leading-relaxed"
                placeholder="Tulis pesan..."
              ></textarea>
              <div className="mt-4 flex gap-2 flex-wrap">
                 <span className="px-3 py-1 bg-gray-100 rounded-lg text-[8px] font-black uppercase text-gray-500">{`{nama}`}</span>
                 <span className="px-3 py-1 bg-gray-100 rounded-lg text-[8px] font-black uppercase text-gray-500">{`{tgl_kembali}`}</span>
              </div>
           </div>
        </div>

        {/* RIGHT: QUEUE */}
        <div className="xl:col-span-8 bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 h-[600px] flex flex-col">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                 <Send size={24} className="text-emerald-600" /> Antrean Pengiriman ({queue.length})
              </h3>
              {sendingMethod === 'API' && queue.length > 0 && (
                <button onClick={handleApiBlast} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                   Mulai Blast Otomatis
                </button>
              )}
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
              {queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                   <Megaphone size={64} className="mb-4 opacity-20" />
                   <p className="text-xs font-black uppercase tracking-widest">Belum ada antrean pesan</p>
                </div>
              ) : (
                queue.map((item, idx) => (
                  <div key={item.user.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:border-indigo-100 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                          item.status === 'SENT' ? 'bg-emerald-500' : 
                          item.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-300'
                        }`}>
                           {idx + 1}
                        </div>
                        <div>
                           <p className="font-black text-gray-900 text-xs uppercase">{item.user.name}</p>
                           <p className="text-[9px] font-bold text-gray-400 mt-0.5">{item.user.phone}</p>
                           {item.details && <p className="text-[8px] text-red-400 mt-1">{item.details}</p>}
                        </div>
                     </div>

                     <div className="flex items-center gap-4">
                        <div className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${
                          item.status === 'SENT' ? 'bg-emerald-100 text-emerald-600' : 
                          item.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
                        }`}>
                           {item.status}
                        </div>
                        
                        {sendingMethod === 'MANUAL' && item.status !== 'SENT' && (
                           <button 
                             onClick={() => handleManualSend(idx)}
                             className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:scale-110 transition-all"
                             title="Kirim WA Web"
                           >
                             <Send size={14} />
                           </button>
                        )}
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// Modul Kartu ANC Pintar
export const SmartCardModule = ({ state, setState, isUser, user }: { state: AppState, setState: any, isUser: boolean, user: User }) => {
  const patientToDisplay = isUser ? user : state.users.find(u => u.id === state.selectedPatientId);
  
  // ==========================================
  // COLOR CONTROL CENTER (EDIT DI SINI)
  // ==========================================
  const CARD_COLORS = {
    paper: "#FFFFFF",    // Warna Kertas (Background Kartu)
    text: "#000000",     // Warna Teks Utama & Border
    barcode: "#000000",  // Warna QR Code (Foreground)
    barcodeBg: "#FFFFFF",// Warna Background QR Code
    accent: "#000000"    // Warna Ikon / Aksen
  };

  const getQrValue = (pid: string) => {
    return `${window.location.origin}${window.location.pathname}?pid=${pid}`;
  };

  const handleSaveCard = () => {
    window.print();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
      {/* SELEKTOR PASIEN */}
      {!isUser && (
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm no-print">
           <div className="flex items-center gap-4 mb-6">
             <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <UserCircle2 size={24} />
             </div>
             <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Pilih Pasien</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pilih data untuk dicetak</p>
             </div>
           </div>
           <select 
             onChange={(e) => setState((prev: AppState) => ({...prev, selectedPatientId: e.target.value}))}
             className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] font-black text-xs uppercase appearance-none outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
             value={state.selectedPatientId || ''}
           >
             <option value="">-- PILIH NAMA PASIEN --</option>
             {state.users.filter(u => u.role === 'USER').map(u => (
               <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
             ))}
           </select>
         </div>
      )}

      {patientToDisplay ? (
        <div className="space-y-10">
          {/* PREVIEW LAYAR (No-Print) */}
          <div className="no-print bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
              <div className="flex items-center gap-5">
                <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl rotate-3">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">KARTU ANC PINTAR</h1>
                  <p className="text-[10px] font-black text-indigo-400 tracking-[0.3em] uppercase mt-2">Versi Digital Aktif</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 relative z-10">
              <div className="flex flex-col items-center shrink-0">
                <div className="bg-white p-6 border-[6px] border-slate-900 rounded-[3rem] shadow-xl">
                  <QRCode value={getQrValue(patientToDisplay.id)} size={150} />
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identitas Pasien</p>
                  <p className="text-2xl font-black text-slate-900 uppercase">{patientToDisplay.name}</p>
                  <p className="text-sm font-bold text-indigo-600 mt-1">ID: {patientToDisplay.id}</p>
                </div>
                <div className="pt-6 border-t border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
                   <p className="text-lg font-black text-slate-700 uppercase">
                      {patientToDisplay.isDelivered ? 'Pasca Salin (Nifas)' : 'Sedang Hamil (ANC)'}
                   </p>
                </div>
              </div>
            </div>
          </div>

          {/* TEMPLATE CETAK (DIPISAHKAN WARNA ELEMENNYA) */}
          <div className="print-only">
            <div className="flex flex-col items-center w-full bg-white">
              
              <div className="w-full text-center mb-10 border-b-2 border-white pb-4">
                 <h2 className="text-xl font-black uppercase" style={{ color: CARD_COLORS.text }}>Dokumen Kartu Kesehatan Digital</h2>
                 <p className="text-xs font-bold uppercase" style={{ color: CARD_COLORS.text }}>{PUSKESMAS_INFO.name}</p>
              </div>

              {/* SISI DEPAN KARTU */}
              <div className="card-to-print w-[85.6mm] h-[54mm] rounded-[15pt] p-6 relative overflow-hidden mb-12"
                   style={{ 
                     backgroundColor: CARD_COLORS.paper, 
                     border: `2.5pt solid ${CARD_COLORS.text}` 
                   }}>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} style={{ color: CARD_COLORS.accent }} />
                      <h2 className="text-[12pt] font-black uppercase tracking-tighter" style={{ color: CARD_COLORS.text }}>KARTU ANC PINTAR</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[7pt] font-black uppercase leading-none" style={{ color: CARD_COLORS.text }}>PASAR MINGGU</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-6 items-center">
                    {/* QR Code Area - Terpisah Warnanya */}
                    <div className="p-1 border-[1.5pt] rounded-lg" style={{ borderColor: CARD_COLORS.text, backgroundColor: CARD_COLORS.barcodeBg }}>
                       <QRCode 
                        value={getQrValue(patientToDisplay.id)} 
                        size={80} 
                        fgColor={CARD_COLORS.barcode} 
                        bgColor={CARD_COLORS.barcodeBg} 
                       />
                    </div>
                    {/* Info Area */}
                    <div className="flex-1 space-y-3">
                       <div>
                          <p className="text-[6pt] font-black uppercase opacity-60" style={{ color: CARD_COLORS.text }}>Nama Pasien</p>
                          <p className="text-[11pt] font-black uppercase truncate leading-none" style={{ color: CARD_COLORS.text }}>{patientToDisplay.name}</p>
                       </div>
                       <div>
                          <p className="text-[6pt] font-black uppercase opacity-60" style={{ color: CARD_COLORS.text }}>ID Sistem</p>
                          <p className="text-[10pt] font-black leading-none" style={{ color: CARD_COLORS.text }}>{patientToDisplay.id}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="absolute bottom-4 left-6 right-6 pt-2 flex justify-between items-center" 
                      style={{ borderTop: `1pt solid ${CARD_COLORS.text}` }}>
                    <p className="text-[6pt] font-black uppercase" style={{ color: CARD_COLORS.text }}>Terenkripsi Digital</p>
                    <p className="text-[6pt] font-black opacity-40 uppercase tracking-widest" style={{ color: CARD_COLORS.text }}>Smart ANC v4.0</p>
                 </div>
              </div>

              {/* SISI BELAKANG KARTU */}
              <div className="card-to-print w-[85.6mm] h-[54mm] rounded-[15pt] p-6 relative overflow-hidden"
                   style={{ 
                     backgroundColor: CARD_COLORS.paper, 
                     border: `2.5pt solid ${CARD_COLORS.text}` 
                   }}>
                 <div className="mb-4 pb-2" style={{ borderBottom: `1pt solid ${CARD_COLORS.text}` }}>
                    <h3 className="text-[10pt] font-black uppercase tracking-[0.1em]" style={{ color: CARD_COLORS.text }}>INSTRUKSI LAYANAN</h3>
                 </div>

                 <div className="space-y-4 flex-1">
                    <p className="text-[8pt] font-bold uppercase leading-tight" style={{ color: CARD_COLORS.text }}>• BAWA KARTU INI SAAT KONTROL KE PUSKESMAS.</p>
                    <p className="text-[8pt] font-bold uppercase leading-tight" style={{ color: CARD_COLORS.text }}>• SCAN QR CODE UNTUK MELIHAT REKAM MEDIS.</p>
                    <p className="text-[8pt] font-bold uppercase leading-tight" style={{ color: CARD_COLORS.text }}>• HUBUNGI BIDAN JIKA ADA TANDA BAHAYA.</p>
                 </div>

                 <div className="absolute bottom-4 left-0 right-0 text-center px-6">
                    <div className="pt-2" style={{ borderTop: `1pt solid ${CARD_COLORS.text}` }}>
                       <p className="text-[8pt] font-black uppercase" style={{ color: CARD_COLORS.text }}>{PUSKESMAS_INFO.phone}</p>
                       <p className="text-[5pt] font-bold opacity-40 uppercase tracking-widest" style={{ color: CARD_COLORS.text }}>Emergency Hot-Line</p>
                    </div>
                 </div>
              </div>

              <div className="mt-16 text-center opacity-30">
                 <p className="text-[12pt] font-black uppercase tracking-[0.3em]" style={{ color: CARD_COLORS.text }}>Gunting Tepat Pada Garis Tepi Hitam</p>
              </div>
            </div>
          </div>

          <div className="no-print px-4">
            <button 
              onClick={handleSaveCard} 
              className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black shadow-2xl flex items-center justify-center gap-6 hover:bg-black transition-all uppercase text-sm tracking-[0.2em] active:scale-95 group"
            >
              <Save size={24} className="group-hover:rotate-12 transition-transform" /> SIMPAN KARTU (CETAK/PDF)
            </button>
            <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Pastikan Anda menggunakan kertas putih bersih untuk hasil terbaik. <br/> 
              Warna teks, barcode, dan kertas telah dipisahkan untuk ketajaman dokumen.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-24 rounded-[4rem] shadow-sm border border-slate-100 text-center space-y-6 no-print">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
            <QrCode size={48} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-slate-300 uppercase tracking-tighter">Kartu Belum Tergenerasi</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Pilih pasien untuk menampilkan kartu digital</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ... (Rest of EducationModule, ContactModule, AccessDenied remains same)
export const EducationModule = () => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(EDUCATION_LIST.map(edu => edu.category)));
    return ['ALL', ...cats];
  }, []);

  const filteredEducation = useMemo(() => {
    return activeCategory === 'ALL' 
      ? EDUCATION_LIST 
      : EDUCATION_LIST.filter(edu => edu.category === activeCategory);
  }, [activeCategory]);

  const handleShare = async (edu: EducationContent) => {
    const shareData = {
      title: edu.title,
      text: `${edu.title}: ${edu.content}`,
      url: edu.url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(edu.url);
        alert('Tautan berhasil disalin ke papan klip!');
      }
    } catch (err) {
      console.error('Gagal membagikan konten:', err);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Topik Edukasi</h3>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Saring materi sesuai kebutuhan</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-xl translate-y-[-2px]' 
                  : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {cat === 'ALL' ? 'Semua Topik' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredEducation.map(edu => (
          <div 
            key={edu.id} 
            className="bg-white rounded-[3rem] overflow-hidden shadow-sm group border border-gray-100 hover:shadow-2xl transition-all duration-500 animate-in zoom-in-95"
          >
            <div className="h-64 overflow-hidden relative">
              <img src={edu.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" alt={edu.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent opacity-60" />
            </div>
            <div className="p-10">
              <h4 className="text-2xl font-black text-gray-900 mb-4 leading-tight tracking-tighter">{edu.title}</h4>
              <p className="text-sm text-gray-500 mb-8 line-clamp-2 font-medium">{edu.content}</p>
              <div className="flex gap-3">
                <a 
                  href={edu.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-[2] text-center py-5 bg-gray-50 text-indigo-600 font-black text-[10px] rounded-2xl hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-[0.2em]"
                >
                  Buka Materi
                </a>
                <button 
                  onClick={() => handleShare(edu)}
                  className="flex-1 flex items-center justify-center gap-2 py-5 bg-indigo-50 text-indigo-600 font-black text-[10px] rounded-2xl hover:bg-indigo-100 transition-all uppercase tracking-[0.2em]"
                  title="Bagikan Materi"
                >
                  <Share2 size={16} /> Bagikan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactModule = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-red-600 p-12 md:p-24 rounded-[4rem] md:rounded-[6rem] text-white shadow-2xl relative overflow-hidden text-center">
        <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-none relative z-10 uppercase">Gawat Darurat?</h2>
        <p className="text-red-100 font-bold max-w-xl mx-auto text-sm md:text-lg relative z-10 mb-10">Jika mengalami tanda bahaya, segera hubungi nomor di bawah ini atau menuju puskesmas terdekat.</p>
        <a href={`tel:${PUSKESMAS_INFO.phone}`} className="inline-flex items-center gap-4 px-8 md:px-12 py-4 md:py-6 bg-white text-red-600 rounded-full font-black text-lg md:text-xl shadow-2xl hover:scale-105 transition-all">
          <Phone size={28} /> {PUSKESMAS_INFO.phone}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {[
          { icon: <MapPin size={40}/>, title: "Lokasi Fisik", detail: PUSKESMAS_INFO.address },
          { icon: <Phone size={40}/>, title: "Layanan Konsultasi", detail: "Tersedia 08.00 - 16.00 WIB" },
          { icon: <Mail size={40}/>, title: "Email Dukungan", detail: PUSKESMAS_INFO.email }
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-10 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-sm border border-gray-100 flex flex-col items-center hover:-translate-y-2 transition-all">
            <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center text-indigo-600 mb-8 shadow-inner">{card.icon}</div>
            <h4 className="font-black text-gray-900 text-xl mb-3 tracking-tighter">{card.title}</h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">{card.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AccessDenied = () => (
  <div className="p-20 text-center animate-in zoom-in duration-500">
    <div className="bg-red-50 p-16 rounded-[4rem] border-4 border-dashed border-red-200">
      <UserX size={80} className="mx-auto text-red-400 mb-6" />
      <h2 className="text-3xl font-black text-red-600 uppercase tracking-tighter">Akses Sistem Dicabut</h2>
      <p className="text-red-500 font-bold mt-2">Silakan hubungi administrator puskesmas untuk verifikasi ulang identitas Anda.</p>
    </div>
  </div>
);
