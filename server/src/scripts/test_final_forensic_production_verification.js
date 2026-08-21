// ============================================================
// SafeED-UP — Final Production Forensic Audit Verification Suite
// Validates 4-Document Cloudinary CDN Upload, MongoDB Metadata,
// Inspector Assigned List, File Redirect Stream, Approval, and QR Lock Engine
// ============================================================
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/safeed_test';
process.env.PORT = '5008';

const connectDB = require('../config/db');
const app = require('../app');
const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
const Document = require('../models/Document.model');

async function runForensicAuditVerification() {
  console.log('\n============================================================');
  console.log('🔍 SAFEED-UP FINAL FORENSIC AUDIT & PRODUCTION VERIFICATION');
  console.log('============================================================\n');

  let server;
  const BASE_URL = 'http://127.0.0.1:5008';

  try {
    await connectDB();
    server = app.listen(5008);
    console.log(`📡 Express Server running at ${BASE_URL}`);

    async function apiRequest(urlPath, method = 'GET', token = null, body = null, isFormData = false) {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (body && !isFormData) headers['Content-Type'] = 'application/json';

      const options = { method, headers };
      if (body) options.body = isFormData ? body : JSON.stringify(body);

      const res = await fetch(`${BASE_URL}${urlPath}`, options);
      return res;
    }

    // STEP 1: Institution Registration & Login
    const timestamp = Date.now();
    const regEmail = `forensic_school_${timestamp}@safeedup.test`;
    const regPhone = '9876543210';
    const regInstName = `Forensic Public School ${timestamp}`;

    console.log(`\n📝 [STEP 1 & 2] Registering & Authenticating Institution: "${regInstName}"...`);
    const regRes = await apiRequest('/api/v1/auth/register', 'POST', null, {
      name: 'Principal Forensic Admin',
      email: regEmail,
      phone: regPhone,
      password: 'TestPassword123!',
      role: 'SCHOOL_ADMIN',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      institutionName: regInstName,
      institutionType: 'SCHOOL',
      address: 'Hazratganj, Lucknow',
    });

    if (!regRes.ok) throw new Error('Registration failed');

    const loginRes = await apiRequest('/api/v1/auth/login', 'POST', null, {
      email: regEmail,
      password: regPhone,
    });
    const loginJson = await loginRes.json();
    const userToken = loginJson.data.accessToken;

    // Verify GET /api/v1/auth/me profile association
    const meRes = await apiRequest('/api/v1/auth/me', 'GET', userToken);
    const meJson = await meRes.json();
    const meUser = meJson.data.user || meJson.data;

    console.log('✅ Auth Me Profile Verified:', {
      userId: meUser._id,
      email: meUser.email,
      role: meUser.role,
      institutionId: meUser.institutionId,
    });

    if (!meUser.institutionId) {
      throw new Error('user.institutionId was not resolved or persisted!');
    }

    // STEP 3: Upload All 4 Required Safety Documents to Cloudinary CDN
    const canonicalDocs = [
      { type: 'FIRE_SAFETY', fileName: 'SAFEED_FINAL_REAL_FIRE_001.pdf' },
      { type: 'BUILDING_STRUCTURAL_SAFETY', fileName: 'SAFEED_FINAL_REAL_BUILDING_001.pdf' },
      { type: 'ELECTRICAL_SAFETY', fileName: 'SAFEED_FINAL_REAL_ELECTRICAL_001.pdf' },
      { type: 'EVACUATION_PLAN', fileName: 'SAFEED_FINAL_REAL_EVACUATION_001.pdf' },
    ];

    const uploadedDocIds = [];

    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n' +
      '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n' +
      '3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792]>> endobj\n' +
      'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n' +
      'trailer <</Size 4 /Root 1 0 R>>\nstartxref\n190\n%%EOF'
    );

    console.log('\n📤 [STEP 3 - 6] Uploading 4 Canonical Safety Documents to Cloudinary CDN...');

    for (const item of canonicalDocs) {
      const pdfBlob = new Blob([validPdfBuffer], { type: 'application/pdf' });
      const uploadForm = new FormData();
      uploadForm.append('documentType', item.type);
      uploadForm.append('file', pdfBlob, item.fileName);

      const uploadRes = await apiRequest('/api/v1/documents', 'POST', userToken, uploadForm, true);
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(`Upload failed for ${item.type}: ${JSON.stringify(uploadJson)}`);
      }

      const doc = uploadJson.data.document || uploadJson.data;
      uploadedDocIds.push(doc._id);

      console.log(`  ✅ Uploaded ${item.type}:`, {
        documentId: doc._id,
        fileUrl: doc.fileUrl,
        cloudinarySecureUrl: doc.cloudinarySecureUrl,
        cloudinaryPublicId: doc.cloudinaryPublicId,
        assignedInspectorId: doc.assignedInspectorId,
        status: doc.status,
      });

      if (!doc.fileUrl || !doc.fileUrl.includes('cloudinary.com')) {
        throw new Error(`Expected Cloudinary CDN URL for ${item.type}, got: ${doc.fileUrl}`);
      }
    }

    // STEP 4: Inspector Login & Document Retrieval
    console.log('\n👮 [STEP 9 & 10] Inspector Authentication & Assigned List Query...');
    let inspector = await User.findOne({ email: 'manual_inspector_lucknow@safeed.test' });
    const { generateTokenPair } = require('../utils/tokenUtils');
    const inspectorTokens = generateTokenPair(inspector);

    const assignedRes = await apiRequest('/api/v1/documents/inspector/assigned', 'GET', inspectorTokens.accessToken);
    const assignedJson = await assignedRes.json();
    const assignedDocs = assignedJson.data.documents || assignedJson.data;

    console.log(`✅ Inspector Assigned Documents Found: ${assignedDocs.length}`);
    for (const docId of uploadedDocIds) {
      const match = assignedDocs.find(d => String(d._id) === String(docId));
      if (!match) throw new Error(`Uploaded document ID ${docId} missing from Inspector assigned list!`);
    }

    // STEP 5: Verify Document Viewing (HTTP 302 Redirect to Cloudinary CDN)
    console.log('\n📄 [STEP 11] Verifying Document File Endpoint (302 Redirect to Cloudinary CDN)...');
    for (const docId of uploadedDocIds) {
      const fileRes = await fetch(`${BASE_URL}/api/v1/documents/${docId}/file`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${userToken}` },
        redirect: 'manual',
      });

      console.log(`  📄 File Endpoint HTTP ${fileRes.status} Location: ${fileRes.headers.get('location')}`);
      if (fileRes.status !== 302 || !fileRes.headers.get('location')?.includes('cloudinary.com')) {
        throw new Error(`Document ${docId} file endpoint failed to issue 302 redirect to Cloudinary CDN!`);
      }
    }

    // STEP 6: Inspector Approves All 4 Documents
    console.log('\n✅ [STEP 12 & 13] Inspector Approving All 4 Documents...');
    for (const docId of uploadedDocIds) {
      const approveRes = await apiRequest(`/api/v1/documents/${docId}/approve`, 'PATCH', inspectorTokens.accessToken, {
        remarks: 'Approved after forensic audit.',
      });
      if (!approveRes.ok) throw new Error(`Approval failed for document ID ${docId}`);
    }

    // STEP 7: Verify 4-Document QR Lock Status in MongoDB
    console.log('\n🔓 [STEP 14 & 23] Verifying 4-Document QR Unlocking Status...');
    const instRecord = await Institution.findById(meUser.institutionId);

    console.log('🍃 [FINAL MONGODB INSTITUTION STATE]:', {
      _id: String(instRecord._id),
      name: instRecord.name,
      qrLocked: instRecord.qrLocked,
      verificationStatus: instRecord.verificationStatus,
      complianceScore: instRecord.complianceScore,
      status: instRecord.status,
    });

    if (instRecord.qrLocked !== false) throw new Error('qrLocked is not false after 4 document approvals!');
    if (instRecord.verificationStatus !== 'VERIFIED') throw new Error(`verificationStatus is ${instRecord.verificationStatus}, expected VERIFIED!`);
    if (instRecord.complianceScore !== 100) throw new Error(`complianceScore is ${instRecord.complianceScore}, expected 100!`);

    console.log('\n============================================================');
    console.log('🎉 FORENSIC AUDIT COMPLETE & 100% PRODUCTION VERIFIED!');
    console.log('============================================================\n');

    server.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ FORENSIC AUDIT VERIFICATION FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    if (server) server.close();
    process.exit(1);
  }
}

runForensicAuditVerification();
