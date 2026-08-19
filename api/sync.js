// ============================================================
// SafeED-UP — Self-Contained Standalone Serverless Sync Endpoint
// Pure Mongoose - Zero external module dependencies (no bcryptjs requirement)
// ============================================================
const mongoose = require('mongoose');

let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return { ok: true };
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
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
    return { ok: false, reason: `MongoDB Atlas connection error (${err.message}). Ensure 0.0.0.0/0 IP access in Atlas.` };
  }
}

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  phone: String,
  password: String,
  role: { type: String, default: 'INSPECTION_OFFICER' },
  district: String,
  designation: String,
  department: String,
  employeeId: String,
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true });

const instSchema = new mongoose.Schema({
  name: String,
  type: String,
  district: String,
  registrationNumber: String,
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Institution = mongoose.models.Institution || mongoose.model('Institution', instSchema);

module.exports = async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const conn = await connectDB();
    if (!conn.ok) return res.status(500).json({ success: false, error: conn.reason });

    if (req.method === 'GET') {
      const users = await User.find({}).select('-password').lean();
      const institutions = await Institution.find({}).lean();
      return res.status(200).json({ success: true, data: { users, institutions } });
    }

    if (req.method === 'POST') {
      const { action, payload } = req.body || {};

      if ((action === 'CREATE_USER' || action === 'createUser') && payload) {
        const emailLow = payload.email?.toLowerCase()?.trim();
        if (!emailLow) {
          return res.status(400).json({ success: false, error: 'Email address is required.' });
        }
        const existing = await User.findOne({ email: emailLow });
        if (existing) {
          return res.status(400).json({ success: false, error: `User with email '${emailLow}' already exists in MongoDB Atlas.` });
        }
        await User.create({
          name: payload.name || payload.officialName || 'Official User',
          email: emailLow,
          password: payload.password || payload.phone || 'SafeED@2026',
          role: payload.role || 'INSPECTION_OFFICER',
          district: payload.district || 'Lucknow',
          designation: payload.designation || 'Sub-Inspector',
          department: payload.department || 'UP Police',
          isActive: payload.isActive !== false,
          phone: payload.phone || undefined,
          employeeId: payload.badgeNumber || undefined,
        });
      } else if ((action === 'UPDATE_USER' || action === 'updateUser') && payload) {
        const targetId = payload._id || payload.id;
        const query = targetId && mongoose.Types.ObjectId.isValid(targetId) ? { _id: targetId } : { email: payload.email?.toLowerCase() };
        await User.findOneAndUpdate(query, { $set: payload }, { new: true });
      } else if ((action === 'TOGGLE_USER' || action === 'toggleUserStatus') && payload) {
        const targetId = payload.id || payload._id;
        const query = targetId && mongoose.Types.ObjectId.isValid(targetId) ? { _id: targetId } : { email: payload.email?.toLowerCase() };
        const u = await User.findOne(query);
        if (u) {
          u.isActive = !u.isActive;
          await u.save();
        }
      } else if ((action === 'DELETE_USER' || action === 'deleteUser') && payload) {
        const targetId = payload.id || payload._id;
        const query = targetId && mongoose.Types.ObjectId.isValid(targetId) ? { _id: targetId } : { email: payload.email?.toLowerCase() };
        await User.deleteOne(query);
      } else if ((action === 'CREATE_INSTITUTION' || action === 'createInstitution') && payload) {
        await Institution.create(payload);
      } else if ((action === 'UPDATE_INSTITUTION' || action === 'updateInstitution') && payload) {
        const targetId = payload._id || payload.id;
        if (targetId) await Institution.findByIdAndUpdate(targetId, { $set: payload });
      } else if ((action === 'DELETE_INSTITUTION' || action === 'deleteInstitution') && payload) {
        const targetId = payload.id || payload._id;
        if (targetId) await Institution.deleteOne({ _id: targetId });
      }

      const users = await User.find({}).select('-password').lean();
      const institutions = await Institution.find({}).lean();
      return res.status(200).json({ success: true, data: { users, institutions } });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(500).json({ success: false, error: `Server error: ${err.message}` });
  }
};
