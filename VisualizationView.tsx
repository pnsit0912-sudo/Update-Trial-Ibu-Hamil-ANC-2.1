
import React from 'react';
import { AlertCircle } from 'lucide-react';

export const VisualizationView = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <div className="bg-slate-100 p-8 rounded-full mb-6">
        <AlertCircle size={64} className="text-slate-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Fitur Dinonaktifkan</h2>
      <p className="text-slate-500 max-w-md">Modul Visualisasi AI telah dinonaktifkan untuk mengoptimalkan performa deployment.</p>
    </div>
  );
};
