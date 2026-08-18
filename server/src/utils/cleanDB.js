// ============================================================
// SafeED-UP — Database Cleanup & Super Admin Initialization
// Wipes all demo data and creates the dedicated Super Admin account
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
const { ROLES } = require('../constants/roles');
const env = require('../config/env');

const cleanAndInitSuperAdmin = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB...');

    // 1. Clear all existing collections
    await User.deleteMany({});
    await Institution.deleteMany({});
    await Inspection.deleteMany({});
    await Document.deleteMany({});
    await Compliance.deleteMany({});
    await Deficiency.deleteMany({});
    await EmergencyPlan.deleteMany({});
    await SafeID.deleteMany({});

    console.log('🧹 Existing database collections cleared.');

    // 2. Create the dedicated Super Admin account
    const superAdmin = await User.create({
      name: 'Super Admin (SafeED)',
      email: 'superadmin@safeed.ac.in',
      password: 'harshsafeed',
      role: ROLES.SUPER_ADMIN,
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✨ Super Admin Created Successfully:');
    console.log(` 👤 Name: ${superAdmin.name}`);
    console.log(` 📧 Username/Email: superadmin@safeed.ac.in`);
    console.log(` 🔑 Password: harshsafeed`);
    console.log(` 🛡️ Role: SUPER_ADMIN`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message || error);
    process.exit(1);
  }
};

cleanAndInitSuperAdmin();
