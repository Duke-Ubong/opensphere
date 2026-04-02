import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // In-memory DB representing the FastAPI User Model
  let currentUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'marcus_vance',
    email: 'marcus@opensphere.io',
    professional_bio: 'Principal Architect @ OpenSphere. Building the future of vibe-coded systems. Ex-Google, Ex-Meta.',
    is_verified: true,
    exposure_dial: 75,
    nodes: 1242,
    trust_score: 98,
    following: [] as string[],
    credentials: [
      { id: '1', title: 'Senior Systems Architect', issuer: 'OpenSphere', date: '2024' },
      { id: '2', title: 'Distributed Systems Specialization', issuer: 'Stanford', date: '2023' }
    ],
    documents: [
      { id: '1', title: 'Q4 Performance Audit', category: 'Certifications', date: '2024-12-15', status: 'VERIFIED', tags: ['Performance', 'Audit'] },
      { id: '2', title: 'Distributed Ledger Patent', category: 'Publications', date: '2024-10-20', status: 'VERIFIED', tags: ['Blockchain', 'Patent'] },
      { id: '3', title: 'OpenSphere Core Architecture', category: 'Research', date: '2024-08-05', status: 'VERIFIED', tags: ['Architecture', 'Core'] }
    ]
  };

  let posts: any[] = [
    {
      id: 1,
      authorId: 'user-1',
      authorName: 'Marcus Vane',
      author: '@VANE_OPS',
      time: '2m ago',
      content: 'The current obsession with "minimal viable liquidity" is killing the market. We\'re trading depth for perceived velocity.',
      type: 'VIBE',
      isUncensored: true,
      tag: 'ERR_SLIPPAGE_DETECTED',
      intensityScore: 85,
      stats: { comments: 24, reVibes: 12, likes: 182 }
    },
    {
      id: 2,
      authorId: 'user-2',
      authorName: 'Elena Thorne',
      author: '@THORNE_DEV',
      time: '15m ago',
      content: 'Thinking about the intersection of L3 networks and localized gig economies. The latency reduction alone could unlock $4B in untapped trade volume.',
      type: 'VIBE',
      isUncensored: false,
      tag: '01:04:22 // ALPHA // PROTOCOL_UPDATE',
      intensityScore: 35,
      image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=1000',
      stats: { comments: 8, reVibes: 45, likes: 312 }
    },
    {
      id: 10,
      authorId: 'system',
      type: 'SYSTEM',
      title: 'MARKET_PULSE_ALERT',
      content: 'ETH/USD VOLATILITY SPIKE +4.2%\nLIQUIDATION_EVENT_ID: 99283-X\nNODE_HEALTH: 99.98%'
    },
    {
      id: 5,
      authorId: 'user-3',
      authorName: 'Sarah Koto',
      author: '@KOTO_ALPHA',
      time: '42m ago',
      content: 'If we don\'t fix the incentive alignment for decentralized validators, the whole stack is just centralized infrastructure with extra steps.',
      type: 'VIBE',
      isUncensored: false,
      intensityScore: 60,
      stats: { comments: 156, reVibes: 89, likes: 1200 }
    },
    {
      id: 6,
      authorId: 'user-4',
      authorName: 'CEO Hustle',
      author: '@ceo_hustle',
      time: '1h ago',
      content: 'Scaling is a mindset before it\'s a technology. If you can\'t describe your business in 3 characters, it\'s too complex.',
      type: 'VIBE',
      isUncensored: false,
      stats: { comments: 12, reVibes: 12, likes: 45 }
    },
    {
      id: 3,
      authorId: 'system',
      authorName: 'System Log',
      author: '@system_log',
      title: 'Recursive Consensus in Heterogeneous Networks',
      description: 'A framework for ultra-low latency bridging between L1 architectures and private corporate subnets.',
      type: 'GIG',
      category: 'RESEARCH PAPER',
      readTime: '12 MIN READ',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0nzbp34bJyRHhUgdh8ihVwY5OPviaacy9poC_3hjD5SZ9gVPK_Dc38q_j6Ok0DimaqI6IPcwFWvMVkT3fqlQsO6g8-lBErY5ssb0qwq-ZEpx5wVgjr4nquHyxdo13VmiHeSfQFWU1AS8L3BAQcZyBHc1Z9LBY61ZLfJ2ukXsesyomq5vfrTKMfEJsGz37mjP-jbY8dAByg1jVhqyFv9vlD9W3_ZuFBUp1czjWD9tIWy3273T3jJFitt5P9MZ-2l53n5iZXP6EMm-Z'
    },
    {
      id: 4,
      authorId: 'system',
      authorName: 'System Log',
      author: '@system_log',
      title: 'Q3 Growth Ecosystem Report',
      description: 'Summary of OpenSphere\'s expansion into the EMEA market and decentralized identity adoption rates.',
      type: 'GIG',
      category: 'MILESTONE',
      readTime: 'DATA VISUALIZATION',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxoGtN9S_Y9uyfT5FpumEGi_J48sIIRveFux9fgd3euxcUY3dzmNZbpzLrve3O3C3HFH1FMV-4D5P6h6z5GO9ovJb_0Ne0d4I949iQfEiu-2WWX1YHD_bV_YGdXFurFMrXYLPp3AZ9HcCbnNOdytSiS-Zty1ZNZeVtrGAknh78CUmlBi5CONtR_qvtyGloGNOyOqoRq5cpxkvQw_PfPQYz_o9vUZQa49HDspqO-t22eaYeTyFOw01t1nQyCHH0iCebAkK8zHhKhOA5'
    }
  ];

  app.get('/api/users/me', (req, res) => {
    res.json(currentUser);
  });

  app.post('/api/documents', (req, res) => {
    const { title, category, fileData, tags } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const newDoc = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      tags: tags || ['New'],
      fileData // In a real app, we'd save to cloud storage and store the URL
    };

    currentUser.documents.unshift(newDoc);
    res.status(201).json(newDoc);
  });

  app.put('/api/users/me', (req, res) => {
    const { username, professional_bio, is_verified } = req.body;
    if (username !== undefined) currentUser.username = username;
    if (professional_bio !== undefined) currentUser.professional_bio = professional_bio;
    if (is_verified !== undefined) currentUser.is_verified = is_verified;
    res.json(currentUser);
  });

  let lounges: any[] = [
    {
      id: 'lounge-1',
      name: 'Core Architecture Sync',
      creator_id: '123e4567-e89b-12d3-a456-426614174000',
      skill_thresholds: { 'System Design': 85, 'Rust': 70 },
      is_temporary: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'lounge-2',
      name: 'DeFi Alpha Leak',
      creator_id: 'some-other-id',
      skill_thresholds: { 'Smart Contracts': 90, 'Solidity': 80 },
      is_temporary: true,
      created_at: new Date().toISOString()
    }
  ];

  app.get('/api/lounges', (req, res) => {
    res.json(lounges);
  });

  app.post('/api/create_lounge', async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const { name, skill_thresholds, is_temporary } = req.body;
    const newLounge = {
      id: `lounge-${Date.now()}`,
      name,
      creator_id: currentUser.id,
      skill_thresholds,
      is_temporary: is_temporary || false,
      created_at: new Date().toISOString()
    };
    lounges = [newLounge, ...lounges];
    res.json(newLounge);
  });

  app.get('/api/posts', (req, res) => {
    res.json(posts);
  });

  app.post('/api/follow', (req, res) => {
    const { targetId } = req.body;
    if (!targetId) return res.status(400).json({ error: 'Target ID required' });
    
    if (currentUser.following.includes(targetId)) {
      currentUser.following = currentUser.following.filter(id => id !== targetId);
    } else {
      currentUser.following.push(targetId);
    }
    res.json({ following: currentUser.following });
  });

  app.get('/api/feed', (req, res) => {
    // Personalized feed: posts from followed users + system posts
    const feed = posts.filter(post => 
      post.authorId === 'system' || 
      post.authorId === currentUser.id || 
      currentUser.following.includes(post.authorId)
    );
    res.json(feed);
  });

  app.post('/api/posts', async (req, res) => {
    // Simulate async queue processing and AI metadata extraction (Gemini)
    await new Promise(resolve => setTimeout(resolve, 600));

    const { type, content, title, category, image, isUncensored, tag } = req.body;

    // Simulate Gemini AI extraction for VIBE posts
    let generatedTag = tag;
    let intensityScore = 50;
    
    if (type === 'VIBE') {
      if (!generatedTag) {
        // Mock AI tagging based on content keywords
        const keywords = ['liquidity', 'market', 'scale', 'node', 'protocol', 'ai', 'crypto'];
        const found = keywords.find(k => content?.toLowerCase().includes(k));
        generatedTag = found ? `SYS_${found.toUpperCase()}_DETECTED` : 'GENERAL_VIBE';
      }
      intensityScore = isUncensored ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 50) + 10;
    }

    const newPost = {
      id: Date.now(),
      time: 'Just now',
      authorName: currentUser.username,
      author: '@' + currentUser.username.toLowerCase().replace(/\s+/g, '_'),
      type,
      content,
      title,
      category,
      image,
      isUncensored,
      tag: generatedTag,
      intensityScore,
      stats: { comments: 0, reVibes: 0, likes: 0 },
      readTime: type === 'GIG' ? `${Math.max(1, Math.floor((content?.length || 0) / 200))} MIN READ` : undefined,
    };
    
    if (newPost.type === 'GIG' && !newPost.image) {
      newPost.image = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxoGtN9S_Y9uyfT5FpumEGi_J48sIIRveFux9fgd3euxcUY3dzmNZbpzLrve3O3C3HFH1FMV-4D5P6h6z5GO9ovJb_0Ne0d4I949iQfEiu-2WWX1YHD_bV_YGdXFurFMrXYLPp3AZ9HcCbnNOdytSiS-Zty1ZNZeVtrGAknh78CUmlBi5CONtR_qvtyGloGNOyOqoRq5cpxkvQw_PfPQYz_o9vUZQa49HDspqO-t22eaYeTyFOw01t1nQyCHH0iCebAkK8zHhKhOA5';
    }
    
    posts = [newPost, ...posts];
    res.json(newPost);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // --- WebSocket Server for Lounge Real-Time Chat ---
  const wss = new WebSocketServer({ noServer: true });
  const loungeRooms = new Map<string, Set<{ ws: WebSocket, username: string, id: string }>>();

  server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/ws-lounge')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const loungeId = url.searchParams.get('loungeId');
    const username = url.searchParams.get('username') || 'Anonymous';

    if (!loungeId) {
      ws.close();
      return;
    }

    if (!loungeRooms.has(loungeId)) {
      loungeRooms.set(loungeId, new Set());
    }
    
    const room = loungeRooms.get(loungeId)!;
    const clientData = { ws, username, id: Math.random().toString(36).substring(7) };
    room.add(clientData);

    const broadcastPresence = () => {
      const users = Array.from(room).map(c => c.username);
      const msg = JSON.stringify({ type: 'presence', users });
      room.forEach(c => {
        if (c.ws.readyState === WebSocket.OPEN) c.ws.send(msg);
      });
    };

    // Broadcast presence when someone joins
    broadcastPresence();

    // Send system message for join
    const joinMsg = JSON.stringify({
      type: 'system',
      message: {
        id: Math.random().toString(36).substring(7),
        content: `${username} joined the secure channel`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    });
    room.forEach(c => {
      if (c.ws.readyState === WebSocket.OPEN) c.ws.send(joinMsg);
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'chat') {
          const isOtr = parsed.isOtr;
          // OTR messages expire in 30 seconds for demonstration
          const expiresAt = isOtr ? Date.now() + 30000 : null;

          const outMsg = JSON.stringify({
            type: 'chat',
            message: {
              id: Math.random().toString(36).substring(7),
              author: username,
              content: parsed.content,
              attachment: parsed.attachment,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              expiresAt,
              isOtr
            }
          });

          room.forEach(c => {
            if (c.ws.readyState === WebSocket.OPEN) c.ws.send(outMsg);
          });
        } else if (parsed.type === 'typing') {
          const typingMsg = JSON.stringify({
            type: 'typing',
            username: username,
            isTyping: parsed.isTyping
          });
          room.forEach(c => {
            if (c !== clientData && c.ws.readyState === WebSocket.OPEN) c.ws.send(typingMsg);
          });
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      room.delete(clientData);
      broadcastPresence();
      
      // Send system message for leave
      const leaveMsg = JSON.stringify({
        type: 'system',
        message: {
          id: Math.random().toString(36).substring(7),
          content: `${username} left the secure channel`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        }
      });
      room.forEach(c => {
        if (c.ws.readyState === WebSocket.OPEN) c.ws.send(leaveMsg);
      });

      if (room.size === 0) {
        loungeRooms.delete(loungeId);
      }
    });
  });
}

startServer();
