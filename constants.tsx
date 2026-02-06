
import React from 'react';
import { UserRole, User, EducationContent, ANCVisit } from './types';
import { LayoutDashboard, Users, UserPlus, BookOpen, MapPin, QrCode, Phone, ShieldCheck, Map as MapIcon, MessageSquare } from 'lucide-react';

export const PUSKESMAS_INFO = {
  name: "Puskesmas Pasar Minggu",
  address: "Jl. Kebagusan Raya No.4, RT.4/RW.4 12520 Jakarta Jakarta",
  phone: "+6289521868087",
  email: "kontak@puskesmas-pasarminggu.go.id",
  lat: -6.2996,
  lng: 106.8315
};

export const WILAYAH_DATA = {
  "Pasar Minggu": [
    "Pejaten Barat",
    "Pejaten Timur",
    "Pasar Minggu",
    "Kebagusan",
    "Jati Padang",
    "Ragunan",
    "Cilandak Timur"
  ]
};

export const NAVIGATION = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES, UserRole.USER], path: 'dashboard' },
  { name: 'Data Pasien', icon: <Users size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES], path: 'patients' },
  { name: 'Monitoring Resiko', icon: <MapPin size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES], path: 'monitoring' },
  { name: 'Pemetaan Lokasi', icon: <MapIcon size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES], path: 'map' },
  { name: 'Pesan Siaran (WA)', icon: <MessageSquare size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES], path: 'broadcast' },
  { name: 'Pendaftaran ANC', icon: <UserPlus size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES], path: 'register' },
  { name: 'Manajemen Akses', icon: <ShieldCheck size={20} />, roles: [UserRole.ADMIN], path: 'management' },
  { name: 'Kartu ANC Pintar', icon: <QrCode size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES, UserRole.USER], path: 'smart-card' },
  { name: 'Edukasi Ibu', icon: <BookOpen size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES, UserRole.USER], path: 'education' },
  { name: 'Kontak Kami', icon: <Phone size={20} />, roles: [UserRole.ADMIN, UserRole.NAKES, UserRole.USER], path: 'contact' },
];

