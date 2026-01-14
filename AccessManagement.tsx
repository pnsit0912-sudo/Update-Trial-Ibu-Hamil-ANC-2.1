
import React, { useState, useMemo } from 'react';
// Added RefreshCw to imports to fix the "Cannot find name 'RefreshCw'" error
import { ShieldCheck, UserCheck, UserX, ClipboardList, ShieldAlert, UserPlus, Edit3, Key, Eye, EyeOff, Search, Users, Stethoscope, UserCircle, Trash2, X, Save, Download, Upload, CloudSync, RefreshCw } from 'lucide-react';
import { User, AppState, UserRole } from './types';

interface AccessManagementProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  currentUser: User;
  addLog: (action: string, module: string, details: string) => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AccessManagement: React.FC<AccessManagementProps> = ({ state, setState, currentUser, addLog, onExport, onImport }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ADMIN' | 'NAKES' | 'USER'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Proteksi Akses: Hanya Admin yang bisa masuk
  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="p-20 text-center animate-in zoom-in duration-500">
        <div className="bg-red-50 p-20 rounded-[5rem] border-4 border-dashed border-red-200 shadow-2xl shadow-red-100">
          <ShieldAlert size={100} className="mx-auto text-red-500 mb-8 animate-bounce" />
          <h2 className="text-4xl font-black text-red-700 uppercase tracking-tighter">Akses Terlarang!</h2>
          <p className="text-red-600 font-bold mt-4 max-w-md mx-auto leading-relaxed">
            Halaman Manajemen Akses dan Kredensial hanya dapat diakses oleh Akun Administrator Utama.
          </p>
        </div>
      </div>
    );
  }

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleUserActive = (targetUser: User) => {
    if (targetUser.id === currentUser.id) return;
    const newStatus = !targetUser.isActive;
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === targetUser.id ? { ...u, isActive: newStatus } : u)
    }));
    addLog(newStatus ? 'GRANT_ACCESS' : 'REVOKE_ACCESS', 'ACCESS', `Admin mengubah status ${targetUser.name} (${targetUser.role}) menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}`);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus permanen akun ${userName}? Data yang dihapus tidak dapat dikembalikan.`)) {
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== userId)
      }));
      addLog('DELETE_USER', 'ACCESS', `Admin menghapus akun ${userName}`);
    }
  };

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<User> = {
      name: formData.get('name') as string,
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as UserRole,
      phone: formData.get('phone') as string,
      isActive: true
    };

    if (editingUser) {
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === editingUser.id ? { ...u, ...data } : u)
      }));
      addLog('UPDATE_USER', 'ACCESS', `Admin memperbarui data ${editingUser.name}`);
      setEditingUser(null);
    } else {
      const newId = `acc-${Date.now()}`;
      setState(prev => ({
        ...prev,
        users: [...prev.users, {
          ...data,
          id: newId,
          dob: '1990-01-01',
          address: '-',
          kecamatan: 'Pasar Minggu',
          kelurahan: 'Pasar Minggu',
          hpht: '',
          pregnancyMonth: 0,
          pregnancyNumber: 0,
          parityP: 0,
          parityA: 0,
          medicalHistory: 'NEW_ACCOUNT',
          selectedRiskFactors: [],
          totalRiskScore: 0,
        } as User]
      }));
      addLog('CREATE_USER', 'ACCESS', `Admin membuat akun baru: ${data.name} (${data.role})`);
      setIsAddingUser(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return state.users.filter(u => {
      const matchTab = activeTab === 'ALL' || u.role === activeTab;
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.username?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [state.users, activeTab, searchTerm]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Migration Sync Section */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-50 p-5 rounded-3xl text-indigo-600">
            <RefreshCw size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Sinkronisasi Migrasi</h3>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">Pindahkan data antar Google AI Studio & Vercel</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onExport}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Download size={16} /> Ekspor Database
          </button>
          <label className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all flex items-center gap-3 cursor-pointer">
            <Upload size={16} /> Impor Database
            <input type="file" className="hidden" accept=".json" onChange={onImport} />
          </label>
        </div>
      </div>

      <div className="bg-indigo-900 p-12 rounded-[4.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
          <div>
            <h2 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
              <ShieldCheck size={40} className="text-indigo-400" /> Manajemen Akses
            </h2>
            <p className="text-indigo-200 font-bold mt-2 uppercase text-[10px] tracking-widest">Kontrol Penuh Admin, Nakes, dan Pasien</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white/10 p-2 rounded-[2rem] border border-white/10">
              {[
                { id: 'ALL', label: 'Semua', icon: <Users size={14}/> },
                { id: 'ADMIN', label: 'Admin', icon: <ShieldCheck size={14}/> },
                { id: 'NAKES', label: 'Nakes', icon: <Stethoscope size={14}/> },
                { id: 'USER', label: 'Pasien', icon: <UserCircle size={14}/> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-white text-indigo-900 shadow-xl' : 'text-indigo-200 hover:bg-white/5'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsAddingUser(true)}
              className="px-8 py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-indigo-400 transition-all shadow-xl"
            >
              <UserPlus size={18} /> Tambah Akun Baru
            </button>
          </div>
        </div>
        <ShieldCheck size={300} className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none" />
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between gap-6 bg-gray-50/30">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="Cari Nama atau Username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[1.5rem] font-bold outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 border-b tracking-widest">
              <tr>
                <th className="px-10 py-6">Nama Pengguna</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6">ID Login</th>
                <th className="px-10 py-6">Kata Sandi</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-indigo-50/10 transition-colors group">
                  <td className="px-10 py-7">
                    <p className="font-black text-gray-900 text-sm leading-none mb-1">{u.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{u.phone}</p>
                  </td>
                  <td className="px-10 py-7">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      u.role === UserRole.ADMIN ? 'bg-slate-900 text-white' : 
                      u.role === UserRole.NAKES ? 'bg-indigo-600 text-white' : 
                      'bg-emerald-500 text-white'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
                      <code className="text-xs font-black text-indigo-600">{u.username || 'N/A'}</code>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
                      <code className="text-xs font-black text-gray-600 tracking-widest">
                        {showPasswords[u.id] ? u.password : '••••••••'}
                      </code>
                      <button onClick={() => togglePassword(u.id)} className="text-gray-300 hover:text-indigo-600 transition-colors">
                        {showPasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <button 
                      onClick={() => toggleUserActive(u)}
                      disabled={u.id === currentUser.id}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${
                        u.id === currentUser.id ? 'opacity-20 cursor-not-allowed' :
                        u.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      {u.isActive ? <><UserCheck size={14}/> Aktif</> : <><UserX size={14}/> Blokir</>}
                    </button>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingUser(u)}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                        title="Ubah Profil"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        disabled={u.id === currentUser.id}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all disabled:opacity-0"
                        title="Hapus Akun"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form (Add/Edit) */}
      {(isAddingUser || editingUser) && (
        <div className="fixed inset-0 z-[100] bg-indigo-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => { setIsAddingUser(false); setEditingUser(null); }}>
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
            <div className="bg-indigo-600 p-12 text-white relative overflow-hidden">
              <h3 className="text-3xl font-black uppercase tracking-tighter leading-none relative z-10">
                {editingUser ? 'Ubah Data Akun' : 'Daftarkan Akun Baru'}
              </h3>
              <p className="text-indigo-200 font-bold text-xs uppercase tracking-widest mt-2 relative z-10">
                {editingUser ? editingUser.name : 'Tambahkan Admin atau Nakes baru ke sistem'}
              </p>
              <button onClick={() => { setIsAddingUser(false); setEditingUser(null); }} className="absolute top-10 right-10 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all z-10">
                <X size={20}/>
              </button>
              <ShieldCheck size={200} className="absolute -right-20 -bottom-20 opacity-10 rotate-12" />
            </div>
            <form onSubmit={handleSaveUser} className="p-12 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nama Lengkap</label>
                <input name="name" defaultValue={editingUser?.name} className="w-full px-8 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-indigo-100" required />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Level Akses (Role)</label>
                  <select name="role" defaultValue={editingUser?.role || UserRole.NAKES} className="w-full px-8 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none">
                    <option value={UserRole.ADMIN}>ADMINISTRATOR</option>
                    <option value={UserRole.NAKES}>TENAGA KESEHATAN</option>
                    <option value={UserRole.USER}>PASIEN (USER)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">No. HP / WhatsApp</label>
                  <input name="phone" defaultValue={editingUser?.phone} className="w-full px-8 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Username</label>
                  <input name="username" defaultValue={editingUser?.username} className="w-full px-8 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Password</label>
                  <input name="password" defaultValue={editingUser?.password} className="w-full px-8 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" required />
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="submit" className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-2">
                  <Save size={18} /> Simpan Perubahan
                </button>
                <button type="button" onClick={() => { setIsAddingUser(false); setEditingUser(null); }} className="px-10 py-6 bg-gray-100 text-gray-500 rounded-[2rem] font-black uppercase text-xs tracking-widest">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Singkat */}
      <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
          <ClipboardList className="text-indigo-600" size={24} /> Log Keamanan Terakhir
        </h3>
        <div className="space-y-4">
          {state.logs.filter(l => l.module === 'ACCESS').slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 border border-gray-100 shadow-sm"><ShieldAlert size={18}/></div>
                 <div>
                   <p className="text-xs font-black text-gray-800 uppercase">{log.details}</p>
                   <p className="text-[9px] font-bold text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                 </div>
               </div>
            </div>
          ))}
          {state.logs.filter(l => l.module === 'ACCESS').length === 0 && (
            <p className="text-[10px] font-black text-gray-300 uppercase text-center py-6">Belum ada riwayat perubahan akses.</p>
          )}
        </div>
      </div>
    </div>
  );
};
