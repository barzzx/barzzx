import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Key, Lock, Unlock, Hash, Copy, Check, ArrowRightLeft, Shield, Sliders, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CryptoToolsView() {
  const [b64Input, setB64Input] = useState('');
  const [b64Output, setB64Output] = useState('');
  const [hashInput, setHashInput] = useState('');
  const [hashOutput, setHashOutput] = useState('');
  const [hashType, setHashType] = useState('SHA-256');

  // Password Generator States
  const [pwdLength, setPwdLength] = useState(16);
  const [incUpper, setIncUpper] = useState(true);
  const [incLower, setIncLower] = useState(true);
  const [incNum, setIncNum] = useState(true);
  const [incSym, setIncSym] = useState(true);
  const [genPwd, setGenPwd] = useState('');

  const handleBase64 = (type: 'encode' | 'decode') => {
    try {
      if (type === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(b64Input)));
        setB64Output(encoded);
        toast.success("Berhasil Enkripsi ke Base64!");
      } else {
        const decoded = decodeURIComponent(escape(atob(b64Input)));
        setB64Output(decoded);
        toast.success("Berhasil Dekripsi dari Base64!");
      }
    } catch (e) {
      toast.error("Input tidak valid!");
    }
  };

  const handleHash = async () => {
    if (!hashInput) return;
    try {
      const msgBuffer = new TextEncoder().encode(hashInput);
      const hashBuffer = await crypto.subtle.digest(hashType, msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashOutput(hashHex);
      toast.success(`Berhasil Generate Hash ${hashType}`);
    } catch (e) {
      toast.error("Terjadi error saat generate Hash.");
    }
  };

  const generatePassword = () => {
    let chars = '';
    if (incUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (incLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (incNum) chars += '0123456789';
    if (incSym) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (!chars) {
      toast.error('Pilih minimal satu kriteria karakter!');
      return;
    }

    let result = '';
    const array = new Uint32Array(pwdLength);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < pwdLength; i++) {
      result += chars[array[i] % chars.length];
    }
    
    setGenPwd(result);
  };

  useEffect(() => {
    generatePassword(); // Initial generation on mount
  }, []);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Teks disalin ke clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10 pb-20">
      <div className="bg-[#0f172a]/80 backdrop-blur-md p-6 lg:p-10 rounded-3xl shadow-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Key className="text-rose-500" size={28} /> Secret Tools (Kriptografi)
            </h2>
            <p className="text-slate-400 text-sm mt-1">Alat enkripsi Base64, Generator Hash, dan Pembuat Sandi.</p>
          </div>
          <Lock size={24} className="text-rose-600" />
        </div>

        {/* TOP ROW: Base64 & Hash Generator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Base64 Tool */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="bg-[#05050a] border border-rose-500/20 rounded-2xl overflow-hidden shadow-lg group relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-rose-500 bg-slate-900/50">
              <ArrowRightLeft size={18} />
              <h3 className="font-bold tracking-widest text-sm uppercase">Base64 Converter</h3>
            </div>
            
            <div className="p-5 flex flex-col gap-4 relative z-10">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Input Teks / Kode</label>
                <textarea 
                  value={b64Input} onChange={e => setB64Input(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-300 font-mono text-sm h-24 focus:outline-none focus:border-rose-500 custom-scrollbar resize-none"
                  placeholder="Masukkan teks biasa atau kode Base64 di sini..."
                ></textarea>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => handleBase64('encode')} className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 font-bold text-sm rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Lock size={14} /> Encode
                </button>
                <button onClick={() => handleBase64('decode')} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-lg transition-colors flex justify-center items-center gap-2">
                  <Unlock size={14} /> Decode
                </button>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="text-xs font-bold text-emerald-500 uppercase">Output Hasil</label>
                  <button onClick={() => copyToClipboard(b64Output)} className="text-slate-500 hover:text-emerald-500 transition-colors p-1"><Copy size={14}/></button>
                </div>
                <textarea 
                  readOnly value={b64Output}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 font-mono text-sm h-24 focus:outline-none custom-scrollbar resize-none pointer-events-auto"
                  placeholder="Hasil konversi muncul di sini..."
                ></textarea>
              </div>
            </div>
          </motion.div>

          {/* HASH Generator Tool */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-[#05050a] border border-purple-500/20 rounded-2xl overflow-hidden shadow-lg group relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-purple-500 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Hash size={18} />
                <h3 className="font-bold tracking-widest text-sm uppercase">Hash Generator</h3>
              </div>
              <select 
                value={hashType} onChange={e => setHashType(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-purple-400 focus:outline-none cursor-pointer"
              >
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-384">SHA-384</option>
                <option value="SHA-512">SHA-512</option>
              </select>
            </div>
            
            <div className="p-5 flex flex-col gap-4 relative z-10">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block uppercase">Input Password / Teks Rahasia</label>
                <input 
                  type="text" 
                  value={hashInput} onChange={e => setHashInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-300 font-mono text-sm focus:outline-none focus:border-purple-500 shadow-inner"
                  placeholder="Cth: MySecretPassword123"
                />
              </div>
              
              <button onClick={handleHash} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-lg transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                <Hash size={16} /> Generate Hash
              </button>

              <div className="mt-2 text-left">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-xs font-bold text-emerald-500 uppercase">Hash Output (HEX String)</label>
                  <button onClick={() => copyToClipboard(hashOutput)} className="text-slate-500 hover:text-emerald-500 transition-colors p-1"><Copy size={14}/></button>
                </div>
                <div className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 font-mono text-xs h-24 overflow-y-auto break-all custom-scrollbar flex items-center justify-center text-center leading-relaxed">
                  {hashOutput ? hashOutput : <span className="text-slate-600 font-sans">Belum ada hash digenerate.</span>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM ROW: PassGen Pro (Full Width) */}
        <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-[#05050a] border border-amber-500/30 mt-8 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.1)] group relative"
        >
          <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2 text-amber-500">
              <Shield size={20} />
              <h3 className="font-bold tracking-widest text-base uppercase">PassGen Pro <span className="text-slate-500 relative top-[-1px] mx-1">|</span> <span className="text-xs text-amber-500/80 font-normal">Sandi Super Kuat</span></h3>
            </div>
            <Sliders size={18} className="text-slate-500" />
          </div>

          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 relative z-10">
            {/* Visual Output */}
            <div className="flex-1 flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase flex justify-between items-center">
                 <span>Hasil Kata Sandi</span>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${pwdLength >= 12 && (incUpper || incSym) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {pwdLength >= 12 && (incUpper || incSym) ? 'SANGAT KUAT' : 'LEMAH/SEDANG'}
                 </span>
              </label>
              
              <div className="relative group cursor-pointer" onClick={() => copyToClipboard(genPwd)}>
                 <div className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-4 md:p-6 text-center text-xl md:text-3xl font-mono text-white tracking-wider break-all shadow-inner group-hover:border-amber-400 transition-colors">
                    {genPwd}
                 </div>
                 <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Copy size={12}/> Klik untuk Menyalin
                 </div>
              </div>

              <button 
                onClick={generatePassword}
                className="mt-6 w-full py-4 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:-translate-y-0.5 flex justify-center items-center gap-2"
              >
                 <RefreshCw size={20} /> GENERATE SANDI BARU
              </button>
            </div>

            <div className="w-px bg-slate-800 hidden md:block"></div>

            {/* Controls */}
            <div className="flex-1 flex flex-col gap-6 justify-center">
              <div>
                <div className="flex justify-between items-center mb-2">
                   <label className="text-sm font-bold text-slate-400">Panjang Karakter</label>
                   <span className="text-amber-500 font-black text-xl">{pwdLength}</span>
                </div>
                <input 
                  type="range" min="8" max="64" 
                  value={pwdLength} 
                  onChange={(e) => setPwdLength(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Huruf Besar (A-Z)', state: incUpper, setter: setIncUpper },
                   { label: 'Huruf Kecil (a-z)', state: incLower, setter: setIncLower },
                   { label: 'Angka (0-9)', state: incNum, setter: setIncNum },
                   { label: 'Simbol Khas (@#!)', state: incSym, setter: setIncSym },
                 ].map((opt, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer group">
                       <input 
                         type="checkbox" checked={opt.state} 
                         onChange={(e) => opt.setter(e.target.checked)}
                         className="w-5 h-5 text-amber-500 rounded bg-slate-900 border-slate-700 cursor-pointer focus:ring-amber-500 focus:ring-offset-slate-900" 
                       />
                       <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{opt.label}</span>
                    </label>
                 ))}
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
