// ============================================================
// SafeED-UP — End-to-End Rebuilt Document Workflow Test Suite
// Verifies all 15 prompt requirements against MongoDB
// ============================================================
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/safeed_test';

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
const Document = require('../models/Document.model');
const { CANONICAL_DOCUMENT_TYPES } = require('../models/Document.model');
const documentService = require('../services/document.service');
const { generateTokenPair, verifyAccessToken } = require('../utils/tokenUtils');

async function runVerificationSuite() {
  console.log('\n============================================================');
  console.log('🧪 Starting Rebuilt Document Workflow End-to-End Verification');
  console.log('============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Database Connection
    console.log('[STEP 1] Connecting to MongoDB...');
    await connectDB();
    assert(mongoose.connection.readyState === 1, 'MongoDB connection established');

    // 2. Setup Test Institution & Users
    console.log('\n[STEP 2] Preparing Test Institution and User Accounts...');

    let testInst = await Institution.findOne({ name: 'VERIFICATION_TEST_SCHOOL' });
    if (!testInst) {
      testInst = await Institution.create({
        name: 'VERIFICATION_TEST_SCHOOL',
        type: 'SCHOOL',
        district: 'Lucknow',
        zone: 'CENTRAL',
        address: '123 Test Street, Lucknow',
        safeId: 'SAFE-UP-LUC-999999',
        status: 'PENDING_DOCUMENT_VERIFICATION',
        verificationStatus: 'UNVERIFIED',
      });
    }

    let instUser = await User.findOne({ email: 'test_inst_admin@safeed.test' });
    if (!instUser) {
      instUser = await User.create({
        name: 'Test Institution Admin',
        email: 'test_inst_admin@safeed.test',
        password: 'TestPassword123!',
        role: 'SCHOOL_ADMIN',
        institutionId: testInst._id,
        isEmailVerified: true,
        isActive: true,
      });
    } else {
      instUser.institutionId = testInst._id;
      instUser.role = 'SCHOOL_ADMIN';
      await instUser.save();
    }

    let inspectorUser = await User.findOne({ email: 'test_inspector@safeed.test' });
    if (!inspectorUser) {
      inspectorUser = await User.create({
        name: 'DCP Lucknow Inspector',
        email: 'test_inspector@safeed.test',
        password: 'TestPassword123!',
        role: 'INSPECTION_OFFICER',
        district: 'Lucknow',
        dcpZone: 'CENTRAL',
        isEmailVerified: true,
        isActive: true,
      });
    }

    assert(instUser && instUser._id, 'Institution user account ready');
    assert(inspectorUser && inspectorUser._id, 'Inspector user account ready');

    // 3. Test Authentication Tokens (Strict Real JWT Verification)
    console.log('\n[STEP 3] Testing Real JWT Token Authentication & Fake Token Rejection...');

    const tokens = generateTokenPair(instUser);
    assert(tokens.accessToken, 'Real JWT accessToken generated');

    const decoded = verifyAccessToken(tokens.accessToken);
    assert(decoded.id === String(instUser._id), 'JWT decoded payload matches institution user ID');

    // Verify rejection of fake token prefixes
    const fakeTokens = ['inst_test', 'officer_test', 'demo_123', 'admin_fake'];
    for (const fake of fakeTokens) {
      let threw = false;
      try {
        verifyAccessToken(fake);
      } catch (e) {
        threw = true;
      }
      assert(threw, `Fake token prefix "${fake}" strictly rejected`);
    }

    // 4. Test Single File GridFS Upload (`POST /api/v1/documents`)
    console.log('\n[STEP 4] Testing GridFS Binary Upload & Canonical Mongo Document Creation...');

    // Clean prior test documents
    await Document.deleteMany({ institutionId: testInst._id });

    const samplePdfBuffer = Buffer.from('%PDF-1.4 Mock PDF Content for SafeED-UP Verification Test');
    const mockFile = {
      buffer: samplePdfBuffer,
      originalname: 'FIRE_SAFETY_CERTIFICATE_TEST.pdf',
      mimetype: 'application/pdf',
      size: samplePdfBuffer.length,
    };

    const doc1 = await documentService.uploadDocument(instUser, mockFile, {
      documentType: 'FIRE_SAFETY',
    });

    assert(doc1 && doc1._id, 'Document record created in MongoDB');
    assert(doc1.documentType === 'FIRE_SAFETY', 'documentType set to canonical enum FIRE_SAFETY');
    assert(doc1.status === 'PENDING_REVIEW', 'Initial document status set to PENDING_REVIEW');
    assert(String(doc1.institutionId) === String(testInst._id), 'institutionId correctly associated');
    assert(doc1.fileStorageId && mongoose.Types.ObjectId.isValid(doc1.fileStorageId), 'fileStorageId is valid GridFS ObjectId');
    assert(doc1.assignedInspectorId && String(doc1.assignedInspectorId) === String(inspectorUser._id), 'assignedInspectorId auto-allocated to Lucknow Inspector');
    assert(typeof doc1.fileSize === 'number' && doc1.fileSize > 0, 'fileSize is numeric bytes count');

    // 5. Test Institution Fetch (`GET /api/v1/documents/my`)
    console.log('\n[STEP 5] Testing Institution Document List Query...');
    const myDocs = await documentService.getMyDocuments(instUser);
    assert(myDocs.length === 1, 'Institution document fetch returned exactly 1 document from MongoDB');
    assert(String(myDocs[0]._id) === String(doc1._id), 'Fetched document matches uploaded document ID');

    // 6. Test Inspector Assigned Fetch (`GET /api/v1/documents/inspector/assigned`)
    console.log('\n[STEP 6] Testing Inspector Assigned Document List Query...');
    const assignedDocs = await documentService.getInspectorAssignedDocuments(inspectorUser);
    assert(assignedDocs.length >= 1, 'Inspector assigned fetch returned documents from MongoDB');
    const foundDoc = assignedDocs.find(d => String(d._id) === String(doc1._id));
    assert(foundDoc, 'Uploaded document present in inspector assigned documents list');

    // 7. Test GridFS File Binary Stream (`GET /api/v1/documents/:id/file`)
    console.log('\n[STEP 7] Testing GridFS Binary Stream Retrieval...');
    const streamResult = await documentService.getDocumentFileStream(doc1._id);
    assert(streamResult.stream, 'GridFS download stream created successfully');
    assert(streamResult.mimeType === 'application/pdf', 'Correct MIME type application/pdf returned');
    assert(streamResult.originalFileName === 'FIRE_SAFETY_CERTIFICATE_TEST.pdf', 'Original filename returned');

    // Read stream bytes
    const chunks = [];
    for await (const chunk of streamResult.stream) {
      chunks.push(chunk);
    }
    const downloadedBuffer = Buffer.concat(chunks);
    assert(downloadedBuffer.toString() === samplePdfBuffer.toString(), 'Binary stream content matches uploaded buffer exactly');

    // 8. Test Document Approval (`PATCH /api/v1/documents/:id/approve`)
    console.log('\n[STEP 8] Testing Inspector Approval...');
    const approvedDoc = await documentService.approveDocument(doc1._id, inspectorUser);
    assert(approvedDoc.status === 'APPROVED', 'Document status updated to APPROVED');
    assert(String(approvedDoc.reviewedBy) === String(inspectorUser._id), 'reviewedBy set to Inspector ObjectId');
    assert(approvedDoc.reviewedAt instanceof Date, 'reviewedAt timestamp recorded');

    // Check QR Status before remaining documents
    const initialQr = await documentService.getQrStatus(testInst._id);
    assert(initialQr.qrUnlocked === false, 'QR Code is LOCKED when only 1 of 4 documents is approved');

    // 9. Upload & Approve Remaining 3 Canonical Document Types
    console.log('\n[STEP 9] Uploading and Approving Remaining 3 Canonical Document Types...');

    const remainingTypes = ['BUILDING_STRUCTURAL_SAFETY', 'ELECTRICAL_SAFETY', 'EVACUATION_PLAN'];
    for (const docType of remainingTypes) {
      const file = {
        buffer: Buffer.from(`%PDF-1.4 Content for ${docType}`),
        originalname: `${docType}_CERT.pdf`,
        mimetype: 'application/pdf',
        size: 500,
      };
      const uploaded = await documentService.uploadDocument(instUser, file, { documentType: docType });
      const approved = await documentService.approveDocument(uploaded._id, inspectorUser);
      assert(approved.status === 'APPROVED', `${docType} document successfully approved`);
    }

    // 10. Verify 4-Doc QR Unlock Engine
    console.log('\n[STEP 10] Testing 4-Doc QR Code Unlock Verification Engine...');
    const finalQr = await documentService.getQrStatus(testInst._id);
    assert(finalQr.qrUnlocked === true, 'QR Code UNLOCKED = true when all 4 mandatory document types are APPROVED');
    assert(Object.values(finalQr.documentStatus).every(s => s === 'APPROVED'), 'All 4 canonical document types marked APPROVED');

    const updatedInst = await Institution.findById(testInst._id);
    assert(updatedInst.qrLocked === false, 'Institution.qrLocked updated to false in MongoDB');
    assert(updatedInst.complianceScore === 100, 'Institution complianceScore updated to 100%');
    assert(updatedInst.verificationStatus === 'VERIFIED', 'Institution verificationStatus updated to VERIFIED');

    console.log('\n============================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} E2E VERIFICATION TESTS PASSED SUCCESSFULLY!`);
    console.log('============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E VERIFICATION SUITE FAILED AT STEP:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

runVerificationSuite().catch(err => {
  console.error('CRITICAL UNHANDLED ERROR:', err);
  process.exit(1);
});
