// ============================================================
// SafeED-UP — Real-Time MongoDB Atlas Production Sync Endpoint
// Direct Serverless Mongoose Persistence — Single Source of Truth
// ============================================================
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const connectDB = require('../server/src/config/db');
const User = require('../server/src/models/User.model');
const Institution = require('../server/src/models/Institution.model');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

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
      const { users, institutions } = req.body || {};

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

      const allUsers = await User.find({}).select('-password -refreshToken').lean();
      const allInsts = await Institution.find({}).lean();

      return res.status(200).json({
        success: true,
        message: 'MongoDB Atlas persistent state updated.',
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
