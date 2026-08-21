// ============================================================
// SafeED-UP — REAL PRODUCTION-DB MANUAL UPLOAD REPRODUCTION
// Uses REAL Atlas DB + REAL registered Institution Admin account.
// No mock data. Real JWT. Real HTTP.
// ============================================================
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
// NO MONGODB_URI override — uses the REAL Atlas URI from .env

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 5000}`;

async function apiRequest(urlPath, method = 'GET', token = null, body = null, isFormData = false) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';
  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);
  return fetch(`${BASE_URL}${urlPath}`, options);
}

(async () => {
  const email = process.argv[2] || 'hanu@gmail.com';
  const password = process.argv[3];
  if (!password) {
    console.error('Usage: node real_atlas_upload_test.js <email> <password>');
    process.exit(1);
  }

  console.log(`\n=== STEP 1: REAL LOGIN as ${email} ===`);
  const loginRes = await apiRequest('/api/v1/auth/login', 'POST', null, { email, password });
  const loginJson = await loginRes.json();
  console.log('Login status:', loginRes.status);
  if (!loginRes.ok) { console.error(JSON.stringify(loginJson)); process.exit(1); }
  const token = loginJson.data.accessToken;
  console.log('JWT acquired:', token ? token.slice(0, 25) + '...' : 'NONE');

  console.log('\n=== STEP 2: GET /api/v1/auth/me ===');
  const meRes = await apiRequest('/api/v1/auth/me', 'GET', token);
  const meJson = await meRes.json();
  console.log('auth/me status:', meRes.status);
  const meUser = meJson?.data?.user || {};
  console.log(JSON.stringify({
    _id: meUser._id || meUser.id,
    role: meUser.role,
    institutionId: meUser.institutionId,
    email: meUser.email,
    name: meUser.name,
  }, null, 2));

  console.log('\n=== STEP 3: UPLOAD SAFEED_MANUAL_REAL_TEST_001.pdf ===');
  const pdfStr = '%PDF-1.4 RAW BINARY FOR SAFEED_MANUAL_REAL_TEST_001.pdf';
  const blob = new Blob([pdfStr], { type: 'application/pdf' });
  const form = new FormData();
  form.append('documentType', 'FIRE_SAFETY');
  form.append('file', blob, 'SAFEED_MANUAL_REAL_TEST_001.pdf');

  const upRes = await apiRequest('/api/v1/documents', 'POST', token, form, true);
  const upJson = await upRes.json();
  console.log('Upload status:', upRes.status);
  console.log(JSON.stringify(upJson, null, 2).slice(0, 1500));

  process.exit(upRes.ok ? 0 : 1);
})().catch((e) => { console.error('TEST ERROR:', e.message); process.exit(1); });
