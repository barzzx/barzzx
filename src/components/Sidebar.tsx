import React, { useContext } from 'react';
import { AppContext } from '../store/AppContext';
import { 
  DownloadCloud, Component, Settings, X, ShieldAlert, UploadCloud, 
  LogOut, User, Crown, Activity, Radar, Key, Ghost, Palette, 
  MessageSquare, Eye, EyeOff, Trash2, Edit2, Share2, List, MoreHorizontal
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar({ isOpen, setIsOpen, currentTab, setCurrentTab }: any) {
  const { isOwner, setIsOwner, currentUser, setCurrentUser, deleteUser, updateCurrentUser, users, settings, language } = useContext(AppContext);
  const [showPw, setShowPw] = React.useState(false);

  const transitionSpeed = settings.transitionSpeed || 0.3;

  const loc = {
    scraper: language === 'id' ? 'Extractor Web barzzx' : 'Web Extractor barzzx',
    myLinks: language === 'id' ? 'Upload Saya' : 'My Uploads',
    publicVault: language === 'id' ? 'Brankas Publik' : 'Public Vault',
    community: language === 'id' ? 'Sinyal Komunitas' : 'Community Signals',
    stegano: language === 'id' ? 'Lab Steganografi' : 'Steganography Lab',
    speed: language === 'id' ? 'Uji Kecepatan' : 'Speed Network',
    scanner: language === 'id' ? 'Radar Sistem' : 'System Radar',
    crypto: language === 'id' ? 'Alat Rahasia' : 'Secret Tools',
    ownerPanel: language === 'id' ? 'Panel Owner' : 'Owner Panel',
    colorHub: language === 'id' ? 'Pusat Tema' : 'Theme Center',
    logout: language === 'id' ? 'Keluar Akun' : 'Logout System',
    ganti: language === 'id' ? 'Ganti Akun' : 'Switch Account',
  };

  const handleDeleteSelf = async () => {
    if (!currentUser) return;
    if (confirm("HAPUS TOTAL AKUN ANDA? Semua link di vault Anda akan lenyap dan akun tidak bisa kembali lagi!")) {
      const success = await deleteUser(currentUser.username);
      if (success) {
        window.location.reload();
      }
    }
  };

  const handleEditProfile = async () => {
    if (!currentUser) return;
    const newName = prompt("Ganti Nama Pengguna (Username):", currentUser.username);
    if (newName === null) return;
    
    if (newName.trim() === "") {
        return toast.error("Nama tidak boleh kosong!");
    }

    if (newName !== currentUser.username) {
        const exists = users.find(u => u.username.toLowerCase() === newName.toLowerCase());
        if (exists) return toast.error("Username sudah digunakan orang lain!");
    }

    const newPw = prompt("Ganti Kata Sandi (Password):", currentUser.password);
    if (newPw === null) return;

    if (newPw.trim().length < 4) {
        return toast.error("Sandi minimal 4 karakter!");
    }

    const updated = { ...currentUser, username: newName, password: newPw };
    await updateCurrentUser(updated);
    toast.success("Profil berhasil diperbarui!");
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link web berhasil disalin!", {
       icon: '🌐',
       style: {
         borderRadius: '10px',
         background: '#333',
         color: '#fff',
       },
    });
  };

  type SidebarTab = {
    id: string;
    label: string;
    icon: any;
    isCustom?: boolean;
    type?: 'url' | 'content';
    value?: string;
  };

  const tabs: SidebarTab[] = [
    { id: 'scraper', label: loc.scraper, icon: DownloadCloud },
    { id: 'my-links', label: loc.myLinks, icon: UploadCloud },
    { id: 'links', label: loc.publicVault, icon: ShieldAlert },
    { id: 'community', label: loc.community, icon: MessageSquare },
    { id: 'stegano', label: loc.stegano, icon: Ghost },
    { id: 'speed-test', label: loc.speed, icon: Activity },
    { id: 'scanner', label: loc.scanner, icon: Radar },
    { id: 'crypto', label: loc.crypto, icon: Key },
  ];

  const customTabs = settings.customTabs || [];
  const mergedTabs: SidebarTab[] = [...tabs];
  
  if (customTabs.length > 0) {
    customTabs.forEach((ct: any) => {
      mergedTabs.push({ 
        id: ct.id, 
        label: ct.label, 
        icon: ct.type === 'url' ? Share2 : List,
        isCustom: true,
        type: ct.type,
        value: ct.value
      });
    });
  }

  if (isOwner) {
     mergedTabs.push({ id: 'color-hub', label: 'Color Hub (VIP)', icon: Palette });
     mergedTabs.push({ id: 'owner', label: 'Owner Panel', icon: Settings });
  }

  const handleSecretClick = () => {
    if (isOwner) return;
    const pwd = prompt("Masukkan kata sandi Owner (barzzx):");
    if (pwd === "barzzxganteng") {
      setIsOwner(true);
      setCurrentTab('owner');
      setIsOpen(false);
      alert("Selamat Datang, Owner barzzx!");
    } else if (pwd !== null) {
      alert("Kata sandi salah!");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionSpeed }}
            className="fixed inset-0 bg-black/70 z-40 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={false}
        animate={{ x: (isOpen || window.innerWidth >= 768) ? 0 : -256 }}
        transition={{ 
          duration: transitionSpeed,
          ease: "easeInOut"
        }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-[#0a0a16] border-r border-slate-800 shadow-xl z-50 flex flex-col md:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5 relative">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Core System</span>
            <h2 className="font-display font-black text-xl text-white uppercase tracking-tighter flex items-center gap-2">
              BARZZX <span className="text-primary italic">X</span>
            </h2>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}><X/></button>
          
          <div onClick={handleSecretClick} className="absolute right-0 top-0 w-12 h-12 cursor-default opacity-0 hover:bg-primary/5 rounded-bl-full z-10"></div>
        </div>
        
        {isOwner && (
          <div className="px-6 py-4">
            <div className="bg-primary/5 border border-primary/20 text-primary py-2 px-3 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(var(--primary-color-rgb),0.1)]">
              <Crown size={14} className="animate-pulse"/> Authenticated Owner
            </div>
          </div>
        )}

        <div className="flex-1 py-6 flex flex-col gap-1 px-4 overflow-y-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-2">Navigation Rail</span>
          {mergedTabs.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { 
                if (tab.type === 'url') {
                  window.open(tab.value, '_blank');
                } else {
                  setCurrentTab(tab.id); 
                }
                setIsOpen(false); 
              }} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left group relative overflow-hidden", 
                currentTab === tab.id 
                  ? "bg-primary text-white shadow-[0_10px_20px_-5px_rgba(var(--primary-color-rgb),0.3)]" 
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <tab.icon size={18} className={cn("transition-colors", currentTab === tab.id ? "text-white" : "text-slate-600 group-hover:text-primary")} /> 
              <span className="text-xs uppercase tracking-wider">{tab.label}</span>
              {currentTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                />
              )}
            </button>
          ))}
          
          {isOwner && (
            <>
              <button 
                onClick={() => { setCurrentTab('owner'); setIsOpen(false); }} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left group relative", 
                  currentTab === 'owner' ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-amber-500/10 hover:text-amber-500"
                )}
              >
                <ShieldAlert size={18} />
                <span className="text-xs uppercase tracking-wider">{loc.ownerPanel}</span>
              </button>
              <button 
                onClick={() => { setCurrentTab('colors'); setIsOpen(false); }} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left group relative", 
                  currentTab === 'colors' ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-500"
                )}
              >
                <Palette size={18} />
                <span className="text-xs uppercase tracking-wider">{loc.colorHub}</span>
              </button>
            </>
          )}
        </div>
        {currentUser && (
          <div className="p-6 border-t border-white/5 bg-slate-950/50 flex flex-col gap-4">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                 <User size={24}/>
               </div>
               <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-black text-sm text-white truncate">{currentUser.username}</h4>
                </div>
                 <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-500 font-bold uppercase tracking-tighter">
                     {currentUser.tier}
                   </span>
                   <button 
                     onClick={() => setShowPw(!showPw)} 
                     className="flex items-center gap-1.5 text-slate-600 hover:text-white transition-colors group/pw"
                     title="Lihat Kata Sandi"
                   >
                     {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                     <span className="text-[8px] font-bold uppercase tracking-tighter hidden group-hover/pw:inline">Lihat Kata Sandi</span>
                   </button>
                 </div>
               </div>
             </div>

             <div className="space-y-2">
               <button 
                 onClick={handleEditProfile}
                 className="flex items-center gap-2 justify-center w-full py-2.5 bg-white/5 text-slate-300 hover:bg-emerald-500 hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:border-emerald-500/50"
               >
                 <Edit2 size={14}/> Ganti Nama dan Sandi
               </button>

               <button 
                 onClick={handleShareLink}
                 className="group flex items-center gap-2 justify-center w-full py-2.5 bg-white/5 text-slate-300 hover:bg-primary hover:text-white transition-all rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:border-primary/50"
               >
                 <Share2 size={14} className="group-hover:scale-110 transition-transform"/> Deploy Referral
               </button>
               
               <div className="grid grid-cols-2 gap-2">
                 <button 
                   onClick={handleDeleteSelf}
                   className="flex items-center gap-2 justify-center py-2.5 bg-red-500/5 text-red-500/50 hover:bg-red-500 hover:text-white transition-all rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-500/10"
                 >
                   Hapus Akun
                 </button>
                 <button 
                   onClick={() => { setCurrentUser(null); window.location.reload(); }} 
                   className="flex items-center gap-2 justify-center py-2.5 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition-all rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5"
                 >
                   Ganti Akun
                 </button>
               </div>
             </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