export const MOCK_USERS: User[] = [
  // --- ADMIN & NAKES ---
  {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    name: 'Drg Ma`Mun (Admin)',
    dob: '1980-01-01',
    address: 'Kantor Puskesmas Pasar Minggu',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Pasar Minggu',
    hpht: '',
    pregnancyMonth: 0,
    pregnancyNumber: 0,
    parityP: 0,
    parityA: 0,
    medicalHistory: 'SYSTEM_ADMIN',
    role: UserRole.ADMIN,
    phone: '0812000000',
    isActive: true,
    selectedRiskFactors: [],
    totalRiskScore: 0
  },
  {
    id: 'bidan',
    username: 'bidan',
    password: 'bidan123',
    name: 'Bidan Siti, S.Tr.Keb',
    dob: '1985-03-10',
    address: 'Puskesmas Pasar Minggu',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Pasar Minggu',
    hpht: '',
    pregnancyMonth: 0,
    pregnancyNumber: 0,
    parityP: 0,
    parityA: 0,
    medicalHistory: 'SYSTEM_NAKES',
    role: UserRole.NAKES,
    phone: '0813000000',
    isActive: true,
    selectedRiskFactors: [],
    totalRiskScore: 0
  },

  // --- KASUS 1: NORMAL (HIJAU) ---
  {
    id: 'ANC-2025-1001',
    username: 'siti',
    password: '123',
    name: 'Ny. Siti Aminah',
    nik: '3174000000000001',
    husbandName: 'Tn. Budi',
    dob: '1998-05-12',
    address: 'Jl. Pejaten Raya No. 45',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Pejaten Barat',
    lat: -6.2850,
    lng: 106.8250,
    height: 155,
    lila: 25,
    hpht: new Date(new Date().setDate(new Date().getDate() - 120)).toISOString().split('T')[0], // Hamil 4 bulan
    pregnancyMonth: 4,
    pregnancyNumber: 1,
    parityP: 0,
    parityA: 0,
    medicalHistory: 'Tidak ada riwayat penyakit',
    role: UserRole.USER,
    phone: '081299887711',
    isActive: true,
    isDelivered: false,
    selectedRiskFactors: [],
    totalRiskScore: 2 // Skor Dasar
  },

  // --- KASUS 2: RISIKO TINGGI (KUNING) - PARITAS BANYAK ---
  {
    id: 'ANC-2025-1002',
    username: 'linda',
    password: '123',
    name: 'Ny. Linda Kusuma',
    nik: '3174000000000002',
    husbandName: 'Tn. Joko',
    dob: '1988-10-20',
    address: 'Kavling Polri Blok D, Ragunan',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Ragunan',
    lat: -6.3120,
    lng: 106.8210,
    height: 158,
    lila: 24,
    hpht: new Date(new Date().setDate(new Date().getDate() - 200)).toISOString().split('T')[0],
    pregnancyMonth: 7,
    pregnancyNumber: 5, // Grande Multi
    parityP: 4,
    parityA: 0,
    medicalHistory: 'Riwayat persalinan normal lancar',
    role: UserRole.USER,
    phone: '081299887722',
    isActive: true,
    isDelivered: false,
    selectedRiskFactors: ['PR_MANY_CHILDREN'],
    totalRiskScore: 6 // 2 + 4
  },

  // --- KASUS 3: RISIKO SANGAT TINGGI (MERAH) - RIWAYAT SESAR & PENYAKIT ---
  {
    id: 'ANC-2025-1003',
    username: 'dewi',
    password: '123',
    name: 'Ny. Dewi Rahayu',
    nik: '3174000000000003',
    husbandName: 'Tn. Asep',
    dob: '1990-02-14',
    address: 'Jl. Kebagusan Dalam IV',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Kebagusan',
    lat: -6.3050,
    lng: 106.8350,
    height: 150,
    lila: 28,
    hpht: new Date(new Date().setDate(new Date().getDate() - 240)).toISOString().split('T')[0],
    pregnancyMonth: 8,
    pregnancyNumber: 3,
    parityP: 2,
    parityA: 0,
    medicalHistory: 'Diabetes Melitus & Riwayat SC',
    role: UserRole.USER,
    phone: '081299887733',
    isActive: true,
    isDelivered: false,
    selectedRiskFactors: ['AGO_DISEASE', 'AGO_HISTORY_CS'],
    totalRiskScore: 14 // 2 + 4 + 8
  },

  // --- KASUS 4: GAWAT DARURAT (HITAM) - PRE-EKLAMPSIA BERAT ---
  {
    id: 'ANC-2025-1004',
    username: 'fitri',
    password: '123',
    name: 'Ny. Fitri Handayani',
    nik: '3174000000000004',
    husbandName: 'Tn. Rian',
    dob: '1995-07-30',
    address: 'Gg. Seratus, Jati Padang',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Jati Padang',
    lat: -6.2920,
    lng: 106.8380,
    height: 160,
    lila: 26,
    hpht: new Date(new Date().setDate(new Date().getDate() - 250)).toISOString().split('T')[0],
    pregnancyMonth: 8,
    pregnancyNumber: 1,
    parityP: 0,
    parityA: 0,
    medicalHistory: 'Hipertensi Kronis',
    role: UserRole.USER,
    phone: '081299887744',
    isActive: true,
    isDelivered: false,
    selectedRiskFactors: ['AGO_PRE_ECLAMPSIA', 'AGDO_ECLAMPSIA'],
    totalRiskScore: 16 // 2 + 4 + 10
  },

  // --- KASUS 5: SUDAH BERSALIN (NORMAL) - HARUSNYA HILANG DARI PETA ---
  {
    id: 'ANC-2025-1005',
    username: 'andini',
    password: '123',
    name: 'Ny. Andini Putri',
    nik: '3174000000000005',
    husbandName: 'Tn. Dimas',
    dob: '1999-01-25',
    address: 'Jl. Ampera Raya No. 12',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Cilandak Timur',
    lat: -6.2980,
    lng: 106.8150,
    height: 156,
    lila: 24,
    hpht: new Date(new Date().setDate(new Date().getDate() - 300)).toISOString().split('T')[0],
    pregnancyMonth: 9,
    pregnancyNumber: 1,
    parityP: 1,
    parityA: 0,
    medicalHistory: 'Sehat',
    role: UserRole.USER,
    phone: '081299887755',
    isActive: true,
    isDelivered: true, // STATUS SUDAH BERSALIN
    deliveryData: {
      id: 'del-001',
      deliveryDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
      babyName: 'By. Andini',
      babyGender: 'L',
      babyWeight: 3200,
      babyHeight: 49,
      motherStatus: 'SEHAT',
      babyStatus: 'HIDUP_SEHAT',
      classification: 'NORMAL',
      condition: 'Partus Spontan, Ibu dan Bayi Sehat'
    },
    pregnancyHistory: [
       {
        id: 'del-001',
        deliveryDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
        babyName: 'By. Andini',
        babyGender: 'L',
        babyWeight: 3200,
        babyHeight: 49,
        motherStatus: 'SEHAT',
        babyStatus: 'HIDUP_SEHAT',
        classification: 'NORMAL',
        condition: 'Partus Spontan, Ibu dan Bayi Sehat'
       }
    ],
    selectedRiskFactors: [],
    totalRiskScore: 2
  },

  // --- KASUS 6: PASIEN MANGKIR (KUNING) ---
  {
    id: 'ANC-2025-1006',
    username: 'rahma',
    password: '123',
    name: 'Ny. Rahmawati',
    nik: '3174000000000006',
    husbandName: 'Tn. Eko',
    dob: '1992-04-18',
    address: 'Jl. Jati Padang Baru No. 8',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Jati Padang',
    lat: -6.2910,
    lng: 106.8340,
    height: 152,
    lila: 23, // KEK Ringan
    hpht: new Date(new Date().setDate(new Date().getDate() - 150)).toISOString().split('T')[0],
    pregnancyMonth: 5,
    pregnancyNumber: 3,
    parityP: 2,
    parityA: 0,
    medicalHistory: 'Anemia',
    role: UserRole.USER,
    phone: '081299887766',
    isActive: true,
    isDelivered: false,
    selectedRiskFactors: ['PR_TOO_SOON'],
    totalRiskScore: 6
  },

  // --- KASUS 7: SUDAH BERSALIN (BBLR) ---
  {
    id: 'ANC-2025-1007',
    username: 'sari',
    password: '123',
    name: 'Ny. Sari Indah',
    nik: '3174000000000007',
    husbandName: 'Tn. Yudi',
    dob: '1987-12-05',
    address: 'Pejaten Timur Gg. Damai',
    kecamatan: 'Pasar Minggu',
    kelurahan: 'Pejaten Timur',
    lat: -6.2890,
    lng: 106.8450,
    height: 160,
    lila: 22, // KEK
    hpht: new Date(new Date().setDate(new Date().getDate() - 290)).toISOString().split('T')[0],
    pregnancyMonth: 9,
    pregnancyNumber: 4,
    parityP: 4,
    parityA: 0,
    medicalHistory: 'Anemia sedang',
    role: UserRole.USER,
    phone: '081299887777',
    isActive: true,
    isDelivered: true,
    deliveryData: {
      id: 'del-002',
      deliveryDate: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0],
      babyName: 'By. Sari',
      babyGender: 'P',
      babyWeight: 2100, // BBLR
      babyHeight: 45,
      motherStatus: 'SEHAT',
      babyStatus: 'HIDUP_KOMPLIKASI',
      classification: 'BBLR',
      condition: 'Bayi BBLR, Perawatan Inkubator 3 Hari'
    },
    pregnancyHistory: [
        {
          id: 'del-002',
          deliveryDate: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0],
          babyName: 'By. Sari',
          babyGender: 'P',
          babyWeight: 2100, // BBLR
          babyHeight: 45,
          motherStatus: 'SEHAT',
          babyStatus: 'HIDUP_KOMPLIKASI',
          classification: 'BBLR',
          condition: 'Bayi BBLR, Perawatan Inkubator 3 Hari'
        }
    ],
    selectedRiskFactors: ['PR_TOO_OLD_MULTI', 'AGO_DISEASE'],
    totalRiskScore: 10
  }
];

