// ─────────────────────────────────────────────────────────
//  THE EVERLASTING VAULT — server.js
//  Production-ready real-time chat server
// ─────────────────────────────────────────────────────────

require('dotenv').config();

const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const helmet   = require('helmet');
const cors     = require('cors');
const path     = require('path');

// ── Mongoose (optional) ──────────────────────────────────
let Message; // Mongoose model — set only if MONGO_URI exists
let useDB = false;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log('[vault] No MONGO_URI found — falling back to in-memory store (last 50 messages).');
    return;
  }
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(uri);
    const messageSchema = new mongoose.Schema({
      username:  { type: String, required: true },
      text:      { type: String, required: true },
      color:     { type: String, default: '#ffffff' },
      timestamp: { type: Date,   default: Date.now },
    });
    Message = mongoose.model('Message', messageSchema);
    useDB = true;
    console.log('[vault] ✅ Connected to MongoDB — messages will persist forever.');
  } catch (err) {
    console.error('[vault] ⚠️  MongoDB connection failed — using in-memory fallback.', err.message);
  }
}

// ── In-memory fallback ───────────────────────────────────
const MAX_MEMORY_MESSAGES = 50;
let memoryMessages = [];

// ── Express + HTTP + Socket.io ───────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 25000,   // heartbeat every 25 s
  pingTimeout:  60000,   // disconnect after 60 s silence
});

// ── Security Headers ─────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // relaxed for CDN imports
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());

// ── Serve static frontend ────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Healthcheck (Stay-Awake Protocol) ────────────────────
app.get('/healthcheck', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Access-code validation endpoint ──────────────────────
const ACCESS_CODE = process.env.ACCESS_CODE || 'Neeku endhuku bro';

app.post('/api/validate', (req, res) => {
  const { code } = req.body;
  if (code === ACCESS_CODE) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Invalid access code.' });
});

// ── Helper: save message ─────────────────────────────────
async function saveMessage(msg) {
  if (useDB) {
    try {
      await new Message(msg).save();
    } catch (e) {
      console.error('[vault] Failed to save message to DB:', e.message);
    }
  } else {
    memoryMessages.push(msg);
    if (memoryMessages.length > MAX_MEMORY_MESSAGES) {
      memoryMessages = memoryMessages.slice(-MAX_MEMORY_MESSAGES);
    }
  }
}

// ── Helper: load history ─────────────────────────────────
async function loadHistory() {
  if (useDB) {
    try {
      return await Message.find().sort({ timestamp: 1 }).limit(200).lean();
    } catch {
      return [];
    }
  }
  return [...memoryMessages];
}

// ── Active users tracker ─────────────────────────────────
const activeUsers = new Map(); // socketId -> { username, color }

// Deterministic color palette for users
const USER_COLORS = [
  '#6ee7b7', '#93c5fd', '#fca5a5', '#fcd34d',
  '#c4b5fd', '#f9a8d4', '#67e8f9', '#fdba74',
  '#a5b4fc', '#86efac', '#fda4af', '#d8b4fe',
];
let colorIndex = 0;
function nextColor() {
  const c = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return c;
}

// ── Socket.io events ─────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[vault] 🔌 Socket connected: ${socket.id}`);

  // ── User joins ──────────────────────────────────────────
  socket.on('user:join', async (username) => {
    const color = nextColor();
    activeUsers.set(socket.id, { username, color });
    socket.emit('user:color', color);

    // Send chat history
    const history = await loadHistory();
    socket.emit('chat:history', history);

    // Broadcast join notice
    io.emit('user:list', Array.from(activeUsers.values()));
    socket.broadcast.emit('chat:system', `${username} joined the vault.`);
    console.log(`[vault] 👤 ${username} joined (${socket.id})`);
  });

  // ── Chat message ────────────────────────────────────────
  socket.on('chat:message', async (text) => {
    const user = activeUsers.get(socket.id);
    if (!user || !text || typeof text !== 'string') return;

    const msg = {
      username:  user.username,
      text:      text.trim().slice(0, 2000), // cap at 2 000 chars
      color:     user.color,
      timestamp: new Date(),
    };
    await saveMessage(msg);
    io.emit('chat:message', msg);
  });

  // ── Typing indicator ───────────────────────────────────
  socket.on('user:typing', (isTyping) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    socket.broadcast.emit('user:typing', {
      username: user.username,
      isTyping,
    });
  });

  // ── Disconnect ──────────────────────────────────────────
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      io.emit('user:list', Array.from(activeUsers.values()));
      io.emit('chat:system', `${user.username} left the vault.`);
      console.log(`[vault] 🚪 ${user.username} disconnected`);
    }
  });
});

// ── Boot ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║   THE EVERLASTING VAULT is running       ║`);
    console.log(`║   http://localhost:${PORT}                  ║`);
    console.log(`╚══════════════════════════════════════════╝\n`);
  });
})();
