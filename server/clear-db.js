const mongoose = require('mongoose');
const env = require('./src/config/env');

const AuditLog = require('./src/models/AuditLog.model');
const Compliance = require('./src/models/Compliance.model');
const Deficiency = require('./src/models/Deficiency.model');
const Document = require('./src/models/Document.model');
const EmergencyPlan = require('./src/models/EmergencyPlan.model');
const Inspection = require('./src/models/Inspection.model');
const Institution = require('./src/models/Institution.model');
const Notification = require('./src/models/Notification.model');
const SafeID = require('./src/models/SafeID.model');
const User = require('./src/models/User.model');

async function wipeTarget(uri, label) {
  console.log(`\n🧹 Wiping database (${label})...`);
  try {
    const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log(`✅ Connected to ${label}`);

    const models = [
      ['AuditLog', conn.model('AuditLog', AuditLog.schema)],
      ['Compliance', conn.model('Compliance', Compliance.schema)],
      ['Deficiency', conn.model('Deficiency', Deficiency.schema)],
      ['Document', conn.model('Document', Document.schema)],
      ['EmergencyPlan', conn.model('EmergencyPlan', EmergencyPlan.schema)],
      ['Inspection', conn.model('Inspection', Inspection.schema)],
      ['Institution', conn.model('Institution', Institution.schema)],
      ['Notification', conn.model('Notification', Notification.schema)],
      ['SafeID', conn.model('SafeID', SafeID.schema)],
      ['User', conn.model('User', User.schema)],
    ];

    for (const [name, model] of models) {
      const res = await model.deleteMany({});
      console.log(`   - Cleared ${name}: ${res.deletedCount} items deleted`);
    }

    await conn.close();
    console.log(`✨ ${label} successfully wiped completely clean!`);
  } catch (err) {
    console.warn(`⚠️ Could not wipe ${label}: ${err.message}`);
  }
}

async function main() {
  // Wipe Local MongoDB
  await wipeTarget('mongodb://127.0.0.1:27017/safeedup', 'Local MongoDB');

  // Wipe Atlas MongoDB if configured
  if (env.MONGODB_URI && !env.MONGODB_URI.includes('127.0.0.1')) {
    await wipeTarget(env.MONGODB_URI, 'MongoDB Atlas Cloud');
  }

  console.log('\n🎉 ALL OLD DATA HAS BEEN WIPED SUCCESSFULLY!');
  process.exit(0);
}

main();
