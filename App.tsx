
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserRole, User, AppState, ANCVisit, SystemLog, SystemAlert, DeliveryData } from './types';
import { PUSKESMAS_INFO, WILAYAH_DATA, NAVIGATION, MOCK_USERS, MOCK_ANC_VISITS } from './constants';
import { RISK_FACTORS_MASTER, calculatePregnancyProgress, getRiskCategory, getBabySizeByWeek } from './utils';
import { 
  CheckCircle, AlertCircle, Users, Calendar, AlertTriangle,
  UserPlus, Edit3, X, Clock, Baby, Trash2, ShieldCheck, LayoutDashboard, Activity, 
  MapPin, ShieldAlert, QrCode, BookOpen, Map as MapIcon, Phone, Navigation as NavIcon, Crosshair,
  RefreshCw, Stethoscope, Heart, Droplets, Thermometer, ClipboardCheck, ArrowRight, ExternalLink,
  Info, Bell, Eye, Star, TrendingUp, CheckSquare, Zap, Shield, List, Sparkles, BrainCircuit, Waves, Utensils, Download, Upload, Database, UserX, Save, PartyPopper, RefreshCcw, Scale, Ruler, CalendarDays, Siren, FileText, Loader2, Calculator, MessageSquare,
  Trophy, Dumbbell, Medal, Timer, Smile, CalendarX, ClipboardList, ChevronRight
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
  { id: 'vit', task: 'Minum Tablet Tambah Darah', time: 'Malam Hari', icon: <Droplets size={18} /> },
  { id: 'move', task: 'Hitung 10 Gerakan Janin', time: 'Setiap Hari', icon: <Activity size={18} /> },
  { id: 'food', task: 'Makan Protein (Telur/Ikan)', time: 'Siang Hari', icon: <Utensils size={18} /> },
  { id: 'sport', task: 'Senam Hamil Ringan (15 mnt)', time: 'Pagi Hari', icon: <Dumbbell size={18} /> }
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

  // Local state for interactive dashboard (checkboxes)
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

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

  // --- DASHBOARD COMPONENTS ---

  const AdminNakesDashboard = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Logic Kalkulasi Data
    const activePatients = state.users.filter(u => u.role === UserRole.USER && !u.isDelivered);
    const highRiskPatients = activePatients.filter(u => u.totalRiskScore >= 12 || (u.selectedRiskFactors && u.selectedRiskFactors.some(rf => ['AGDO_BLEEDING', 'AGDO_ECLAMPSIA'].includes(rf))));
    
    // Logic Pasien Mangkir (Missed Visits)
    const missedPatients = activePatients.filter(u => {
       const pVisits = state.ancVisits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
       const latest = pVisits[0];
       return latest && latest.nextVisitDate < today;
    });

    // Logic Jadwal Hari Ini & Besok
    const upcomingVisits = activePatients.filter(u => {
       const pVisits = state.ancVisits.filter(v => v.patientId === u.id).sort((a,b) => b.visitDate.localeCompare(a.visitDate));
       const latest = pVisits[0];
       return latest && latest.nextVisitDate >= today; // Tampilkan semua yang dijadwalkan hari ini atau ke depan
    }).sort((a,b) => {
       const visitA = state.ancVisits.find(v => v.patientId === a.id)?.nextVisitDate || '';
       const visitB = state.ancVisits.find(v => v.patientId === b.id)?.nextVisitDate || '';
       return visitA.localeCompare(visitB);
    }).slice(0, 5);

    return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
         {/* HEADER COMMAND CENTER */}
         <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-emerald-500 rounded-lg animate-pulse"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Monitoring System</p>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Pusat Pemantauan Klinis</h2>
                <p className="text-slate-400 mt-2 text-sm font-bold">Halo, {currentUser?.name}. Berikut adalah status kesehatan ibu hamil terkini.</p>
            </div>
            
            <div className="relative z-10 flex gap-4">
               <button onClick={() => handleNavigate('patients')} className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <UserPlus size={16}/> Registrasi Pasien
               </button>
               <button onClick={() => handleNavigate('map')} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                  <MapIcon size={16}/> Peta Sebaran
               </button>
            </div>
            <Stethoscope size={300} className="absolute -right-20 -bottom-32 text-white opacity-5 rotate-12" />
         </div>

         {/* RINGKASAN STATUS KLINIS */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-indigo-100 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><Users size={20}/></div>
                  <span className="text-[10px] font-black uppercase bg-slate-50 px-2 py-1 rounded text-slate-400">Total</span>
               </div>
               <p className="text-3xl font-black text-slate-900">{activePatients.length}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Ibu Hamil Aktif</p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-red-100 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all"><ShieldAlert size={20}/></div>
                  <span className="text-[10px] font-black uppercase bg-slate-50 px-2 py-1 rounded text-slate-400">Prioritas</span>
               </div>
               <p className="text-3xl font-black text-slate-900">{highRiskPatients.length}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Risiko Tinggi (KRST)</p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-yellow-100 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl group-hover:bg-yellow-500 group-hover:text-white transition-all"><CalendarX size={20}/></div>
                  <span className="text-[10px] font-black uppercase bg-slate-50 px-2 py-1 rounded text-slate-400">Action</span>
               </div>
               <p className="text-3xl font-black text-slate-900">{missedPatients.length}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Lewat Jadwal Kontrol</p>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:border-emerald-100 transition-all">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><Baby size={20}/></div>
                  <span className="text-[10px] font-black uppercase bg-slate-50 px-2 py-1 rounded text-slate-400">Arsip</span>
               </div>
               <p className="text-3xl font-black text-slate-900">{state.users.filter(u => u.isDelivered).length}</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Sudah Bersalin</p>
            </div>
         </div>

         {/* SPLIT VIEW: PRIORITAS & JADWAL */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* PANEL KIRI: PRIORITAS PENANGANAN (KRST) */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                     <AlertCircle className="text-red-500" size={24} /> Watchlist Risiko Tinggi
                  </h3>
                  <button onClick={() => handleNavigate('monitoring')} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                     Lihat Semua <ChevronRight size={12}/>
                  </button>
               </div>

               <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {highRiskPatients.length === 0 ? (
                     <div className="text-center py-10 opacity-50">
                        <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4"/>
                        <p className="text-xs font-bold uppercase">Tidak ada pasien risiko tinggi aktif</p>
                     </div>
                  ) : (
                     highRiskPatients.slice(0, 5).map(p => (
                        <div key={p.id} className="p-5 rounded-[2rem] bg-red-50 border border-red-100 flex items-center justify-between group hover:shadow-md transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-white text-red-600 font-black flex items-center justify-center border border-red-100 shadow-sm">
                                 {p.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase">{p.name}</p>
                                 <p className="text-[10px] font-bold text-red-500 uppercase mt-0.5">
                                    Skor: {p.totalRiskScore + 2} • {p.kelurahan}
                                 </p>
                              </div>
                           </div>
                           <button onClick={() => setViewingPatientProfile(p.id)} className="p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm">
                              <ClipboardList size={18} />
                           </button>
                        </div>
                     ))
                  )}
               </div>
            </div>

            {/* PANEL KANAN: JADWAL KUNJUNGAN & MANGKIR */}
            <div className="space-y-8">
               {/* MANGKIR ALERT */}
               {missedPatients.length > 0 && (
                  <div className="bg-amber-50 p-8 rounded-[3rem] border border-amber-100 relative overflow-hidden">
                     <div className="relative z-10">
                        <h3 className="text-lg font-black text-amber-800 uppercase tracking-tighter flex items-center gap-3 mb-4">
                           <CalendarX size={24} /> {missedPatients.length} Pasien Mangkir
                        </h3>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                           {missedPatients.map(p => (
                              <div key={p.id} className="flex justify-between items-center bg-white/60 p-3 rounded-xl">
                                 <span className="text-xs font-bold text-amber-900 uppercase">{p.name}</span>
                                 <button onClick={() => window.open(`https://wa.me/${p.phone.replace(/\D/g,'').replace(/^0/,'62')}`, '_blank')} className="text-[9px] font-black bg-amber-500 text-white px-3 py-1 rounded-lg uppercase hover:bg-amber-600">
                                    Hubungi
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                     <AlertTriangle size={150} className="absolute -right-10 -bottom-10 text-amber-200 opacity-50 rotate-12 pointer-events-none"/>
                  </div>
               )}

               {/* AGENDA KUNJUNGAN */}
               <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex-1">
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 mb-6">
                     <Calendar size={24} className="text-indigo-600" /> Agenda Kunjungan
                  </h3>
                  <div className="space-y-4">
                     {upcomingVisits.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold uppercase text-center py-4">Belum ada jadwal kunjungan dekat</p>
                     ) : (
                        upcomingVisits.map(p => {
                           const visitDate = state.ancVisits.find(v => v.patientId === p.id)?.nextVisitDate;
                           const isToday = visitDate === today;
                           return (
                              <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                 <div className={`w-2 h-12 rounded-full ${isToday ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                 <div className="flex-1">
                                    <p className="text-xs font-black text-slate-900 uppercase">{p.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                       Jadwal: {visitDate === today ? 'HARI INI' : new Date(visitDate!).toLocaleDateString('id-ID')}
                                    </p>
                                 </div>
                                 {isToday && <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[8px] font-black uppercase">Hari Ini</span>}
                              </div>
                           );
                        })
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  const PatientDashboard = () => {
    const pregnancy = calculatePregnancyProgress(currentUser?.hpht || '');
    const babySize = pregnancy ? getBabySizeByWeek(pregnancy.weeks) : { name: 'Belum Terdeteksi', icon: '❓' };
    
    // Achievement System Logic
    const level = pregnancy ? (pregnancy.weeks < 13 ? 1 : pregnancy.weeks < 27 ? 2 : 3) : 1;
    const levelName = ['Bunda Pemula', 'Bunda Pejuang', 'Super Mom'][level - 1];
    
    // Task handling
    const toggleTask = (taskId: string) => {
      if (completedTasks.includes(taskId)) {
        setCompletedTasks(completedTasks.filter(t => t !== taskId));
      } else {
        setCompletedTasks([...completedTasks, taskId]);
        showNotification("Tugas Selesai! Pertahankan semangat Bunda!");
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
         {/* HERO HEADER */}
         <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                     Level {level}: {levelName}
                  </span>
               </div>
               <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">Halo, {currentUser?.name.split(' ')[0]}</h2>
               <p className="text-emerald-100 font-bold text-sm opacity-90">Semoga Bunda dan si Kecil sehat selalu hari ini.</p>
            </div>
            <Sparkles size={200} className="absolute -right-10 -bottom-20 text-white opacity-10 animate-pulse" />
         </div>

         {/* MAIN INTERACTIVE GRID */}
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* MODULE 1: FETAL DEVELOPMENT */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all">
               <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                       <Baby size={24} className="text-emerald-500"/> Perkembangan Janin
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Minggu ke-{pregnancy?.weeks || 0}</p>
                  </div>
               </div>
               
               <div className="mt-8 flex items-center gap-8 relative z-10">
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-6xl shadow-inner animate-bounce">
                     {babySize.icon}
                  </div>
                  <div>
                     <p className="text-sm font-bold text-slate-400 uppercase">Ukuran Sebesar</p>
                     <p className="text-2xl md:text-3xl font-black text-slate-800 uppercase leading-none mt-1">{babySize.name}</p>
                  </div>
               </div>
               
               <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium">
                  "{getTrimesterAdvice(pregnancy?.weeks || 0)}"
               </div>
            </div>

            {/* MODULE 2: HPL COUNTDOWN */}
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                  <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 mb-6">
                     <Timer size={24} className="text-emerald-400"/> Menuju HPL
                  </h3>
                  
                  <div className="flex items-end gap-2 mb-2">
                     <span className="text-5xl md:text-6xl font-black tracking-tighter">{pregnancy?.hpl ? Math.max(0, 280 - (pregnancy?.totalDays || 0)) : '-'}</span>
                     <span className="text-lg font-bold text-slate-400 mb-2">Hari Lagi</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Estimasi: {pregnancy?.hpl || 'Belum ada data'}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-8">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        <span>Mulai</span>
                        <span>{pregnancy?.percentage || 0}%</span>
                        <span>Lahir</span>
                     </div>
                     <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${pregnancy?.percentage || 0}%` }}></div>
                     </div>
                  </div>
               </div>
               <CalendarDays size={200} className="absolute -right-20 -top-20 text-white opacity-5 rotate-12" />
            </div>

            {/* MODULE 3: DAILY EXERCISE */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 xl:col-span-2">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                     <Dumbbell size={24} className="text-indigo-500"/> Misi Harian Bunda
                  </h3>
                  <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                     {completedTasks.length}/{DAILY_TASKS.length} Selesai
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DAILY_TASKS.map(task => {
                     const isDone = completedTasks.includes(task.id);
                     return (
                        <div 
                           key={task.id}
                           onClick={() => toggleTask(task.id)}
                           className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-95 ${
                              isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg'
                           }`}
                        >
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${isDone ? 'bg-white/20' : 'bg-slate-50 text-slate-400'}`}>
                              {isDone ? <CheckCircle size={20} /> : task.icon}
                           </div>
                           <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isDone ? 'text-emerald-100' : 'text-slate-400'}`}>{task.time}</p>
                           <p className={`font-bold leading-tight ${isDone ? 'text-white' : 'text-slate-700'}`}>{task.task}</p>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* MODULE 4: ACHIEVEMENTS */}
            <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 xl:col-span-2 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-6">
                  <div className="bg-white p-4 rounded-[2rem] text-yellow-500 shadow-xl shadow-indigo-100">
                     <Trophy size={40} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Pencapaian Bunda</h3>
                     <p className="text-xs font-bold text-slate-500 mt-1">Terus jaga kesehatan untuk membuka lencana baru!</p>
                  </div>
               </div>
               
               <div className="flex gap-4">
                  {[1, 2, 3].map(lvl => (
                     <div key={lvl} className={`flex flex-col items-center gap-2 ${lvl <= level ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 border-white ${lvl <= level ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-slate-200'}`}>
                           <Medal size={28} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tri {lvl}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    );
  };

  const DashboardHome = () => {
    return currentUser?.role === UserRole.USER ? <PatientDashboard /> : <AdminNakesDashboard />;
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
