// ============================================================
// SafeED-UP — Canonical Sync Endpoint (Express & Serverless)
// ============================================================
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
const Complaint = require('../models/Complaint.model');
const connectDB = require('../config/db');

async function syncHandler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Ensure database connection
    await connectDB();

    // Purge action
    if (req.query.purge === 'true' || req.body?.purge === true) {
      await User.deleteMany({});
      await Institution.deleteMany({});
      await Complaint.deleteMany({});
      return res.status(200).json({
        success: true,
        message: 'MongoDB Atlas purged cleanly.',
        data: { users: [], institutions: [], complaints: [] },
      });
    }

    if (req.method === 'GET') {
      const users = await User.find({}).select('-password').lean();
      let institutions = await Institution.find({}).lean();
      let complaints = await Complaint.find({}).lean();

      // Auto-seed default institutions across all 5 zones if empty
      if (institutions.length === 0) {
        const dummyAdminId = new mongoose.Types.ObjectId();
        const DEFAULT_INSTS = [
          {
            safeId: 'SAFE-UP-LKO-100101',
            name: 'SR Public School',
            type: 'SCHOOL',
            district: 'Lucknow',
            zone: 'CENTRAL',
            totalStudents: 1250,
            staffCount: 65,
            classroomCount: 42,
            floorCount: 3,
            exitGateCount: 3,
            nearestPoliceStation: 'Hazratganj Police Station',
            status: 'VERIFIED',
            complianceScore: 85,
            riskLevel: 'LOW',
            assignedInspector: 'DCP Central',
            assignedInspectorZone: 'CENTRAL',
            affiliationBoard: 'CBSE',
            adminUserId: dummyAdminId,
            address: { street: 'Hazratganj Main Road', district: 'Lucknow', state: 'Uttar Pradesh' },
            contactPerson: { name: 'Dr. Rajesh Sharma', email: 'principal@srpublic.edu.in', phone: '9839012345' },
          },
          {
            safeId: 'SAFE-UP-LKO-100102',
            name: 'Allen Career Institute (Aliganj)',
            type: 'COACHING_INSTITUTE',
            district: 'Lucknow',
            zone: 'NORTH',
            totalStudents: 850,
            staffCount: 45,
            classroomCount: 28,
            floorCount: 4,
            exitGateCount: 2,
            nearestPoliceStation: 'Aliganj Police Station',
            status: 'VERIFIED',
            complianceScore: 92,
            riskLevel: 'LOW',
            assignedInspector: 'DCP North',
            assignedInspectorZone: 'NORTH',
            affiliationBoard: 'Other',
            adminUserId: dummyAdminId,
            address: { street: 'Kapoorthala, Aliganj', district: 'Lucknow', state: 'Uttar Pradesh' },
            contactPerson: { name: 'Sanjeev Agarwal', email: 'director@allenlko.ac.in', phone: '9839054321' },
          },
          {
            safeId: 'SAFE-UP-LKO-100103',
            name: 'Delhi Public School (Gomti Nagar)',
            type: 'SCHOOL',
            district: 'Lucknow',
            zone: 'EAST',
            totalStudents: 2100,
            staffCount: 110,
            classroomCount: 60,
            floorCount: 3,
            exitGateCount: 4,
            nearestPoliceStation: 'Gomti Nagar Police Station',
            status: 'PENDING_DOCUMENT_VERIFICATION',
            complianceScore: 45,
            riskLevel: 'MEDIUM',
            assignedInspector: 'DCP East',
            assignedInspectorZone: 'EAST',
            affiliationBoard: 'CBSE',
            adminUserId: dummyAdminId,
            address: { street: 'Gomti Nagar Phase 2', district: 'Lucknow', state: 'Uttar Pradesh' },
            contactPerson: { name: 'Sunita Verma', email: 'admin@dpsgomtinagar.com', phone: '9839088888' },
          },
          {
            safeId: 'SAFE-UP-LKO-100104',
            name: 'FIITJEE Coaching Center (Chowk)',
            type: 'COACHING_INSTITUTE',
            district: 'Lucknow',
            zone: 'WEST',
            totalStudents: 620,
            staffCount: 30,
            classroomCount: 18,
            floorCount: 2,
            exitGateCount: 2,
            nearestPoliceStation: 'Chowk Police Station',
            status: 'PENDING_DOCUMENT_VERIFICATION',
            complianceScore: 30,
            riskLevel: 'HIGH',
            assignedInspector: 'DCP West',
            assignedInspectorZone: 'WEST',
            affiliationBoard: 'Other',
            adminUserId: dummyAdminId,
            address: { street: 'Chowk Crossing', district: 'Lucknow', state: 'Uttar Pradesh' },
            contactPerson: { name: 'Vikram Singh', email: 'head@fiitjeechowk.ac.in', phone: '9839077777' },
          },
          {
            safeId: 'SAFE-UP-LKO-100105',
            name: 'St. Joseph Inter College (Ashiyana)',
            type: 'SCHOOL',
            district: 'Lucknow',
            zone: 'SOUTH',
            totalStudents: 1800,
            staffCount: 85,
            classroomCount: 50,
            floorCount: 3,
            exitGateCount: 3,
            nearestPoliceStation: 'Ashiyana Police Station',
            status: 'VERIFIED',
            complianceScore: 88,
            riskLevel: 'LOW',
            assignedInspector: 'DCP South',
            assignedInspectorZone: 'SOUTH',
            affiliationBoard: 'ICSE',
            adminUserId: dummyAdminId,
            address: { street: 'Sector H, Ashiyana', district: 'Lucknow', state: 'Uttar Pradesh' },
            contactPerson: { name: 'Father Thomas', email: 'principal@stjosephlko.edu.in', phone: '9839066666' },
          },
        ];
        try {
          await Institution.insertMany(DEFAULT_INSTS);
          institutions = await Institution.find({}).lean();
        } catch (seedErr) {
          console.warn('Auto-seed inst notice:', seedErr.message);
        }
      }

      return res.status(200).json({
        success: true,
        data: { users, institutions, complaints },
      });
    }

    if (req.method === 'POST') {
      const { action, payload } = req.body || {};

      try {
        if ((action === 'CREATE_USER' || action === 'createUser') && payload) {
          const emailLow = payload.email?.toLowerCase()?.trim();
          if (!emailLow) {
            return res.status(400).json({ success: false, error: 'Email address is required.' });
          }
          const existing = await User.findOne({ email: emailLow });
          if (existing) {
            return res.status(400).json({
              success: false,
              error: `User with email '${emailLow}' already exists in MongoDB Atlas.`,
            });
          }

          // Clean phone: ensure 10-digit number starting with 6-9 to satisfy regex
          let rawPhone = String(payload.phone || '').replace(/\D/g, '');
          if (rawPhone.length === 10 && !/^[6-9]/.test(rawPhone)) {
            rawPhone = '9' + rawPhone.substring(1);
          }
          const phone = rawPhone.length === 10 ? rawPhone : undefined;

          // Clean password: ensure >= 8 characters to satisfy minlength
          let rawPassword = String(payload.password || payload.phone || 'SafeED@2026').trim();
          if (rawPassword.length < 8) rawPassword = rawPassword + 'SafeED2026';

          // Clean role: ensure valid enum value
          const { ROLES } = require('../constants/roles');
          let role = payload.role || payload.assignedPortal || 'INSPECTION_OFFICER';
          if (role === 'INSPECTOR' || role === 'POLICE') role = 'INSPECTION_OFFICER';
          if (!Object.values(ROLES).includes(role)) role = 'INSPECTION_OFFICER';

          const badgeNum = payload.badgeNumber || payload.employeeId || payload.badge || undefined;
          const userDoc = {
            name: (payload.name || payload.officialName || 'Official User').trim(),
            email: emailLow,
            password: rawPassword,
            role: role,
            state: payload.state || 'Uttar Pradesh',
            district: payload.district || 'Lucknow',
            designation: payload.designation || payload.officialDesignation || 'Sub-Inspector',
            department: payload.department || 'UP Police',
            postingStation: payload.postingStation || payload.policeStation || payload.nearestPoliceStation,
            policeRank: payload.policeRank || payload.rankLevel || payload.rank,
            dcpZone: payload.dcpZone || payload.zone,
            badgeNumber: badgeNum,
            employeeId: badgeNum,
            isActive: payload.isActive !== false,
          };
          if (phone) userDoc.phone = phone;

          await User.create(userDoc);
        } else if ((action === 'UPDATE_USER' || action === 'updateUser') && payload) {
          const targetId = payload._id || payload.id;
          const query = targetId && mongoose.Types.ObjectId.isValid(targetId) 
            ? { _id: targetId } 
            : { email: payload.email?.toLowerCase() };
          await User.findOneAndUpdate(query, { $set: payload }, { new: true });
        } else if ((action === 'TOGGLE_USER' || action === 'toggleUserStatus') && payload) {
          const targetId = payload.id || payload._id;
          const query = targetId && mongoose.Types.ObjectId.isValid(targetId) 
            ? { _id: targetId } 
            : { email: payload.email?.toLowerCase() };
          const u = await User.findOne(query);
          if (u) {
            u.isActive = !u.isActive;
            await u.save();
          }
        } else if ((action === 'DELETE_USER' || action === 'deleteUser') && payload) {
          const targetId = payload.id || payload._id;
          const query = targetId && mongoose.Types.ObjectId.isValid(targetId) 
            ? { _id: targetId } 
            : { email: payload.email?.toLowerCase() };
          await User.deleteOne(query);
        } else if ((action === 'CREATE_INSTITUTION' || action === 'createInstitution' || action === 'registerInstitution') && payload) {
          const instName = payload.name || payload.institutionName;
          if (!instName) {
            return res.status(400).json({ success: false, error: 'Institution name is required.' });
          }
          const existing = await Institution.findOne({ name: instName });
          if (!existing) {
            const rawZone = String(payload.zone || payload.assignedInspectorZone || 'CENTRAL').toUpperCase();
            let zoneStr = 'CENTRAL';
            if (rawZone.includes('WEST')) zoneStr = 'WEST';
            else if (rawZone.includes('NORTH')) zoneStr = 'NORTH';
            else if (rawZone.includes('EAST')) zoneStr = 'EAST';
            else if (rawZone.includes('SOUTH')) zoneStr = 'SOUTH';

            const districtStr = payload.district || 'Lucknow';
            const districtCode = districtStr.slice(0, 3).toUpperCase();
            const safeId = payload.safeId || `SAFE-UP-${districtCode}-${Math.floor(100000 + Math.random() * 900000)}`;

            const instDoc = {
              safeId,
              name: instName,
              type: payload.type || payload.institutionType || 'SCHOOL',
              district: districtStr,
              zone: zoneStr,
              totalStudents: parseInt(payload.totalStudents || 0),
              staffCount: parseInt(payload.staffCount || payload.totalTeachers || 0),
              classroomCount: parseInt(payload.classroomCount || payload.totalClassrooms || 0),
              floorCount: parseInt(payload.floorCount || payload.buildingFloors || 1),
              exitGateCount: parseInt(payload.exitGateCount || 2),
              nearestPoliceStation: payload.nearestPoliceStation || `${districtStr} Police Station`,
              status: payload.status || 'PENDING_DOCUMENT_VERIFICATION',
              riskLevel: payload.riskLevel || 'UNDER_REVIEW',
              address: typeof payload.address === 'object' ? payload.address : {
                street: payload.address || `${districtStr}, Uttar Pradesh`,
                district: districtStr,
                state: payload.state || 'Uttar Pradesh',
              },
              contactPerson: {
                name: payload.principal || payload.contactName || 'Principal',
                email: payload.email || 'admin@inst.edu.in',
                phone: payload.contact || payload.phone || '',
              },
              affiliationBoard: payload.affiliationBoard || 'CBSE',
              affiliationCode: payload.affiliationCode || '',
              assignedInspector: payload.assignedInspector || `DCP ${zoneStr}`,
              assignedInspectorZone: zoneStr,
              districtRemarks: payload.districtRemarks || [],
              adminUserId: payload.adminUserId || new mongoose.Types.ObjectId(),
            };
            await Institution.create(instDoc);
          }
        } else if ((action === 'UPDATE_INSTITUTION' || action === 'updateInstitution') && payload) {
          const targetId = payload._id || payload.id;
          if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
            await Institution.findByIdAndUpdate(targetId, { $set: payload }, { new: true });
          } else if (payload.name) {
            await Institution.findOneAndUpdate({ name: payload.name }, { $set: payload }, { new: true });
          }
        } else if ((action === 'DELETE_INSTITUTION' || action === 'deleteInstitution') && payload) {
          const targetId = payload.id || payload._id;
          if (targetId) {
            await Institution.deleteOne({ _id: targetId });
          }
        } else if ((action === 'CREATE_COMPLAINT' || action === 'submitComplaint') && payload) {
          const ticket = payload.complaintTicket || `CMP-UP-${Math.floor(100000 + Math.random() * 900000)}`;
          const rawZone = String(payload.zone || 'CENTRAL').toUpperCase();
          let zoneStr = 'CENTRAL';
          if (rawZone.includes('WEST')) zoneStr = 'WEST';
          else if (rawZone.includes('NORTH')) zoneStr = 'NORTH';
          else if (rawZone.includes('EAST')) zoneStr = 'EAST';
          else if (rawZone.includes('SOUTH')) zoneStr = 'SOUTH';

          const cmpDoc = {
            complaintTicket: ticket,
            institutionName: payload.institutionName,
            institutionId: payload.institutionId || null,
            district: payload.district || 'Lucknow',
            zone: zoneStr,
            category: payload.category || 'FIRE_SAFETY_HAZARD',
            complainantName: payload.complainantName || 'Anonymous Citizen',
            complainantPhone: payload.complainantPhone || 'Hidden',
            complainantEmail: payload.complainantEmail || '',
            description: payload.description || 'Public safety concern reported',
            status: payload.status || 'PENDING_DISTRICT_ACTION',
            assignedInspector: payload.assignedInspector || null,
            assignedInspectorZone: payload.assignedInspectorZone || null,
            assignedAt: payload.assignedAt || null,
            districtDirectives: payload.districtDirectives || '',
            resolutionRemarks: payload.resolutionRemarks || '',
            resolvedAt: payload.resolvedAt || null,
            submittedAt: payload.submittedAt || new Date().toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
          };
          await Complaint.create(cmpDoc);
        } else if ((action === 'ASSIGN_COMPLAINT' || action === 'assignComplaint') && payload) {
          const cid = payload.complaintId || payload._id || payload.id;
          if (cid) {
            await Complaint.findOneAndUpdate(
              { $or: [{ _id: mongoose.Types.ObjectId.isValid(cid) ? cid : null }, { complaintTicket: cid }] },
              {
                $set: {
                  status: 'INVESTIGATION_ASSIGNED',
                  assignedInspector: payload.assignedInspector,
                  assignedInspectorZone: payload.assignedInspectorZone,
                  assignedAt: payload.assignedAt || new Date().toLocaleDateString('en-IN'),
                  districtDirectives: payload.districtDirectives || 'Investigate site safety immediately.',
                },
              }
            );
          }
        } else if ((action === 'RESOLVE_COMPLAINT' || action === 'resolveComplaint') && payload) {
          const cid = payload.complaintId || payload._id || payload.id;
          if (cid) {
            await Complaint.findOneAndUpdate(
              { $or: [{ _id: mongoose.Types.ObjectId.isValid(cid) ? cid : null }, { complaintTicket: cid }] },
              {
                $set: {
                  status: 'RESOLVED',
                  resolutionRemarks: payload.resolutionRemarks || 'Site inspection completed.',
                  resolvedAt: payload.resolvedAt || new Date().toLocaleDateString('en-IN'),
                },
              }
            );
          }
        }
      } catch (actionErr) {
        console.error('Sync Action Error:', actionErr.message);
        if (actionErr.code === 11000) {
          const dupField = Object.keys(actionErr.keyPattern || {})[0] || 'record';
          return res.status(400).json({
            success: false,
            error: `A ${dupField} with this value already exists in MongoDB Atlas.`,
          });
        }
        return res.status(400).json({
          success: false,
          error: actionErr.message,
        });
      }

      // Return latest fresh state after mutation
      const users = await User.find({}).select('-password').lean();
      const institutions = await Institution.find({}).lean();
      const complaints = await Complaint.find({}).lean();
      return res.status(200).json({
        success: true,
        data: { users, institutions, complaints },
      });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Sync Handler Error:', err.message);
    return res.status(500).json({
      success: false,
      error: `Server sync error: ${err.message}`,
    });
  }
}

module.exports = syncHandler;
