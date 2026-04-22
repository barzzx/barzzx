import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Ghost, Image as ImageIcon, Lock, Unlock, Download, UploadCloud, EyeOff, AlertTriangle, RefreshCw, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SteganoView() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  
  const [encodeText, setEncodeText] = useState('');
  const [encodeImage, setEncodeImage] = useState<string | null>(null);
  const [encodedResultImage, setEncodedResultImage] = useState<string | null>(null);

  const [decodeImage, setDecodeImage] = useState<string | null>(null);
  const [decodedText, setDecodedText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const decodeInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'encode' | 'decode') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Harap unggah file gambar (PNG/JPG)!');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            if (type === 'encode') {
                setEncodeImage(event.target.result as string);
                setEncodedResultImage(null); // Reset result
            } else {
                setDecodeImage(event.target.result as string);
                setDecodedText(''); // Reset result
            }
        }
    };
    reader.readAsDataURL(file);
  };

  const encodeMessage = () => {
    if (!encodeImage) return toast.error('Upload gambar dulu!');
    if (!encodeText) return toast.error('Tulis pesan rahasia dulu!');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Delimiter and text
        const secretMessage = encodeText + '[STEG_END]';
        const textEncoder = new TextEncoder();
        const msgBytes = textEncoder.encode(secretMessage);
        
        let binaryMsg = '';
        for (let i = 0; i < msgBytes.length; i++) {
            binaryMsg += msgBytes[i].toString(2).padStart(8, '0');
        }

        if (binaryMsg.length > data.length * 3) {
            return toast.error('Gambar terlalu kecil untuk menampung pesan panjang ini!');
        }

        let bitIndex = 0;
        for (let i = 0; i < data.length; i += 4) {
             // Red
             if (bitIndex < binaryMsg.length) {
                 data[i] = (data[i] & 254) | parseInt(binaryMsg[bitIndex]);
                 bitIndex++;
             }
             // Green
             if (bitIndex < binaryMsg.length) {
                 data[i+1] = (data[i+1] & 254) | parseInt(binaryMsg[bitIndex]);
                 bitIndex++;
             }
             // Blue
             if (bitIndex < binaryMsg.length) {
                 data[i+2] = (data[i+2] & 254) | parseInt(binaryMsg[bitIndex]);
                 bitIndex++;
             }
             // Leave Alpha (i+3) identical to not mess up transparency rendering too much
        }

        ctx.putImageData(imgData, 0, 0);
        // HARUS DITANGKAP SEBAGAI PNG AGAR LOSLESS! JIKA JPG, PIXEL COMPRESSION AKAN MENGHANCURKAN DATA LSB.
        const resultUrl = canvas.toDataURL('image/png');
        setEncodedResultImage(resultUrl);
        toast.success('Pesan rahasia berhasil disisipkan!');
    };
    img.src = encodeImage;
  };

  const decodeMessage = () => {
    if (!decodeImage) return toast.error('Upload gambar bersandi dulu!');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let binaryMsg = '';
        // Extract LSB from pixels until we find the delimiter
        for (let i = 0; i < data.length; i += 4) {
            binaryMsg += (data[i] & 1).toString();
            binaryMsg += (data[i+1] & 1).toString();
            binaryMsg += (data[i+2] & 1).toString();
        }

        // Convert binary string to byte array
        const bytes = [];
        for (let i = 0; i < binaryMsg.length; i += 8) {
            const byteStr = binaryMsg.slice(i, i + 8);
            if (byteStr.length === 8) {
                bytes.push(parseInt(byteStr, 2));
            }
        }

        // Decode UTF-8 string
        let decodedString = '';
        try {
            const textDecoder = new TextDecoder('utf-8', { fatal: false });
            decodedString = textDecoder.decode(new Uint8Array(bytes));
        } catch(e) {
            return toast.error('Gagal mendekode gambar ini!');
        }

        const endIndex = decodedString.indexOf('[STEG_END]');
        if (endIndex !== -1) {
            setDecodedText(decodedString.substring(0, endIndex));
            toast.success('Berhasil mengekstrak pesan rahasia!');
        } else {
            toast.error('Tidak ada pesan rahasia ditemukan di gambar ini (Kesalahan Format). Pastikan berformat PNG lossless.');
        }
    };
    img.src = decodeImage;
  };

  const downloadImage = () => {
     if (!encodedResultImage) return;
     const a = document.createElement('a');
     a.href = encodedResultImage;
     a.download = `secret_image_${new Date().getTime()}.png`;
     a.click();
     toast.success('Gambar rahasia didownload (PNG)!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10 pb-20">
      <div className="bg-[#0f172a]/80 backdrop-blur-md p-6 lg:p-10 rounded-3xl shadow-2xl border border-slate-800">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Ghost className="text-purple-500 animate-pulse" size={28} /> Steganography Lab
            </h2>
            <p className="text-slate-400 text-sm mt-1">Sembunyikan pesan teks rahasia ke dalam sebuah dimensi gambar.</p>
          </div>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden p-1">
            <button 
              onClick={() => setMode('encode')}
              className={`px-4 py-2 font-bold text-sm tracking-wider uppercase transition-colors rounded-md ${mode === 'encode' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ENCODE (Tanam)
            </button>
            <button 
              onClick={() => setMode('decode')}
              className={`px-4 py-2 font-bold text-sm tracking-wider uppercase transition-colors rounded-md ${mode === 'decode' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              DECODE (Bongkar)
            </button>
          </div>
        </div>

        {/* Notif Penting PNG */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3 mb-8">
           <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
           <p className="text-slate-300 text-sm leading-relaxed">
             <span className="font-bold text-amber-500">Penting: </span>
             Data rahasia disisipkan secara piksel-ke-piksel. Saat gambar selesai ditanam pesan (Encode), formatnya akan berubah mutlak menjadi <b>PNG</b>. 
             Jika Anda mengirimkan gambar rahasia ini via medsos yang melakukan kompresi otomatis (seperti WhatsApp biasa / Facebook), <b>pesan akan terhapus/hilang</b> . Kirimkan sebagai "Dokumen" (Document File) untuk menjaga pixelnya!
           </p>
        </div>

        {/* ENCODE MODE */}
        {mode === 'encode' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
                   <ImageIcon size={16} className="text-purple-500"/> 1. Pilih Gambar Wadah
                </h3>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => handleImageUpload(e, 'encode')} />
                
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`h-48 border-2 border-dashed ${encodeImage ? 'border-purple-500/50 p-2' : 'border-slate-700 hover:border-purple-500/50'} rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-slate-900/50 transition-all group`}
                >
                   {encodeImage ? (
                      <div className="w-full h-full relative rounded-xl overflow-hidden group">
                        <img src={encodeImage} className="w-full h-full object-contain bg-black/20" alt="Hiding Container" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
                           <span className="text-white font-bold flex items-center gap-2"><RefreshCw size={16}/> Ganti Gambar</span>
                        </div>
                      </div>
                   ) : (
                      <div className="text-slate-500 flex flex-col items-center group-hover:text-purple-400 transition-colors">
                        <UploadCloud size={40} className="mb-2" />
                        <span className="font-bold">Klik untuk Mengunggah</span>
                      </div>
                   )}
                </div>

                <div className="flex flex-col gap-2 mt-6">
                   <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2 mt-4">
                      <EyeOff size={16} className="text-purple-500"/> 2. Tulis Pesan Rahasia
                   </h3>
                   <textarea 
                     value={encodeText} onChange={e => setEncodeText(e.target.value)}
                     className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-purple-500 h-32 custom-scrollbar resize-none font-mono text-sm"
                     placeholder="Tulis pesan rahasia yang mau dibenamkan ke dalam gambar..."
                   ></textarea>
                </div>

                <button 
                  onClick={encodeMessage}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] flex justify-center items-center gap-2 transition-transform hover:-translate-y-1"
                >
                  <Lock size={18}/> TANAM PESAN RAHASIA
                </button>
             </div>

             {/* Output Area */}
             <div className="bg-[#05050a] border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="font-bold text-emerald-500 uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                  <Check size={16}/> Hasil Akhir (Gambar Rahasia)
                </h3>

                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center p-2 mb-4 overflow-hidden relative">
                   {encodedResultImage ? (
                     <img src={encodedResultImage} className="max-w-full max-h-64 object-contain" alt="Encrypted result" />
                   ) : (
                     <div className="text-slate-600 font-mono text-xs text-center px-4">
                       Menunggu kompilasi gambar steganography...
                     </div>
                   )}
                </div>

                <button 
                  onClick={downloadImage}
                  disabled={!encodedResultImage}
                  className={`w-full py-3 font-bold rounded-xl flex justify-center items-center gap-2 transition-all ${
                     encodedResultImage ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Download size={18} /> Unduh Gambar Hasil (.PNG)
                </button>
             </div>
           </motion.div>
        )}

        {/* DECODE MODE */}
        {mode === 'decode' && (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
                   <ImageIcon size={16} className="text-blue-500"/> 1. Pilih Gambar Bersandi
                </h3>
                <input type="file" accept="image/png" className="hidden" ref={decodeInputRef} onChange={e => handleImageUpload(e, 'decode')} />
                
                <div 
                   onClick={() => decodeInputRef.current?.click()}
                   className={`h-48 border-2 border-dashed ${decodeImage ? 'border-blue-500/50 p-2' : 'border-slate-700 hover:border-blue-500/50'} rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-slate-900/50 transition-all group`}
                >
                   {decodeImage ? (
                      <div className="w-full h-full relative rounded-xl overflow-hidden group">
                        <img src={decodeImage} className="w-full h-full object-contain bg-black/20" alt="To decode" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
                           <span className="text-white font-bold flex items-center gap-2"><RefreshCw size={16}/> Ganti Gambar</span>
                        </div>
                      </div>
                   ) : (
                      <div className="text-slate-500 flex flex-col items-center group-hover:text-blue-400 transition-colors">
                        <UploadCloud size={40} className="mb-2" />
                        <span className="font-bold text-center">Klik untuk Mengunggah<br/><span className="text-xs font-normal text-slate-600">(Harus format asli .PNG)</span></span>
                      </div>
                   )}
                </div>

                <button 
                  onClick={decodeMessage}
                  className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2 transition-transform hover:-translate-y-1"
                >
                  <Unlock size={18}/> BONGKAR GAMBAR
                </button>
             </div>

             {/* Output Area */}
             <div className="bg-[#05050a] border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="font-bold text-emerald-500 uppercase tracking-widest text-sm flex items-center gap-2 mb-4">
                  <Check size={16}/> Pesan Tersembunyi (Ekstrak)
                </h3>

                <textarea 
                  readOnly 
                  value={decodedText}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-emerald-400 font-mono text-sm custom-scrollbar resize-none focus:outline-none min-h-[250px]"
                  placeholder="Isi pesan rahasia akan diekstrak dan tertampil di sini..."
                ></textarea>
             </div>
           </motion.div>
        )}

      </div>
    </div>
  );
}
