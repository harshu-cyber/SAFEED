// Temporary diagnostic script — safe read-only DB inspection
const mongoose = require('mongoose');
const env = require('../config/env');

(async () => {
  await mongoose.connect(env.MONGODB_URI);
  const User = require('../models/User.model');
  const Institution = require('../models/Institution.model');

  const user = await User.findOne({ email: 'hanu@gmail.com' });
  console.log('user._id type:', user._id.constructor.name, String(user._id));
  console.log('user.institutionId:', user.institutionId);

  const q = {
    $or: [
      { adminUserId: user._id },
      { email: user.email.toLowerCase() },
      { 'contactPerson.email': user.email.toLowerCase() },
    ],
  };
  const inst = await Institution.findOne(q);
  console.log('EXACT middleware/service query result:', inst ? inst.name + ' | ' + inst._id : 'NULL');

  const byAdminOnly = await Institution.findOne({ adminUserId: user._id });
  console.log('adminUserId(ObjectId) match:', byAdminOnly ? byAdminOnly.name : 'NULL');

  const raw = await mongoose.connection.db.collection('institutions').findOne({ adminUserId: String(user._id) });
  console.log('adminUserId(string) raw match:', raw ? raw.name : 'NULL');

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
