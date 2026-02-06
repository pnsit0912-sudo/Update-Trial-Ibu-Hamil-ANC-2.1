
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserRole, User, AppState, ANCVisit, SystemLog, SystemAlert, DeliveryData } from './types';
import { PUSKESMAS_INFO, WILAYAH_DATA, NAVIGATION, MOCK_USERS, MOCK_ANC_VISITS } from './constants';
import { RISK_FACTORS_MASTER, calculatePregnancyProgress, getRiskCategory, getBabySizeByWeek } from './utils';
import { 
  CheckCircle, AlertCircle, Users, Calendar, AlertTriangle,
  UserPlus, Edit3, X, Clock, Baby, Trash2, ShieldCheck, LayoutDashboard, Activity, 
  MapPin, ShieldAlert, QrCode, BookOpen, Map as MapIcon, Phone, Navigation as NavIcon, Crosshair,
  RefreshCw, Stethoscope, Heart, Droplets, Thermometer, ClipboardCheck, ArrowRight, ExternalLink,
  Info, Bell, Eye, Star, TrendingUp, CheckSquare, Zap, Shield, List, Sparkles, BrainCircuit, Waves, Utensils, Download, Upload, Database, UserX, Save, PartyPopper, RefreshCcw, Scale, Ruler, CalendarDays, Siren, FileText, Loader2, Calculator, MessageSquare
} from 'lucide-react';
import { supabase } from './supabaseClient';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PatientList } from './PatientList';
import { LoginScreen } from './LoginScreen';
import { AccessManagement } from './AccessManagement';
import { RiskMonitoring } from './RiskMonitoring';
import { SmartCardModule, EducationModule, ContactModule, BroadcastModule } from './FeatureModules';
import { MapView } from './MapView';
import { PatientProfileView } from './PatientProfileView';

const DATABASE_VERSION = '5.0.0 (Online PostgreSQL)';

const DAILY_TASKS = [
  { task: 'Minum Tablet Tambah Darah', time: 'Malam Hari', icon: <Droplets size={16} /> },
  { task: 'Hitung 10 Gerakan Janin', time: 'Setiap Hari', icon: <Activity size={16} /> },
  { task: 'Konsumsi Protein Tinggi', time: 'Sarapan/Maksi', icon: <Utensils size={16} /> }
];

const getTrimesterAdvice = (weeks: number) => {
  if (weeks <= 13) return "Trimester 1: Fokus pada asupan Asam Folat untuk perkembangan saraf janin. Istirahat cukup jika sering mual (morning sickness).";
  if (weeks <= 26) return "Trimester 2: Mulai hitung gerakan janin. Konsumsi kalsium tinggi untuk pembentukan tulang bayi dan cegah anemia dengan zat besi.";
  return "Trimester 3: Waspadai tanda persalinan dan Pre-eklampsia (pusing hebat/kaki bengkak). Siapkan tas persalinan dan perlengkapan bayi.";
};

// --- HELPER MAPPING (DATABASE SNAKE_CASE -> APP CAMELCASE) ---
const mapUserFromDB = (u: any): User => ({
  id: u.id,
  username: u.username,
  password: u.password,
  name: u.name,
  nik: u.nik,
  husbandName: u.husband_name,
  bpjsNumber: u.bpjs_number,
  height: u.height,
  prePregnancyWeight: u.pre_pregnancy_weight,
  lila: u.lila,
  role: u.role as UserRole,
  phone: u.phone || '',
  dob: u.dob || '',
  address: u.address || '',
  kecamatan: u.kecamatan || '',
  kelurahan: u.kelurahan || '',
  hpht: u.hpht || '',
  pregnancyMonth: u.pregnancy_month || 0,
  pregnancyNumber: u.pregnancy_number || 0,
  parityP: u.parity_p || 0,
  parityA: u.parity_a || 0,
  medicalHistory: u.medical_history || '',
  totalRiskScore: u.total_risk_score || 0,
  isActive: u.is_active,
  isDelivered: u.is_delivered,
  lat: u.lat,
  lng: u.lng,
  selectedRiskFactors: u.selected_risk_factors || [],
  deliveryData: u.delivery_data,
  pregnancyHistory: u.pregnancy_history || []
});

