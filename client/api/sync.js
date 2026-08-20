// ============================================================
// SafeED-UP — Self-Contained Standalone Serverless Sync Endpoint (ESM)
// Pure Mongoose - Zero external module dependencies (no bcryptjs requirement)
// ============================================================
import mongoose from 'mongoose';

let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return { ok: true };
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://safeedadmin:Safeed2026@safeed.mewsypb.mongodb.net/safeedup?retryWrites=true&w=majority&appName=safeed';
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
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

const complaintSchema = new mongoose.Schema({
  complaintTicket: String,
  institutionName: String,
  category: String,
  status: String,
}, { strict: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Institution = mongoose.models.Institution || mongoose.model('Institution', instSchema);
const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

function getParsedBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
}

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const conn = await connectDB();
    if (!conn.ok) {
      return res.status(200).json({ success: false, error: conn.reason });
    }

    if (req.method === 'GET') {
      const users = await User.find({}).select('-password').lean();
      const institutions = await Institution.find({}).lean();
      const complaints = await Complaint.find({}).lean();
      return res.status(200).json({ success: true, data: { users, institutions, complaints } });
    }

    if (req.method === 'POST') {
      const body = getParsedBody(req);
      const { action, payload } = body || {};

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
          assignedPortal: payload.assignedPortal || payload.role || 'INSPECTION_OFFICER',
          district: payload.district || 'Lucknow',
          designation: payload.designation || 'Sub-Inspector',
          department: payload.department || 'UP Police',
          isActive: payload.isActive !== false,
          phone: payload.phone || undefined,
          employeeId: payload.badgeNumber || payload.employeeId || undefined,
          badgeNumber: payload.badgeNumber || payload.employeeId || undefined,
          dcpZone: payload.dcpZone || undefined,
          postingStation: payload.postingStation || payload.nearestPoliceStation || undefined,
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
      } else if ((action === 'CREATE_INSTITUTION' || action === 'createInstitution' || action === 'registerInstitution') && payload) {
        try {
          await Institution.collection.dropIndex('safeId_1').catch(() => {});
        } catch (e) {}

        const instData = { ...payload };
        if (instData._id && typeof instData._id === 'string' && instData._id.startsWith('inst_')) {
          delete instData._id;
        }
        if (!instData.name && instData.institutionName) {
          instData.name = instData.institutionName;
        }
        if (!instData.type && instData.institutionType) {
          instData.type = instData.institutionType;
        }
        if (!instData.affiliationBoard && instData.board) {
          instData.affiliationBoard = instData.board;
        }
        const districtStr = instData.district || 'Lucknow';
        const districtCode = districtStr.slice(0, 3).toUpperCase();
        if (!instData.safeId || instData.safeId === 'null' || instData.safeId === 'undefined') {
          instData.safeId = `SAFE-UP-${districtCode}-${Math.floor(100000 + Math.random() * 900000)}`;
        }
        if (!instData.address) {
          instData.address = `${districtStr}, Uttar Pradesh`;
        } else if (typeof instData.address === 'object') {
          instData.address = instData.address.street || `${districtStr}, Uttar Pradesh`;
        }
        if (!instData.principal) {
          instData.principal = instData.principalName || instData.contactName || 'Principal';
        }
        if (!instData.contact) {
          instData.contact = instData.phone || '';
        }
        if (!instData.email && instData.contactPerson?.email) {
          instData.email = instData.contactPerson.email;
        }
        const rawZ = String(instData.zone || instData.assignedInspectorZone || 'CENTRAL').toLowerCase();
        let zoneStr = 'CENTRAL';
        if (rawZ.includes('west')) zoneStr = 'WEST';
        else if (rawZ.includes('north')) zoneStr = 'NORTH';
        else if (rawZ.includes('east')) zoneStr = 'EAST';
        else if (rawZ.includes('south')) zoneStr = 'SOUTH';
        else zoneStr = 'CENTRAL';

        instData.zone = zoneStr;
        instData.assignedInspector = `DCP ${zoneStr}`;
        instData.assignedInspectorZone = zoneStr;
        instData.assignedInspectorEmail = `dcp${zoneStr.toLowerCase()}@safeedup.gov.in`;

        const filter = instData.email ? { email: instData.email.toLowerCase() } : { name: instData.name };
        await Institution.findOneAndUpdate(filter, { $set: instData }, { upsert: true, new: true });
      } else if ((action === 'UPDATE_INSTITUTION' || action === 'updateInstitution') && payload) {
        const targetId = payload._id || payload.id;
        if (targetId) await Institution.findByIdAndUpdate(targetId, { $set: payload });
      } else if ((action === 'DELETE_INSTITUTION' || action === 'deleteInstitution') && payload) {
        const targetId = payload.id || payload._id;
        if (targetId) await Institution.deleteOne({ _id: targetId });
      }

      const users = await User.find({}).select('-password').lean();
      const institutions = await Institution.find({}).lean();
      const complaints = await Complaint.find({}).lean();
      return res.status(200).json({ success: true, data: { users, institutions, complaints } });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    return res.status(200).json({ success: false, error: `Server error: ${err.stack || err.message}` });
  }
}
