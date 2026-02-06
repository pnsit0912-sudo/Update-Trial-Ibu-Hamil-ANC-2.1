
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Image as ImageIcon, Download, RefreshCw, AlertCircle, Wand2, Ratio } from 'lucide-react';

const ASPECT_RATIOS = [
  { label: '1:1 (Square)', value: '1:1' },
  { label: '3:4 (Portrait)', value: '3:4' },
  { label: '4:3 (Landscape)', value: '4:3' },
  { label: '9:16 (Story)', value: '9:16' },
  { label: '16:9 (Cinema)', value: '16:9' },
];

export const VisualizationView = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const win = window as any;
      if (win.aistudio && await win.aistudio.hasSelectedApiKey()) {
        setHasKey(true);
      }
    } catch (error) {
      console.error("Error checking API key:", error);
    }
  };

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
      // Assume success as per guidelines to avoid race condition
      setHasKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
        const win = window as any;
        if (!hasKey && win.aistudio) {
            await handleSelectKey();
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: "1K"
                }
            }
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64String = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    setGeneratedImage(`data:${mimeType};base64,${base64String}`);
                    break;
                }
            }
        } else {
            throw new Error("Tidak ada gambar yang dihasilkan. Coba prompt lain.");
        }

    } catch (err: any) {
        console.error(err);
        setError(err.message || "Gagal menghasilkan gambar. Pastikan API Key valid.");
        if (err.message?.includes('Requested entity was not found')) {
            setHasKey(false);
            const win = window as any;
            if (win.aistudio) {
              await win.aistudio.openSelectKey();
            }
        }
    } finally {
        setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `smart-anc-dream-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
       <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-10 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden text-white">
          <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
                      <Sparkles size={24} className="text-yellow-300" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest text-emerald-100">Fitur Premium Gemini AI</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-6">Visualisasi Impian</h2>
              <p className="text-emerald-50 text-sm md:text-lg font-medium leading-relaxed">
                  Visualisasikan konsep kamar bayi atau foto maternity dengan AI.
              </p>
          </div>
          <Sparkles size={300} className="absolute -right-20 -bottom-40 text-white opacity-10 rotate-12" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-5 space-y-6">
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-100/50">
                   {!hasKey && (
                       <div className="mb-8 bg-amber-50 border border-amber-100 p-6 rounded-3xl">
                           <h4 className="flex items-center gap-2 text-amber-800 font-black uppercase text-sm mb-2">
                               <AlertCircle size={16} /> Akses API Diperlukan
                           </h4>
                           <button onClick={handleSelectKey} className="px-6 py-3 bg-amber-600 text-white text-xs font-black uppercase rounded-xl hover:bg-amber-700 transition-all">
                               Set API Key
                           </button>
                       </div>
                   )}

                   <div className="space-y-6">
                       <div className="space-y-3">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Imajinasi Anda</label>
                           <textarea 
                               value={prompt}
                               onChange={(e) => setPrompt(e.target.value)}
                               placeholder="Contoh: Kamar bayi tema hutan..."
                               className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white transition-all resize-none"
                           />
                       </div>

                       <div className="space-y-3">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                               <Ratio size={14} /> Rasio Gambar
                           </label>
                           <div className="grid grid-cols-3 gap-2">
                               {ASPECT_RATIOS.map((ratio) => (
                                   <button
                                       key={ratio.value}
                                       onClick={() => setAspectRatio(ratio.value)}
                                       className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${
                                           aspectRatio === ratio.value 
                                           ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                           : 'border-transparent bg-slate-100 text-slate-400 hover:bg-slate-200'
                                       }`}
                                   >
                                       {ratio.label}
                                   </button>
                               ))}
                           </div>
                       </div>

                       <button 
                           onClick={handleGenerate}
                           disabled={isLoading || !prompt || !hasKey}
                           className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                       >
                           {isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Wand2 size={20} />} Wujudkan
                       </button>

                       {error && (
                           <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
                               {error}
                           </div>
                       )}
                   </div>
               </div>
           </div>

           <div className="lg:col-span-7">
               <div className="bg-white p-4 rounded-[3rem] shadow-sm border border-slate-100 h-full min-h-[500px] flex flex-col">
                   <div className="flex-1 bg-slate-100 rounded-[2.5rem] overflow-hidden relative group flex items-center justify-center border border-slate-200">
                       {generatedImage ? (
                           <>
                               <img src={generatedImage} alt="AI Result" className="w-full h-full object-contain" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                   <button 
                                       onClick={downloadImage}
                                       className="px-8 py-4 bg-white text-slate-900 rounded-full font-black uppercase text-xs tracking-widest hover:scale-110 transition-transform flex items-center gap-3"
                                   >
                                       <Download size={18} /> Simpan
                                   </button>
                               </div>
                           </>
                       ) : (
                           <div className="text-center p-10 opacity-40">
                               <ImageIcon size={64} className="mx-auto mb-4 text-slate-400" />
                               <p className="text-sm font-black uppercase text-slate-400 tracking-widest">Belum ada visualisasi</p>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};