export const MOCK_ANC_VISITS: ANCVisit[] = [
  // Siti (Normal)
  {
    id: 'v-siti-1',
    patientId: 'ANC-2025-1001',
    visitDate: new Date().toISOString().split('T')[0],
    scheduledDate: new Date().toISOString().split('T')[0],
    nextVisitDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    weight: 55.0,
    bloodPressure: '110/70',
    tfu: 14,
    djj: 140,
    hb: 12.5,
    complaints: 'Mual berkurang',
    dangerSigns: [],
    edema: false,
    fetalMovement: 'Normal',
    followUp: 'ANC_RUTIN',
    nakesNotes: 'Kondisi ibu janin baik.',
    nakesId: 'bidan',
    status: 'COMPLETED'
  },
  
  // Linda (Kuning)
  {
    id: 'v-linda-1',
    patientId: 'ANC-2025-1002',
    visitDate: new Date().toISOString().split('T')[0],
    scheduledDate: new Date().toISOString().split('T')[0],
    nextVisitDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
    weight: 62.0,
    bloodPressure: '120/80',
    tfu: 24,
    djj: 142,
    hb: 11.2,
    complaints: 'Nyeri punggung',
    dangerSigns: [],
    edema: false,
    fetalMovement: 'Normal',
    followUp: 'ANC_RUTIN',
    nakesNotes: 'Edukasi istirahat, waspada tanda persalinan dini.',
    nakesId: 'bidan',
    status: 'COMPLETED'
  },

  // Dewi (Merah - Diabetes)
  {
    id: 'v-dewi-1',
    patientId: 'ANC-2025-1003',
    visitDate: new Date().toISOString().split('T')[0],
    scheduledDate: new Date().toISOString().split('T')[0],
    nextVisitDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    weight: 75.5,
    bloodPressure: '135/85',
    tfu: 28,
    djj: 148,
    hb: 10.8,
    complaints: 'Cepat lelah, sering haus',
    dangerSigns: [],
    edema: true,
    fetalMovement: 'Normal',
    followUp: 'KONSUL_DOKTER',
    nakesNotes: 'Gula darah puasa agak tinggi. Rujuk konsultasi SpOG.',
    nakesId: 'bidan',
    status: 'COMPLETED'
  },

  // Fitri (Hitam - Gawat Darurat)
  {
    id: 'v-fitri-1',
    patientId: 'ANC-2025-1004',
    visitDate: new Date().toISOString().split('T')[0],
    scheduledDate: new Date().toISOString().split('T')[0],
    nextVisitDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0],
    weight: 65.0,
    bloodPressure: '170/110', // TENSI TINGGI UNTUK TRIASE HITAM
    tfu: 30,
    djj: 110, // GAWAT JANIN
    hb: 9.5,
    complaints: 'Pusing hebat, pandangan kabur, nyeri ulu hati',
    dangerSigns: ['Pusing Hebat', 'Nyeri Perut Hebat'],
    edema: true,
    fetalMovement: 'Kurang Aktif',
    followUp: 'RUJUK_RS',
    nakesNotes: 'GAWAT DARURAT! Pre-eklampsia Berat (PEB). Segera rujuk RSUD.',
    nakesId: 'bidan',
    status: 'COMPLETED'
  },

  // Rahma (Mangkir - Tanggal Kunjungan Berikutnya Lampau)
  {
    id: 'v-rahma-1',
    patientId: 'ANC-2025-1006',
    visitDate: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString().split('T')[0], // 45 hari lalu
    scheduledDate: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString().split('T')[0],
    nextVisitDate: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], // Harusnya kontrol 15 hari lalu
    weight: 60.0,
    bloodPressure: '110/70',
    tfu: 20,
    djj: 144,
    hb: 11.0,
    complaints: 'Tidak ada',
    dangerSigns: [],
    edema: false,
    fetalMovement: 'Normal',
    followUp: 'ANC_RUTIN',
    nakesNotes: 'Pasien tidak datang sesuai jadwal.',
    nakesId: 'bidan',
    status: 'COMPLETED'
  }
];

