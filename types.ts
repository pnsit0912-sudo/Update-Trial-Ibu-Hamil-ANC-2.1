
export enum UserRole {
  ADMIN = 'ADMIN',
  NAKES = 'NAKES',
  USER = 'USER'
}

export type RiskFactor = {
  id: string;
  label: string;
  score: number;
  category: 'MEDIS' | 'OBSTETRI' | 'SOSIAL';
};

export interface DeliveryData {
  id: string;
  deliveryDate: string;
  babyName?: string;
  babyGender: 'L' | 'P';
  babyWeight: number; // dalam gram
  babyHeight: number; // dalam cm
  motherStatus: 'SEHAT' | 'KOMPLIKASI' | 'MENINGGAL';
  babyStatus: 'HIDUP_SEHAT' | 'HIDUP_KOMPLIKASI' | 'MENINGGAL';
  classification: 'NORMAL' | 'BBLR' | 'BBLSR';
  condition: string;
}

export interface User {
  id: string;
  username?: string;
  password?: string;
  name: string;
  dob: string;
  address: string;
  kecamatan: string;
  kelurahan: string;
  lat?: number;
  lng?: number;
  hpht: string;
  pregnancyMonth: number; 
  pregnancyNumber: number; // Gravida (G)
  parityP: number; // Para (P)
  parityA: number; // Abortus (A)
  medicalHistory: string;
  selectedRiskFactors: string[];
  totalRiskScore: number;
  role: UserRole;
  phone: string;
  isActive: boolean;
  isDelivered?: boolean;
  deliveryData?: DeliveryData;
  pregnancyHistory?: DeliveryData[]; // Riwayat persalinan sebelumnya
}

export interface ANCVisit {
  id: string;
  patientId: string;
  visitDate: string;
  scheduledDate: string;
  nextVisitDate: string;
  weight: number;
  bloodPressure: string;
  tfu: number;
  djj: number;
  hb: number;
  complaints: string;
  dangerSigns: string[];
  edema: boolean;
  fetalMovement: string;
  followUp: string;
  nakesNotes: string;
  nakesId: string;
  status: 'COMPLETED' | 'MISSED' | 'SCHEDULED';
}

export interface SystemAlert {
  id: string;
  type: 'EMERGENCY' | 'MISSED';
  patientId: string;
  patientName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  ancVisits: ANCVisit[];
  alerts: SystemAlert[];
  selectedPatientId: string | null;
  logs: SystemLog[];
  userChecklists: Record<string, Record<string, boolean>>;
  // Added currentView to support persistence and state management in App.tsx
  currentView: string;
}

export interface EducationContent {
  id: string;
  title: string;
  type: 'TEXT' | 'VIDEO' | 'IMAGE';
  category: string;
  content: string;
  thumbnail: string;
  url: string;
}
