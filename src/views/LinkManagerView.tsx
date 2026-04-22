import React, { useState, useContext } from 'react';
import { AppContext, LinkCategory, LinkItem } from '../store/AppContext';
import { Lock, Unlock, ExternalLink, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../components/Sidebar';

export default function LinkManagerView() {
  const { linkCategories, isOwner } = useContext(AppContext);
  const [unlockedCategories, setUnlockedCategories] = useState<Record<string, boolean>>({});

  const handleUnlock = (categoryId: string, actualPassword?: string) => {
    if (!actualPassword) {
      // If no password set by owner, just unlock
      setUnlockedCategories(prev => ({ ...prev, [categoryId]: true }));
      return;
    }
    const pwd = prompt("Enter password to access this category:");
    if (pwd === actualPassword) {
      setUnlockedCategories(prev => ({ ...prev, [categoryId]: true }));
      toast.success("Unlocked successfully!");
    } else if (pwd !== null) {
      toast.error("Incorrect password!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-xl flex gap-3 text-blue-200 shadow-sm">
        <Shield className="shrink-0 text-primary" />
        <div>
          <h3 className="font-bold text-white">Secure Links Vault</h3>
          <p className="text-sm opacity-90">Store private links (e.g. Mediafire, Drive) organized by category. Some categories may require a password to view.</p>
        </div>
      </div>

      {linkCategories.length === 0 ? (
        <div className="text-center p-12 bg-[#0f172a] rounded-2xl border border-dashed border-slate-700">
          <p className="text-slate-400">No categories created yet.</p>
          {isOwner && <p className="text-sm text-slate-500 mt-2">Go to the Owner Panel to create some.</p>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {linkCategories.map(cat => {
            const isUnlocked = isOwner || !cat.password || unlockedCategories[cat.id];
            
            return (
              <div key={cat.id} className="bg-[#0f172a] rounded-xl shadow-lg border border-slate-800 p-5 flex flex-col transition-all hover:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-white">{cat.name}</h3>
                  <div className="flex items-center gap-2">
                    {cat.password && !isUnlocked && <><span className="text-xs text-rose-500 font-medium">Terkunci</span><Lock size={18} className="text-rose-500"/></>}
                    {cat.password && isUnlocked && <><span className="text-xs text-emerald-500 font-medium">Terbuka</span><Unlock size={18} className="text-emerald-500"/></>}
                    {!cat.password && <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-medium">Publik (Tanpa Sandi)</span>}
                  </div>
                </div>

                {!isUnlocked ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <p className="text-slate-400 text-sm mb-4">This category is password protected.</p>
                    <button 
                      onClick={() => handleUnlock(cat.id, cat.password)}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg flex gap-2 items-center hover:bg-slate-700 font-medium transition-colors border border-slate-700"
                    >
                      <Lock size={16}/> Unlock to View
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2">
                    {cat.links.length === 0 ? (
                      <p className="text-sm text-slate-500 py-2">No links in this category.</p>
                    ) : (
                      cat.links.map((link, i) => (
                        <a 
                          key={i} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex justify-between items-center p-3 rounded-lg bg-[#05050a] border border-slate-800 hover:border-primary hover:bg-primary/5 transition-colors text-slate-300 hover:text-white group"
                        >
                          <span className="font-medium truncate mr-2">{link.title}</span>
                          <ExternalLink size={16} className="shrink-0 text-slate-500 group-hover:text-primary transition-colors"/>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
