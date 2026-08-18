// ============================================================
// SafeED-UP — Vercel Serverless Global Sync Endpoint
// MongoDB Atlas as single source of truth for all devices
// ============================================================

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://SAFEED:Clekhak1701@cluster0.8vmsujy.mongodb.net/safeedup?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
}

// Global Sync Schema — stores all users & institutions as arrays
const SyncStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global_safeed_state' },
    users: { type: Array, default: [] },
    institutions: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, minimize: false }
);

const SyncState = mongoose.models.SyncState || mongoose.model('SyncState', SyncStateSchema);

// In-memory fallback if DB unreachable
let memoryStore = { users: [], institutions: [], updatedAt: new Date().toISOString() };

function mergeUsers(existing, incoming) {
  // Super Admin is NEVER stored in cloud
  const SA_EMAIL = 'superadmin@safeed.ac.in';
  const filtered = incoming.filter(u => u.email !== SA_EMAIL && u.role !== 'SUPER_ADMIN');

  // Build map: _id → user from existing
  const map = {};
  for (const u of existing) {
    if (u._id) map[u._id] = u;
  }
  // Incoming overwrites / adds — never removes existing users
  for (const u of filtered) {
    if (u._id) map[u._id] = u;
  }
  return Object.values(map);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectToDatabase();
  const dbReady = mongoose.connection.readyState === 1;

  try {
    // ── GET: return current global state ──────────────────────────
    if (req.method === 'GET') {
      if (dbReady) {
        const doc = await SyncState.findById('global_safeed_state').lean();
        return res.status(200).json({
          success: true,
          data: {
            users: doc?.users || [],
            institutions: doc?.institutions || [],
            updatedAt: doc?.updatedAt || null,
          },
        });
      }
      return res.status(200).json({ success: true, data: memoryStore });
    }

    // ── POST: merge incoming state into MongoDB ───────────────────
    if (req.method === 'POST') {
      const { users: incomingUsers, institutions: incomingInsts } = req.body || {};

      if (dbReady) {
        // Load existing doc
        const existing = await SyncState.findById('global_safeed_state').lean();
        const existingUsers = existing?.users || [];
        const existingInsts = existing?.institutions || [];

        // Smart merge: never delete users — only add/update
        const mergedUsers = Array.isArray(incomingUsers)
          ? mergeUsers(existingUsers, incomingUsers)
          : existingUsers;

        const mergedInsts = Array.isArray(incomingInsts) && incomingInsts.length > 0
          ? incomingInsts
          : existingInsts;

        const updated = await SyncState.findByIdAndUpdate(
          'global_safeed_state',
          { $set: { users: mergedUsers, institutions: mergedInsts, updatedAt: new Date() } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return res.status(200).json({
          success: true,
          data: { users: updated.users, institutions: updated.institutions, updatedAt: updated.updatedAt },
        });
      }

      // Memory fallback
      if (Array.isArray(incomingUsers)) {
        memoryStore.users = mergeUsers(memoryStore.users, incomingUsers);
      }
      if (Array.isArray(incomingInsts) && incomingInsts.length > 0) {
        memoryStore.institutions = incomingInsts;
      }
      memoryStore.updatedAt = new Date().toISOString();
      return res.status(200).json({ success: true, data: memoryStore });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: err.message });
  }
};
