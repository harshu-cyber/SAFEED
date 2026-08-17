const mongoose = require('mongoose');
const env = require('./src/config/env');
const User = require('./src/models/User.model');
const Institution = require('./src/models/Institution.model');
const { ROLES } = require('./src/constants/roles');

async function debug() {
  await mongoose.connect(env.MONGODB_URI);
  await User.deleteMany({});
  await Institution.deleteMany({});

  const user = await User.create({
    name: 'Principal Ramesh Chandra (School)',
    email: 'schooladmin@safeedup.gov.in',
    password: 'Password@123',
    role: ROLES.SCHOOL_ADMIN,
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    isActive: true,
  });

  const distAdmin = await User.create({
    name: 'Suresh Kumar (District Admin)',
    email: 'districtadmin@safeedup.gov.in',
    password: 'Password@123',
    role: ROLES.DISTRICT_ADMIN,
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    isActive: true,
  });

  try {
    const inst = await Institution.create({
      safeId: 'SAFE-UP-LKO-000001',
      name: 'La Martiniere College',
      type: 'SCHOOL',
      affiliationBoard: 'ICSE',
      udiseCode: '09260100101',
      registrationNumber: 'REG-UP-2021-9941',
      address: { street: 'La Martiniere Road, Hazratganj', city: 'Lucknow', pincode: '226001', district: 'Lucknow', state: 'Uttar Pradesh' },
      coordinates: { lat: 26.8467, lng: 80.9462 },
      contactPerson: { name: 'Principal MacFarland', phone: '0522-2235640', email: 'lamartiniere@safeedup.gov.in', designation: 'Principal' },
      totalStudents: 2850,
      totalStaff: 140,
      buildingFloors: 4,
      builtYear: 1845,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      riskLevel: 'LOW',
      complianceScore: 96,
      lastInspectionDate: new Date('2026-01-15'),
      adminUserId: user._id,
      verifiedBy: distAdmin._id,
      verifiedAt: new Date('2026-01-10')
    });
    console.log('INST OK:', inst.name);
  } catch (e) {
    console.error('INST FAIL:', e);
  }
  process.exit(0);
}
debug();
