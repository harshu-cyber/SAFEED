// ============================================================
// SafeED-UP — One-Time Super Admin Creator
// Run with: node src/utils/createSuperAdmin.js
// ============================================================
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not set'); process.exit(1); }

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  phone: String,
  password: String,
  role: String,
  state: String,
  district: String,
  designation: String,
  badgeNumber: String,
  department: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
    console.log('✅ MongoDB Connected');

    const existing = await User.findOne({ email: 'superadmin@safeed.ac.in' });
    if (existing) {
      console.log('ℹ️  Super Admin already exists in database!');
      console.log('   Email:', existing.email);
      console.log('   Role:', existing.role);
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash('harshsafeed', 12);

    const superAdmin = await User.create({
      name: 'Super Admin (SafeED)',
      email: 'superadmin@safeed.ac.in',
      phone: '9412000001',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      designation: 'System Administrator',
      badgeNumber: 'SA-001',
      department: 'SafeED-UP HQ',
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✅ Super Admin created successfully!');
    console.log('   ID:', superAdmin._id);
    console.log('   Email: superadmin@safeed.ac.in');
    console.log('   Password: harshsafeed');
    console.log('   Role: SUPER_ADMIN');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

createSuperAdmin();
