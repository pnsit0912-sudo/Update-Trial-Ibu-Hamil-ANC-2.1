
import React from 'react';
import { ClipboardList, User, Calendar, ShieldAlert } from 'lucide-react';
import { SystemLog } from './types';

interface AuditTrailProps {
  logs: SystemLog[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 border-b bg-gray-900 text-white flex items-center justify-between">
        <h2 className="font-black uppercase flex items-center gap-3 tracking-tighter text-2xl">
          <ClipboardList className="text-indigo-400" size={28} /> Audit Trail & System Logs
        </h2>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
          <ShieldAlert size={12} className="text-red-400" /> Akuntabilitas Medis Aktif
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b tracking-widest">
            <tr>
              <th className="px-8 py-5 w-48">Waktu (WIB)</th>
              <th className="px-8 py-5 w-48">Aktor</th>
              <th className="px-8 py-5 w-32">Modul</th>
              <th className="px-8 py-5">Deskripsi Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                    <Calendar size={12} />
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                      {log.userName.charAt(0)}
                    </div>
                    <p className="text-[11px] font-black text-gray-900">{log.userName}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-2 py-1 rounded bg-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-500">
                    {log.module}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase ${
                      log.action.includes('REGISTER') || log.action.includes('ADD') ? 'text-emerald-600' :
                      log.action.includes('UPDATE') ? 'text-blue-600' :
                      log.action.includes('DELETE') ? 'text-red-600' : 'text-indigo-600'
                    }`}>
                      {log.action}
                    </span>
                    <p className="text-xs font-bold text-gray-600 truncate max-w-md">{log.details}</p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