export const EDUCATION_LIST: EducationContent[] = [
  {
    id: 'e1',
    title: 'Gizi Seimbang Ibu Hamil (Kemenkes)',
    type: 'TEXT',
    category: 'Gizi',
    content: 'Pentingnya asupan protein, zat besi, dan asam folat selama masa kehamilan untuk mencegah anemia dan stunting.',
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    url: 'https://ayosehat.kemkes.go.id/pentingnya-pemenuhan-gizi-seimbang-bagi-ibu-hamil'
  },
  {
    id: 'e2',
    title: 'Tanda Bahaya Kehamilan (Video)',
    type: 'VIDEO',
    category: 'Emergensi',
    content: 'Visualisasi gejala kritis seperti perdarahan, pusing hebat, dan bengkak pada kaki yang perlu segera ditangani.',
    thumbnail: 'https://images.unsplash.com/photo-1505751172107-597d5a4d73dd?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.youtube.com/watch?v=kYI0W7U2H_Y'
  },
  {
    id: 'e3',
    title: 'Tips Persalinan Aman & Nyaman',
    type: 'TEXT',
    category: 'Persiapan',
    content: 'Persiapan fisik dan mental menjelang persalinan, termasuk teknik pernapasan dan perlengkapan tas rumah sakit.',
    thumbnail: 'https://images.unsplash.com/photo-1519494080410-f9aa76cb4283?auto=format&fit=crop&w=800&q=80',
    url: 'https://promkes.kemkes.go.id/6-persiapan-persalinan-yang-harus-diketahui-ibu-hamil'
  },
  {
    id: 'e4',
    title: 'Pentingnya Tablet Tambah Darah',
    type: 'TEXT',
    category: 'Gizi',
    content: 'Alasan mengapa ibu hamil wajib mengonsumsi TTD minimal 90 tablet selama masa kehamilan.',
    thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    url: 'https://sehatnegeriku.kemkes.go.id/baca/rilis-media/20230125/4742278/cegah-stunting-sejak-hamil-dengan-konsumsi-tablet-tambah-darah/'
  }
];
