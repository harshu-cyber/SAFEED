const mongoose = require('mongoose');
const env = require('./src/config/env');
const Institution = require('./src/models/Institution.model');
const Inspection = require('./src/models/Inspection.model');
const SafeID = require('./src/models/SafeID.model');

async function test() {
  await mongoose.connect(env.MONGODB_URI);
  const total = await Institution.countDocuments();
  const verified = await Institution.countDocuments({ verificationStatus: 'VERIFIED' });
  const fire = await Institution.countDocuments({ complianceScore: { $gte: 70 } });
  const safeIds = await Institution.countDocuments({ safeId: { $ne: null } });
  console.log('DB_COUNTS:', { total, verified, fire, safeIds });
  process.exit(0);
}
test().catch(err => { console.error(err); process.exit(1); });
