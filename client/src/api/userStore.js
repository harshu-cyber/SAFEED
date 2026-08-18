/**
 * userStore.js — SafeED-UP User Management Store
 * Manages police officers, inspectors, and admin users in localStorage.
 * Users created here can log in via AuthContext's fallback logic.
 */

const STORE_KEY = 'safeed_users_store_v3';

const DEFAULT_USERS = [
  {
    _id: 'u-super-1',
    name: 'Super Admin (SafeED)',
    email: 'superadmin@safeed.ac.in',
    username: 'superadmin@safeed.ac.in',
    phone: '9412000001',
    password: 'harshsafeed',
    role: 'SUPER_ADMIN',
    assignedPortal: 'SUPER_ADMIN',
    designation: 'System Administrator',
    badgeNumber: 'SA-001',
    department: 'SafeED-UP HQ',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    joiningDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'SYSTEM',
  },
  {
    _id: 'u-dist-tarun',
    name: 'TARUN',
    email: 'cp1ko@safeed',
    username: 'cp1ko@safeed',
    phone: '9876543210',
    password: '9876543210',
    role: 'DISTRICT_ADMIN',
    assignedPortal: 'DISTRICT_ADMIN',
    designation: 'District Authority',
    badgeNumber: 'LKO-01',
    department: 'UP Police',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    joiningDate: '2024-02-01',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    createdBy: 'Super Admin',
  },
  {
    _id: 'u-insp-1',
    name: 'Inspector Sharma',
    email: 'si.sharma@uppolice.gov.in',
    username: 'si.sharma@uppolice.gov.in',
    phone: '9412000003',
    password: '9412000003',
    role: 'INSPECTION_OFFICER',
    assignedPortal: 'INSPECTION_OFFICER',
    designation: 'SI Officer',
    badgeNumber: 'UPP-4081',
    department: 'UP Police',
    dcpZone: 'DCP Central',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    joiningDate: '2024-02-05',
    isActive: true,
    createdAt: '2024-02-05T00:00:00Z',
    createdBy: 'Super Admin',
  },
];

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStore(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function cleanupLegacyStores() {
  try {
    const keysToRemove = [
      'safeed_users_store_v1',
      'safeed_users_store_v2',
      'safeed_users_store',
      'users_store',
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (_) {}
}

function initStore() {
  cleanupLegacyStores();

  const existing = loadStore();
  if (!existing) {
    saveStore({ users: DEFAULT_USERS });
    return { users: DEFAULT_USERS };
  }

  // Filter out any stale pre-seeded dummy accounts from previous versions
  const dummyEmails = [
    'dcpwest@safeedup.gov.in',
    'dcpcentral@safeedup.gov.in',
    'dcpnorth@safeedup.gov.in',
    'dcpeast@safeedup.gov.in',
    'dcpsouth@safeedup.gov.in',
    'dgp@safeedup.gov.in',
    'commissioner@uppolice.gov.in',
    'joint.cop@uppolice.gov.in',
    'adcp@safeedup.gov.in',
    'acp@safeedup.gov.in',
    'superadmin@safeedup.gov.in',
  ];

  existing.users = (existing.users || []).filter(u => !dummyEmails.includes(u.email?.toLowerCase()));

  // Ensure superadmin@safeed.ac.in / harshsafeed exists and is updated
  let sa = existing.users.find(u => u.role === 'SUPER_ADMIN' || u.email?.includes('superadmin'));
  if (sa) {
    sa.email = 'superadmin@safeed.ac.in';
    sa.username = 'superadmin@safeed.ac.in';
    sa.password = 'harshsafeed';
    sa.isActive = true;
  } else {
    existing.users.unshift(DEFAULT_USERS[0]);
  }

  // Ensure all DEFAULT_USERS (TARUN, Inspector Sharma, etc.) exist in the store
  for (const defUser of DEFAULT_USERS) {
    const exists = existing.users.some(u => u.email?.toLowerCase() === defUser.email?.toLowerCase() || u._id === defUser._id);
    if (!exists) {
      existing.users.push(defUser);
    }
  }

  saveStore(existing);
  return existing;
}

export const userStore = {
  getUsers() {
    return initStore().users;
  },

  getUserById(id) {
    return this.getUsers().find(u => u._id === id) || null;
  },

  getUserByEmail(email) {
    return this.getUsers().find(
      u => u.email?.toLowerCase() === email?.toLowerCase()
    ) || null;
  },

  syncCloudUsers(cloudUsers) {
    if (!Array.isArray(cloudUsers) || cloudUsers.length === 0) return;
    const store = initStore();

    // CRITICAL: Always preserve the local Super Admin — never overwrite with cloud payload
    const localSA = store.users.find(u => u.role === 'SUPER_ADMIN' || u.email === 'superadmin@safeed.ac.in');

    // Merge: use cloud users but strip any cloud Super Admin (could be corrupted)
    const filteredCloud = cloudUsers.filter(u => u.role !== 'SUPER_ADMIN' && u.email !== 'superadmin@safeed.ac.in');

    const merged = localSA ? [localSA, ...filteredCloud] : filteredCloud;
    store.users = merged;
    saveStore(store);
  },

  createUser(formData, createdByName = 'Super Admin') {
    const store = initStore();

    const emailLower = formData.email?.toLowerCase();
    if (store.users.find(u => u.email?.toLowerCase() === emailLower)) {
      throw new Error('A user with this email already exists.');
    }

    const newId = 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const username = formData.email;
    const password = formData.phone;

    // Determine target portal path
    let assignedPortal = formData.assignedPortal || formData.role;
    if (assignedPortal === 'INSPECTION_OFFICER' || formData.role === 'INSPECTION_OFFICER' || formData.role === 'POLICE_OFFICER') {
      assignedPortal = 'INSPECTION_OFFICER';
    } else if (assignedPortal === 'DISTRICT_ADMIN' || formData.role === 'DISTRICT_ADMIN') {
      assignedPortal = 'DISTRICT_ADMIN';
    } else if (assignedPortal === 'SUPER_ADMIN' || formData.role === 'SUPER_ADMIN') {
      assignedPortal = 'SUPER_ADMIN';
    }

    const newUser = {
      _id: newId,
      name: formData.name,
      email: formData.email,
      username,
      phone: formData.phone,
      password,
      role: formData.role || 'INSPECTION_OFFICER',
      assignedPortal,
      designation: formData.designation || '',
      badgeNumber: formData.badgeNumber || '',
      department: formData.department || 'UP Police',
      dcpZone: formData.dcpZone || null,
      district: formData.district || 'Lucknow',
      state: formData.state || 'Uttar Pradesh',
      joiningDate: formData.joiningDate || new Date().toISOString().split('T')[0],
      bloodGroup: formData.bloodGroup || '',
      rankLevel: formData.rankLevel || '',
      postingStation: formData.postingStation || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: createdByName,
      avatar: null,
    };

    store.users.push(newUser);
    saveStore(store);

    // Trigger Real-Time Global Cloud Sync
    import('./cloudSync').then(m => m.cloudSync.push()).catch(() => {});

    return newUser;
  },

  updateUser(id, updates) {
    const store = initStore();
    const idx = store.users.findIndex(u => u._id === id);
    if (idx === -1) throw new Error('User not found.');
    if (store.users[idx].role === 'SUPER_ADMIN') throw new Error('Cannot modify Super Admin system account.');
    store.users[idx] = { ...store.users[idx], ...updates, updatedAt: new Date().toISOString() };
    saveStore(store);

    // Trigger Real-Time Global Cloud Sync
    import('./cloudSync').then(m => m.cloudSync.push()).catch(() => {});

    return store.users[idx];
  },

  toggleUserStatus(id) {
    const store = initStore();
    const user = store.users.find(u => u._id === id);
    if (!user) throw new Error('User not found.');
    if (user.role === 'SUPER_ADMIN') throw new Error('Cannot deactivate Super Admin account.');
    user.isActive = !user.isActive;
    saveStore(store);

    // Trigger Real-Time Global Cloud Sync
    import('./cloudSync').then(m => m.cloudSync.push()).catch(() => {});

    return user;
  },

  deleteUser(id) {
    const store = initStore();
    const user = store.users.find(u => u._id === id);
    if (!user) throw new Error('User not found.');
    if (user.role === 'SUPER_ADMIN') throw new Error('Cannot delete Super Admin account.');
    store.users = store.users.filter(u => u._id !== id);
    saveStore(store);

    // Trigger Real-Time Global Cloud Sync
    import('./cloudSync').then(m => m.cloudSync.push()).catch(() => {});
  },

  getStats() {
    const users = this.getUsers();
    return {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      inspectors: users.filter(u => u.role === 'INSPECTION_OFFICER').length,
      districtAdmins: users.filter(u => u.role === 'DISTRICT_ADMIN').length,
      superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
      police: users.filter(u => u.role === 'POLICE_OFFICER').length,
    };
  },
};
