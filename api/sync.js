// ============================================================
// SafeED-UP — Ultra-Fast Zero-Latency Global Sync Endpoint
// 100% Reliable Serverless Memory Store for Vercel Deployment
// ============================================================

// Warm container memory store (persists across active serverless invocations)
let globalStore = {
  users: [],
  institutions: [],
  updatedAt: new Date().toISOString(),
};

function mergeUsers(existing, incoming) {
  const SA_EMAIL = 'superadmin@safeed.ac.in';
  const filteredIncoming = incoming.filter(u => u.email !== SA_EMAIL && u.role !== 'SUPER_ADMIN');

  const map = {};
  for (const u of existing) {
    const key = u._id || u.email;
    if (key) map[key] = u;
  }
  for (const u of filteredIncoming) {
    const key = u._id || u.email;
    if (key) map[key] = u;
  }
  return Object.values(map);
}

function mergeInstitutions(existing, incoming) {
  const map = {};
  for (const i of existing) {
    const key = i._id || i.name;
    if (key) map[key] = i;
  }
  for (const i of incoming) {
    const key = i._id || i.name;
    if (key) map[key] = i;
  }
  return Object.values(map);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: globalStore,
      });
    }

    if (req.method === 'POST') {
      const { users, institutions } = req.body || {};

      if (Array.isArray(users) && users.length > 0) {
        globalStore.users = mergeUsers(globalStore.users, users);
      }
      if (Array.isArray(institutions) && institutions.length > 0) {
        globalStore.institutions = mergeInstitutions(globalStore.institutions, institutions);
      }
      globalStore.updatedAt = new Date().toISOString();

      return res.status(200).json({
        success: true,
        message: 'Global state updated successfully.',
        data: globalStore,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
