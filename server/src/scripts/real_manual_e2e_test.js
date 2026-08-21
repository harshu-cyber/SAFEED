// ============================================================
// SafeED-UP — Real Manual E2E Test Suite (8-Step Execution)
// Validates Real Institution Account Registration/Login, GET /api/v1/auth/me,
// User-Institution Relationship, Uploading SAFEED_MANUAL_REAL_TEST_001.pdf,
// Inspector Assignment, Binary File Stream, and Approval.
// ============================================================
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/safeed_test';
process.env.PORT = '5006';

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const app = require('../app');
const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
const Document = require('../models/Document.model');

async function runManualE2ETest() {
  console.log('\n============================================================');
  console.log('🧪 REAL MANUAL E2E USER-INSTITUTION & UPLOAD VERIFICATION');
  console.log('============================================================\n');

  let server;
  const BASE_URL = 'http://127.0.0.1:5006';

  try {
    // 1. DB Connect & Server Start
    await connectDB();
    server = app.listen(5006);
    console.log(`📡 Express Server running at ${BASE_URL}`);

    // Helper HTTP Request Function
    async function apiRequest(urlPath, method = 'GET', token = null, body = null, isFormData = false) {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (body && !isFormData) headers['Content-Type'] = 'application/json';

      const options = { method, headers };
      if (body) options.body = isFormData ? body : JSON.stringify(body);

      const res = await fetch(`${BASE_URL}${urlPath}`, options);
      return res;
    }

    // ------------------------------------------------------------
    // STEP 1: Real Account Registration / Login Flow
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('STEP 1 — REAL INSTITUTION REGISTRATION & LOGIN');
    console.log('============================================================');

    const regEmail = `real_school_admin_${Date.now()}@safeedup.test`;
    const regPhone = '9876543210';
    const regPassword = 'TestPassword123!';
    const regInstName = `St. Francis School ${Date.now()}`;

    console.log(`📝 Registering new Institution Admin: ${regEmail} | Institution: "${regInstName}"`);

    const regRes = await apiRequest('/api/v1/auth/register', 'POST', null, {
      name: 'Fr. Thomas Administrator',
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: 'SCHOOL_ADMIN',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      institutionName: regInstName,
      institutionType: 'SCHOOL',
      address: 'Hazratganj Main Road, Lucknow',
    });

    const regJson = await regRes.json();
    if (!regRes.ok) {
      throw new Error(`Registration failed (${regRes.status}): ${JSON.stringify(regJson)}`);
    }

    console.log('✅ Registration HTTP Status:', regRes.status);
    console.log('✅ Account Registered Successfully!');

    // Now perform Login with the registered credentials
    console.log(`\n🔑 Performing Login for ${regEmail} with auto-set password (${regPhone})...`);
    const loginRes = await apiRequest('/api/v1/auth/login', 'POST', null, {
      email: regEmail,
      password: regPhone,
    });

    const loginJson = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);

    const userToken = loginJson.data.accessToken;
    console.log('✅ Real JWT Access Token acquired.');

    // ------------------------------------------------------------
    // STEP 2: GET /api/v1/auth/me Profile Verification
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('STEP 2 — CALLING GET /api/v1/auth/me');
    console.log('============================================================');

    const meRes = await apiRequest('/api/v1/auth/me', 'GET', userToken);
    const meJson = await meRes.json();

    if (!meRes.ok) throw new Error(`auth/me failed: ${JSON.stringify(meJson)}`);

    const meUser = meJson.data.user;
    console.log('👤 [AUTHENTICATED USER PROFILE]:');
    console.log(JSON.stringify({
      user_id: meUser._id || meUser.id,
      user_role: meUser.role,
      user_institutionId: meUser.institutionId,
      user_email: meUser.email,
      user_name: meUser.name,
    }, null, 2));

    if (!meUser.institutionId) {
      throw new Error('CRITICAL BUG: user.institutionId is MISSING from auth/me profile!');
    }

    // ------------------------------------------------------------
    // STEP 3: MongoDB Institution Record Check
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('STEP 3 — CHECKING INSTITUTION RECORD IN MONGODB');
    console.log('============================================================');

    const instDb = await Institution.findById(meUser.institutionId);
    if (!instDb) {
      throw new Error(`Institution document not found in MongoDB for ID: ${meUser.institutionId}`);
    }

    console.log('🍃 [MATCHED MONGODB INSTITUTION]:');
    console.log({
      _id: String(instDb._id),
      name: instDb.name,
      type: instDb.type,
      district: instDb.district,
      zone: instDb.zone,
      adminUserId: String(instDb.adminUserId),
    });

    if (String(instDb._id) !== String(meUser.institutionId)) {
      throw new Error('User institutionId does not match MongoDB Institution _id!');
    }

    // ------------------------------------------------------------
    // STEP 4: Upload SAFEED_MANUAL_REAL_TEST_001.pdf
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('STEP 4 — UPLOADING SAFEED_MANUAL_REAL_TEST_001.pdf via POST /api/v1/documents');
    console.log('============================================================');

    const pdfStr = '%PDF-1.4 RAW BINARY FOR SAFEED_MANUAL_REAL_TEST_001.pdf';
    const pdfBlob = new Blob([pdfStr], { type: 'application/pdf' });
    const uploadForm = new FormData();
    uploadForm.append('documentType', 'FIRE_SAFETY');
    uploadForm.append('file', pdfBlob, 'SAFEED_MANUAL_REAL_TEST_001.pdf');

    const uploadRes = await apiRequest('/api/v1/documents', 'POST', userToken, uploadForm, true);
    const uploadJson = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status}): ${JSON.stringify(uploadJson)}`);
    }

    console.log('✅ HTTP POST /api/v1/documents Status:', uploadRes.status);
    const uploadedDoc = uploadJson.data.document || uploadJson.data;

    console.log('📥 [UPLOADED DOCUMENT DETAILS]:');
    console.log(JSON.stringify({
      uploaded_documentId: uploadedDoc._id,
      uploaded_institutionId: uploadedDoc.institutionId,
      uploaded_documentType: uploadedDoc.documentType,
      uploaded_originalFileName: uploadedDoc.originalFileName,
      uploaded_fileStorageId: uploadedDoc.fileStorageId,
      uploaded_assignedInspectorId: uploadedDoc.assignedInspectorId,
      uploaded_status: uploadedDoc.status,
    }, null, 2));

    if (String(uploadedDoc.institutionId) !== String(meUser.institutionId)) {
      throw new Error(`Uploaded document institutionId (${uploadedDoc.institutionId}) does not match authenticated user institutionId (${meUser.institutionId})!`);
    }

    const testDocId = uploadedDoc._id;

    // ------------------------------------------------------------
    // STEP 5: Inspector Login & Assigned List Verification
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('STEP 5 — INSPECTOR LOGIN & ASSIGNED DOCUMENT QUERY');
    console.log('============================================================');

    // Create or find an inspector for Lucknow CENTRAL
    let inspector = await User.findOne({ email: 'manual_inspector_lucknow@safeed.test' });
    if (!inspector) {
      inspector = await User.create({
        name: 'Inspector Inspector Singh',
        email: 'manual_inspector_lucknow@safeed.test',
        password: 'TestPassword123!',
        role: 'INSPECTION_OFFICER',
        district: 'Lucknow',
        dcpZone: 'CENTRAL',
        isEmailVerified: true,
        isActive: true,
      });
    }

    const { generateTokenPair } = require('../utils/tokenUtils');
    const inspectorTokens = generateTokenPair(inspector);

    const inspectorAssignedRes = await apiRequest('/api/v1/documents/inspector/assigned', 'GET', inspectorTokens.accessToken);
    const inspectorAssignedJson = await inspectorAssignedRes.json();

    const assignedDocs = inspectorAssignedJson.data.documents || inspectorAssignedJson.data;
    const foundDoc = assignedDocs.find(d => String(d._id) === String(testDocId));

    console.log('🔎 [INSPECTOR ASSIGNED DOCS COUNT]:', assignedDocs.length);
    console.log('🔎 [FOUND UPLOADING DOC IN INSPECTOR LIST]:', foundDoc ? foundDoc._id : 'NOT FOUND');

    if (!foundDoc) {
      throw new Error(`Uploaded document ${testDocId} was NOT found in Inspector assigned list!`);
    }

    // ------------------------------------------------------------
    // STEP 6: PDF Binary File Stream Verification
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log(`STEP 6 — FETCHING PDF STREAM GET /api/v1/documents/${testDocId}/file`);
    console.log('============================================================');

    const fileStreamRes = await apiRequest(`/api/v1/documents/${testDocId}/file`, 'GET', inspectorTokens.accessToken);
    const streamContentType = fileStreamRes.headers.get('content-type');
    const streamDisposition = fileStreamRes.headers.get('content-disposition');
    const streamBodyText = await fileStreamRes.text();

    console.log('📄 [STREAM HEADERS]:', {
      'content-type': streamContentType,
      'content-disposition': streamDisposition,
    });
    console.log('📄 [STREAM BODY PREVIEW]:', streamBodyText);

    if (!streamContentType.includes('application/pdf')) {
      throw new Error(`Expected application/pdf stream, got ${streamContentType}`);
    }
    if (streamBodyText.includes('<!DOCTYPE html>')) {
      throw new Error('Stream returned HTML instead of binary PDF!');
    }
    if (streamBodyText !== pdfStr) {
      throw new Error('Stream content does not match uploaded PDF content!');
    }

    // ------------------------------------------------------------
    // STEP 7: Document Approval
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log(`STEP 7 — APPROVING DOCUMENT via PATCH /api/v1/documents/${testDocId}/approve`);
    console.log('============================================================');

    const approveRes = await apiRequest(`/api/v1/documents/${testDocId}/approve`, 'PATCH', inspectorTokens.accessToken, {
      remarks: 'Fire safety certificate manually verified.',
    });
    const approveJson = await approveRes.json();

    console.log('✅ Approval API Response Status:', approveRes.status);

    const approvedDocDb = await Document.findById(testDocId);
    console.log('🍃 [APPROVED DOCUMENT MONGODB RECORD]:');
    console.log({
      _id: String(approvedDocDb._id),
      status: approvedDocDb.status,
      reviewedBy: String(approvedDocDb.reviewedBy),
      reviewedAt: approvedDocDb.reviewedAt,
    });

    if (approvedDocDb.status !== 'APPROVED') {
      throw new Error('Document status was not updated to APPROVED!');
    }

    // ------------------------------------------------------------
    // STEP 8: Remaining 3 Mandatory Docs & QR Unlock
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('STEP 8 — REMAINING 3 DOCUMENTS & FINAL QR CODE UNLOCK STATE');
    console.log('============================================================');

    const remainingTypes = [
      { type: 'BUILDING_STRUCTURAL_SAFETY', filename: 'SAFEED_MANUAL_REAL_TEST_002.pdf' },
      { type: 'ELECTRICAL_SAFETY', filename: 'SAFEED_MANUAL_REAL_TEST_003.pdf' },
      { type: 'EVACUATION_PLAN', filename: 'SAFEED_MANUAL_REAL_TEST_004.pdf' },
    ];

    for (const item of remainingTypes) {
      const bStr = `%PDF-1.4 RAW CONTENT FOR ${item.filename}`;
      const blob = new Blob([bStr], { type: 'application/pdf' });
      const form = new FormData();
      form.append('documentType', item.type);
      form.append('file', blob, item.filename);

      const upRes = await apiRequest('/api/v1/documents', 'POST', userToken, form, true);
      const upJ = await upRes.json();
      const cDoc = upJ.data.document || upJ.data;

      await apiRequest(`/api/v1/documents/${cDoc._id}/approve`, 'PATCH', inspectorTokens.accessToken, {
        remarks: 'Approved.',
      });
      console.log(`  -> Approved ${item.type} (ID: ${cDoc._id})`);
    }

    const qrStatusRes = await apiRequest('/api/v1/documents/qr-status', 'GET', userToken);
    const qrStatusJson = await qrStatusRes.json();

    console.log('\n🔓 [FINAL QR UNLOCK API RESPONSE]:');
    console.log(JSON.stringify(qrStatusJson.data, null, 2));

    const finalInst = await Institution.findById(meUser.institutionId);
    console.log('\n🍃 [FINAL INSTITUTION MONGODB RECORD]:');
    console.log({
      _id: String(finalInst._id),
      name: finalInst.name,
      qrLocked: finalInst.qrLocked,
      complianceScore: finalInst.complianceScore,
      verificationStatus: finalInst.verificationStatus,
    });

    if (qrStatusJson.data.qrUnlocked !== true || finalInst.qrLocked !== false) {
      throw new Error('QR unlock failed after approving all 4 documents!');
    }

    console.log('\n============================================================');
    console.log('🎉 REAL MANUAL E2E TEST PASSED 100% SUCCESSFULLY!');
    console.log('============================================================\n');

    server.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ REAL MANUAL E2E TEST FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    if (server) server.close();
    process.exit(1);
  }
}

runManualE2ETest();
