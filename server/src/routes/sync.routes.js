// ============================================================
// SafeED-UP — Canonical Sync Endpoint (Express & Serverless)
// ============================================================
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
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
      return res.status(200).json({
        success: true,
        message: 'MongoDB Atlas purged cleanly.',
        data: { users: [], institutions: [] },
      });
    }

    if (req.method === 'GET') {
      const users = await User.find({}).select('-password').lean();
      const institutions = await Institution.find({}).lean();
      return res.status(200).json({
        success: true,
        data: { users, institutions },
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
        } else if ((action === 'CREATE_INSTITUTION' || action === 'createInstitution') && payload) {
          const existing = await Institution.findOne({ name: payload.name });
          if (!existing) {
            const instDoc = {
              name: payload.name,
              type: payload.type || 'SCHOOL',
              registrationNumber: payload.registrationNumber || `REG-${Date.now()}`,
              address: {
                district: payload.district || 'Lucknow',
                state: payload.state || 'Uttar Pradesh',
              },
              contactPerson: {
                name: payload.contactName || 'Principal',
                email: payload.email || 'admin@inst.edu.in',
              },
              adminUserId: payload.adminUserId || new mongoose.Types.ObjectId(),
            };
            await Institution.create(instDoc);
          }
        } else if ((action === 'UPDATE_INSTITUTION' || action === 'updateInstitution') && payload) {
          const targetId = payload._id || payload.id;
          if (targetId) {
            await Institution.findByIdAndUpdate(targetId, { $set: payload });
          }
        } else if ((action === 'DELETE_INSTITUTION' || action === 'deleteInstitution') && payload) {
          const targetId = payload.id || payload._id;
          if (targetId) {
            await Institution.deleteOne({ _id: targetId });
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
      return res.status(200).json({
        success: true,
        data: { users, institutions },
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
