import React, { useState, useContext } from 'react';
import { AppContext, LinkItem } from '../store/AppContext';
import { ShieldAlert, Plus, Trash2, ExternalLink, ArrowUpCircle, Lock, Unlock, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyLinksView() {
  const { isOwner, currentUser, updateCurrentUser, settings } = useContext(AppContext);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [unlockedLinks, setUnlockedLinks] = useState<Record<number, boolean>>({});
  const [redeemCode, setRedeemCode] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!currentUser) return null;

  const LIMITS = {
    Free: 3,
    Basic: 10,
    VIP: Infinity
  };

  const limit = isOwner ? Infinity : LIMITS[currentUser.tier];
  const canAdd = currentUser.links.length < limit;

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd) {
      setShowUpgradeModal(true);
      return;
    }
    if (!title.trim() || !url.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    let validUrl = url;
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    // Simulate upload progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 15);
      if (p > 90) p = 90;
      setUploadProgress(p);
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      setTimeout(() => {
        const newLink: LinkItem = { 
          title, 
          url: validUrl, 
          password: linkPassword.trim() || undefined,
          createdAt: new Date().toISOString()
        };
        
        updateCurrentUser({
          ...currentUser,
          links: [...currentUser.links, newLink]
        });
        
        setTitle('');
        setUrl('');
        setLinkPassword('');
        setIsUploading(false);
        setUploadProgress(0);
        toast.success('Tautan berhasil ditambahkan!');
      }, 400); // short wait at 100%
    }, 1500); // 1.5 seconds simulated upload
  };

  const handleDelete = (index: number) => {
    const updatedLinks = currentUser.links.filter((_, i) => i !== index);
    updateCurrentUser({ ...currentUser, links: updatedLinks });
    toast.success('Tautan dihapus');
  };

  const contactOwner = () => {
    const text = encodeURIComponent(`Halo Owner, saya ingin menaikkan tier akun (Username: ${currentUser.username}) ke mode Basic/VIP.`);
    window.open(`https://wa.me/${settings.waNumber}?text=${text}`, '_blank');
  };

  const handleUnlockLink = (index: number, actualPassword?: string) => {
    const pwd = prompt("Masukkan password untuk link ini:");
    if (pwd === actualPassword) {
      setUnlockedLinks(prev => ({ ...prev, [index]: true }));
      toast.success("Sandi benar! Link terbuka.");
    } else if (pwd !== null) {
      toast.error("Password salah!");
    }
  };

  const handleRedeemCode = () => {
    const code = redeemCode.trim();
    if (code === settings.codeBasic) {
      updateCurrentUser({ ...currentUser, tier: 'Basic' });
      toast.success('Kode Berhasil! Tier Anda sekarang Basic.');
      setShowUpgradeModal(false);
    } else if (code === settings.codeVip) {
      updateCurrentUser({ ...currentUser, tier: 'VIP' });
      toast.success('Kode Berhasil! Tier Anda sekarang VIP 💎.');
      setShowUpgradeModal(false);
    } else {
      toast.error('Kode Salah atau Tidak Berlaku!');
    }
    setRedeemCode('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 text-slate-200">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-primary/20 flex items-center justify-center rounded-full">
            <ShieldAlert className="text-primary shrink-0" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-xl">Uploud Tautan Pribadi</h3>
            <p className="text-sm opacity-90 text-slate-400">
              Akun <span className="font-bold text-white">{currentUser.username}</span> | 
              Status: <span className="font-bold text-primary">{currentUser.tier}</span>
            </p>
            <p className="text-sm text-slate-400 mt-1">Kuota: {currentUser.links.length} / {limit === Infinity ? 'Unlimited' : limit}</p>
          </div>
        </div>
        {currentUser.tier !== 'VIP' && (
          <button onClick={() => setShowUpgradeModal(true)} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg flex gap-2 items-center font-bold shadow-lg transition-transform hover:scale-105">
            <ArrowUpCircle size={20}/> Naik Pangkat / Klaim
          </button>
        )}
      </div>

      <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
        <h3 className="font-bold text-white mb-4">Tambah Tautan</h3>
        <form onSubmit={handleAddLink} className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Judul (Misal: Video Lucu)" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-slate-500"
            />
            <input 
              type="text" 
              placeholder="URL Tautan (Misal: example.com)" 
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="flex-[2] px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-slate-500"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Password Keamanan URL (Kosongkan jika Publik/No PW)" 
              value={linkPassword}
              onChange={e => setLinkPassword(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder-slate-500"
            />
            <button 
              type="submit" 
              disabled={isUploading}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 flex gap-2 items-center shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-colors justify-center md:w-auto w-full whitespace-nowrap"
            >
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20}/>}
              {isUploading ? 'Uploading...' : 'Simpan ke Vault'}
            </button>
          </div>
        </form>

        {isUploading && (
          <div className="mt-4 relative z-10 w-full bg-slate-900 p-4 border border-slate-700/50 rounded-xl">
            <div className="flex justify-between text-xs text-primary mb-2 font-mono font-bold tracking-wider uppercase">
              <span>System Upload Sequence...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-primary h-2 rounded-full transition-all duration-300 ease-out animate-pulse" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800 relative z-10 backdrop-blur-sm">
        <h3 className="font-bold text-white mb-4">Daftar Tautan Saya</h3>
        {currentUser.links.length === 0 ? (
          <p className="text-slate-500 text-center py-6 border border-dashed border-slate-700 rounded-xl">Belum ada tautan yang ditambahkan.</p>
        ) : (
          <div className="space-y-3">
            {currentUser.links.map((link, i) => {
              const isLocked = link.password && !unlockedLinks[i];
              
              return (
                <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-[#05050a] border border-slate-800 hover:border-primary/50 transition-colors group">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="font-medium text-white truncate flex items-center gap-2">
                       {link.title}
                       {link.password ? (
                         <span className="text-[10px] px-2 py-[2px] bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full font-bold">Dilindungi Password</span>
                       ) : (
                         <span className="text-[10px] px-2 py-[2px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-bold">Tanpa Sandi</span>
                       )}
                    </span>
                    
                    {isLocked ? (
                      <button onClick={() => handleUnlockLink(i, link.password)} className="mt-2 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-800 w-fit px-3 py-1.5 rounded-lg border border-slate-700">
                         <Lock size={14}/> Klik untuk Buka Kunci
                      </button>
                    ) : (
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-primary flex hover:underline truncate mt-1 items-center gap-1">
                        {link.url} <ExternalLink size={12}/>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isLocked && <Lock size={18} className="text-slate-600"/>}
                    {!isLocked && link.password && <Unlock size={18} className="text-emerald-500 opacity-50"/>}
                    <button 
                      onClick={() => handleDelete(i)} 
                      className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                      title="Hapus Tautan"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold text-white mb-2">Upgrade Akun</h2>
              <p className="text-slate-400 mb-6 flex flex-col">
                <span>Dapatkan fitur lebih dengan menaikkan pangkat,</span>
                <span>saat ini <span className="text-white font-bold">{currentUser.tier}</span>.</span>
              </p>

              <div className="space-y-4 mb-6 text-left">
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl">
                  <h4 className="font-bold text-amber-500 text-lg">Tier BASIC 🚀</h4>
                  <p className="text-slate-300 text-sm mt-1">Kuota: <span className="font-bold text-white">10 Tautan</span></p>
                  <p className="text-slate-300 text-sm font-semibold">Harga: Rp {settings.basicPrice}</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-primary p-4 rounded-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                  <h4 className="font-bold text-primary text-lg relative z-10">Tier VIP 💎</h4>
                  <p className="text-slate-300 text-sm mt-1 relative z-10">Kuota: <span className="font-bold text-white">Unlimited (Tanpa Batas)</span></p>
                  <p className="text-slate-300 text-sm font-semibold relative z-10">Harga: Rp {settings.vipPrice}</p>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors">
                  Batal
                </button>
                <button onClick={contactOwner} className="flex-[2] py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-transform hover:-translate-y-1">
                  Beli via WA Owner
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700 text-left">
                <h4 className="text-sm font-bold text-slate-200 mb-2">Sudah Bayar? Masukkan Kode:</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Masukkan kode unik dari owner..."
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-primary placeholder-slate-600"
                  />
                  <button
                    onClick={handleRedeemCode}
                    className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    Klaim Kode
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
