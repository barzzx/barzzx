import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Palette, Copy, Check, MousePointer2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerColorHubView() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, i: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(i);
    toast.success("Design Code tercopy ke clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const gradients = [
    { name: "Cyberpunk Blue", class: "bg-gradient-to-r from-blue-600 to-indigo-600" },
    { name: "Neon Purple", class: "bg-gradient-to-r from-purple-600 to-pink-500" },
    { name: "Toxic Emerald", class: "bg-gradient-to-r from-emerald-500 to-teal-400" },
    { name: "Hacker Amber", class: "bg-gradient-to-r from-amber-500 to-orange-500" },
    { name: "Dark Sith", class: "bg-gradient-to-r from-red-600 to-rose-900" },
    { name: "Ocean Depth", class: "bg-gradient-to-t from-slate-900 to-blue-900" },
  ];

  const glows = [
    { name: "Blue Pulse", class: "shadow-[0_0_30px_rgba(37,99,235,0.6)]" },
    { name: "Purple Dream", class: "shadow-[0_0_30px_rgba(168,85,247,0.6)]" },
    { name: "Emerald Glint", class: "shadow-[0_0_30px_rgba(16,185,129,0.5)]" },
    { name: "Amber Alert", class: "shadow-[0_0_30px_rgba(245,158,11,0.5)]" },
    { name: "Rose Glow", class: "shadow-[0_0_30px_rgba(225,29,72,0.5)]" },
    { name: "Soft White", class: "shadow-[0_0_30px_rgba(255,255,255,0.2)]" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10 pb-20">
      <div className="bg-[#0f172a]/80 backdrop-blur-md p-6 lg:p-10 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 border-b border-rose-500/20 pb-6 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-rose-500 tracking-tight flex items-center gap-3">
              <Palette size={28} /> CSS Color & Gradient Hub
            </h2>
            <p className="text-slate-400 text-sm mt-1">Gudang desain UI Tailwind khusus Owner (Secret Panel).</p>
          </div>
          <div className="bg-rose-500/10 text-rose-500 px-4 py-2 border border-rose-500/30 rounded-xl font-bold flex items-center shadow-[0_0_15px_rgba(225,29,72,0.2)]">
            🌟 OWNER EXCLUSIVE 🌟
          </div>
        </div>

        <div className="space-y-12 relative z-10">
           {/* Gradients */}
           <section>
              <h3 className="text-white font-bold tracking-widest text-sm mb-4 uppercase">Background Gradients</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                 {gradients.map((grad, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col group">
                       <div className={`w-full h-24 rounded-xl mb-4 ${grad.class}`}></div>
                       <h4 className="text-slate-300 font-bold mb-2">{grad.name}</h4>
                       <button 
                         onClick={() => copyCode(grad.class, i)}
                         className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-mono font-bold rounded-lg transition-all ${
                            copiedIndex === i ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 cursor-pointer'
                         }`}
                       >
                         {copiedIndex === i ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> {grad.class.slice(0, 20)}...</>}
                       </button>
                    </div>
                 ))}
              </div>
           </section>

           {/* Glows */}
           <section>
              <h3 className="text-white font-bold tracking-widest text-sm mb-4 uppercase">Box Shadows (Glow FX)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                 {glows.map((glow, i) => (
                    <div key={i+100} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col items-center group">
                       <div className={`w-16 h-16 rounded-2xl mb-6 mt-4 bg-slate-800 border border-slate-700 ${glow.class}`}></div>
                       <h4 className="text-slate-300 font-bold mb-2 self-start w-full">{glow.name}</h4>
                       <button 
                         onClick={() => copyCode(glow.class, i+100)}
                         className={`w-full py-2 flex items-center justify-center gap-2 text-xs font-mono font-bold rounded-lg transition-all ${
                            copiedIndex === i+100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 cursor-pointer'
                         }`}
                       >
                         {copiedIndex === i+100 ? <><Check size={14}/> Copied!</> : <><Copy size={14}/> Copy CSS</>}
                       </button>
                    </div>
                 ))}
              </div>
           </section>
        </div>

      </div>
    </div>
  );
}