const mapUserToDB = (u: Partial<User>) => ({
  id: u.id,
  username: u.username,
  password: u.password,
  name: u.name,
  nik: u.nik,
  husband_name: u.husbandName,
  bpjs_number: u.bpjsNumber,
  height: u.height,
  pre_pregnancy_weight: u.prePregnancyWeight,
  lila: u.lila,
  role: u.role,
  phone: u.phone,
  dob: u.dob,
  address: u.address,
  kecamatan: u.kecamatan,
  kelurahan: u.kelurahan,
  hpht: u.hpht,
  pregnancy_month: u.pregnancyMonth,
  pregnancy_number: u.pregnancyNumber,
  parity_p: u.parityP,
  parity_a: u.parityA,
  medical_history: u.medicalHistory,
  total_risk_score: u.totalRiskScore,
  is_active: u.isActive,
  is_delivered: u.isDelivered,
  lat: u.lat,
  lng: u.lng,
  selected_risk_factors: u.selectedRiskFactors,
  delivery_data: u.deliveryData,
  pregnancy_history: u.pregnancyHistory
});

const mapVisitFromDB = (v: any): ANCVisit => ({
  id: v.id,
  patientId: v.patient_id,
  nakesId: v.nakes_id,
  visitDate: v.visit_date,
  scheduledDate: v.scheduled_date,
  nextVisitDate: v.next_visit_date,
  weight: v.weight,
  bloodPressure: v.blood_pressure,
  tfu: v.tfu,
  djj: v.djj,
  hb: v.hb,
  complaints: v.complaints,
  dangerSigns: v.danger_signs || [],
  edema: v.edema,
  fetalMovement: v.fetal_movement,
  followUp: v.follow_up,
  nakesNotes: v.nakes_notes,
  status: v.status as any
});

