// ============================================================
// SafeED-UP — Database Seed Script
// Populates production-grade demo data for all 9 roles
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
const qrService = require('../services/qr.service');
const env = require('../config/env');

const seedDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Institution.deleteMany({});
    await Inspection.deleteMany({});
    await Document.deleteMany({});
    await Compliance.deleteMany({});
    await Deficiency.deleteMany({});
    await EmergencyPlan.deleteMany({});
    await SafeID.deleteMany({});

    console.log('🧹 Existing database collections cleared.');

    const defaultPassword = 'Password@123';

    // 1. Create Users for all 9 roles
    const userConfigs = [
      { name: 'Super Admin', email: 'superadmin@safeed.ac.in', password: 'harshsafeed', role: ROLES.SUPER_ADMIN, state: 'Uttar Pradesh', district: 'Lucknow', isActive: true },
      { name: 'Dr. Anita Verma (State Admin)', email: 'stateadmin@safeedup.gov.in', password: defaultPassword, role: ROLES.STATE_ADMIN, state: 'Uttar Pradesh', district: 'Lucknow', isActive: true },
      { name: 'Suresh Kumar (District Admin)', email: 'districtadmin@safeedup.gov.in', password: defaultPassword, role: ROLES.DISTRICT_ADMIN, state: 'Uttar Pradesh', district: 'Lucknow', isActive: true },
      { name: 'Inspector Inspector Singh', email: 'inspector@safeedup.gov.in', password: defaultPassword, role: ROLES.INSPECTION_OFFICER, state: 'Uttar Pradesh', district: 'Lucknow', designation: 'Senior Safety Inspector', isActive: true },
      { name: 'ACP Vikram Rathore (Police)', email: 'police@safeedup.gov.in', password: defaultPassword, role: ROLES.POLICE_OFFICER, state: 'Uttar Pradesh', district: 'Lucknow', designation: 'Assistant Commissioner of Police', isActive: true },
      { name: 'Chief Fire Officer Tyagi', email: 'fire@safeedup.gov.in', password: defaultPassword, role: ROLES.FIRE_OFFICER, state: 'Uttar Pradesh', district: 'Lucknow', designation: 'District Fire Officer', isActive: true },
      { name: 'Principal Ramesh Chandra (School)', email: 'schooladmin@safeedup.gov.in', password: defaultPassword, role: ROLES.SCHOOL_ADMIN, state: 'Uttar Pradesh', district: 'Lucknow', isActive: true },
      { name: 'Director Amit Academy (Coaching)', email: 'coachingadmin@safeedup.gov.in', password: defaultPassword, role: ROLES.COACHING_ADMIN, state: 'Uttar Pradesh', district: 'Lucknow', isActive: true },
      { name: 'Citizen Rahul Gupta', email: 'citizen@safeedup.gov.in', password: defaultPassword, role: ROLES.CITIZEN, state: 'Uttar Pradesh', district: 'Lucknow', isActive: true },
    ];

    const users = [];
    for (const u of userConfigs) {
      try {
        const created = await User.create(u);
        users.push(created);
      } catch (e) {
        console.error('USER FAIL:', u.email, e.message);
      }
    }

    console.log(`👤 Created ${users.length} demo users across all 9 roles.`);

    const schoolAdminUser = users.find(u => u.role === ROLES.SCHOOL_ADMIN);
    const coachingAdminUser = users.find(u => u.role === ROLES.COACHING_ADMIN);
    const districtAdminUser = users.find(u => u.role === ROLES.DISTRICT_ADMIN);
    const inspectorUser = users.find(u => u.role === ROLES.INSPECTION_OFFICER);

    // 2. Create Comprehensive Real Dataset of 55+ UP Institutions across 15+ districts
    const upDistricts = [
      { city: 'Lucknow', district: 'Lucknow', lat: 26.8467, lng: 80.9462, pincode: '226001', code: 'LKO' },
      { city: 'Kanpur', district: 'Kanpur Nagar', lat: 26.4499, lng: 80.3319, pincode: '208001', code: 'KNP' },
      { city: 'Varanasi', district: 'Varanasi', lat: 25.3176, lng: 82.9739, pincode: '221001', code: 'VNS' },
      { city: 'Noida', district: 'Gautam Buddha Nagar', lat: 28.5355, lng: 77.3910, pincode: '201301', code: 'NOI' },
      { city: 'Prayagraj', district: 'Prayagraj', lat: 25.4358, lng: 81.8463, pincode: '211001', code: 'PRG' },
      { city: 'Agra', district: 'Agra', lat: 27.1767, lng: 78.0081, pincode: '282001', code: 'AGR' },
      { city: 'Gorakhpur', district: 'Gorakhpur', lat: 26.7606, lng: 83.3732, pincode: '273001', code: 'GKP' },
      { city: 'Ghaziabad', district: 'Ghaziabad', lat: 28.6947, lng: 77.4382, pincode: '201001', code: 'GBD' },
      { city: 'Meerut', district: 'Meerut', lat: 28.9845, lng: 77.7064, pincode: '250001', code: 'MRT' },
      { city: 'Bareilly', district: 'Bareilly', lat: 28.3670, lng: 79.4304, pincode: '243001', code: 'BLY' },
      { city: 'Aligarh', district: 'Aligarh', lat: 27.8974, lng: 78.0880, pincode: '202001', code: 'ALG' },
      { city: 'Jhansi', district: 'Jhansi', lat: 25.4484, lng: 78.5685, pincode: '284001', code: 'JHS' },
      { city: 'Mathura', district: 'Mathura', lat: 27.4924, lng: 77.6737, pincode: '281001', code: 'MTH' },
      { city: 'Ayodhya', district: 'Ayodhya', lat: 26.7922, lng: 82.1998, pincode: '224001', code: 'AYD' },
      { city: 'Moradabad', district: 'Moradabad', lat: 28.8386, lng: 78.7733, pincode: '244001', code: 'MBD' },
    ];

    const schoolPrefixes = [
      'St. Xavier High School', 'Delhi Public School (DPS)', 'City Montessori School (CMS)',
      'Kendriya Vidyalaya', 'Jawahar Navodaya Vidyalaya', 'Sacred Heart Senior Secondary',
      'St. Joseph Academy', 'Army Public School', 'Spring Dale College', 'Loyola Public School'
    ];

    const coachingPrefixes = [
      'Allen Career Institute', 'FIITJEE Academy', 'Resonance NEET & IIT Hub',
      'Aakash Educational Services', 'Physics Wallah Vidyapeeth', 'Career Launcher Hub',
      'PACE IIT & Medical', 'Vibrant Academy', 'Bansal Classes Center', 'Utkarsh Classes'
    ];

    const streetNames = [
      'Civil Lines Academic Corridor', 'Station Road Complex', 'VIP Road Knowledge Park',
      'University Road Sector 4', 'Mall Road Square', 'Gomti Nagar Extension',
      'Grand Trunk Road Center', 'Raj Nagar Bypass', 'Kachery Road Circle', 'Expressway Sector 62'
    ];

    const realUPInstitutions = [];
    let counter = 1;

    for (let d = 0; d < upDistricts.length; d++) {
      const dist = upDistricts[d];
      
      // Add 2 Schools per district
      for (let s = 0; s < 2; s++) {
        const name = `${schoolPrefixes[(d * 2 + s) % schoolPrefixes.length]}, ${dist.city}`;
        const padId = String(counter).padStart(6, '0');
        const code = dist.code;

        realUPInstitutions.push({
          safeId: `SAFE-UP-${code}-${padId}`,
          name,
          type: 'SCHOOL',
          affiliationBoard: s % 2 === 0 ? 'CBSE' : 'ICSE',
          udiseCode: `09${(d + 10).toString()}${s}00${counter}`,
          registrationNumber: `REG-UP-2023-${1000 + counter}`,
          address: {
            street: streetNames[(d + s) % streetNames.length],
            city: dist.city,
            pincode: dist.pincode,
            district: dist.district,
            state: 'Uttar Pradesh',
          },
          coordinates: { lat: dist.lat + (s * 0.005), lng: dist.lng + (s * 0.005) },
          contactPerson: {
            name: `Principal ${dist.city} Branch`,
            phone: `0522-24${(10000 + counter).toString()}`,
            email: `school.${counter}@safeedup.gov.in`,
            designation: 'Principal',
          },
          totalStudents: 1500 + (counter * 35) % 2500,
          totalStaff: 80 + (counter * 3) % 100,
          buildingFloors: 3 + (s % 3),
          builtYear: 1995 + (s * 5),
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          riskLevel: counter % 5 === 0 ? 'MEDIUM' : 'LOW',
          complianceScore: 88 + (counter % 11),
          lastInspectionDate: new Date(2026, 0, (counter % 28) + 1),
          adminUserId: schoolAdminUser._id,
          verifiedBy: districtAdminUser._id,
          verifiedAt: new Date(2026, 0, 10),
        });
        counter++;
      }

      // Add 2 Coaching Institutes per district
      for (let c = 0; c < 2; c++) {
        const name = `${coachingPrefixes[(d * 2 + c) % coachingPrefixes.length]}, ${dist.city}`;
        const padId = String(counter).padStart(6, '0');
        const code = dist.code;

        realUPInstitutions.push({
          safeId: `SAFE-UP-${code}-${padId}`,
          name,
          type: 'COACHING_INSTITUTE',
          registrationNumber: `COA-UP-2024-${2000 + counter}`,
          address: {
            street: streetNames[(d + c + 3) % streetNames.length],
            city: dist.city,
            pincode: dist.pincode,
            district: dist.district,
            state: 'Uttar Pradesh',
          },
          coordinates: { lat: dist.lat - (c * 0.004), lng: dist.lng - (c * 0.004) },
          contactPerson: {
            name: `Center Director ${dist.city}`,
            phone: `9839${(100000 + counter).toString()}`,
            email: `coaching.${counter}@safeedup.gov.in`,
            designation: 'Director',
          },
          totalStudents: 800 + (counter * 25) % 1500,
          totalStaff: 40 + (counter * 2) % 60,
          buildingFloors: 4,
          builtYear: 2012 + (c * 3),
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
          riskLevel: counter % 4 === 0 ? 'MEDIUM' : 'LOW',
          complianceScore: 85 + (counter % 12),
          lastInspectionDate: new Date(2026, 0, (counter % 28) + 1),
          adminUserId: coachingAdminUser._id,
          verifiedBy: districtAdminUser._id,
          verifiedAt: new Date(2026, 0, 15),
        });
        counter++;
      }
    }

    // Bulk create institutions
    const createdInsts = [];
    for (const instData of realUPInstitutions) {
      try {
        const inst = await Institution.create(instData);
        createdInsts.push(inst);
      } catch (e) {
        console.error('INSTITUTION FAIL:', instData.name, e.message);
      }
    }

    const inst1 = createdInsts[0];
    const inst2 = createdInsts[2];

    await User.findByIdAndUpdate(schoolAdminUser._id, { institutionId: inst1._id });
    await User.findByIdAndUpdate(coachingAdminUser._id, { institutionId: inst2._id });

    // Generate Safe IDs + QR Codes for all
    for (const inst of createdInsts) {
      await qrService.generateForInstitution(inst._id, districtAdminUser._id);
    }

    console.log(`🏫 Created ${createdInsts.length} verified UP institutions across major districts with active Safe IDs & QR codes.`);


    // 3. Create Documents
    try {
      await Document.create([
        {
          institutionId: inst1._id,
          documentType: 'FIRE_NOC',
          title: 'Fire Safety Certificate 2025-26',
          fileUrl: '/uploads/documents/demo_fire_noc.pdf',
          fileName: 'demo_fire_noc.pdf',
          fileType: 'application/pdf',
          fileSize: 1048576,
          issueDate: new Date('2025-04-01'),
          expiryDate: new Date('2026-03-31'),
          issuingAuthority: 'UP Fire Service Department',
          verificationStatus: 'APPROVED',
          verifiedBy: districtAdminUser._id,
          verifiedAt: new Date('2025-04-05'),
          uploadedBy: schoolAdminUser._id,
        },
        {
          institutionId: inst1._id,
          documentType: 'BUILDING_PLAN',
          title: 'Approved Structural Safety Certificate',
          fileUrl: '/uploads/documents/demo_building_plan.pdf',
          fileName: 'demo_building_plan.pdf',
          fileType: 'application/pdf',
          fileSize: 2097152,
          issueDate: new Date('2024-01-01'),
          issuingAuthority: 'Lucknow Development Authority',
          verificationStatus: 'APPROVED',
          verifiedBy: districtAdminUser._id,
          uploadedBy: schoolAdminUser._id,
        },
      ]);
      console.log('📄 Documents created successfully.');
    } catch (docErr) {
      console.error('DOCUMENT CREATE FAIL:', docErr.message);
    }

    // 4. Create Emergency Plan
    try {
      await EmergencyPlan.create({
        institutionId: inst1._id,
        hasFireExtinguishers: true,
        fireExtinguisherCount: 24,
        hasFireAlarm: true,
        hasSprinklerSystem: true,
        hasEmergencyExits: true,
        emergencyExitCount: 4,
        exitsAreClearlyMarked: true,
        hasEvacuationPlan: true,
        hasAssemblyPoint: true,
        hasFirstAidKit: true,
        firstAidKitCount: 8,
        firstAidTrainedStaffCount: 12,
        lastDrillDate: new Date('2026-01-20'),
        emergencyContacts: [
          { name: 'Fire Station Control Room', role: 'Fire Emergency', phone: '101' },
          { name: 'District Police Control Room', role: 'Police', phone: '112' },
          { name: 'KGMU Hospital Emergency', role: 'Medical Emergency', phone: '0522-2257540' },
        ],
        hasCCTV: true,
        cctvCameraCount: 36,
        cctvFunctional: true,
        readinessScore: 95,
        readinessLevel: 'EXCELLENT',
      });
      console.log('🚨 Emergency plan created successfully.');
    } catch (planErr) {
      console.error('EMERGENCY PLAN FAIL:', planErr.message);
    }

    // 5. Create Inspection
    try {
      await Inspection.create({
        inspectionId: 'INSP-2602-00001',
        institutionId: inst1._id,
        inspectorId: inspectorUser._id,
        inspectionType: 'ROUTINE',
        status: 'COMPLETED',
        scheduledDate: new Date('2026-01-15'),
        conductedDate: new Date('2026-01-15'),
        completedAt: new Date('2026-01-15'),
        overallPercentage: 92,
        findings: 'All structural safety norms satisfied. Minor labeling required on 2nd floor extinguisher.',
        recommendations: 'Conduct evacuation drill quarterly.',
        scheduledBy: districtAdminUser._id,
        isApproved: true,
      });
      console.log('🔍 Inspection created successfully.');
    } catch (inspErr) {
      console.error('INSPECTION FAIL:', inspErr.message);
    }

    console.log('✅ Database successfully seeded with demo dataset!');
    console.log('\n================ DEMO CREDENTIALS ================');
    console.log('Password for all users: Password@123\n');
    console.log('1. Super Admin:      superadmin@safeedup.gov.in');
    console.log('2. State Admin:      stateadmin@safeedup.gov.in');
    console.log('3. District Admin:   districtadmin@safeedup.gov.in');
    console.log('4. Inspector:        inspector@safeedup.gov.in');
    console.log('5. Police Officer:   police@safeedup.gov.in');
    console.log('6. Fire Officer:     fire@safeedup.gov.in');
    console.log('7. School Admin:     schooladmin@safeedup.gov.in');
    console.log('8. Coaching Admin:   coachingadmin@safeedup.gov.in');
    console.log('9. Citizen User:     citizen@safeedup.gov.in');
    console.log('==================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error stack:', error.stack || error);
    process.exit(1);
  }
};

seedDB();
