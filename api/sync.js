// ============================================================
// SafeED-UP — Real-Time MongoDB Atlas Production Sync Endpoint
// Direct Serverless Mongoose Persistence — Single Source of Truth
// Trigger Vercel Build: 2026-08-19 Live Production Deployment
// ============================================================
const mongoose = require('mongoose');

let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return { ok: true };
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.warn('MongoDB Atlas URI (process.env.MONGODB_URI) is not configured.');
    return { ok: false, reason: 'MONGODB_URI is not set in Vercel Environment Variables. Please add it and Redeploy.' };
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    return { ok: true };
  } catch (err) {
    console.error('MongoDB Atlas Connect Error:', err.message);
    return { ok: false, reason: `MongoDB Atlas connection error (${err.message}). Please check MongoDB Atlas Network Access (allow 0.0.0.0/0) and password.` };
  }
}

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: String,
  district: String,
  state: String,
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Institution Schema & Model
const instSchema = new mongoose.Schema({
  name: String,
  type: String,
  district: String,
  state: String,
  safetyScore: Number,
  complianceStatus: String,
}, { strict: false, timestamps: true });

const Institution = mongoose.models.Institution || mongoose.model('Institution', instSchema);

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const conn = await connectDB();
    if (!conn.ok) {
      return res.status(500).json({
        success: false,
        error: conn.reason,
      });
    }

    // Check if purge requested
    if (req.query.purge === 'true' || req.body?.purge === true) {
      await Institution.deleteMany({});
      await User.deleteMany({ email: { $ne: 'superadmin@safeed.ac.in' } });
      return res.status(200).json({
        success: true,
        message: 'MongoDB Atlas permanently purged of all demo data. Only Super Admin remains.',
      });
    }

    if (req.method === 'GET') {
      const users = await User.find({}).select('-password -refreshToken').lean();
      const institutions = await Institution.find({}).lean();

      return res.status(200).json({
        success: true,
        data: {
          users,
          institutions,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    if (req.method === 'POST') {
      const { action, payload, users, institutions } = req.body || {};

      if (action === 'CREATE_USER' && payload) {
        const emailLow = payload.email?.toLowerCase();
        const existing = await User.findOne({ email: emailLow });
        if (existing) {
          return res.status(400).json({ success: false, error: 'A user with this email already exists in MongoDB Atlas.' });
        }
        await User.create(payload);
      }
      else if (action === 'UPDATE_USER' && payload) {
        const { _id, email, ...updates } = payload;
        if (email === 'superadmin@safeed.ac.in') {
          return res.status(403).json({ success: false, error: 'Super Admin account cannot be modified.' });
        }
        await User.findOneAndUpdate(
          { $or: [{ _id }, { email: email?.toLowerCase() }] },
          { $set: updates }
        );
      }
      else if (action === 'TOGGLE_USER' && payload?.id) {
        const u = await User.findById(payload.id) || await User.findOne({ email: String(payload.id).toLowerCase() });
        if (u && u.email !== 'superadmin@safeed.ac.in') {
          u.isActive = !u.isActive;
          await u.save();
        }
      }
      else if (action === 'DELETE_USER' && payload?.id) {
        const u = await User.findById(payload.id) || await User.findOne({ email: String(payload.id).toLowerCase() });
        if (u && u.email !== 'superadmin@safeed.ac.in') {
          await User.deleteOne({ _id: u._id });
        }
      }
      else if (action === 'CREATE_INSTITUTION' && payload) {
        await Institution.create(payload);
      }
      else if (action === 'UPDATE_INSTITUTION' && payload) {
        const { _id, ...updates } = payload;
        await Institution.findByIdAndUpdate(_id, { $set: updates });
      }
      else if (action === 'DELETE_INSTITUTION' && payload?.id) {
        await Institution.deleteOne({ $or: [{ _id: payload.id }, { safeId: payload.id }] });
      }
      else if (Array.isArray(users) || Array.isArray(institutions)) {
        if (Array.isArray(users)) {
          for (const u of users) {
            if (u.email && u.email !== 'superadmin@safeed.ac.in') {
              await User.findOneAndUpdate(
                { email: u.email.toLowerCase() },
                { $set: u },
                { upsert: true, new: true }
              );
            }
          }
        }
        if (Array.isArray(institutions)) {
          for (const inst of institutions) {
            if (inst.name) {
              await Institution.findOneAndUpdate(
                { name: inst.name },
                { $set: inst },
                { upsert: true, new: true }
              );
            }
          }
        }
      }

      const allUsers = await User.find({}).select('-password -refreshToken').lean();
      const allInsts = await Institution.find({}).lean();

      return res.status(200).json({
        success: true,
        message: 'MongoDB Atlas operation successful.',
        data: {
          users: allUsers,
          institutions: allInsts,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
