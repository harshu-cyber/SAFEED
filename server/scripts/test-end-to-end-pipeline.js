// ============================================================
// SafeED-UP — End-to-End MongoDB Document Pipeline Test Script
// ============================================================
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Institution = require('../src/models/Institution.model');
const User = require('../src/models/User.model');
const Document = require('../src/models/Document.model');
const SafeID = require('../src/models/SafeID.model');
const documentService = require('../src/services/document.service');
const qrService = require('../src/services/qr.service');

async function runEndToEndTest() {
  console.log('\n==================================================');
  console.log('🧪 Starting SAFEED-UP End-to-End Document Pipeline Test');
  console.log('==================================================\n');

  try {
    // 1. Connect DB
    await connectDB();
    console.log('[TEST 1] ✅ MongoDB Atlas Connected Successfully');

    // 2. Setup / Find Test Inspector & Test Institution
    let inspector = await User.findOne({ role: 'INSPECTION_OFFICER' });
    if (!inspector) {
      inspector = await User.create({
        name: 'Test Inspection Officer',
        email: `test_inspector_${Date.now()}@safeedup.gov.in`,
        password: 'Password123!',
        role: 'INSPECTION_OFFICER',
        district: 'Lucknow',
        dcpZone: 'CENTRAL',
        isVerified: true,
      });
    }
    console.log(`[TEST 2] ✅ Inspector User Verified: ${inspector.email} (ID: ${inspector._id})`);

    let institution = await Institution.findOne({ email: 'e2e_test_school@safeedup.gov.in' });
    if (!institution) {
      institution = await Institution.create({
        name: 'SafeED E2E Verification Academy',
        email: 'e2e_test_school@safeedup.gov.in',
        district: 'Lucknow',
        zone: 'CENTRAL',
        type: 'SCHOOL',
        status: 'PENDING_DOCUMENT_VERIFICATION',
        verificationStatus: 'UNVERIFIED',
        address: '123 Civil Lines, Lucknow, Uttar Pradesh',
        profileCompleted: true,
        totalStudents: 500,
        staffCount: 30,
        classroomCount: 15,
        floorCount: 2,
        exitGateCount: 3,
        emergencyContact: '9876543210',
      });
    } else {
      institution.isQrUnlocked = false;
      institution.safeId = null;
      await institution.save();
    }
    console.log(`[TEST 3] ✅ Test Institution Ready: ${institution.name} (ID: ${institution._id})`);

    // Clean old documents for clean test
    await Document.deleteMany({ institutionId: institution._id });

    // 3. Simulate Upload of all 4 mandatory document types
    const MANDATORY_TYPES = ['FIRE_SAFETY', 'BUILDING_SAFETY', 'ELECTRICAL_SAFETY', 'EVACUATION_SAFETY'];
    const uploadedDocs = [];

    for (const docType of MANDATORY_TYPES) {
      const mockFile = {
        buffer: Buffer.from(`Sample PDF content for ${docType}`),
        originalname: `${docType.toLowerCase()}_certificate.pdf`,
        mimetype: 'application/pdf',
        size: 1024,
      };

      const docRecord = await documentService.upload(
        institution._id.toString(),
        {
          title: `Official ${docType.replace(/_/g, ' ')} Certificate`,
          documentType: docType,
        },
        mockFile,
        inspector
      );
      uploadedDocs.push(docRecord);
      console.log(`[TEST 4] 📄 Document Uploaded: ${docRecord.title} -> Status: ${docRecord.verificationStatus}`);
    }

    // Verify initial QR state is LOCKED
    let initialCompliance = await documentService.getCompliance(institution._id);
    console.log(`[TEST 5] 🔒 Initial QR Status: ${initialCompliance.qrUnlocked ? 'UNLOCKED ❌ (FAILED)' : 'LOCKED ✅ (PASSED)'}`);
    if (initialCompliance.qrUnlocked) {
      throw new Error('QR unlocked prematurely before document approval!');
    }

    // 4. Approve documents one by one
    for (let i = 0; i < uploadedDocs.length; i++) {
      const doc = uploadedDocs[i];
      const approvedDoc = await documentService.verifyDocument(
        doc._id,
        'APPROVE',
        inspector._id,
        'Verified & approved by E2E test harness'
      );
      console.log(`[TEST 6.${i + 1}] ✓ Document Approved: ${approvedDoc.title} -> Status: ${approvedDoc.verificationStatus}`);

      const midCompliance = await documentService.getCompliance(institution._id);
      if (i < uploadedDocs.length - 1) {
        console.log(`[TEST 6.${i + 1}] 🔒 Partial Approval QR Status: ${midCompliance.qrUnlocked ? 'UNLOCKED ❌ (FAILED)' : 'LOCKED ✅ (PASSED)'}`);
      } else {
        console.log(`[TEST 6.4] 🔑 Final Approval QR Status: ${midCompliance.qrUnlocked ? 'UNLOCKED ✅ (PASSED)' : 'LOCKED ❌ (FAILED)'}`);
      }
    }

    // 5. Final Compliance & SafeID verification
    const finalCompliance = await documentService.getCompliance(institution._id);
    const updatedInst = await Institution.findById(institution._id);

    console.log('\n==================================================');
    console.log('🎉 END-TO-END PIPELINE AUDIT VERIFICATION RESULTS');
    console.log('==================================================');
    console.log(`• Institution Safe ID: ${finalCompliance.safeId || updatedInst.safeId}`);
    console.log(`• MongoDB isQrUnlocked Field: ${updatedInst.isQrUnlocked}`);
    console.log(`• Compliance qrUnlocked Flag: ${finalCompliance.qrUnlocked}`);
    console.log(`• All 4 Mandatory Documents Approved: ${finalCompliance.allDocumentsApproved}`);
    console.log('==================================================\n');

    if (updatedInst.isQrUnlocked && finalCompliance.qrUnlocked && finalCompliance.safeId) {
      console.log('✅ ALL E2E WORKFLOW TESTS PASSED PERFECTLY!');
    } else {
      throw new Error('E2E Verification Failed: QR Code was not unlocked after all 4 documents were approved.');
    }

  } catch (err) {
    console.error('❌ E2E Pipeline Test Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

runEndToEndTest();
