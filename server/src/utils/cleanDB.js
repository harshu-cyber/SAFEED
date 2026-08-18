// ============================================================
// SafeED-UP — Database Cleanup Script
// Wipes all data across all collections (Users, Institutions, Docs, Inspections)
// ============================================================
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
const Inspection = require('../models/Inspection.model');
const Document = require('../models/Document.model');
const Compliance = require('../models/Compliance.model');
const Deficiency = require('../models/Deficiency.model');
const EmergencyPlan = require('../models/EmergencyPlan.model');
const SafeID = require('../models/SafeID.model');
const env = require('../config/env');

const cleanDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for cleanup...');

    await User.deleteMany({});
    await Institution.deleteMany({});
    await Inspection.deleteMany({});
    await Document.deleteMany({});
    await Compliance.deleteMany({});
    await Deficiency.deleteMany({});
    await EmergencyPlan.deleteMany({});
    await SafeID.deleteMany({});

    console.log('✨ ALL institution data, admin accounts, documents, inspections, and safe IDs cleared from database successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database cleanup error:', error.message || error);
    process.exit(1);
  }
};

cleanDB();
