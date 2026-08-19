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

      if (action === 'createUser' && payload) {
        const emailLow = payload.email?.toLowerCase();
        const existing = await User.findOne({ email: emailLow });
        if (!existing) {
          // Provide default password if missing in payload
          const userDoc = {
            name: payload.name || payload.officialName || 'Official User',
            email: emailLow,
            password: payload.password || 'SafeED@2026',
            role: payload.role || 'CITIZEN',
            district: payload.district || payload.postingStation || null,
            designation: payload.designation || payload.officialDesignation || null,
            isActive: payload.status !== 'Suspended',
          };
          const newUser = new User(userDoc);
          await newUser.save();
        }
      } else if (action === 'updateUser' && payload && payload.id) {
        await User.findOneAndUpdate(
          { $or: [{ _id: mongoose.Types.ObjectId.isValid(payload.id) ? payload.id : null }, { email: payload.email }] },
          { $set: payload },
          { new: true }
        );
      } else if (action === 'toggleUserStatus' && payload && payload.id) {
        const u = await User.findOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(payload.id) ? payload.id : null }, { email: payload.email }] });
        if (u) {
          u.isActive = !u.isActive;
          await u.save();
        }
      } else if (action === 'deleteUser' && payload && payload.id) {
        await User.deleteOne({ $or: [{ _id: mongoose.Types.ObjectId.isValid(payload.id) ? payload.id : null }, { email: payload.email }] });
      } else if (action === 'createInstitution' && payload) {
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
          const newInst = new Institution(instDoc);
          await newInst.save();
        }
      } else if (action === 'updateInstitution' && payload && payload.id) {
        await Institution.findOneAndUpdate(
          { _id: mongoose.Types.ObjectId.isValid(payload.id) ? payload.id : null },
          { $set: payload },
          { new: true }
        );
      } else if (action === 'deleteInstitution' && payload && payload.id) {
        await Institution.deleteOne({ _id: mongoose.Types.ObjectId.isValid(payload.id) ? payload.id : null });
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
