// Temporary diagnostic — read-only
const mongoose = require('mongoose');
const env = require('../config/env');

(async () => {
  await mongoose.connect(env.MONGODB_URI);
  const col = mongoose.connection.db.collection('users');
  const users = await col.find({ role: { $in: ['SCHOOL_ADMIN', 'COACHING_ADMIN'] } }).project({ email: 1, phone: 1, institutionId: 1 }).toArray();
  users.forEach((u) => console.log(JSON.stringify(u)));
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
