// ============================================================
// SafeED-UP — Vercel Serverless Handler (Express + MongoDB Atlas)
// ============================================================
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if present
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const app = require('../server/src/app');
const connectDB = require('../server/src/config/db');
const syncHandler = require('./sync');

module.exports = async (req, res) => {
  if (req.url === '/api/sync' || req.url?.startsWith('/api/sync?')) {
    return syncHandler(req, res);
  }
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB Serverless Connection Error:', err);
  }
  return app(req, res);
};
