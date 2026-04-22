import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export type ScrapedResource = { type: string; name: string; content: string };
export type ScrapedItem = { url: string; date: string; resources: ScrapedResource[] };

export type LinkItem = { title: string; url: string; password?: string; createdAt?: string };
export type LinkCategory = { id: string; name: string; password?: string; links: LinkItem[]; createdAt?: string };

export type UserTier = 'Free' | 'Basic' | 'VIP';
export type User = {
  username: string;
  password: string;
  tier: UserTier;
  links: LinkItem[];
  isBlocked?: boolean;
  isOwner?: boolean;
  blockReason?: string;
  createdAt?: string;
};

export type CustomTab = {
  id: string;
  label: string;
  icon?: string;
  type: 'url' | 'content';
  value: string;
};

export type AppSettings = {
  waNumber: string;
  waNumber2: string;
  unlockPassword: string;
  basicPrice: string;
  vipPrice: string;
  codeBasic: string;
  codeVip: string;
  codeOwner: string;
  transitionSpeed: number;
  customTabs: CustomTab[];
};

interface AppState {
  isOwner: boolean;
  setIsOwner: (val: boolean) => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  savedScrapes: ScrapedItem[];
  saveScrape: (item: ScrapedItem) => void;
  linkCategories: LinkCategory[];
  saveLinkCategories: (cats: LinkCategory[]) => void;
  showPhonePreview: boolean;
  setShowPhonePreview: (val: boolean) => void;
  
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (user: User) => void;
  deleteUser: (username: string) => Promise<boolean>;
  blockUser: (username: string, reason: string) => Promise<void>;
  unblockUser: (username: string) => Promise<void>;
  
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  currentExtractUrl: string;
  setCurrentExtractUrl: (v: string) => void;
  currentExtracted: ScrapedResource[];
  setCurrentExtracted: (v: ScrapedResource[]) => void;
}

const defaultCats: LinkCategory[] = [
  { id: 'cat-1', name: 'Foto & Video', password: '', links: [] },
  { id: 'cat-2', name: 'File & Dokumen', password: '', links: [] }
];

const defaultSettings: AppSettings = {
  waNumber: '62895627124072',
  waNumber2: '895706826200',
  unlockPassword: 'unlockbarzzx',
  basicPrice: '5.000',
  vipPrice: '15.000',
  codeBasic: 'barzzxbaik',
  codeVip: 'barzzxproff',
  codeOwner: 'barzzxganteng',
  transitionSpeed: 0.3,
  customTabs: []
};

