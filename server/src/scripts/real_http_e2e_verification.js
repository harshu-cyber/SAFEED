// ============================================================
// SafeED-UP — Real HTTP API & Database Verification Suite
// Uses Node 22 native fetch API against live Express server & MongoDB
// ============================================================
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/safeed_test';
process.env.PORT = '5005';

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const app = require('../app');
const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
const Document = require('../models/Document.model');
const { generateTokenPair } = require('../utils/tokenUtils');

async function runHttpVerification() {
  console.log('\n============================================================');
  console.log('🚀 REAL HTTP API & DATABASE VERIFICATION EXECUTION');
  console.log('============================================================\n');

  let server;
  const BASE_URL = 'http://127.0.0.1:5005';

  try {
    // 1. Database Connection & Server Launch
    await connectDB();
    server = app.listen(5005);
    console.log(`📡 Express server listening on ${BASE_URL}`);

    // 2. Setup Test Database Records
    console.log('\n[CHECKPOINT 0] Setting up Test Institution & Inspector Users in MongoDB...');

    let testInst = await Institution.findOne({ name: 'HTTP_E2E_TEST_SCHOOL' });
    if (!testInst) {
      testInst = await Institution.create({
        name: 'HTTP_E2E_TEST_SCHOOL',
        type: 'SCHOOL',
        district: 'Lucknow',
        zone: 'CENTRAL',
        address: '456 SafeED Highway, Lucknow',
        safeId: 'SAFE-UP-LUC-888888',
        status: 'PENDING_DOCUMENT_VERIFICATION',
        verificationStatus: 'UNVERIFIED',
      });
    }

    let instUser = await User.findOne({ email: 'http_inst_admin@safeed.test' });
    if (!instUser) {
      instUser = await User.create({
        name: 'HTTP Test Institution Admin',
        email: 'http_inst_admin@safeed.test',
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

    let inspectorUser = await User.findOne({ email: 'http_inspector@safeed.test' });
    if (!inspectorUser) {
      inspectorUser = await User.create({
        name: 'Inspector Vijay Kumar',
        email: 'http_inspector@safeed.test',
        password: 'TestPassword123!',
        role: 'INSPECTION_OFFICER',
        district: 'Lucknow',
        dcpZone: 'CENTRAL',
        isEmailVerified: true,
        isActive: true,
      });
    }

    // Purge old test documents
    await Document.deleteMany({ institutionId: testInst._id });

    // Generate Real JWT Tokens
    const instTokens = generateTokenPair(instUser);
    const inspectorTokens = generateTokenPair(inspectorUser);

    // Helper for JSON HTTP requests
    async function makeRequest(urlPath, method = 'GET', token, body = null, isFormData = false) {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (body && !isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const options = {
        method,
        headers,
      };

      if (body) {
        options.body = isFormData ? body : JSON.stringify(body);
      }

      const res = await fetch(`${BASE_URL}${urlPath}`, options);
      return res;
    }

    // ------------------------------------------------------------
    // CHECKPOINT 1: Upload Fire Safety Document via HTTP POST
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('[CHECKPOINT 1] Uploading SAFEED_E2E_TEST_FIRE_001.pdf via POST /api/v1/documents');
    console.log('============================================================');

    const fileContentStr = '%PDF-1.4 RAW BINARY CONTENT FOR SAFEED_E2E_TEST_FIRE_001.pdf';
    const fileBlob = new Blob([fileContentStr], { type: 'application/pdf' });

    const form1 = new FormData();
    form1.append('documentType', 'FIRE_SAFETY');
    form1.append('file', fileBlob, 'SAFEED_E2E_TEST_FIRE_001.pdf');

    const uploadHttpRes = await makeRequest('/api/v1/documents', 'POST', instTokens.accessToken, form1, true);
    const uploadJson = await uploadHttpRes.json();

    if (!uploadHttpRes.ok) {
      throw new Error(`Upload failed with HTTP ${uploadHttpRes.status}: ${JSON.stringify(uploadJson)}`);
    }

    console.log('\n📥 [BACKEND HTTP RESPONSE]:');
    const docData = uploadJson.data.document || uploadJson.data;
    console.log(JSON.stringify({
      documentId: docData._id,
      institutionId: docData.institutionId,
      documentType: docData.documentType,
      originalFileName: docData.originalFileName,
      fileStorageId: docData.fileStorageId,
      assignedInspectorId: docData.assignedInspectorId,
      status: docData.status,
    }, null, 2));

    const fireDocId = docData._id;

    // ------------------------------------------------------------
    // CHECKPOINT 2: Direct MongoDB Query Verification
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('[CHECKPOINT 2] Direct MongoDB Query for Document ID:', fireDocId);
    console.log('============================================================');

    const dbDoc1 = await Document.findById(fireDocId);
    console.log('🍃 [MONGODB RECORD]:');
    console.log({
      _id: String(dbDoc1._id),
      institutionId: String(dbDoc1.institutionId),
      documentType: dbDoc1.documentType,
      originalFileName: dbDoc1.originalFileName,
      fileStorageId: String(dbDoc1.fileStorageId),
      assignedInspectorId: String(dbDoc1.assignedInspectorId),
      status: dbDoc1.status,
      fileSize: dbDoc1.fileSize,
    });

    if (String(dbDoc1._id) !== fireDocId) throw new Error('MongoDB Document ID mismatch!');

    // ------------------------------------------------------------
    // CHECKPOINT 3: Inspector Assigned Fetch via HTTP
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('[CHECKPOINT 3] Inspector Fetching Assigned Docs via GET /api/v1/documents/inspector/assigned');
    console.log('============================================================');

    const inspectorAssignedHttpRes = await makeRequest('/api/v1/documents/inspector/assigned', 'GET', inspectorTokens.accessToken);
    const inspectorAssignedJson = await inspectorAssignedHttpRes.json();
    const assignedList = inspectorAssignedJson.data.documents || inspectorAssignedJson.data;
    const foundInspectorDoc = assignedList.find(d => String(d._id) === fireDocId);

    console.log('🔎 [INSPECTOR API RETURNED DOCS COUNT]:', assignedList.length);
    console.log('🔎 [MATCHED INSPECTOR DOC ID]:', foundInspectorDoc ? foundInspectorDoc._id : 'NOT FOUND');

    if (!foundInspectorDoc || String(foundInspectorDoc._id) !== fireDocId) {
      throw new Error(`Inspector document list did not contain uploaded document ID ${fireDocId}!`);
    }

    // ------------------------------------------------------------
    // CHECKPOINT 4: GridFS File Binary Streaming Verification
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log(`[CHECKPOINT 4] Fetching Binary Stream via GET /api/v1/documents/${fireDocId}/file`);
    console.log('============================================================');

    const fileStreamHttpRes = await makeRequest(`/api/v1/documents/${fireDocId}/file`, 'GET', inspectorTokens.accessToken);
    const contentTypeHeader = fileStreamHttpRes.headers.get('content-type');
    const contentDispositionHeader = fileStreamHttpRes.headers.get('content-disposition');
    const downloadedText = await fileStreamHttpRes.text();

    console.log('📄 [HTTP RESPONSE HEADERS]:');
    console.log({
      'content-type': contentTypeHeader,
      'content-disposition': contentDispositionHeader,
    });

    console.log('📄 [BINARY CONTENT PREVIEW]:', downloadedText);

    if (!contentTypeHeader.includes('application/pdf')) {
      throw new Error(`Expected content-type application/pdf, but got ${contentTypeHeader}`);
    }
    if (downloadedText.includes('<!DOCTYPE html>') || downloadedText.includes('<html')) {
      throw new Error('CRITICAL BUG: File endpoint returned HTML page instead of binary PDF!');
    }
    if (downloadedText !== fileContentStr) {
      throw new Error('Downloaded binary does not match uploaded file content!');
    }

    // ------------------------------------------------------------
    // CHECKPOINT 5: Document Approval via HTTP PATCH
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log(`[CHECKPOINT 5] Approving Document via PATCH /api/v1/documents/${fireDocId}/approve`);
    console.log('============================================================');

    const approveHttpRes = await makeRequest(`/api/v1/documents/${fireDocId}/approve`, 'PATCH', inspectorTokens.accessToken, {
      remarks: 'Fire safety certificate verified and valid.',
    });
    const approveJson = await approveHttpRes.json();

    console.log('✅ [APPROVAL API RESPONSE]:', JSON.stringify(approveJson, null, 2));

    const updatedDbDoc1 = await Document.findById(fireDocId);
    console.log('🍃 [UPDATED MONGODB RECORD]:');
    console.log({
      _id: String(updatedDbDoc1._id),
      status: updatedDbDoc1.status,
      reviewedBy: String(updatedDbDoc1.reviewedBy),
      reviewedAt: updatedDbDoc1.reviewedAt,
      remarks: updatedDbDoc1.remarks,
    });

    if (updatedDbDoc1.status !== 'APPROVED') throw new Error('Document status was not updated to APPROVED in Mongo!');
    if (String(updatedDbDoc1.reviewedBy) !== String(inspectorUser._id)) throw new Error('reviewedBy mismatch!');

    // ------------------------------------------------------------
    // CHECKPOINT 6: Upload and Approve Remaining 3 Document Types
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('[CHECKPOINT 6] Uploading & Approving Remaining 3 Mandatory Document Types...');
    console.log('============================================================');

    const remainingSpecs = [
      { type: 'BUILDING_STRUCTURAL_SAFETY', filename: 'SAFEED_E2E_TEST_BUILDING_002.pdf' },
      { type: 'ELECTRICAL_SAFETY', filename: 'SAFEED_E2E_TEST_ELEC_003.pdf' },
      { type: 'EVACUATION_PLAN', filename: 'SAFEED_E2E_TEST_EVAC_004.pdf' },
    ];

    for (const spec of remainingSpecs) {
      console.log(`\n📤 Uploading ${spec.type} (${spec.filename})...`);
      const str = `%PDF-1.4 RAW BINARY CONTENT FOR ${spec.filename}`;
      const blob = new Blob([str], { type: 'application/pdf' });
      const form = new FormData();
      form.append('documentType', spec.type);
      form.append('file', blob, spec.filename);

      const upRes = await makeRequest('/api/v1/documents', 'POST', instTokens.accessToken, form, true);
      const upJson = await upRes.json();
      const createdDoc = upJson.data.document || upJson.data;
      const createdId = createdDoc._id;
      console.log(`  -> Created Document ID: ${createdId}`);

      const appRes = await makeRequest(`/api/v1/documents/${createdId}/approve`, 'PATCH', inspectorTokens.accessToken, {
        remarks: `${spec.type} verified successfully.`,
      });
      const appJson = await appRes.json();
      const appDoc = appJson.data.document || appJson.data;
      console.log(`  -> Approved ${spec.type}: status = ${appDoc.status}`);
    }

    // ------------------------------------------------------------
    // CHECKPOINT 7: Final QR Unlock State Verification
    // ------------------------------------------------------------
    console.log('\n============================================================');
    console.log('[CHECKPOINT 7] Final 4-Document Approval & QR Code Unlock State');
    console.log('============================================================');

    const allDocs = await Document.find({ institutionId: testInst._id });
    console.log('🍃 [ALL MONGODB DOCUMENTS FOR INSTITUTION]:');
    allDocs.forEach(d => {
      console.log(`  - [${d.documentType}] ID: ${d._id} | Status: ${d.status} | File: ${d.originalFileName}`);
    });

    const qrStatusHttpRes = await makeRequest('/api/v1/documents/qr-status', 'GET', instTokens.accessToken);
    const qrStatusJson = await qrStatusHttpRes.json();

    console.log('\n🔓 [HTTP GET /api/v1/documents/qr-status RESPONSE]:');
    console.log(JSON.stringify(qrStatusJson.data, null, 2));

    const finalInstDb = await Institution.findById(testInst._id);
    console.log('\n🍃 [FINAL INSTITUTION MONGODB RECORD]:');
    console.log({
      _id: String(finalInstDb._id),
      name: finalInstDb.name,
      qrLocked: finalInstDb.qrLocked,
      complianceScore: finalInstDb.complianceScore,
      verificationStatus: finalInstDb.verificationStatus,
    });

    if (qrStatusJson.data.qrUnlocked !== true) throw new Error('qrUnlocked is NOT true after 4 docs approved!');
    if (finalInstDb.qrLocked !== false) throw new Error('Institution.qrLocked in DB is NOT false!');
    if (finalInstDb.complianceScore !== 100) throw new Error('Institution complianceScore in DB is NOT 100!');
    if (finalInstDb.verificationStatus !== 'VERIFIED') throw new Error('Institution verificationStatus in DB is NOT VERIFIED!');

    console.log('\n============================================================');
    console.log('🎉 REAL E2E HTTP API & MONGODB VERIFICATION COMPLETED WITH 100% SUCCESS!');
    console.log('============================================================\n');

    server.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ REAL HTTP E2E VERIFICATION FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    if (server) server.close();
    process.exit(1);
  }
}

runHttpVerification();
