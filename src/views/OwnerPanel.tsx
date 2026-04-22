import React, { useState, useContext } from 'react';
import { AppContext, LinkCategory, UserTier } from '../store/AppContext';
import { Plus, Trash2, Save, Palette, Users, Settings as SettingsIcon, Link as LinkIcon, Eye, EyeOff, Lock, Unlock, Ban, CheckCircle, Activity, X, List, Crown } from 'lucide-react';
import { cn } from '../components/Sidebar';
import toast from 'react-hot-toast';
import axios from 'axios';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

export default function OwnerPanel() {
  const { themeColor, setThemeColor, linkCategories, saveLinkCategories, users, setUsers, settings, setSettings, currentUser, setCurrentUser, deleteUser, blockUser, unblockUser } = useContext(AppContext);
  const [cats, setCats] = useState<LinkCategory[]>(linkCategories);
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync with context if it changes from polling
  React.useEffect(() => {
    setCats(linkCategories);
    setLocalSettings(settings);
  }, [linkCategories, settings]);

  const [activeTab, setActiveTab] = useState<'vault' | 'users' | 'settings' | 'navigation' | 'owners'>('vault');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [shownPasswords, setShownPasswords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const stats = React.useMemo(() => {
    const totalUsers = users.length;
    const totalOwners = users.filter(u => u.isOwner).length;
    const totalLinks = users.reduce((acc, u) => acc + u.links.length, 0) + cats.reduce((acc, c) => acc + c.links.length, 0);
    const blockedUsers = users.filter(u => u.isBlocked).length;
    const totalCategories = cats.length;
    
    const tiers = {
      free: users.filter(u => u.tier === 'Free').length,
      basic: users.filter(u => u.tier === 'Basic').length,
      vip: users.filter(u => u.tier === 'VIP').length,
    };

    return { totalUsers, totalOwners, totalLinks, blockedUsers, totalCategories, tiers };
  }, [users, cats]);

  // Processing Chart Data (Accurate Growth)
  const chartData = React.useMemo(() => {
    const dailyData: Record<string, { date: string; users: number; links: number; rawDate: string }> = {};
    const today = new Date();
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const raw = d.toISOString().split('T')[0];
      dailyData[raw] = { date: key, users: 0, links: 0, rawDate: raw };
    }

    users.forEach(u => {
      const uDate = u.createdAt ? u.createdAt.split('T')[0] : '';
      if (uDate && dailyData[uDate]) {
        dailyData[uDate].users += 1;
      } else if (!uDate) {
        // Fallback for old data: put in the oldest visible slot
        const oldestKey = Object.keys(dailyData).sort()[0];
        dailyData[oldestKey].users += 1;
      }
      
      u.links.forEach(l => {
        const lDate = l.createdAt ? l.createdAt.split('T')[0] : (u.createdAt ? u.createdAt.split('T')[0] : '');
        if (lDate && dailyData[lDate]) {
          dailyData[lDate].links += 1;
        } else if (!lDate) {
          const oldestKey = Object.keys(dailyData).sort()[0];
          dailyData[oldestKey].links += 1;
        }
      });
    });

    return Object.values(dailyData).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [users]);

  const togglePassword = (username: string) => {
    setShownPasswords(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const handleDeleteUser = async (username: string) => {
    if (confirm(`HAPUS TOTAL akun ${username}? Semua data link kustomnya akan hilang permanen!`)) {
       const success = await deleteUser(username);
       if (success) toast.success(`Akun ${username} telah dimusnahkan!`);
    }
  };

  const handleBlockUser = async (username: string) => {
    const reason = prompt(`Alasan blokir untuk ${username}:`, "Melanggar aturan barzzx.");
    if (reason !== null) {
      await blockUser(username, reason);
      toast.success(`${username} Diblokir!`);
    }
  };

  const handleUnblockUser = async (username: string) => {
    await unblockUser(username);
    toast.success(`Blokir ${username} dibuka!`);
  };

  const handleAddCategory = () => {
    setCats([...cats, { id: Date.now().toString(), name: 'New Category', password: '', links: [] }]);
  };

  const handleCategoryChange = (id: string, field: string, value: string) => {
    setCats(cats.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      setCats(cats.filter(c => c.id !== id));
    }
  };

  const handleAddLink = (categoryId: string) => {
    setCats(cats.map(c => {
      if (c.id === categoryId) {
        return { ...c, links: [...c.links, { title: 'New Link', url: 'https://' }] };
      }
      return c;
    }));
  };

  const handleLinkChange = (categoryId: string, linkIndex: number, field: string, value: string) => {
    setCats(cats.map(c => {
      if (c.id === categoryId) {
        const newLinks = [...c.links];
        newLinks[linkIndex] = { ...newLinks[linkIndex], [field]: value };
        return { ...c, links: newLinks };
      }
      return c;
    }));
  };

  const handleDeleteLink = (categoryId: string, linkIndex: number) => {
    setCats(cats.map(c => {
      if (c.id === categoryId) {
        return { ...c, links: c.links.filter((_, i) => i !== linkIndex) };
      }
      return c;
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const p1 = axios.post('/api/categories', { categories: cats });
      const p2 = axios.post('/api/settings', { ...localSettings, themeColor });
      
      const res = await Promise.all([p1, p2]);
      
      if (res[0].data.success && res[1].data.success) {
         saveLinkCategories(cats);
         setSettings(res[1].data.settings);
         toast.success("Konfigurasi Owner disimpan secara Global!");
      }
    } catch(e) {
      toast.error("Gagal menyimpan ke server");
    }
  };

  const handleChangeTier = async (username: string, tier: UserTier) => {
    const updatedUser = users.find(u => u.username === username);
    if (!updatedUser) return;
    updatedUser.tier = tier;
    
    try {
       const res = await axios.post('/api/users', { action: 'update', user: updatedUser });
       if (res.data.success) {
          setUsers(res.data.users);
          if (currentUser?.username === username) {
             setCurrentUser(res.data.users.find((u:any) => u.username === username) || null);
          }
          toast.success(`Pangkat ${username} telah diubah menjadi ${tier}`);
       }
    } catch(e) {
       toast.error("Gagal mengubah tier user");
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Accurate Stats Briefing */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Member</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-white">{stats.totalUsers}</span>
            <span className="text-xs text-slate-400 mb-1">Orang</span>
          </div>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Tautan</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-primary">{stats.totalLinks}</span>
            <span className="text-xs text-slate-400 mb-1">Links</span>
          </div>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Akun Diblokir</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-rose-500">{stats.blockedUsers}</span>
            <span className="text-xs text-slate-400 mb-1">User</span>
          </div>
        </div>
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Public Hub</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-amber-500">{stats.totalCategories}</span>
            <span className="text-xs text-slate-400 mb-1">Kategori</span>
          </div>
        </div>
      </div>

      {/* Accurate Growth Chart */}
      <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-700"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2">
              <Activity size={18} className="text-primary"/> Grafik Pertumbuhan Akurat
            </h3>
            <p className="text-slate-500 text-xs">Statistik pendaftaran member & tautan 7 hari terakhir.</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"></div> <span className="text-slate-400">MEMBER</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-slate-400">LINK</span></div>
          </div>
        </div>
        
        <div className="h-[250px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={themeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={themeColor} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLinks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #1e293b', 
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#fff',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ padding: '0' }}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke={themeColor} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorUsers)" 
                name="Member Baru"
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="links" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorLinks)" 
                name="Tautan Baru"
                animationDuration={2500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-2">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50 text-[10px] font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          <span className="text-slate-400">FREE: {stats.tiers.free}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-[10px] font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
          <span className="text-amber-500">BASIC: {stats.tiers.basic}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-[10px] font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
          <span className="text-purple-400">VIP: {stats.tiers.vip}</span>
        </div>
      </div>

      {/* Sub-Navigation for Owner Panel */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2 custom-scrollbar">
        <button onClick={() => setActiveTab('vault')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold flex gap-2 items-center transition-all ${activeTab==='vault'?'bg-primary text-white':'text-slate-400 hover:bg-slate-800'}`}><LinkIcon size={18}/> Kategori Vault</button>
        <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold flex gap-2 items-center transition-all ${activeTab==='users'?'bg-primary text-white':'text-slate-400 hover:bg-slate-800'}`}><Users size={18}/> Member & Pangkat</button>
        <button onClick={() => setActiveTab('owners')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold flex gap-2 items-center transition-all ${activeTab==='owners'?'bg-primary text-white':'text-slate-400 hover:bg-slate-800'}`}><Crown size={18} className="text-amber-500"/> Kelola Owner</button>
        <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold flex gap-2 items-center transition-all ${activeTab==='settings'?'bg-primary text-white':'text-slate-400 hover:bg-slate-800'}`}><SettingsIcon size={18}/> Harga & Tema</button>
        <button onClick={() => setActiveTab('navigation')} className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold flex gap-2 items-center transition-all ${activeTab==='navigation'?'bg-primary text-white':'text-slate-400 hover:bg-slate-800'}`}><List size={18}/> Navigasi Kustom</button>
      </div>

      {activeTab === 'owners' && (
        <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Crown size={24} className="text-amber-500"/> Manajemen Owner
                </h2>
                <p className="text-sm text-slate-400 mt-1">Daftar akun yang memiliki akses Owner Panel.</p>
              </div>
              <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <span className="text-sm font-bold text-amber-500">Total Owner: {stats.totalOwners}</span>
              </div>
           </div>

           <div className="space-y-3">
              {users.filter(u => u.isOwner).length === 0 ? (
                <p className="text-slate-500 text-center py-6">Belum ada owner tambahan.</p>
              ) : (
                users.filter(u => u.isOwner).map(u => (
                  <div key={u.username} className="bg-[#05050a] border border-slate-800 rounded-xl p-4 flex justify-between items-center group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Crown size={20}/>
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{u.username}</h4>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">Role: Primary Owner Account</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={async () => {
                           if (confirm(`Copot status owner dari ${u.username}?`)) {
                             try {
                               await axios.post('/api/users', { action: 'update', user: { ...u, isOwner: false } });
                               toast.success(`Status Owner dicopot dari ${u.username}`);
                             } catch(e) {
                               toast.error("Gagal mencopot status owner");
                             }
                           }
                         }}
                         className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg text-xs font-bold transition-all"
                       >
                         Copot Status
                       </button>
                       <button 
                         onClick={() => handleDeleteUser(u.username)}
                         className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                         title="Hapus Akun Owner"
                       >
                         <Trash2 size={16}/>
                       </button>
                    </div>
                  </div>
                ))
              )}
           </div>

           <div className="mt-8 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
              <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Peringatan Keamanan</h5>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                Setiap akun yang login melalui tombol "Login Sebagai Owner" di halaman utama akan otomatis terdaftar di sini. 
                Owner memiliki akses penuh untuk menghapus user, mengubah harga, dan memblokir perangkat. 
                Pastikan Anda hanya memberikan akses kepada orang yang terpercaya.
              </p>
           </div>
        </div>
      )}
      {activeTab === 'navigation' && (
        <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Navigasi Kustom (Tabs)</h2>
              <p className="text-sm text-slate-400 mt-1">Tambah kategori sidebar kustom untuk mempermudah akses user.</p>
            </div>
            <button 
              onClick={() => setLocalSettings({
                ...localSettings, 
                customTabs: [...(localSettings.customTabs || []), { id: Date.now().toString(), label: 'Tab Baru', type: 'url', value: 'https://' }]
              })} 
              className="px-4 py-2 bg-primary text-white rounded-lg flex gap-2 items-center text-sm font-medium hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              <Plus size={16}/> Tambah Tab
            </button>
          </div>

          <div className="space-y-4">
            {(localSettings.customTabs || []).length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                <p className="text-slate-500 text-sm">Belum ada tab kustom.</p>
              </div>
            )}
            {(localSettings.customTabs || []).map((tab, idx) => (
              <div key={tab.id} className="p-4 bg-[#05050a] border border-slate-800 rounded-xl space-y-4 shadow-inner">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Label Menu</label>
                    <input 
                      type="text" 
                      value={tab.label}
                      onChange={e => {
                        const newTabs = [...localSettings.customTabs];
                        newTabs[idx].label = e.target.value;
                        setLocalSettings({...localSettings, customTabs: newTabs});
                      }}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Tipe Konten</label>
                    <select 
                      value={tab.type}
                      onChange={e => {
                        const newTabs = [...localSettings.customTabs];
                        newTabs[idx].type = e.target.value as any;
                        setLocalSettings({...localSettings, customTabs: newTabs});
                      }}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-sm outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="url">Link Eksternal (Redirect)</option>
                      <option value="content">Halaman Kustom (Markdown)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        const newTabs = localSettings.customTabs.filter((_, i) => i !== idx);
                        setLocalSettings({...localSettings, customTabs: newTabs});
                      }}
                      className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">
                    {tab.type === 'url' ? 'Link Tujuan (https://...)' : 'Konten Halaman (Markdown/HTML)'}
                  </label>
                  {tab.type === 'url' ? (
                    <input 
                      type="text" 
                      value={tab.value}
                      onChange={e => {
                        const newTabs = [...localSettings.customTabs];
                        newTabs[idx].value = e.target.value;
                        setLocalSettings({...localSettings, customTabs: newTabs});
                      }}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <textarea 
                      value={tab.value}
                      onChange={e => {
                        const newTabs = [...localSettings.customTabs];
                        newTabs[idx].value = e.target.value;
                        setLocalSettings({...localSettings, customTabs: newTabs});
                      }}
                      rows={4}
                      className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-sm outline-none focus:ring-1 focus:ring-primary custom-scrollbar"
                      placeholder="# Judul Halaman\nKetik konten di sini..."
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
             <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex gap-2 items-center font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-colors">
                <Save size={20}/> Simpan Navigasi
             </button>
          </div>
        </div>
      )}
      {activeTab === 'vault' && (
        <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Manage Link Categories</h2>
            <button onClick={handleAddCategory} className="px-4 py-2 bg-primary text-white rounded-lg flex gap-2 items-center text-sm font-medium hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              <Plus size={16}/> Add Category
            </button>
          </div>

          <div className="space-y-6">
            {cats.map((cat, i) => (
              <div key={cat.id} className="border border-slate-700 rounded-xl p-4 bg-[#05050a]">
                 <div className="flex flex-col md:flex-row gap-4 mb-4">
                   <div className="flex-1">
                     <label className="text-xs font-semibold text-slate-400 uppercase">Category Name (Tautan)</label>
                     <input 
                       type="text" 
                       value={cat.name} 
                       onChange={e => handleCategoryChange(cat.id, 'name', e.target.value)}
                       className="w-full mt-1 px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded focus:ring-2 focus:ring-primary outline-none transition-all placeholder-slate-600"
                     />
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between items-end">
                       <label className="text-xs font-semibold text-slate-400 uppercase">Password Kategori</label>
                       {cat.password && (
                         <button onClick={() => handleCategoryChange(cat.id, 'password', '')} className="text-[10px] text-rose-400 hover:text-rose-300">
                           [Hapus Sandi = Publik]
                         </button>
                       )}
                     </div>
                     <input 
                       type="text" 
                       placeholder="Kosongkan untuk Publik (Tanpa Sandi)"
                       value={cat.password || ''} 
                       onChange={e => handleCategoryChange(cat.id, 'password', e.target.value)}
                       className="w-full mt-1 px-3 py-2 border border-slate-700 bg-slate-900 text-white rounded focus:ring-2 focus:ring-primary outline-none transition-all placeholder-slate-600"
                     />
                   </div>
                   <div className="flex items-end">
                     <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20 transition-colors">
                       <Trash2 size={20}/>
                     </button>
                   </div>
                 </div>

                 <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-sm text-slate-200">Links</h4>
                      <button onClick={() => handleAddLink(cat.id)} className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-medium transition-colors">
                        + Add Link
                      </button>
                    </div>
                    {cat.links.length === 0 && <p className="text-slate-500 text-xs py-2">No links added.</p>}
                    <div className="space-y-2">
                      {cat.links.map((link, j) => (
                        <div key={j} className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            placeholder="Title" 
                            value={link.title} 
                            onChange={e => handleLinkChange(cat.id, j, 'title', e.target.value)}
                            className="flex-1 px-2 py-1 border border-slate-700 bg-slate-900 text-white rounded text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder-slate-600"
                          />
                          <input 
                            type="text" 
                            placeholder="URL" 
                            value={link.url} 
                            onChange={e => handleLinkChange(cat.id, j, 'url', e.target.value)}
                            className="flex-[2] px-2 py-1 border border-slate-700 bg-slate-900 text-white rounded text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder-slate-600"
                          />
                          <button onClick={() => handleDeleteLink(cat.id, j)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
             <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex gap-2 items-center font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-colors">
                <Save size={20}/> Save Vault
             </button>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
          <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Daftar Member & Pangkat</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Live Sync</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">Data sinkron otomatis setiap 3 detik.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="text" 
                placeholder="Cari Username..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg whitespace-nowrap">
                <span className="text-sm font-bold text-primary">Total: {users.length} Orang</span>
              </div>
            </div>
          </div>
          {filteredUsers.length === 0 ? (
            <p className="text-slate-500 text-center py-6">Member tidak ditemukan.</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(u => (
                <div key={u.username} className="bg-[#05050a] border border-slate-800 rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4">
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg">{u.username}</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] font-mono text-slate-400">
                          {shownPasswords[u.username] ? u.password : '••••••••'}
                          <button onClick={() => togglePassword(u.username)} className="hover:text-white">
                            {shownPasswords[u.username] ? <EyeOff size={14}/> : <Eye size={14}/>}
                          </button>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 mt-1">Tautan Diupload: <span className="font-bold text-slate-300">{u.links.length}</span></span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400 hidden sm:inline">Pangkat:</span>
                        <select 
                          value={u.tier} 
                          onChange={(e) => handleChangeTier(u.username, e.target.value as UserTier)}
                          className="px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer text-sm"
                        >
                          <option value="Free">Free (3 Limit)</option>
                          <option value="Basic">Basic (10 Limit)</option>
                          <option value="VIP">VIP (Tanpa Batas)</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => u.isBlocked ? handleUnblockUser(u.username) : handleBlockUser(u.username)}
                          className={`p-2 rounded-lg transition-all shadow-sm ${u.isBlocked ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white'}`}
                          title={u.isBlocked ? "Buka Blokir" : "Blokir Akun"}
                        >
                          {u.isBlocked ? <CheckCircle size={16}/> : <Ban size={16}/>}
                        </button>
                        <button 
                          onClick={() => setExpandedUser(expandedUser === u.username ? null : u.username)}
                          className={`flex gap-2 items-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${expandedUser === u.username ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          {expandedUser === u.username ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.username)}
                          className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          title="Hapus Akun Total"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedUser === u.username && (
                    <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                      <h4 className="font-bold text-sm px-2 text-primary mb-3">Isi Vault Tautan {u.username}:</h4>
                      {u.links.length === 0 ? (
                        <p className="text-xs text-slate-500 px-2">Tidak ada tautan disimpan.</p>
                      ) : (
                        <div className="space-y-2">
                          {u.links.map((link, j) => (
                            <div key={j} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-[#0a0a16] border border-slate-800 rounded-lg gap-2">
                              <div className="flex flex-col truncate">
                                <span className="text-sm font-bold text-white truncate">{link.title}</span>
                                <a href={link.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate mt-0.5">{link.url}</a>
                              </div>
                              <div className="shrink-0">
                                {link.password ? (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-md">
                                    <Lock size={12} className="text-rose-500"/>
                                    <span className="text-xs font-semibold text-rose-500">Sandi: {link.password}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                                    <Unlock size={12} className="text-emerald-500"/>
                                    <span className="text-xs font-semibold text-emerald-500">Tanpa Sandi</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Palette size={22} className="text-primary"/>
                  Luxury Theme Configuration
                </h2>
                <p className="text-slate-400 text-sm">Sesuaikan identitas visual website Anda.</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-white/5">
                <input 
                  type="color" 
                  value={themeColor} 
                  onChange={e => setThemeColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Master Picker</span>
                  <span className="text-xs font-mono text-primary uppercase font-bold">{themeColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manual Color Definitions</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 mb-1 block">Hex Code</span>
                    <input 
                      type="text"
                      value={themeColor}
                      onChange={e => setThemeColor(e.target.value)}
                      placeholder="#000000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    * Warna ini akan diaplikasikan ke seluruh elemen utama seperti Tombol, Border Aktif, Ikon, dan Aksen Gampingan.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preset Designer Themes</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {name: 'Cyber Blue', color: '#3b82f6'},
                    {name: 'Neon Green', color: '#10b981'},
                    {name: 'Royal Purple', color: '#a855f7'},
                    {name: 'Crimson Red', color: '#ef4444'},
                    {name: 'Sun Orange', color: '#f97316'},
                    {name: 'Electric Pink', color: '#ec4899'},
                    {name: 'Gold Lux', color: '#eab308'},
                    {name: 'Slate Tech', color: '#64748b'}
                  ].map(t => (
                    <button
                      key={t.color}
                      onClick={() => setThemeColor(t.color)}
                      className="group flex flex-col items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <div 
                        className="w-full aspect-square rounded-md border border-white/10 group-hover:scale-110 transition-transform shadow-lg"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
             <h2 className="text-xl font-bold mb-4 text-white">Animasi & Transisi</h2>
             <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Kecepatan Transisi Halaman (Detik)</label>
                    <div className="flex items-center gap-4 mt-1">
                      <input 
                        type="range" 
                        min="0.1" 
                        max="2.0" 
                        step="0.1"
                        value={localSettings.transitionSpeed} 
                        onChange={e => setLocalSettings({...localSettings, transitionSpeed: parseFloat(e.target.value)})}
                        className="flex-1 accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono text-primary w-12">{localSettings.transitionSpeed}s</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">* Semakin kecil angka, semakin cepat perpindahan antar tab.</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-2xl shadow-lg border border-slate-800">
             <h2 className="text-xl font-bold mb-4 text-white">Manajemen Upgrade Model & Harga</h2>
             <div className="space-y-4">
                 <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">WhatsApp 1 (Utama)</label>
                    <input 
                      type="text" 
                      value={localSettings.waNumber} 
                      onChange={e => setLocalSettings({...localSettings, waNumber: e.target.value})}
                      className="w-full mt-1 px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder-slate-600"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">WhatsApp 2 (Cadangan)</label>
                    <input 
                      type="text" 
                      value={localSettings.waNumber2} 
                      onChange={e => setLocalSettings({...localSettings, waNumber2: e.target.value})}
                      className="w-full mt-1 px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder-slate-600"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">* Gunakan format internasional tanpa '+', misal: 62812345678</p>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Harga Mode Basic</label>
                    <input 
                      type="text" 
                      value={localSettings.basicPrice} 
                      onChange={e => setLocalSettings({...localSettings, basicPrice: e.target.value})}
                      className="w-full mt-1 px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder-slate-600"
                      placeholder="e.g. 5.000"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Harga Mode VIP</label>
                    <input 
                      type="text" 
                      value={localSettings.vipPrice} 
                      onChange={e => setLocalSettings({...localSettings, vipPrice: e.target.value})}
                      className="w-full mt-1 px-4 py-2 border border-slate-700 bg-slate-900 text-white rounded-lg focus:ring-2 focus:ring-primary outline-none placeholder-slate-600"
                      placeholder="e.g. 15.000"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Pengaturan Kata Sandi & Kode</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase">Sandi Basic (Top Up)</label>
                      <input 
                        type="text" 
                        value={localSettings.codeBasic} 
                        onChange={e => setLocalSettings({...localSettings, codeBasic: e.target.value})}
                        className="w-full mt-1 px-4 py-2 border border-slate-700 bg-slate-900 text-amber-500 font-bold rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase">Sandi VIP (Top Up)</label>
                      <input 
                        type="text" 
                        value={localSettings.codeVip} 
                        onChange={e => setLocalSettings({...localSettings, codeVip: e.target.value})}
                        className="w-full mt-1 px-4 py-2 border border-slate-700 bg-slate-900 text-purple-400 font-bold rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-rose-400 uppercase">Sandi Rahasia OWNER</label>
                      <input 
                        type="text" 
                        value={localSettings.codeOwner} 
                        onChange={e => setLocalSettings({...localSettings, codeOwner: e.target.value})}
                        className="w-full mt-1 px-4 py-2 border border-rose-900/50 bg-slate-900 text-rose-500 font-bold rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                        placeholder="Default: barzzxganteng"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-emerald-400 uppercase">Sandi Buka Blokir Manual (Untuk User)</label>
                    <input 
                      type="text" 
                      value={localSettings.unlockPassword} 
                      onChange={e => setLocalSettings({...localSettings, unlockPassword: e.target.value})}
                      className="w-full mt-1 px-4 py-2 border border-emerald-900/50 bg-slate-900 text-emerald-500 font-bold rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. unlockbarzzx"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 italic">* User bisa memasukkan sandi ini sendiri tombol "Buka Blokir Manual" jika Bos sudah membagikannya.</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg flex gap-2 items-center font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-colors">
                      <Save size={20}/> Simpan Pengaturan
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