export const AppContext = createContext<AppState>({} as AppState);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isOwner, setIsOwner] = useState(() => localStorage.getItem('isOwnerTemp') === 'true');
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('themeColor') || '#2563eb');
  const [savedScrapes, setSavedScrapes] = useState<ScrapedItem[]>(() => JSON.parse(localStorage.getItem('savedScrapes') || '[]'));
  const [linkCategories, setLinkCategories] = useState<LinkCategory[]>(() => {
    const stored = localStorage.getItem('linkCategories');
    return stored ? JSON.parse(stored) : defaultCats;
  });
  const [showPhonePreview, setShowPhonePreview] = useState(false);
  const [language, setLanguage] = useState<'id' | 'en'>(() => (localStorage.getItem('language') as 'id' | 'en') || 'id');

  // New Auth & Config States
  const [users, setUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('users') || '[]'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const isDeviceBlocked = localStorage.getItem('isDeviceBlocked') === 'true';
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      if (isDeviceBlocked && !user.isOwner) return null; // Force logout if device was blocked later
      return user;
    }
    return null;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('appSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  // Handle device blocking and auto-logout
  useEffect(() => {
    if (currentUser?.isBlocked && !isOwner) {
      localStorage.setItem('isDeviceBlocked', 'true');
      setCurrentUser(null);
    }
    // If owner is logged in, clear device block for safety
    if (isOwner) {
      localStorage.removeItem('isDeviceBlocked');
    }
  }, [currentUser, isOwner]);
  const [currentExtractUrl, setCurrentExtractUrl] = useState('');
  const [currentExtracted, setCurrentExtracted] = useState<ScrapedResource[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/data');
        if (!isMounted) return;
        
        if (res.data.success) {
          setSettings(res.data.settings);
          if (res.data.settings.themeColor) setThemeColor(res.data.settings.themeColor);
          setUsers(res.data.users);
          if (res.data.linkCategories) setLinkCategories(res.data.linkCategories);
          
          const lastUser = localStorage.getItem('last_user_attempt');
          
          // CRITICAL: Accurate Block Detection
          if (currentUser) {
            const fresh = res.data.users.find((u: any) => u.username === currentUser.username);
            if (fresh) {
              // Update local state ONLY if something meaningful changed
              if (fresh.isBlocked !== currentUser.isBlocked || fresh.tier !== currentUser.tier || fresh.isOwner !== currentUser.isOwner) {
                setCurrentUser(fresh);
              }

              // Update device block status
              if (fresh.isBlocked) {
                localStorage.setItem('isDeviceBlocked', 'true');
              } else {
                localStorage.removeItem('isDeviceBlocked');
              }
              
              // Sync owner status if the DB says they are owner
              if (fresh.isOwner) {
                setIsOwner(true);
                localStorage.setItem('isOwnerTemp', 'true');
              }
            } else {
              // Only logout if we are absolutely sure the user is gone
              // (Wait 1 additional cycle to be safe against race conditions)
              console.warn("User not found in broadcast, waiting for sync...");
            }
          } else if (lastUser) {
            const freshTrace = res.data.users.find((u: any) => u.username === lastUser);
            if (!freshTrace || !freshTrace.isBlocked) {
              localStorage.removeItem('isDeviceBlocked');
            } else {
              localStorage.setItem('isDeviceBlocked', 'true');
            }
          }
        }
      } catch (e) {
        console.error("Fetch error:", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); 
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.username]); // Only re-poll logic if the WHO is logged in changes, not every state change

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    document.documentElement.style.setProperty('--primary-color', themeColor);
    
    // Convert hex to RGB for advanced tailwind usage
    const hex = themeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      document.documentElement.style.setProperty('--primary-color-rgb', `${r}, ${g}, ${b}`);
    }
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);
  
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const updateCurrentUser = async (updated: User) => {
    const oldUsername = currentUser?.username;
    setCurrentUser(updated);
    setUsers(users.map(u => u.username === oldUsername ? updated : u));
    try {
      await axios.post('/api/users', { action: 'update', user: updated, oldUsername });
    } catch(e) {
      console.error("Failed to update user globally", e);
    }
  };

  const deleteUser = async (username: string) => {
    try {
      const res = await axios.post('/api/users', { action: 'delete', username });
      if (res.data.success) {
        setUsers(res.data.users);
        if (currentUser?.username === username) {
          setCurrentUser(null);
        }
        return true;
      }
    } catch(e) {
      console.error("Failed to delete user", e);
    }
    return false;
  };

  const blockUser = async (username: string, reason: string) => {
    try {
      const res = await axios.post('/api/users', { action: 'block', username, reason });
      if (res.data.success) {
        setUsers(res.data.users);
        if (currentUser?.username === username) {
           setCurrentUser({ ...currentUser, isBlocked: true, blockReason: reason });
        }
      }
    } catch(e) {
      console.error("Gagal blokir", e);
    }
  };

  const unblockUser = async (username: string) => {
    try {
      const res = await axios.post('/api/users', { action: 'unblock', username });
      if (res.data.success) {
        setUsers(res.data.users);
        if (currentUser?.username === username) {
           setCurrentUser({ ...currentUser, isBlocked: false, blockReason: '' });
        }
      }
    } catch(e) {
      console.error("Gagal unblock", e);
    }
  };

  const saveScrape = (item: ScrapedItem) => {
    const updated = [item, ...savedScrapes];
    setSavedScrapes(updated);
    localStorage.setItem('savedScrapes', JSON.stringify(updated));
  };

  const saveLinkCategories = (cats: LinkCategory[]) => {
    setLinkCategories(cats);
    localStorage.setItem('linkCategories', JSON.stringify(cats));
  };

  return (
    <AppContext.Provider value={{
      isOwner, setIsOwner: (val) => { setIsOwner(val); localStorage.setItem('isOwnerTemp', val ? 'true' : 'false'); },
      themeColor, setThemeColor,
      savedScrapes, saveScrape,
      linkCategories, saveLinkCategories,
      showPhonePreview, setShowPhonePreview,
      users, setUsers,
      currentUser, setCurrentUser, updateCurrentUser, deleteUser,
      blockUser, unblockUser,
      language, setLanguage,
      settings, setSettings,
      currentExtractUrl, setCurrentExtractUrl,
      currentExtracted, setCurrentExtracted
    }}>
      {children}
    </AppContext.Provider>
  );
};
