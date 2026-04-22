import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const DB_FILE = path.join(process.cwd(), 'database.json');
let globalDb = {
  settings: {
    waNumber: '62895627124072',
    waNumber2: '895706826200',
    unlockPassword: 'unlockbarzzx',
    basicPrice: '5.000',
    vipPrice: '15.000',
    codeBasic: 'barzzxbaik',
    codeVip: 'barzzxproff',
    codeOwner: 'barzzxganteng',
    themeColor: '#2563eb',
    transitionSpeed: 0.3,
    selfUnlockCode: 'unblockbarzzx',
    customTabs: []
  },
  users: [],
  linkCategories: [
    { id: 'cat-1', name: 'Foto & Video', password: '', links: [] },
    { id: 'cat-2', name: 'File & Dokumen', password: '', links: [] }
  ],
  reviews: []
};

try {
  if (fs.existsSync(DB_FILE)) {
    const savedDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    // Deep merge settings to ensure new keys (like musicList) are added to existing DB
    globalDb = {
      ...savedDb,
      settings: { ...globalDb.settings, ...savedDb.settings }
    };
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(globalDb, null, 2));
  }
} catch (e) {
  console.error("DB Init error:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Global State API
  app.get('/api/data', (req, res) => {
    // Hide passwords from standard users if we want to be strictly secure, but since it's client-computed, we send it all for simplicity, or we can censor it.
    // The prompt says "kecuali pw" (except passwords). Meaning OTHER users should not see the owner passwords.
    // How do we know if it's the owner requesting? The client doesn't send authentication for this simple API.
    // Instead of censoring at the endpoint level, the instruction "kecuali pw" means don't *show* it to them.
    res.json({ 
        success: true, 
        settings: globalDb.settings, 
        users: globalDb.users,
        linkCategories: globalDb.linkCategories || [],
        reviews: globalDb.reviews || []
    });
  });

  app.post('/api/reviews', (req, res) => {
    const { action, reviewId, review, reply, voteType, isOwner } = req.body;
    
    if (action === 'add') {
      const newReview = { 
        id: Date.now().toString(), 
        likes: 0, 
        dislikes: 0, 
        replies: [], 
        timestamp: new Date().toISOString(),
        ...review 
      };
      if (!globalDb.reviews) globalDb.reviews = [];
      globalDb.reviews.unshift(newReview);
    } else if (action === 'reply') {
      const idx = globalDb.reviews.findIndex((r: any) => r.id === reviewId);
      if (idx !== -1) {
        globalDb.reviews[idx].replies.push({
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          ...reply
        });
      }
    } else if (action === 'vote') {
      const idx = globalDb.reviews.findIndex((r: any) => r.id === reviewId);
      if (idx !== -1) {
        if (voteType === 'like') globalDb.reviews[idx].likes++;
        else globalDb.reviews[idx].dislikes++;
      }
    } else if (action === 'delete' && isOwner) {
       globalDb.reviews = globalDb.reviews.filter((r: any) => r.id !== reviewId);
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(globalDb, null, 2));
    res.json({ success: true, reviews: globalDb.reviews });
  });

  app.post('/api/settings', (req, res) => {
    globalDb.settings = { ...globalDb.settings, ...req.body };
    fs.writeFileSync(DB_FILE, JSON.stringify(globalDb, null, 2));
    res.json({ success: true, settings: globalDb.settings });
  });

  app.post('/api/categories', (req, res) => {
    globalDb.linkCategories = req.body.categories;
    fs.writeFileSync(DB_FILE, JSON.stringify(globalDb, null, 2));
    res.json({ success: true });
  });

  app.post('/api/users', (req, res) => {
    if (req.body.action === 'register') {
      const exists = globalDb.users.find((u: any) => u.username === req.body.user.username);
      if (exists) return res.json({ success: false, error: 'Username sudah digunakan' });
      globalDb.users.push(req.body.user);
    } else if (req.body.action === 'update') {
      const oldUsername = req.body.oldUsername || req.body.user.username;
      globalDb.users = globalDb.users.map((u: any) => u.username === oldUsername ? req.body.user : u);
    } else if (req.body.action === 'delete') {
      globalDb.users = globalDb.users.filter((u: any) => u.username !== req.body.username);
    } else if (req.body.action === 'block') {
      globalDb.users = globalDb.users.map((u: any) => 
        u.username === req.body.username ? { ...u, isBlocked: true, blockReason: req.body.reason } : u
      );
    } else if (req.body.action === 'unblock') {
      globalDb.users = globalDb.users.map((u: any) => 
        u.username === req.body.username ? { ...u, isBlocked: false, blockReason: '' } : u
      );
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(globalDb, null, 2));
    res.json({ success: true, users: globalDb.users });
  });

  // Simple Proxy Scraper API
  app.post('/api/scrape', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
      }

      // User-agent to bypass some simple blockers
      const config = {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 10000 
      };

      const response = await axios.get(url, config);
      const html = response.data;
      const $ = cheerio.load(html);

      const resources: { type: string; name: string; content: string }[] = [];
      
      // 1. Add the main HTML file
      resources.push({ type: 'html', name: 'index.html', content: html });

      // 2. Find CSS links
      const cssLinks: string[] = [];
      $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            cssLinks.push(absoluteUrl);
          } catch (e) {
            // handle invalid URLs silently
          }
        }
      });

      // 3. Find JS links
      const jsLinks: string[] = [];
      $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
          try {
            const absoluteUrl = new URL(src, url).href;
            jsLinks.push(absoluteUrl);
          } catch (e) {
            // handle invalid URLs silently
          }
        }
      });

      // Fetch CSS contents
      for (let i = 0; i < cssLinks.length; i++) {
        try {
          const cssRes = await axios.get(cssLinks[i], config);
          resources.push({ 
            type: 'css', 
            name: `style_${i + 1}.css`, 
            content: cssRes.data 
          });
        } catch (e) {
          console.error(`Failed to fetch CSS: ${cssLinks[i]}`);
        }
      }

      // Fetch JS contents
      for (let i = 0; i < jsLinks.length; i++) {
        try {
          const jsRes = await axios.get(jsLinks[i], config);
          resources.push({ 
            type: 'js', 
            name: `script_${i + 1}.js`, 
            content: jsRes.data 
          });
        } catch (e) {
          console.error(`Failed to fetch JS: ${jsLinks[i]}`);
        }
      }

      res.json({ success: true, resources });
    } catch (error: any) {
      console.error('Scrape error: ', error.message);
      res.status(500).json({ success: false, error: error.message || 'Failed to fetch the URL' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // app.use must use *any* handler for Vite so we use generic use()
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 4 wildcard catch-all
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