const mapVisitToDB = (v: ANCVisit) => ({
  id: v.id,
  patient_id: v.patientId,
  nakes_id: v.nakesId,
  visit_date: v.visitDate,
  scheduled_date: v.scheduledDate,
  next_visit_date: v.nextVisitDate,
  weight: v.weight,
  blood_pressure: v.bloodPressure,
  tfu: v.tfu,
  djj: v.djj,
  hb: v.hb,
  complaints: v.complaints,
  danger_signs: v.dangerSigns,
  edema: v.edema,
  fetal_movement: v.fetalMovement,
  follow_up: v.followUp,
  nakes_notes: v.nakesNotes,
  status: v.status
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [editingPatient, setEditingPatient] = useState<User | null>(null);
  const [isAddingVisit, setIsAddingVisit] = useState<User | null>(null);
  const [recordingDelivery, setRecordingDelivery] = useState<User | null>(null);
  const [startingNewPregnancy, setStartingNewPregnancy] = useState<User | null>(null);
  const [editingVisit, setEditingVisit] = useState<{patient: User, visit: ANCVisit} | null>(null);
  const [viewingPatientProfile, setViewingPatientProfile] = useState<string | null>(null);
  const [tempRiskFactors, setTempRiskFactors] = useState<string[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const [formCoords, setFormCoords] = useState<{lat: string, lng: string}>({lat: '', lng: ''});
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [calcHpht, setCalcHpht] = useState<string>(''); // For Calculator UI in Register

  const [visitPreviewData, setVisitPreviewData] = useState<Partial<ANCVisit>>({
    bloodPressure: '120/80',
    dangerSigns: [],
    fetalMovement: 'Normal',
    djj: 140
  });

  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    ancVisits: [],
    alerts: [],
    selectedPatientId: null,
    logs: [],
    userChecklists: {},
    currentView: 'dashboard'
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [patientSearch, setPatientSearch] = useState('');

  // --- SUPABASE DATA FETCHING ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: visitsData } = await supabase.from('anc_visits').select('*');
      const { data: logsData } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);

      const hasDBUsers = usersData && usersData.length > 0;
      const hasDBVisits = visitsData && visitsData.length > 0;

      if (!hasDBUsers) {
        showNotification('Mode Demo: Menggunakan Data Mock (Database Kosong/RLS)');
      }

      setState(prev => ({
        ...prev,
        users: hasDBUsers ? usersData.map(mapUserFromDB) : MOCK_USERS,
        ancVisits: hasDBVisits ? visitsData.map(mapVisitFromDB) : MOCK_ANC_VISITS,
        logs: logsData ? logsData.map(l => ({ 
            id: l.id, timestamp: l.timestamp, userId: l.user_id, userName: l.user_name, action: l.action, module: l.module, details: l.details 
        })) : []
      }));
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setState(prev => ({
        ...prev,
        users: MOCK_USERS,
        ancVisits: MOCK_ANC_VISITS,
      }));
      showNotification('Koneksi database gagal. Beralih ke mode offline (Mock Data).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addLog = useCallback(async (action: string, module: string, details: string) => {
    if (!currentUser) return;
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      action,
      module,
      details
    };
    
    setState(prev => ({
      ...prev,
      logs: [{ 
        id: newLog.id, timestamp: newLog.timestamp, userId: newLog.user_id, userName: newLog.user_name, action, module, details 
      }, ...prev.logs].slice(0, 100)
    }));

    supabase.from('system_logs').insert([newLog]).then(({ error }) => {
       if (error) console.error("Gagal simpan log:", error);
    });
  }, [currentUser]);

  const showNotification = useCallback((message: string) => {
    setNotification({ message, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // ... (Registration Handlers unchanged) ...
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role === UserRole.USER) return;
    const formData = new FormData(e.currentTarget);
    const hpht = formData.get('hpht') as string;
    const progress = calculatePregnancyProgress(hpht);
    const score = tempRiskFactors.reduce((acc, id) => acc + (RISK_FACTORS_MASTER[id]?.score || 0), 0);

    const baseData = {
      name: formData.get('name') as string,
      nik: formData.get('nik') as string,
      husbandName: formData.get('husbandName') as string,
      bpjsNumber: formData.get('bpjsNumber') as string,
      dob: formData.get('dob') as string,
      phone: formData.get('phone') as string,
      
      height: parseFloat(formData.get('height') as string) || 0,
      prePregnancyWeight: parseFloat(formData.get('prePregnancyWeight') as string) || 0,
      lila: parseFloat(formData.get('lila') as string) || 0,

      hpht: hpht,
      pregnancyMonth: progress?.months || 0,
      pregnancyNumber: parseInt(formData.get('gravida') as string || '0'),
      parityP: parseInt(formData.get('para') as string || '0'),
      parityA: parseInt(formData.get('abortus') as string || '0'),
      medicalHistory: formData.get('medicalHistory') as string,
      
      address: formData.get('address') as string,
      kecamatan: formData.get('kecamatan') as string,
      kelurahan: formData.get('kelurahan') as string,
      lat: parseFloat(formData.get('lat') as string) || parseFloat(formCoords.lat) || undefined,
      lng: parseFloat(formData.get('lng') as string) || parseFloat(formCoords.lng) || undefined,
      
      selectedRiskFactors: tempRiskFactors,
      totalRiskScore: score,
    };

    try {
      if (editingPatient) {
        const updateData = { ...editingPatient, ...baseData };
        const dbData = mapUserToDB(updateData);
        await supabase.from('users').update(dbData).eq('id', editingPatient.id);
        addLog('UPDATE_PATIENT', 'PATIENT', `Mengubah data ${baseData.name}`);
        setState(prev => ({ ...prev, users: prev.users.map(u => u.id === editingPatient.id ? updateData : u) }));
      } else {
        const id = `ANC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const newUser: User = { 
          ...baseData, id, username: id, password: id, role: UserRole.USER, isActive: true 
        } as User;
        const dbData = mapUserToDB(newUser);
        await supabase.from('users').insert([dbData]);
        addLog('REGISTER_PATIENT', 'PATIENT', `Mendaftarkan ${baseData.name}`);
        setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
      }
      handleNavigate('patients');
      showNotification(editingPatient ? 'Data diperbarui' : 'Pasien baru terdaftar');
    } catch (err: any) {
      alert('Gagal menyimpan data (Cek Koneksi): ' + err.message);
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const activePatient = isAddingVisit || editingVisit?.patient;
    if (!activePatient || !currentUser) return;
    
    const formData = new FormData(e.currentTarget);
    const visitData: ANCVisit = {
      id: editingVisit ? editingVisit.visit.id : `v${Date.now()}`,
      patientId: activePatient.id,
      visitDate: editingVisit ? editingVisit.visit.visitDate : new Date().toISOString().split('T')[0],
      scheduledDate: editingVisit ? editingVisit.visit.scheduledDate : new Date().toISOString().split('T')[0],
      nextVisitDate: formData.get('nextVisit') as string,
      weight: parseFloat(formData.get('weight') as string),
      bloodPressure: formData.get('bp') as string,
      tfu: parseFloat(formData.get('tfu') as string),
      djj: parseFloat(formData.get('djj') as string),
      hb: parseFloat(formData.get('hb') as string),
      complaints: formData.get('complaints') as string,
      dangerSigns: formData.getAll('dangerSigns') as string[],
      edema: formData.get('edema') === 'on',
      fetalMovement: formData.get('fetalMovement') as string,
      followUp: formData.get('followUp') as string,
      nakesNotes: formData.get('notes') as string,
      nakesId: editingVisit ? editingVisit.visit.nakesId : currentUser.id,
      status: 'COMPLETED'
    };

    try {
       const dbData = mapVisitToDB(visitData);
       if (editingVisit) {
         await supabase.from('anc_visits').update(dbData).eq('id', visitData.id);
         addLog('UPDATE_ANC_VISIT', 'ANC', `Memperbarui riwayat ANC ${activePatient.name}`);
       } else {
         await supabase.from('anc_visits').insert([dbData]);
         addLog('ANC_VISIT', 'ANC', `Pemeriksaan ANC ${activePatient.name}`);
       }
       setState(prev => {
         let newVisits = editingVisit 
            ? prev.ancVisits.map(v => v.id === visitData.id ? visitData : v)
            : [...prev.ancVisits, visitData];
         return { ...prev, ancVisits: newVisits };
       });
       setIsAddingVisit(null);
       setEditingVisit(null);
       showNotification('Pemeriksaan Berhasil Disimpan');
    } catch (err: any) {
      alert('Gagal menyimpan kunjungan: ' + err.message);
    }
  };

  // --- LOGIKA PENCATATAN KELAHIRAN ---
  const handleDeliverySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!recordingDelivery || !currentUser) return;

    const formData = new FormData(e.currentTarget);
    const weight = parseInt(formData.get('babyWeight') as string);
    
    let classification: 'NORMAL' | 'BBLR' | 'BBLSR' = 'NORMAL';
    if (weight < 1500) classification = 'BBLSR';
    else if (weight < 2500) classification = 'BBLR';

    const deliveryData: DeliveryData = {
      id: `birth-${Date.now()}`,
      deliveryDate: formData.get('deliveryDate') as string,
      babyName: formData.get('babyName') as string || 'Bayi Ny. ' + recordingDelivery.name,
      babyGender: formData.get('babyGender') as 'L' | 'P',
      babyWeight: weight,
      babyHeight: parseInt(formData.get('babyHeight') as string),
      motherStatus: formData.get('motherStatus') as any,
      babyStatus: formData.get('babyStatus') as any,
      classification,
      condition: formData.get('condition') as string,
    };

    // UPDATE STATE: isDelivered menjadi TRUE agar hilang dari MAP dan MONITORING
    const updatedUser = { 
       ...recordingDelivery, 
       isDelivered: true, 
       deliveryData,
       pregnancyHistory: [...(recordingDelivery.pregnancyHistory || []), deliveryData]
    };

    try {
      const dbData = mapUserToDB(updatedUser);
      await supabase.from('users').update({ 
        is_delivered: true, 
        delivery_data: dbData.delivery_data, 
        pregnancy_history: dbData.pregnancy_history 
      }).eq('id', updatedUser.id);

      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === recordingDelivery.id ? updatedUser : u)
      }));
      addLog('RECORD_DELIVERY', 'PATIENT', `Mencatat kelahiran bayi Ny. ${recordingDelivery.name}. Pasien diarsipkan dari peta.`);
      setRecordingDelivery(null);
      showNotification(`Data kelahiran berhasil dicatat. Pasien diarsipkan.`);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  const handleStartNewPregnancy = async (user: User) => {
    if (!window.confirm('Mulai kehamilan baru? Data kehamilan saat ini akan diarsipkan ke riwayat.')) return;
    
    // Reset status to active pregnancy
    const updatedUser = {
      ...user,
      isDelivered: false,
      pregnancyNumber: user.pregnancyNumber + 1,
      parityP: user.parityP + 1, // Assuming previous was successful
      hpht: new Date().toISOString().split('T')[0], // Reset HPHT placeholder
      pregnancyMonth: 0,
      totalRiskScore: 0, // Reset risk score, needs re-assessment
      selectedRiskFactors: [],
      deliveryData: undefined
    };

    try {
       const dbData = mapUserToDB(updatedUser);
       // We don't want to wipe pregnancy_history, just append in delivery logic.
       // Here we just update current state fields.
       await supabase.from('users').update({
         is_delivered: false,
         pregnancy_number: updatedUser.pregnancyNumber,
         parity_p: updatedUser.parityP,
         hpht: updatedUser.hpht,
         pregnancy_month: 0,
         total_risk_score: 0,
         selected_risk_factors: [],
         delivery_data: null
       }).eq('id', user.id);

       setState(prev => ({
         ...prev,
         users: prev.users.map(u => u.id === user.id ? updatedUser : u)
       }));
       addLog('NEW_PREGNANCY', 'PATIENT', `Memulai kehamilan baru untuk Ny. ${user.name}`);
       setEditingPatient(updatedUser); // Directly open edit to update HPHT/Risk
       setView('register'); 
       showNotification('Kehamilan baru dimulai. Silakan perbarui data HPHT dan Risiko.');
    } catch(err: any) {
       alert("Gagal update: " + err.message);
    }
  };

  const handleDeleteVisit = useCallback(async (visitId: string) => {
    if (!window.confirm('Hapus permanen riwayat pemeriksaan ini?')) return;
    try {
      await supabase.from('anc_visits').delete().eq('id', visitId);
      setState(prev => ({
        ...prev,
        ancVisits: prev.ancVisits.filter(v => v.id !== visitId)
      }));
      addLog('DELETE_VISIT', 'ANC', `Menghapus riwayat pemeriksaan ID: ${visitId}`);
      showNotification('Riwayat pemeriksaan berhasil dihapus');
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  }, [addLog, showNotification]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda.");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormCoords({ lat: latitude.toFixed(6), lng: longitude.toFixed(6) });
        setIsGettingLocation(false);
        showNotification('Lokasi presisi berhasil diambil dari GPS');
      },
      (error) => {
        setIsGettingLocation(false);
        alert(`Gagal mendapatkan lokasi: ${error.message}. Silakan input manual.`);
      },
      { enableHighAccuracy: true }
    );
  }, [showNotification]);

  const handleNavigate = (targetView: string) => {
    setEditingPatient(null);
    setIsAddingVisit(null);
    setEditingVisit(null);
    setViewingPatientProfile(null);
    setRecordingDelivery(null);
    setStartingNewPregnancy(null);
    setTempRiskFactors([]);
    setView(targetView);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50">
        <Loader2 size={48} className="animate-spin text-emerald-600 mb-4" />
        <h2 className="text-xl font-black text-slate-900 uppercase">Menghubungkan Database...</h2>
        <p className="text-xs text-slate-400 font-bold mt-2">Memuat data dari Supabase Cloud</p>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen users={state.users} onLogin={(u) => setCurrentUser(u)} />;

  const DashboardHome = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
         <div className="bg-gradient-to-r from-emerald-800 to-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Selamat Datang, {currentUser.name}</h2>
                <p className="text-emerald-200 mt-2 text-sm uppercase tracking-widest">Sistem Smart ANC Terintegrasi (Online)</p>
                <div className="flex gap-4 mt-8">
                <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Total Pasien</p>
                    <p className="text-3xl font-black">{state.users.filter(u => u.role === UserRole.USER).length}</p>
                </div>
                <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">Total Kunjungan</p>
                    <p className="text-3xl font-black">{state.ancVisits.length}</p>
                </div>
                </div>
            </div>
            <Activity size={300} className="absolute -right-20 -bottom-32 text-white opacity-5 rotate-12" />
         </div>
      </div>
    );
  };

  const renderRegistrationForm = () => {
    const calcProgress = calculatePregnancyProgress(calcHpht || editingPatient?.hpht || '');
    
    return (
      <div className="max-w-6xl mx-auto space-y-12 animate-in zoom-in-95 pb-20">
         <div className="flex items-center gap-6">
           <button onClick={() => handleNavigate('patients')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 hover:scale-105 transition-all">
             <ArrowRight className="rotate-180" size={24}/>
           </button>
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{editingPatient ? 'Edit Rekam Medis' : 'Registrasi ANC Baru'}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standar Pelayanan Antenatal (10 T) & Buku KIA</p>
           </div>
         </div>

         <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Form content remains the same as previously implemented */}
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Users size={18} /> I. Identitas & Admin
                 </h3>
                 <div className="space-y-4">
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">NIK (KTP)</label>
                       <input name="nik" placeholder="16 Digit NIK" defaultValue={editingPatient?.nik} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-200" required />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nama Ibu</label>
                       <input name="name" placeholder="Nama Lengkap Sesuai KTP" defaultValue={editingPatient?.name} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-200" required />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nama Suami</label>
                       <input name="husbandName" placeholder="Nama Penanggung Jawab" defaultValue={editingPatient?.husbandName} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-200" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Tgl Lahir</label>
                          <input type="date" name="dob" defaultValue={editingPatient?.dob} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-200" required />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">No. JKN/BPJS</label>
                          <input name="bpjsNumber" placeholder="Opsional" defaultValue={editingPatient?.bpjsNumber} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">No. HP / WhatsApp</label>
                       <input name="phone" placeholder="08..." defaultValue={editingPatient?.phone} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-200" required />
                    </div>
                 </div>
              </div>

              {/* GEOSPASIAL CARD */}
              <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
                 <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MapPin size={18} /> II. Geospasial Rumah
                 </h3>
                 <div className="space-y-4">
                    <button 
                       type="button" 
                       onClick={getCurrentLocation}
                       className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                       {isGettingLocation ? <Loader2 className="animate-spin" size={16}/> : <Crosshair size={16} />} 
                       {isGettingLocation ? 'Mencari Sinyal GPS...' : 'Ambil Titik Lokasi Otomatis'}
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="text-[9px] font-black text-emerald-600 uppercase ml-2">Latitude</label>
                          <input name="lat" value={formCoords.lat || editingPatient?.lat || ''} onChange={(e) => setFormCoords({...formCoords, lat: e.target.value})} placeholder="-6.2..." className="w-full p-3 bg-white rounded-xl font-bold text-xs text-center outline-none border border-emerald-100 focus:border-emerald-400" />
                       </div>
                       <div>
                          <label className="text-[9px] font-black text-emerald-600 uppercase ml-2">Longitude</label>
                          <input name="lng" value={formCoords.lng || editingPatient?.lng || ''} onChange={(e) => setFormCoords({...formCoords, lng: e.target.value})} placeholder="106.8..." className="w-full p-3 bg-white rounded-xl font-bold text-xs text-center outline-none border border-emerald-100 focus:border-emerald-400" />
                       </div>
                    </div>
                    
                    <div>
                       <label className="text-[10px] font-bold text-emerald-600 uppercase ml-2">Alamat Domisili</label>
                       <textarea name="address" defaultValue={editingPatient?.address} placeholder="Nama Jalan, RT/RW, No. Rumah" className="w-full p-4 bg-white rounded-2xl font-bold text-sm outline-none border border-emerald-100 h-24 resize-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <select name="kecamatan" defaultValue="Pasar Minggu" className="p-3 bg-white rounded-xl font-bold text-xs outline-none border border-emerald-100">
                          <option value="Pasar Minggu">Kec. Pasar Minggu</option>
                       </select>
                       <select name="kelurahan" defaultValue={editingPatient?.kelurahan || ''} className="p-3 bg-white rounded-xl font-bold text-xs outline-none border border-emerald-100" required>
                          <option value="">- Kelurahan -</option>
                          {WILAYAH_DATA["Pasar Minggu"].map(kel => <option key={kel} value={kel}>{kel}</option>)}
                       </select>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-8 space-y-6">
              
              {/* FISIK DASAR */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h3 className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity size={18} /> III. Data Fisik Dasar (Screening Awal)
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Tinggi Badan (TB)</label>
                       <div className="relative">
                          <input type="number" step="0.1" name="height" defaultValue={editingPatient?.height} placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-emerald-200" required />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">CM</span>
                       </div>
                       <p className="text-[9px] text-slate-400 mt-1 ml-2">*TB {"<"} 145cm risiko panggul sempit</p>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">BB Pra-Hamil</label>
                       <div className="relative">
                          <input type="number" step="0.1" name="prePregnancyWeight" defaultValue={editingPatient?.prePregnancyWeight} placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-emerald-200" required />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">KG</span>
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">LILA (Lengan Atas)</label>
                       <div className="relative">
                          <input type="number" step="0.1" name="lila" defaultValue={editingPatient?.lila} placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-emerald-200" required />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">CM</span>
                       </div>
                       <p className="text-[9px] text-slate-400 mt-1 ml-2">*LILA {"<"} 23.5cm risiko KEK</p>
                    </div>
                 </div>
              </div>

              {/* OBSTETRI CALCULATOR */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Calculator size={18} /> IV. Kalkulator Obstetri & HPL
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                       <div className="space-y-4">
                          <div>
                             <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Hari Pertama Haid Terakhir (HPHT)</label>
                             <input 
                               type="date" 
                               name="hpht" 
                               defaultValue={editingPatient?.hpht} 
                               onChange={(e) => setCalcHpht(e.target.value)}
                               className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl font-bold text-white text-lg outline-none focus:bg-white/20" 
                               required 
                             />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Gravida (G)</label>
                                <input type="number" name="gravida" defaultValue={editingPatient?.pregnancyNumber} placeholder="1" className="w-full p-3 bg-white/10 border border-white/20 rounded-2xl font-bold text-center outline-none" />
                             </div>
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Para (P)</label>
                                <input type="number" name="para" defaultValue={editingPatient?.parityP} placeholder="0" className="w-full p-3 bg-white/10 border border-white/20 rounded-2xl font-bold text-center outline-none" />
                             </div>
                             <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Abortus (A)</label>
                                <input type="number" name="abortus" defaultValue={editingPatient?.parityA} placeholder="0" className="w-full p-3 bg-white/10 border border-white/20 rounded-2xl font-bold text-center outline-none" />
                             </div>
                          </div>
                       </div>
                       
                       {/* Result Display */}
                       <div className="bg-emerald-600/20 border border-emerald-500/30 p-6 rounded-3xl space-y-4">
                          {calcProgress ? (
                             <>
                                <div>
                                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Hari Perkiraan Lahir (HPL)</p>
                                   <p className="text-2xl font-black text-white mt-1">{calcProgress.hpl}</p>
                                </div>
                                <div className="flex gap-6">
                                   <div>
                                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Usia Kehamilan</p>
                                      <p className="text-xl font-bold text-white mt-1">{calcProgress.weeks} Minggu</p>
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Trimester</p>
                                      <p className="text-xl font-bold text-white mt-1">{Math.floor((calcProgress.weeks / 40) * 3) + 1}</p>
                                   </div>
                                </div>
                             </>
                          ) : (
                             <div className="text-center py-6 text-emerald-400/50">
                                <Calendar size={32} className="mx-auto mb-2" />
                                <p className="text-xs font-bold uppercase">Input HPHT untuk kalkulasi otomatis</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
                 <Waves size={300} className="absolute -right-20 -bottom-32 text-emerald-900 opacity-20 pointer-events-none" />
              </div>

              {/* FAKTOR RISIKO (CHECKBOXES) */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                 <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShieldAlert size={18} /> V. Skrining Faktor Risiko (Puji Rochjati)
                 </h3>
                 <div className="h-64 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(RISK_FACTORS_MASTER).map(([key, rf]) => (
                       <label key={key} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${tempRiskFactors.includes(key) ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-50 hover:bg-slate-100'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${tempRiskFactors.includes(key) ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>
                             {tempRiskFactors.includes(key) && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <input 
                             type="checkbox" 
                             className="hidden" 
                             checked={tempRiskFactors.includes(key)}
                             onChange={(e) => {
                                if(e.target.checked) setTempRiskFactors([...tempRiskFactors, key]);
                                else setTempRiskFactors(tempRiskFactors.filter(k => k !== key));
                             }}
                          />
                          <div>
                             <p className={`text-xs font-bold leading-tight ${tempRiskFactors.includes(key) ? 'text-red-700' : 'text-slate-600'}`}>{rf.label}</p>
                             <p className="text-[9px] font-black text-slate-400 mt-1 uppercase">Skor: {rf.score}</p>
                          </div>
                       </label>
                    ))}
                 </div>
                 <div className="mt-6 pt-6 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Riwayat Penyakit Lain / Catatan Tambahan</label>
                    <textarea name="medicalHistory" defaultValue={editingPatient?.medicalHistory} placeholder="Contoh: Alergi obat, Asma, Riwayat Operasi..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-200 h-24 resize-none mt-2" />
                 </div>
              </div>

              {/* ACTION BUTTON */}
              <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl hover:bg-black transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-95">
                 <Save size={20} /> Simpan Data Rekam Medis
              </button>

           </div>
         </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden text-slate-900 selection:bg-emerald-200">
      <Sidebar currentView={view} onNavigate={handleNavigate} onLogout={() => setCurrentUser(null)} userRole={currentUser?.role} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <main className={`transition-all duration-700 ${isSidebarOpen && window.innerWidth > 1024 ? 'lg:ml-80' : 'ml-0'}`}>
        <Header title={viewingPatientProfile ? "Profil Medis" : view.replace('-', ' ').toUpperCase()} userName={currentUser?.name || ''} userRole={currentUser?.role} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onSearchChange={setPatientSearch} onLogout={() => setCurrentUser(null)} alerts={state.alerts} onMarkAsRead={() => {}} onNavigateToPatient={handleNavigate} isSyncing={isLoading} />
        
        <div className="p-4 md:p-8 lg:p-12 xl:p-16 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)]">
          {notification && <div className="fixed top-6 md:top-10 left-1/2 -translate-x-1/2 z-[999] px-6 md:px-10 py-4 md:py-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10"><CheckCircle size={20} className="text-emerald-400" /><p className="text-xs font-black uppercase tracking-widest">{notification.message}</p></div>}
          
          {view === 'dashboard' && <DashboardHome />}
          {view === 'broadcast' && <BroadcastModule state={state} />}
          
          {view === 'patients' && currentUser.role !== UserRole.USER && (
            <PatientList users={state.users} visits={state.ancVisits} onEdit={(u) => { setEditingPatient(u); setTempRiskFactors(u.selectedRiskFactors); setView('register'); setFormCoords({lat: String(u.lat || ''), lng: String(u.lng || '')}); }} onAddVisit={(u) => { setIsAddingVisit(u); setVisitPreviewData({ bloodPressure: '120/80', dangerSigns: [], fetalMovement: 'Normal', djj: 140 }); }} onViewProfile={(id) => setViewingPatientProfile(id)} onDeletePatient={(id) => { }} onDeleteVisit={handleDeleteVisit} onToggleVisitStatus={() => {}} onRecordDelivery={(u) => setRecordingDelivery(u)} onStartNewPregnancy={handleStartNewPregnancy} currentUserRole={currentUser.role} searchFilter={patientSearch} />
          )}

           {/* REGISTER VIEW - NOW USING THE NEW RENDER FUNCTION */}
          {view === 'register' && currentUser.role !== UserRole.USER && renderRegistrationForm()}

          {view === 'management' && <AccessManagement state={state} setState={setState} currentUser={currentUser!} addLog={addLog} onExport={()=>{}} onImport={()=>{}} />}
          {view === 'monitoring' && <RiskMonitoring state={state} onViewProfile={(id)=>setViewingPatientProfile(id)} onAddVisit={(u)=>setIsAddingVisit(u)} onToggleVisitStatus={()=>{}} />}
          {view === 'map' && <MapView users={state.users} visits={state.ancVisits} />}
          {view === 'smart-card' && <SmartCardModule state={state} setState={setState} isUser={currentUser?.role === UserRole.USER} user={currentUser!} />}
          {view === 'education' && <EducationModule />}
          {view === 'contact' && <ContactModule />}

          {/* DELIVERY MODAL (NEW) */}
          {recordingDelivery && (
             <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
                   <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                      <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                         <Baby size={28} /> Pencatatan Kelahiran
                      </h3>
                      <button onClick={() => setRecordingDelivery(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><X size={20}/></button>
                   </div>
                   <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      <div className="bg-emerald-50 p-4 rounded-2xl mb-6 border border-emerald-100">
                         <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Pasien Ibu</p>
                         <p className="text-lg font-black text-emerald-900 uppercase">{recordingDelivery.name}</p>
                         <p className="text-[10px] text-emerald-500 mt-1">*Pasien akan otomatis diarsipkan dari Peta & Monitoring Risiko setelah data disimpan.</p>
                      </div>
                      
                      <form onSubmit={handleDeliverySubmit} className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Tanggal Lahir</label>
                               <input type="date" name="deliveryDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Jenis Kelamin</label>
                               <select name="babyGender" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none">
                                  <option value="L">Laki-Laki</option>
                                  <option value="P">Perempuan</option>
                               </select>
                            </div>
                         </div>

                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Nama Bayi</label>
                            <input name="babyName" placeholder="Nama Bayi (Opsional)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Berat (Gram)</label>
                               <input type="number" name="babyWeight" placeholder="3200" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Panjang (CM)</label>
                               <input type="number" name="babyHeight" placeholder="49" required className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" />
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Kondisi Ibu</label>
                               <select name="motherStatus" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none">
                                  <option value="SEHAT">Sehat</option>
                                  <option value="KOMPLIKASI">Komplikasi</option>
                                  <option value="MENINGGAL">Meninggal</option>
                               </select>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Kondisi Bayi</label>
                               <select name="babyStatus" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none">
                                  <option value="HIDUP_SEHAT">Hidup Sehat</option>
                                  <option value="HIDUP_KOMPLIKASI">Hidup Komplikasi</option>
                                  <option value="MENINGGAL">Meninggal (IUFD/Neonatal)</option>
                               </select>
                            </div>
                         </div>

                         <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Catatan Tambahan</label>
                            <textarea name="condition" placeholder="Keterangan persalinan..." className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none h-24 resize-none" />
                         </div>

                         <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-200">
                            Simpan & Arsipkan Pasien
                         </button>
                      </form>
                   </div>
                </div>
             </div>
          )}

          {viewingPatientProfile && (
            <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-start justify-center p-2 md:p-12 overflow-y-auto pt-10 pb-10">
              <div className="w-full max-w-7xl my-auto">
                <PatientProfileView 
                  patient={state.users.find(u => u.id === viewingPatientProfile)!} 
                  visits={state.ancVisits} 
                  onClose={() => setViewingPatientProfile(null)} 
                  onDeleteVisit={handleDeleteVisit}
                  isStaff={currentUser.role !== UserRole.USER} 
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
