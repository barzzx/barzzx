import React, { useState, useContext, useEffect } from 'react';
import { AppContext, ScrapedResource } from '../store/AppContext';
import { Copy, Download, Loader2, FileCode2, Play, Code2, Search, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ScraperView() {
  const { currentExtractUrl: url, setCurrentExtractUrl: setUrl, currentExtracted: resources, setCurrentExtracted: setResources, language } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);

  // Translations
  const loc = {
    title: language === 'id' ? 'Extractor Web barzzx' : 'Web Extractor barzzx',
    desc: language === 'id' ? 'Ekstrak kode sumber (HTML, CSS, JS) dari website manapun secara instan.' : 'Instantly extract source code (HTML, CSS, JS) from any website.',
    placeholder: language === 'id' ? 'Masukkan URL Website (https://...)' : 'Enter Website URL (https://...)',
    btn: language === 'id' ? 'Ekstrak Sekarang' : 'Extract Now',
    videoTitle: language === 'id' ? 'Tinjauan Sistem' : 'System Overview',
    unmute: language === 'id' ? 'Klik Aktifkan Suara' : 'Click to Unmute',
  };

  // Live Editor States
  const [editHtml, setEditHtml] = useState('');
  const [editCss, setEditCss] = useState('');
  const [editJs, setEditJs] = useState('');
  const [activeTab, setActiveTab] = useState<'html'|'css'|'js'|'preview'>('html');
  const [iframeSrc, setIframeSrc] = useState('');

  // Update editor when resources perfectly extracted
  useEffect(() => {
    if (resources && resources.length > 0) {
      const htmlCode = resources.filter(r => r.type === 'html').map(r => r.content).join('\n') || '<h1>Kosong</h1>';
      const cssCode = resources.filter(r => r.type === 'css').map(r => r.content).join('\n') || '/* Tidak ada CSS */';
      const jsCode = resources.filter(r => r.type === 'js').map(r => r.content).join('\n') || '// Tidak ada JS';
      
      setEditHtml(htmlCode);
      setEditCss(cssCode);
      setEditJs(jsCode);
      setIframeSrc(''); // reset preview when new extraction
      setActiveTab('html');
    }
  }, [resources]);

  const runCode = () => {
    const combined = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${editCss}</style>
      </head>
      <body>
        ${editHtml}
        <script>${editJs}<\/script>
      </body>
      </html>
    `;
    setIframeSrc(combined);
    setActiveTab('preview');
    toast.success("Kode di-compile ulang untuk Preview!");
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setProgress(0);
    setResources([]); // clear previous
    
    // Simulate initial network connection progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 10);
      if (p > 85) p = 85; 
      setProgress(p);
    }, 200);

    try {
      let validUrl = url;
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }

      const res = await axios.post('/api/scrape', { url: validUrl });
      clearInterval(interval);
      setProgress(100);
      
      if (res.data.success) {
        setResources(res.data.resources);
        toast.success(`Berhasil! ${res.data.resources.length} sumber ditarik.`);
      } else {
        toast.error(res.data.error || 'Gagal mengekstrak URL');
        setTimeout(() => setProgress(0), 1000);
      }
    } catch (err: any) {
      clearInterval(interval);
      toast.error('Tidak dapat terhubung ke server');
      setTimeout(() => setProgress(0), 1000);
    } finally {
      setTimeout(() => {
        setLoading(false);
        if (progress === 100) setProgress(0);
      }, 800);
    }
  };

  const htmlResources = resources.filter(r => r.type === 'html');
  const cssResources = resources.filter(r => r.type === 'css');
  const jsResources = resources.filter(r => r.type === 'js');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Salin Kode ${type.toUpperCase()} Berhasil!`);
  };

  const renderResourceGroup = (title: string, items: ScrapedResource[], typeLabel: string) => {
    return (
      <div className="mb-8">
        <h3 className="font-bold text-xl text-primary mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          {title} <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{items.length} file</span>
        </h3>
        {items.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-600 bg-slate-900/50 flex flex-col items-center justify-center min-h-[150px]">
            {loading ? (
               <Loader2 className="animate-spin text-primary mb-2" size={24} />
            ) : (
               <FileCode2 className="text-slate-700 mb-2" size={32} />
            )}
            <p>{loading ? "Sebentar lagi kode akan muncul..." : `Belum ada kode ${typeLabel} yang diekstrak.`}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((res, i) => (
              <div key={i} className="border border-slate-800 rounded-lg overflow-hidden flex flex-col bg-[#05050a] group hover:border-slate-700 transition-colors">
                <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileCode2 size={16} className="text-slate-500" />
                    <span className="font-mono text-sm font-semibold text-slate-300 group-hover:text-primary transition-colors">{res.name}</span>
                  </div>
                  <button onClick={() => copyToClipboard(res.content, typeLabel)} className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded flex gap-2 items-center text-xs font-bold transition-all border border-primary/20 hover:border-primary">
                    <Copy size={14}/> Copy Kode {typeLabel}
                  </button>
                </div>
                <div className="p-4 text-slate-400 font-mono text-xs md:text-sm max-h-64 overflow-y-auto whitespace-pre-wrap break-words custom-scrollbar">
                  {res.content.slice(0, 1000)}
                  {res.content.length > 1000 && <div className="text-amber-500/80 mt-3 font-sans italic text-sm">... (Kode terlalu panjang, Pratinjau dipotong. Unduh atau Copy untuk melihat kode penuh)</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 relative will-change-transform">
      <div className="bg-[#0f172a] p-6 md:p-8 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden transform-gpu">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 relative z-10">
          {loc.title}
        </h2>
        <p className="text-slate-400 text-sm mb-6 relative z-10 font-medium font-sans">
          {loc.desc}
        </p>
        
        <form onSubmit={handleScrape} className="flex flex-col md:flex-row gap-3 relative z-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={loc.placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-black/50 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder-slate-600 shadow-inner"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-4 bg-primary hover:bg-blue-600 disabled:bg-slate-800 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_20px_-5px_rgba(var(--primary-color-rgb),0.3)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : <Download size={20} />}
            {loading ? (language === 'id' ? 'Mengekstrak...' : 'Extracting...') : loc.btn}
          </button>
        </form>

        {/* Progress Bar Ekstrak HTML */}
        {loading && (
          <div className="mt-6 relative z-10">
            <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest">
              <span>{language === 'id' ? 'Data Sinkronisasi...' : 'Data Syncing...'}</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden shadow-inner border border-white/5">
              <div 
                className="bg-gradient-to-r from-primary to-indigo-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--primary-color-rgb),0.5)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800 backdrop-blur-sm relative z-10 transform-gpu">
         {renderResourceGroup(language === 'id' ? "Daftar HTML" : "HTML Bundle", htmlResources, "HTML")}
         {renderResourceGroup(language === 'id' ? "Daftar CSS" : "CSS Bundle", cssResources, "CSS")}
         {renderResourceGroup(language === 'id' ? "Daftar JavaScript" : "JS Bundle", jsResources, "JS")}
      </div>

      {resources.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] p-6 lg:p-8 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.1)] border border-slate-700 relative z-10 mt-12 overflow-hidden"
        >
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-800 pb-4 relative z-10 gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Code2 className="text-purple-500" size={28} /> Live Code Editor
              </h2>
              <p className="text-slate-400 text-sm mt-1">Lihat, Edit, dan Uji Coba langsung hasil ekstraksi web (Playground).</p>
            </div>
            <button 
              onClick={runCode}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-2 font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
            >
              <Play size={18} /> Jalankan Kode (Run)
            </button>
          </div>

          <div className="flex space-x-2 mb-4 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800 w-fit relative z-10">
            {(['html', 'css', 'js', 'preview'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab ? (tab === 'preview' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-700 text-white') : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative z-10 border border-slate-800 bg-[#05050a] rounded-xl overflow-hidden h-[500px]">
            {activeTab === 'html' && (
               <textarea 
                 value={editHtml} 
                 onChange={e => setEditHtml(e.target.value)} 
                 className="w-full h-full p-4 bg-transparent text-slate-300 font-mono text-sm focus:outline-none custom-scrollbar resize-none" 
                 spellCheck="false"
               />
            )}
            {activeTab === 'css' && (
               <textarea 
                 value={editCss} 
                 onChange={e => setEditCss(e.target.value)} 
                 className="w-full h-full p-4 bg-transparent text-blue-300 font-mono text-sm focus:outline-none custom-scrollbar resize-none" 
                 spellCheck="false"
               />
            )}
            {activeTab === 'js' && (
               <textarea 
                 value={editJs} 
                 onChange={e => setEditJs(e.target.value)} 
                 className="w-full h-full p-4 bg-transparent text-amber-300 font-mono text-sm focus:outline-none custom-scrollbar resize-none" 
                 spellCheck="false"
               />
            )}
            {activeTab === 'preview' && (
               <div className="w-full h-full bg-white relative">
                 {iframeSrc ? (
                   <iframe 
                     srcDoc={iframeSrc} 
                     title="Preview" 
                     sandbox="allow-scripts"
                     className="w-full h-full border-0 absolute inset-0 bg-white"
                   />
                 ) : (
                   <div className="flex h-full items-center justify-center text-slate-500 font-bold bg-slate-100 flex-col gap-3">
                      <Play size={48} className="text-slate-300" />
                      Silakan klik "Jalankan Kode (Run)" untuk melihat Preview!
                   </div>
                 )}
               </div>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}
