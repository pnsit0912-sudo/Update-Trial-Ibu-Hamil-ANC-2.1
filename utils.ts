
export const RISK_FACTORS_MASTER: Record<string, {label: string, score: number, group: 'I' | 'II' | 'III', short: string}> = {
  // --- KELOMPOK I: ADA POTENSI GAWAT OBSTETRI (APGO) ---
  // Skor 4: Faktor risiko dasar yang perlu pemantauan
  'PR_TOO_YOUNG': { label: 'Terlalu Muda, Hamil I ≤ 16 Tahun', score: 4, group: 'I', short: 'Primi Muda' },
  'PR_TOO_OLD': { label: 'Terlalu Tua, Hamil I ≥ 35 Tahun', score: 4, group: 'I', short: 'Primi Tua' },
  'PR_SLOW': { label: 'Terlalu Lambat Hamil I, Kawin ≥ 4 Tahun', score: 4, group: 'I', short: 'Primi Tua Sekunder' },
  'PR_LONG': { label: 'Terlalu Lama Hamil Lagi (≥ 10 Tahun)', score: 4, group: 'I', short: 'Anak Terkecil >10th' },
  'PR_TOO_SOON': { label: 'Terlalu Cepat Hamil Lagi (≤ 2 Tahun)', score: 4, group: 'I', short: 'Anak Terkecil <2th' },
  'PR_MANY_CHILDREN': { label: 'Terlalu Banyak Anak (≥ 4 Anak)', score: 4, group: 'I', short: 'Grande Multi' },
  'PR_TOO_OLD_MULTI': { label: 'Terlalu Tua, Umur ≥ 35 Tahun', score: 4, group: 'I', short: 'Multi Tua' },
  'PR_SHORT': { label: 'Terlalu Pendek (TB ≤ 145 cm)', score: 4, group: 'I', short: 'TB <145cm' },
  'PR_HISTORY_FAIL': { label: 'Pernah Gagal Kehamilan/Keguguran', score: 4, group: 'I', short: 'Riw. Abortus' },
  'PR_CS_HISTORY': { label: 'Pernah Melahirkan Tarikan Tang/Vakum', score: 4, group: 'I', short: 'Riw. Persalinan Sulit' },

  // --- KELOMPOK II: ADA GAWAT OBSTETRI (AGO) ---
  // Skor 4: Risiko medis penyerta
  'AGO_DISEASE': { label: 'Penyakit (Kurang Darah, Malaria, TBC, Payah Jantung, DM, PMS)', score: 4, group: 'II', short: 'Penyakit Ibu' },
  'AGO_PRE_ECLAMPSIA': { label: 'Bengkak pada Muka/Tungkai, Tekanan Darah Tinggi', score: 4, group: 'II', short: 'Preeklamsia Ringan' },
  'AGO_TWINS': { label: 'Hamil Kembar 2 atau Lebih', score: 4, group: 'II', short: 'Gemelli' },
  'AGO_HYDRAMNIOS': { label: 'Hamil Kembar Air (Hidramnion)', score: 4, group: 'II', short: 'Hidramnion' },
  'AGO_DEAD_BABY': { label: 'Bayi Mati dalam Kandungan', score: 4, group: 'II', short: 'IUFD' },
  'AGO_OVERDUE': { label: 'Kehamilan Lebih Bulan (> 42 Minggu)', score: 4, group: 'II', short: 'Post Date' },
  'AGO_BREECH': { label: 'Letak Sungsang', score: 4, group: 'II', short: 'Sungsang' },
  'AGO_TRANSVERSE': { label: 'Letak Lintang', score: 4, group: 'II', short: 'Lintang' },
  // Skor 8: Riwayat Sesar (Risiko Ruptur Uteri) - Diperberat agar kombinasi dengan 1 faktor lain langsung MERAH (14)
  'AGO_HISTORY_CS': { label: 'Riwayat Sesar (SC) Sebelumnya', score: 8, group: 'II', short: 'Riw. SC' },

  // --- KELOMPOK III: ADA GAWAT DARURAT OBSTETRI (AGDO) ---
  // Skor 10: AUTOMATIC KRST (Skor Dasar 2 + 10 = 12 -> Merah)
  'AGDO_BLEEDING': { label: 'Perdarahan Dalam Kehamilan (APB)', score: 10, group: 'III', short: 'Perdarahan' },
  'AGDO_ECLAMPSIA': { label: 'Kejang-Kejang (Eklampsia)', score: 10, group: 'III', short: 'Eklampsia' },
};

