import React, { useState, useContext, useEffect } from 'react';
import { AppProvider, AppContext, ScrapedItem } from './store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import PhonePreviewOverlay from './components/PhonePreviewOverlay';
import ScraperView from './views/ScraperView';
import LinkManagerView from './views/LinkManagerView';
import MyLinksView from './views/MyLinksView';
import OwnerPanel from './views/OwnerPanel';
import AuthView from './views/AuthView';
import SpeedTestView from './views/SpeedTestView';
import DeviceScannerView from './views/DeviceScannerView';
import CryptoToolsView from './views/CryptoToolsView';
import CommunitySignalView from './views/CommunitySignalView';
import SteganoView from './views/SteganoView';
import OwnerColorHubView from './views/OwnerColorHubView';
import Decorations from './components/Decorations';
import { Smartphone, Menu, Save, Download, X, RefreshCw, Ban, MessageCircle, Activity, Lock as LockIcon, List, Search, Play } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { cn } from './components/Sidebar';
import toast from 'react-hot-toast';
import JSZip from 'jszip';

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('scraper');
  const { isOwner, setIsOwner, setShowPhonePreview, currentUser, currentExtracted, currentExtractUrl, saveScrape, settings, setCurrentUser, users, linkCategories, themeColor, unblockUser, language, setLanguage } = useContext(AppContext);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const [videoStarted, setVideoStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isVideoUnmuted, setIsVideoUnmuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (currentTab === 'scraper') {
        videoRef.current.play().catch(() => console.log("Waiting for user interaction"));
      }
    }
  }, [currentTab]);

  const isDeviceBlocked = localStorage.getItem('isDeviceBlocked') === 'true' && !isOwner;

  // Stats & Chart Data for Blocked Screens
  const stats = React.useMemo(() => {
    const totalUsers = users.length;
    const totalLinks = users.reduce((acc, u) => acc + u.links.length, 0) + linkCategories.reduce((acc, c) => acc + c.links.length, 0);
    return { totalUsers, totalLinks };
  }, [users, linkCategories]);

  const chartData = React.useMemo(() => {
    const dailyData: Record<string, { date: string; users: number; links: number; rawDate: string }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const raw = d.toISOString().split('T')[0];
      dailyData[raw] = { date: key, users: 0, links: 0, rawDate: raw };
    }
    users.forEach(u => {
      const uDate = u.createdAt ? u.createdAt.split('T')[0] : '';
      if (uDate && dailyData[uDate]) dailyData[uDate].users += 1;
      u.links.forEach(l => {
        const lDate = l.createdAt ? l.createdAt.split('T')[0] : (u.createdAt ? u.createdAt.split('T')[0] : '');
        if (lDate && dailyData[lDate]) dailyData[lDate].links += 1;
      });
    });
    return Object.values(dailyData).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [users]);

  // Save/Download Overlay States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState({ html: true, css: true, js: true });

  const filteredResources = currentExtracted?.filter(r => selectedTypes[r.type as keyof typeof selectedTypes]) || [];
  const htmlResources = currentExtracted?.filter(r => r.type === 'html') || [];
  const cssResources = currentExtracted?.filter(r => r.type === 'css') || [];
  const jsResources = currentExtracted?.filter(r => r.type === 'js') || [];

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');

  const handleSecretUnlock = async () => {
    const unlockPw = settings.unlockPassword || 'unlockbarzzx';
    const selfCode = (settings as any).selfUnlockCode || 'unblockbarzzx';
    
    if (unlockInput === unlockPw || unlockInput === selfCode) {
      const lastUser = localStorage.getItem('last_user_attempt') || currentUser?.username;
      
      if (lastUser) {
        await unblockUser(lastUser);
      }
      
      localStorage.removeItem('isDeviceBlocked');
      localStorage.removeItem('last_user_attempt');
      setCurrentUser(null);
      setShowUnlockModal(false);
      setUnlockInput('');
      toast.success("AKSES DIBUKA! Status blokir sudah dihapus. Silakan login kembali.");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.error("Password Salah! Hubungi admin barzzx.");
    }
  };



  const UnlockModal = () => (
    <AnimatePresence>
      {showUnlockModal && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <LockIcon size={32} className="text-primary"/>
              </div>
              <h3 className="text-xl font-bold text-white">Buka Blokir Manual</h3>
              <p className="text-slate-400 text-xs mt-1">Masukkan password manual yang diberikan owner.</p>
            </div>

            <div className="space-y-4">
              <input 
                type="password"
                placeholder="Kata sandi manual..."
                value={unlockInput}
                onChange={(e) => setUnlockInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-primary transition-all text-center font-bold tracking-widest"
                autoFocus
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowUnlockModal(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all"
                >
                  BATAL
                </button>
                <button 
                  onClick={handleSecretUnlock}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
                >
                  BUKA AKSES
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // If device is blocked
  if (isDeviceBlocked) {
    return (
      <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center p-8 text-center overflow-auto">
        <UnlockModal />
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-md w-full bg-slate-950 border-2 border-rose-600 rounded-3xl p-10 shadow-[0_0_100px_rgba(225,29,72,0.4)] my-auto"
        >
          <div className="mb-6 inline-block p-5 bg-rose-600/20 rounded-full border border-rose-600 animate-bounce">
            <Ban size={64} className="text-rose-600" />
          </div>
          <h1 className="text-4xl font-black text-rose-600 mb-4 tracking-tighter">PERANGKAT DIBLOKIR</h1>
          <p className="text-slate-400 mb-4 font-medium">
            Owner barzzx telah memutus akses perangkat Anda secara total. Anda tidak dapat masuk, mendaftar, atau menggunakan fitur apapun lagi.
          </p>
          
          <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
            <p className="text-white font-bold text-sm mb-2 text-center uppercase tracking-widest opacity-50">System Center</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <a 
                href={`https://wa.me/${settings.waNumber}?text=${encodeURIComponent("Halo Owner, perangkat saya diblokir. Saya ingin minta maaf dan minta akses dibuka. (WA 1)")}`}
                target="_blank" 
                className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 text-sm"
              >
                <MessageCircle size={20}/> OWNER 1
              </a>
              <a 
                href={`https://wa.me/${settings.waNumber2}?text=${encodeURIComponent("Halo Owner, perangkat saya diblokir. (WA 2)")}`}
                target="_blank" 
                className="py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 text-sm"
              >
                <MessageCircle size={20}/> OWNER 2
              </a>
            </div>

            <button 
              onClick={() => setShowUnlockModal(true)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-800 transition-all text-xs cursor-pointer pointer-events-auto"
            >
              <LockIcon size={14}/> BUKA BLOKIR MANUAL
            </button>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 border border-slate-700"
          >
            <RefreshCw size={20} className="animate-spin-slow" /> REFRESH STATUS
          </button>

          <p className="mt-6 text-[10px] text-slate-700 uppercase font-bold tracking-[0.2em]">SISTEM KEAMANAN barzzx v2.0</p>
        </motion.div>
      </div>
    );
  }

  // If no user is logged in, show authentication screen
  if (currentUser?.isBlocked && !isOwner) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col items-center justify-center p-6 text-center overflow-auto">
        <UnlockModal />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.1),transparent)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none select-none overflow-hidden flex flex-wrap gap-4 p-4 text-[10px] font-mono leading-none">
            {Array(500).fill('BLOCKED').map((t, i) => <span key={i} className="text-rose-500">{t}</span>)}
          </div>
        </div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 space-y-6 max-w-lg my-auto"
        >
          <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500 animate-pulse shadow-[0_0_50px_rgba(244,63,94,0.3)]">
            <Ban size={48} className="text-rose-500" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tighter">AKUN DIBLOKIR</h1>
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
              <p className="text-lg text-slate-300 font-medium italic">
                "{currentUser.blockReason || 'Anda melanggar aturan barzzx.'}"
              </p>
            </div>
            <p className="text-slate-500 text-sm">
              Sinyal Anda telah diputus oleh Owner karena alasan di atas. Jika ini adalah kesalahan, silakan hubungi owner.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <p className="text-white font-bold text-sm">Chat Owner agar dibuka:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-1">
              <a 
                href={`https://wa.me/${settings.waNumber}?text=${encodeURIComponent(`Halo Owner, akun saya (${currentUser.username}) diblokir. Bisa tolong dibuka? (WA 1)`)}`}
                target="_blank" 
                className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={20}/> OWNER 1
              </a>
              <a 
                href={`https://wa.me/${settings.waNumber2}?text=${encodeURIComponent(`Halo Owner, akun saya (${currentUser.username}) diblokir. Bisa tolong dibuka? (WA 2)`)}`}
                target="_blank" 
                className="py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle size={20}/> OWNER 2
              </a>
            </div>

            <button 
              onClick={() => setShowUnlockModal(true)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-800 transition-all text-xs cursor-pointer pointer-events-auto"
            >
              <LockIcon size={14}/> BUKA BLOKIR MANUAL
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary font-bold rounded-xl flex items-center justify-center gap-2 border border-primary/30 transition-all"
            >
              <RefreshCw size={18} /> REFRESH STATUS
            </button>

            <button 
              onClick={() => { setCurrentUser(null); window.location.reload(); }}
              className="w-full px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all"
            >
              GANTI AKUN
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentUser) return <AuthView />;

  const handleSaveToMemory = () => {
    if (!currentExtracted || currentExtracted.length === 0) {
      toast.error('Belum ada web diekstrak!');
      return;
    }
    if (filteredResources.length === 0) {
      toast.error('Centang minimal satu untuk disimpan!');
      return;
    }
    const item: ScrapedItem = {
      url: currentExtractUrl,
      date: new Date().toISOString(),
      resources: filteredResources
    };
    saveScrape(item);
    toast.success('Berhasil disimpan ke Memory Vault!');
    setShowSaveModal(false);
  };

  const handleDownload = async () => {
    if (!currentExtracted || currentExtracted.length === 0) {
      toast.error('Belum ada web diekstrak!');
      return;
    }
    if (filteredResources.length === 0) {
      toast.error('Centang minimal satu untuk didownload!');
      return;
    }
    const zip = new JSZip();
    filteredResources.forEach(r => {
      zip.file(r.name, r.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `scraped_${new Date().getTime()}.zip`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    toast.success('Proses Unduh Dimulai!');
    setShowSaveModal(false);
  };

  // Secret button handler logic
  const handleSecretClick = () => {
    if (isOwner) return; // already owner
    const pwd = prompt("Masukkan kata sandi Owner:");
    if (pwd === settings.codeOwner) {
      setIsOwner(true);
      setCurrentTab('owner');
      toast.success("Selamat Datang, Owner barzzx!");
    } else if (pwd !== null) {
      toast.error("Kata sandi salah!");
    }
  };

  // Touch gesture handlers for mobile sidebar opening
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX;

    // Jika mulai sentuh dari jengkal tepi kiri (< 40px) dan digeser ke kanan > 60px
    if (touchStartX < 40 && diff > 60) {
      setSidebarOpen(true);
      setTouchStartX(null); // Prevent multiple triggers
    }
    
    // Opsional: Tutup sidebar jika geser kiri
    if (sidebarOpen && diff < -60) {
      setSidebarOpen(false);
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  const transitionSpeed = settings.transitionSpeed || 0.18;

  const currentCustomTab = (settings.customTabs || []).find((t: any) => t.id === currentTab);

  return (
    <div 
      className="min-h-screen flex text-slate-200 bg-[#030712] selection:bg-primary/30"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Decorations />
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
      />
      
      <main className="flex-1 ml-0 transition-all duration-300 md:ml-64 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header - Deluxe Glassmorphism */}
        <header className="h-16 bg-[#030712]/40 backdrop-blur-xl flex items-center px-6 justify-between shrink-0 sticky top-0 z-30 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-1">
                {language === 'id' ? 'Kecerdasan Sistem' : 'System Intelligence'}
              </span>
              <h1 className="font-display font-black text-lg text-white uppercase tracking-tighter flex items-center gap-2">
                {currentCustomTab ? currentCustomTab.label : currentTab.replace('-', ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-40">
            <button 
              onClick={() => setLanguage(language === 'id' ? 'en' : 'id')} 
              className="px-3 py-1.5 bg-white/5 border border-white/5 hover:border-primary/30 rounded-lg transition-all text-[10px] font-black text-slate-400 hover:text-white flex items-center gap-2"
              title="Ganti Bahasa / Change Language"
            >
              {language === 'id' ? '🇮🇩 ID' : '🇺🇸 EN'}
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="p-2.5 text-slate-400 hover:text-primary bg-white/5 border border-white/5 hover:border-primary/30 rounded-xl transition-all duration-500 group shadow-lg"
              title={language === 'id' ? 'Segarkan Sistem' : 'Sync System'}
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
            </button>
          </div>

          <div 
            onClick={handleSecretClick} 
            className="w-10 h-10 absolute top-0 right-0 cursor-default opacity-0 z-50 rounded-bl-full hover:bg-primary/5" 
            title={!isOwner ? 'Owner Access' : ''}
          ></div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-10 no-scrollbar relative scroll-smooth">
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            {/* Persistent Global Video for Scraper View */}
            <div className={cn(
              "mb-8 w-full transition-all duration-700",
              currentTab === 'scraper' ? "block opacity-100 translate-y-0" : "hidden opacity-0 -translate-y-10"
            )}>
              <div className="w-full aspect-video rounded-3xl overflow-hidden glass-card shadow-2xl relative group border border-white/5 bg-[#0a0a1a]">
                {!videoError ? (
                  <video 
                    ref={videoRef}
                    autoPlay 
                    loop 
                    muted={!isVideoUnmuted}
                    playsInline
                    id="global-hero-video"
                    preload="auto"
                    className="w-full h-full object-cover relative z-0"
                    onPlay={() => setVideoStarted(true)}
                    onCanPlay={() => setVideoStarted(true)}
                    onCanPlayThrough={() => setVideoStarted(true)}
                    onError={(e) => {
                      console.error("Video Error:", e);
                      setVideoError(true);
                    }}
                  >
                    <source src="https://c.termai.cc/v180/Lq3BR8m.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <Play size={40} className="text-primary"/>
                    </div>
                    <p className="text-slate-500 text-[10px] mt-4 font-black tracking-widest">VIDEO ASSET OFFLINE</p>
                  </div>
                )}

                {(!isVideoUnmuted || !videoStarted) && (
                  <div 
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] group-hover:bg-black/20 transition-all cursor-pointer transform-gpu"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        setIsVideoUnmuted(true);
                        setVideoStarted(true);
                        videoRef.current.play().then(() => {
                           toast.success(language === 'id' ? "Audio Diaktifkan!" : "Audio Activated!");
                        }).catch(e => {
                           console.error("Video play failed:", e);
                           setVideoStarted(true);
                        });
                      }
                    }}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center backdrop-blur-xl animate-pulse shadow-[0_0_50px_rgba(var(--primary-color-rgb),0.4)]">
                        <Play size={48} className="text-white fill-white translate-x-1"/>
                      </div>
                      <div className="px-5 py-2 bg-black/70 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                          {language === 'id' ? 'Klik Aktifkan Suara' : 'Click to Unmute'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-end p-8 z-10 pointer-events-none transform-gpu">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Cinematic Feed</span>
                  </div>
                  <h3 className="text-2xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-3">
                      {language === 'id' ? 'Tinjauan Sistem' : 'System Overview'} <span className="text-primary italic animate-pulse">Live</span>
                  </h3>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, scale: 1.05, filter: 'blur(10px)' }}
                transition={{ duration: transitionSpeed, ease: [0.19, 1, 0.22, 1] }}
                className="space-y-8 w-full"
              >
                {currentCustomTab ? (
                  <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentCustomTab.value }} />
                  </div>
                ) : (
                  <>
                    {currentTab === 'scraper' && <ScraperView />}
                    {currentTab === 'my-links' && <MyLinksView />}
                    {currentTab === 'links' && <LinkManagerView />}
                    {currentTab === 'community' && <CommunitySignalView />}
                    {currentTab === 'stegano' && <SteganoView />}
                    {currentTab === 'speed-test' && <SpeedTestView />}
                    {currentTab === 'scanner' && <DeviceScannerView />}
                    {currentTab === 'crypto' && <CryptoToolsView />}
                    {currentTab === 'color-hub' && isOwner && <OwnerColorHubView />}
                    {currentTab === 'owner' && isOwner && <OwnerPanel />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Spacer to hide secret button so user has to scroll down */}
          <div className="h-48 w-full opacity-0 pointer-events-none"></div>

          {/* Secret Button placed at the very bottom right */}
          <div className="flex justify-end pr-2 pb-2 relative z-50">
            <button 
              onClick={handleSecretClick} 
              className="text-[10px] text-slate-900 border-none bg-transparent hover:text-slate-600 transition-colors select-none"
              title={!isOwner ? 'Secret Area' : ''}
            >
              tools barzzx
            </button>
          </div>
        </div>
      </main>

      {/* Floating Action Button (Overlay Download Memori) ALL TABS */}
      <button 
        onClick={() => {
          if (!currentExtracted || currentExtracted.length === 0) {
            toast.error("Tidak ada data! Ekstrak web di tab Extractor terlebih dahulu.");
          } else {
            setShowSaveModal(true);
          }
        }}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-110 transition-transform z-[60]"
        title="Simpan / Download File CSS, HTML & JS"
      >
        <Download size={28} />
        {currentExtracted?.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-md">
            {currentExtracted.length}
          </span>
        )}
      </button>

      {/* Modal Overlay Pilihan Simpan IN MAIN LAYOUT */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowSaveModal(false)}>
          <div 
            className="bg-[#0f172a] border border-slate-700 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-white">Simpan Data Ekstrak?</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">Pilih komponen dari URL yang terakhir diekstrak:</p>
            <div className="text-xs text-primary mb-4 p-2 bg-primary/10 rounded border border-primary/20 truncate">{currentExtractUrl}</div>
            
            <div className="flex flex-col gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800 mb-6">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="font-medium text-slate-300 group-hover:text-white transition-colors">Daftar HTML ({htmlResources.length})</span>
                <input type="checkbox" checked={selectedTypes.html} onChange={e => setSelectedTypes({...selectedTypes, html: e.target.checked})} className="w-5 h-5 text-primary rounded bg-slate-800 border-slate-700" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="font-medium text-slate-300 group-hover:text-white transition-colors">Daftar CSS ({cssResources.length})</span>
                <input type="checkbox" checked={selectedTypes.css} onChange={e => setSelectedTypes({...selectedTypes, css: e.target.checked})} className="w-5 h-5 text-primary rounded bg-slate-800 border-slate-700" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="font-medium text-slate-300 group-hover:text-white transition-colors">Daftar JavaScript ({jsResources.length})</span>
                <input type="checkbox" checked={selectedTypes.js} onChange={e => setSelectedTypes({...selectedTypes, js: e.target.checked})} className="w-5 h-5 text-primary rounded bg-slate-800 border-slate-700" />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleSaveToMemory} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex gap-2 justify-center items-center shadow-lg transition-all hover:-translate-y-0.5">
                <Save size={18}/> Simpan ke Memori
              </button>
              <button onClick={handleDownload} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex gap-2 justify-center items-center border border-slate-700 transition-all">
                <Download size={18}/> Download File ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Overlay Button for Phone Preview */}
      <button 
        onClick={() => setShowPhonePreview(true)}
        className="fixed bottom-6 left-6 p-4 bg-primary text-white rounded-full shadow-[0_0_25px_rgba(37,99,235,0.6)] hover:scale-105 transition-transform z-40 focus:outline-none focus:ring-4 focus:ring-primary/50"
      >
        <Smartphone size={28} />
      </button>

      <PhonePreviewOverlay />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid #1e293b'
          }
        }} 
      />
    </AppProvider>
  );
}
