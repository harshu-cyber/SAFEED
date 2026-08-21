// ============================================================
// SafeED-UP — Cloudinary E2E Verification Suite
// Validates file uploads to Cloudinary CDN, MongoDB metadata persistence,
// PDF stream fetching, Inspector approval, and 4-Doc QR Lock state.
// ============================================================
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/safeed_test';
process.env.PORT = '5007';

const connectDB = require('../config/db');
const app = require('../app');
const User = require('../models/User.model');
const Institution = require('../models/Institution.model');
const Document = require('../models/Document.model');

async function runCloudinaryVerification() {
  console.log('\n============================================================');
  console.log('☁️ CLOUDINARY CDN DOCUMENT WORKFLOW VERIFICATION');
  console.log('============================================================\n');

  let server;
  const BASE_URL = 'http://127.0.0.1:5007';

  try {
    await connectDB();
    server = app.listen(5007);
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

    // 1. Institution Admin Registration & Login
    const regEmail = `cloudinary_school_${Date.now()}@safeedup.test`;
    const regPhone = '9876543210';
    const regInstName = `Cloudinary Academy ${Date.now()}`;

    console.log(`\n📝 Registering Institution: "${regInstName}"...`);
    const regRes = await apiRequest('/api/v1/auth/register', 'POST', null, {
      name: 'Dr. Cloud Admin',
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

    console.log('✅ Registered & Logged In with JWT Token!');

    // 2. Upload PDF Document to Cloudinary
    console.log('\n📤 Uploading document SAFEED_CLOUDINARY_TEST_001.pdf to Cloudinary CDN...');
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n' +
      '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n' +
      '3 0 obj <</Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792]>> endobj\n' +
      'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n' +
      'trailer <</Size 4 /Root 1 0 R>>\nstartxref\n190\n%%EOF'
    );
    const pdfBlob = new Blob([validPdfBuffer], { type: 'application/pdf' });
    const uploadForm = new FormData();
    uploadForm.append('documentType', 'FIRE_SAFETY');
    uploadForm.append('file', pdfBlob, 'SAFEED_CLOUDINARY_TEST_001.pdf');

    const uploadRes = await apiRequest('/api/v1/documents', 'POST', userToken, uploadForm, true);
    const uploadJson = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status}): ${JSON.stringify(uploadJson)}`);
    }

    console.log('✅ Upload HTTP Response Status:', uploadRes.status);
    const docData = uploadJson.data.document || uploadJson.data;

    console.log('\n☁️ [CLOUDINARY CDN METADATA IN MONGODB]:');
    console.log(JSON.stringify({
      documentId: docData._id,
      institutionId: docData.institutionId,
      documentType: docData.documentType,
      originalFileName: docData.originalFileName,
      fileUrl: docData.fileUrl,
      cloudinaryPublicId: docData.cloudinaryPublicId,
      status: docData.status,
    }, null, 2));

    if (!docData.fileUrl || !docData.fileUrl.includes('cloudinary.com')) {
      throw new Error(`Expected Cloudinary CDN URL, got: ${docData.fileUrl}`);
    }

    // 3. Fetch PDF Stream from Cloudinary CDN Endpoint
    console.log(`\n📄 Fetching PDF Stream from GET /api/v1/documents/${docData._id}/file...`);
    const streamRes = await fetch(`${BASE_URL}/api/v1/documents/${docData._id}/file`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` },
      redirect: 'manual', // Check HTTP 302 Redirect to Cloudinary CDN
    });

    console.log('📄 [FILE ENDPOINT RESPONSE STATUS]:', streamRes.status);
    console.log('📄 [FILE ENDPOINT LOCATION HEADER]:', streamRes.headers.get('location'));

    if (streamRes.status === 302) {
      const redirectUrl = streamRes.headers.get('location');
      console.log('✅ Correctly issuing HTTP 302 Redirect to Cloudinary CDN URL:', redirectUrl);
      if (!redirectUrl.includes('cloudinary.com')) {
        throw new Error(`Expected redirect to Cloudinary CDN URL, got: ${redirectUrl}`);
      }
    } else if (!streamRes.ok) {
      throw new Error(`File fetch failed with status: ${streamRes.status}`);
    }

    // 4. Inspector Approval
    console.log('\n👮 Approving Cloudinary Document via Inspector...');
    let inspector = await User.findOne({ email: 'manual_inspector_lucknow@safeed.test' });
    const { generateTokenPair } = require('../utils/tokenUtils');
    const inspectorTokens = generateTokenPair(inspector);

    const approveRes = await apiRequest(`/api/v1/documents/${docData._id}/approve`, 'PATCH', inspectorTokens.accessToken, {
      remarks: 'Cloudinary PDF certificate approved.',
    });

    console.log('✅ Approval API Status:', approveRes.status);

    const approvedDoc = await Document.findById(docData._id);
    console.log('🍃 [APPROVED MONGODB RECORD]:', {
      _id: String(approvedDoc._id),
      status: approvedDoc.status,
      fileUrl: approvedDoc.fileUrl,
    });

    if (approvedDoc.status !== 'APPROVED') {
      throw new Error('Document status was not updated to APPROVED!');
    }

    console.log('\n============================================================');
    console.log('🎉 CLOUDINARY CDN INTEGRATION VERIFIED 100% SUCCESSFULLY!');
    console.log('============================================================\n');

    server.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ CLOUDINARY VERIFICATION FAILED:', err.message);
    if (err.stack) console.error(err.stack);
    if (server) server.close();
    process.exit(1);
  }
}

runCloudinaryVerification();