export const calculatePregnancyProgress = (hphtString: string) => {
  if (!hphtString) return null;
  const hpht = new Date(hphtString);
  const today = new Date();
  const diffTime = today.getTime() - hpht.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (totalDays < 0) return null;
  const weeks = Math.floor(totalDays / 7);
  const months = Math.floor(totalDays / 30.417);
  const hpl = new Date(hpht);
  hpl.setDate(hpl.getDate() + 280); 

  return {
    weeks,
    months,
    totalDays,
    hpl: hpl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    percentage: Math.min(Math.round((totalDays / 280) * 100), 100)
  };
};

export const getRiskCategory = (scoreFromFactors: number, currentAncData?: any) => {
  // SKOR AWAL IBU HAMIL ADALAH 2
  const baseScore = 2; 
  const total = scoreFromFactors + baseScore;

  // 1. TRIASE HITAM (GAWAT DARURAT KLINIS - LIVE)
  // Ini mendeteksi kondisi tanda vital saat pemeriksaan fisik, terlepas dari skor screening
  if (currentAncData) {
    const bpStr = currentAncData.bloodPressure || "0/0";
    const bpParts = bpStr.split('/');
    const sys = bpParts.length > 0 ? Number(bpParts[0]) : 0;
    const dia = bpParts.length > 1 ? Number(bpParts[1]) : 0;
    
    const djj = Number(currentAncData.djj || 140);
    
    const hasFatalSigns = currentAncData.dangerSigns?.some((s: string) => 
      ['Perdarahan', 'Ketuban Pecah', 'Kejang', 'Pusing Hebat', 'Nyeri Perut Hebat'].includes(s)
    );
    
    // Syok, Eklampsia, Gawat Janin
    if ((sys >= 160 && sys < 500) || (dia >= 110 && dia < 500) || hasFatalSigns || currentAncData.fetalMovement === 'Tidak Ada' || (djj > 0 && (djj < 100 || djj > 180))) {
      return { 
        label: 'HITAM', 
        desc: 'GAWAT DARURAT (Immediate Referral)', 
        color: 'text-white bg-slate-950 border-slate-900', 
        hex: '#020617',
        priority: 0
      };
    }
  }

  // 2. KELOMPOK RISIKO BERDASARKAN SKOR PUJI ROCHJATI
  
  // KRST (KEHAMILAN RISIKO SANGAT TINGGI) - Skor >= 12
  // Otomatis tercapai jika ada Kelompok III (Skor 10 + 2 = 12)
  if (total >= 12) {
    return { 
      label: 'MERAH', 
      desc: 'RISIKO SANGAT TINGGI (KRST)', 
      color: 'text-white bg-red-600 border-red-700', 
      hex: '#dc2626',
      priority: 1
    };
  }
  
  // KRT (KEHAMILAN RISIKO TINGGI) - Skor 6 - 10
  if (total >= 6) {
    return { 
      label: 'KUNING', 
      desc: 'RISIKO TINGGI (KRT)', 
      color: 'text-yellow-900 bg-yellow-400 border-yellow-500', 
      hex: '#facc15',
      priority: 2
    };
  }
  
  // KRR (KEHAMILAN RISIKO RENDAH) - Skor 2
  return { 
    label: 'HIJAU', 
    desc: 'RISIKO RENDAH (KRR)', 
    color: 'text-white bg-emerald-500 border-emerald-600', 
    hex: '#10b981',
    priority: 3
  };
};

export const getBabySizeByWeek = (week: number) => {
  if (week <= 4) return { name: 'Biji Poppy', icon: '🌱' };
  if (week <= 8) return { name: 'Buah Raspberry', icon: '🫐' };
  if (week <= 12) return { name: 'Buah Lemon', icon: '🍋' };
  if (week <= 16) return { name: 'Buah Alpukat', icon: '🥑' };
  if (week <= 20) return { name: 'Buah Pisang', icon: '🍌' };
  if (week <= 24) return { name: 'Buah Jagung', icon: '🌽' };
  if (week <= 28) return { name: 'Buah Terong', icon: '🍆' };
  if (week <= 32) return { name: 'Buah Kelapa', icon: '🥥' };
  if (week <= 36) return { name: 'Buah Melon', icon: '🍈' };
  return { name: 'Semangka Kecil', icon: '🍉' };
};
