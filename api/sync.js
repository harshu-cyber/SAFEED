// ============================================================
// SafeED-UP — Vercel Serverless Global Sync Endpoint
// Syncs users, institutions, inspections, and complaints in real-time
// across ALL devices visiting https://safeed-ruddy.vercel.app/
// ============================================================

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://SAFEED:Clekhak1701@cluster0.8vmsujy.mongodb.net/safeedup?retryWrites=true&w=majority&appName=Cluster0';

// Global cache for connection reuse across serverless invocations
let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
  } catch (err) {
    console.error('MongoDB connection error in Serverless Sync:', err.message);
  }
}

// Global Sync Schema
const SyncStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global_safeed_state' },
    users: { type: Array, default: [] },
    institutions: { type: Array, default: [] },
    inspections: { type: Array, default: [] },
    complaints: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, minimize: false }
);

const SyncState = mongoose.models.SyncState || mongoose.model('SyncState', SyncStateSchema);

// In-Memory Fallback State (if DB is unreachable)
let memoryStore = {
  users: [],
  institutions: [],
  inspections: [],
  complaints: [],
  updatedAt: new Date().toISOString(),
};

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectToDatabase();

  try {
    if (req.method === 'GET') {
      let doc = null;
      if (mongoose.connection.readyState === 1) {
        doc = await SyncState.findById('global_safeed_state').lean();
      }

      if (doc) {
        return res.status(200).json({
          success: true,
          data: {
            users: doc.users || [],
            institutions: doc.institutions || [],
            inspections: doc.inspections || [],
            complaints: doc.complaints || [],
            updatedAt: doc.updatedAt,
          },
        });
      } else {
        return res.status(200).json({
          success: true,
          data: memoryStore,
        });
      }
    }

    if (req.method === 'POST') {
      const { users, institutions, inspections, complaints } = req.body || {};

      const payload = {
        updatedAt: new Date(),
      };
      if (Array.isArray(users)) payload.users = users;
      if (Array.isArray(institutions)) payload.institutions = institutions;
      if (Array.isArray(inspections)) payload.inspections = inspections;
      if (Array.isArray(complaints)) payload.complaints = complaints;

      if (mongoose.connection.readyState === 1) {
        const updatedDoc = await SyncState.findByIdAndUpdate(
          'global_safeed_state',
          { $set: payload },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return res.status(200).json({
          success: true,
          message: 'Global state synced across all devices.',
          data: updatedDoc,
        });
      } else {
        if (Array.isArray(users)) memoryStore.users = users;
        if (Array.isArray(institutions)) memoryStore.institutions = institutions;
        if (Array.isArray(inspections)) memoryStore.inspections = inspections;
        if (Array.isArray(complaints)) memoryStore.complaints = complaints;
        memoryStore.updatedAt = new Date().toISOString();

        return res.status(200).json({
          success: true,
          message: 'Global state synced in memory.',
          data: memoryStore,
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Serverless Sync error:', err);
    return res.status(500).json({ error: err.message });
  }
};
