import React, { useState, useContext } from 'react';
import { AppContext, User } from '../store/AppContext';
import { Shield, UserPlus, LogIn, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'motion/react';

export default function AuthView() {
  const { users, setUsers, setCurrentUser, setIsOwner } = useContext(AppContext);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleOwnerLogin = async () => {
    const ownerName = prompt("Masukkan Nama Owner:");
    if (!ownerName) return;
    const ownerPw = prompt("Masukkan Kata Sandi Owner:");
    if (ownerPw === "barzzxganteng") {
      setIsOwner(true);
      const ownerUser: User = {
        username: ownerName,
        password: ownerPw,
        tier: 'VIP' as const,
        links: [],
        isBlocked: false,
        isOwner: true,
        createdAt: new Date().toISOString()
      };
      
      // Update or create owner in global users
      const existingUser = users.find(u => u.username === ownerName);
      if (existingUser) {
        await axios.post('/api/users', { action: 'update', user: { ...existingUser, isOwner: true } });
      } else {
        await axios.post('/api/users', { action: 'register', user: ownerUser });
      }

      setCurrentUser({...ownerUser, isOwner: true});
      toast.success(`Selamat Datang kembali, Owner ${ownerName}!`);
    } else if (ownerPw !== null) {
      toast.error("Kata sandi owner salah!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localStorage.getItem('isDeviceBlocked') === 'true') {
      toast.error('PERANGKAT ANDA TELAH DIBLOKIR TOTAL!', { duration: 5000 });
      return;
    }

    if (!username.trim() || !password.trim()) {
      toast.error('Username dan password tidak boleh kosong!');
      return;
    }

    if (isLogin) {
      const u = users.find(u => u.username === username && u.password === password);
      if (u) {
        localStorage.setItem('last_user_attempt', username);
        if (u.isBlocked) {
          localStorage.setItem('isDeviceBlocked', 'true');
          toast.error(`AKUN "${u.username}" DIBLOKIR: ${u.blockReason || 'Melanggar aturan.'}`, { duration: 6000 });
          return;
        }
        setCurrentUser(u);
        toast.success(`Selamat datang, ${u.username}!`);
      } else {
        toast.error('Akun tidak ditemukan atau password salah.');
      }
    } else {
      if (localStorage.getItem('isDeviceBlocked') === 'true') {
        toast.error('PERANGKAT ANDA TERBLOKIR! Tidak bisa membuat akun baru.', { duration: 5000 });
        return;
      }
      localStorage.setItem('last_user_attempt', username);
      const exists = users.find(u => u.username === username);
      if (exists) {
        toast.error('Username sudah digunakan!');
      } else {
        const newUser = {
          username,
          password,
          tier: 'Free' as const,
          links: [],
          isBlocked: false,
          createdAt: new Date().toISOString()
        };
        try {
          const res = await axios.post('/api/users', { action: 'register', user: newUser });
          if (res.data.success) {
            setUsers(res.data.users);
            setCurrentUser(newUser);
            toast.success('Pendaftaran berhasil! Akun Anda terbuat.');
          } else {
            toast.error(res.data.error || 'Gagal mendaftar');
          }
        } catch (e) {
          toast.error("Gagal terhubung ke server");
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] p-4 font-sans text-slate-200 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-soft"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-10 relative overflow-hidden group premium-shadow"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-indigo-400 to-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-[0_0_30px_rgba(var(--primary-color-rgb),0.2)] mb-6 rotate-3 transform group-hover:rotate-0 transition-all duration-500">
            <Shield size={40} className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary-color-rgb),0.5)]" />
          </div>
          <h2 className="text-3xl font-display font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 mb-2">
            BARZZX <span className="text-primary">TOOLS</span>
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">{isLogin ? 'Authentication Required' : 'Establish New Identity'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Universal Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-black/40 border border-white/5 text-white rounded-xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder-slate-700 font-medium"
              placeholder="e.g. ShadowRunner"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Cipher</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-black/40 border border-white/5 text-white rounded-xl focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder-slate-700 font-medium"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest flex justify-center items-center gap-3 shadow-[0_10px_20px_-5px_rgba(var(--primary-color-rgb),0.4)] transition-all hover:scale-[1.02] active:scale-95 group/btn overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
            {isLogin ? <><LogIn size={18}/> Authorize</> : <><UserPlus size={18}/> Initialize</>}
          </button>

          {isLogin && (
            <button 
              type="button"
              onClick={handleOwnerLogin}
              className="w-full py-3 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white rounded-xl font-bold uppercase tracking-widest flex justify-center items-center gap-2 border border-amber-500/20 transition-all text-[10px]"
            >
              <Crown size={14}/> Login Sebagai Owner
            </button>
          )}
        </form>

        <div className="mt-10 text-center pt-8 border-t border-white/5">
          <p className="text-slate-500 text-sm font-medium">
            {isLogin ? "No identity found? " : "Already established? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:text-white font-bold transition-all underline underline-offset-4 decoration-primary/30 hover:decoration-primary"
            >
              {isLogin ? "Create One Free" : "Authorize Now"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
