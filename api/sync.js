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
          await Institution.collection.dropIndex('udiseCode_1').catch(() => {});
        } catch (e) {}

        const rawInst = { ...payload };
        if (rawInst._id && typeof rawInst._id === 'string' && rawInst._id.startsWith('inst_')) {
          delete rawInst._id;
        }

        const districtStr = rawInst.district || 'Lucknow';
        const districtCode = districtStr.slice(0, 3).toUpperCase();
        const udiseCodeStr = rawInst.udiseCode || `09${Math.floor(1000000000 + Math.random() * 8999999999)}`;
        const rawZ = String(rawInst.zone || rawInst.assignedInspectorZone || 'CENTRAL').toLowerCase();
        let zoneStr = 'CENTRAL';
        if (rawZ.includes('west')) zoneStr = 'WEST';
        else if (rawZ.includes('north')) zoneStr = 'NORTH';
        else if (rawZ.includes('east')) zoneStr = 'EAST';
        else if (rawZ.includes('south')) zoneStr = 'SOUTH';
        else zoneStr = 'CENTRAL';

        const instName = rawInst.name || rawInst.institutionName || 'Institution';
        const emailStr = (rawInst.email || rawInst.contactPerson?.email || '').toLowerCase().trim();
        const phoneStr = rawInst.phone || rawInst.contact || rawInst.contactPerson?.phone || '';
        const principalStr = rawInst.principal || rawInst.principalName || rawInst.contactPerson?.name || 'Principal';

        const canonicalInst = {
          ...rawInst,
          name: instName,
          type: (rawInst.type || rawInst.institutionType || 'SCHOOL').toUpperCase(),
          affiliationBoard: rawInst.board || rawInst.affiliationBoard || 'CBSE',
          affiliationCode: rawInst.affiliationCode || '',
          udiseCode: udiseCodeStr,
          district: districtStr,
          state: rawInst.state || 'Uttar Pradesh',
          zone: zoneStr,
          address: typeof rawInst.address === 'object' ? rawInst.address : {
            street: typeof rawInst.address === 'string' && rawInst.address ? rawInst.address : `${districtStr} Main Road`,
            district: districtStr,
            state: rawInst.state || 'Uttar Pradesh'
          },
          contactPerson: {
            name: principalStr,
            email: emailStr,
            phone: phoneStr
          },
          principal: principalStr,
          contact: phoneStr,
          email: emailStr,
          phone: phoneStr,
          totalStudents: parseInt(rawInst.totalStudents || 0) || 100,
          staffCount: parseInt(rawInst.staffCount || rawInst.totalTeachers || 0) || 10,
          classroomCount: parseInt(rawInst.classroomCount || rawInst.totalClassrooms || 0) || 5,
          floorCount: parseInt(rawInst.floorCount || rawInst.buildingFloors || 1) || 1,
          exitGateCount: parseInt(rawInst.exitGateCount || 2) || 2,
          nearestPoliceStation: rawInst.nearestPoliceStation || `${districtStr} Police Station`,
          status: rawInst.status || 'PENDING',
          verificationStatus: rawInst.verificationStatus || 'UNVERIFIED',
          riskLevel: rawInst.riskLevel || 'UNDER_REVIEW',
          complianceScore: typeof rawInst.complianceScore === 'number' ? rawInst.complianceScore : 0,
          assignedInspector: `DCP ${zoneStr}`,
          assignedInspectorZone: zoneStr,
          assignedInspectorEmail: `dcp${zoneStr.toLowerCase()}@safeedup.gov.in`,
          isActive: true,
          isPubliclyVisible: true,
          registrationNumber: rawInst.registrationNumber || `REG-${Date.now()}`,
          safeId: rawInst.safeId || `SAFE-UP-${districtCode}-${Math.floor(100000 + Math.random() * 900000)}`,
          createdAt: rawInst.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const filter = (emailStr && typeof emailStr === 'string' && emailStr.trim())
          ? { email: emailStr }
          : { safeId: canonicalInst.safeId };
        await Institution.findOneAndUpdate(filter, { $set: canonicalInst }, { upsert: true, new: true });
      } else if ((action === 'UPDATE_INSTITUTION' || action === 'updateInstitution') && payload) {
        const targetId = payload._id || payload.id;
        if (targetId) await Institution.findByIdAndUpdate(targetId, { $set: payload });
      } else if ((action === 'DELETE_INSTITUTION' || action === 'deleteInstitution') && payload) {
        const targetId = payload.id || payload._id;
        if (targetId) await Institution.deleteOne({ _id: targetId });
      } else if ((action === 'UPLOAD_DOCUMENT' || action === 'uploadDocument') && payload) {
        const { institutionId, email, safeId, document: doc } = payload;
        if (doc) {
          const filter = (institutionId && mongoose.Types.ObjectId.isValid(institutionId))
            ? { _id: institutionId }
            : email ? { email: email.toLowerCase() } : { safeId };
          const inst = await Institution.findOne(filter);
          if (inst) {
            const currentDocs = Array.isArray(inst.documents) ? inst.documents : [];
            const existingIdx = currentDocs.findIndex(d => d.type === doc.type || (doc._id && d._id === doc._id));
            if (existingIdx >= 0) {
              currentDocs[existingIdx] = { ...currentDocs[existingIdx], ...doc };
            } else {
              currentDocs.unshift(doc);
            }
            inst.documents = currentDocs;
            inst.markModified('documents');
            await inst.save();
          }
        }
      } else if ((action === 'VERIFY_DOCUMENT' || action === 'verifyDocument') && payload) {
        const { institutionId, email, safeId, docId, docType, status, remarks } = payload;
        const filter = (institutionId && mongoose.Types.ObjectId.isValid(institutionId))
          ? { _id: institutionId }
          : email ? { email: email.toLowerCase() } : { safeId };
        const inst = await Institution.findOne(filter);
        if (inst && Array.isArray(inst.documents)) {
          inst.documents = inst.documents.map(d => (d._id === docId || d.type === docType) ? { ...d, status, remarks: remarks || d.remarks } : d);
          inst.markModified('documents');

          const required = ['FIRE_NOC', 'STRUCTURAL_SAFETY', 'ELECTRICAL_SAFETY', 'EMERGENCY_PLAN'];
          const verifiedTypes = inst.documents.filter(d => d.status === 'VERIFIED').map(d => d.type);
          const score = Math.round((verifiedTypes.length / required.length) * 100);
          inst.complianceScore = score;
          inst.status = score === 100 ? 'VERIFIED' : 'PENDING_DOCUMENT_VERIFICATION';
          await inst.save();
        }
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
};
