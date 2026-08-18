/**
 * cloudSync.js — Professional Real-Time Cloud Sync Engine
 * Uses /api/sync Vercel Serverless Function → MongoDB Atlas as SINGLE SOURCE OF TRUTH
 * All devices (Laptop, Mobile, Tablet, PC) read/write from the same database.
 */

import { userStore } from './userStore';
import { institutionStore } from './institutionStore';

// /api/sync is at the same domain as the Vercel app
const SYNC_URL = '/api/sync';

// Super Admin is NEVER synced to/from cloud — always kept locally
const SA_EMAIL = 'superadmin@safeed.ac.in';

let pollInterval = null;
let isBusy = false;
let lastCloudTimestamp = 0;

/**
 * Push local users + institutions to MongoDB Atlas via /api/sync
 */
async function push() {
  if (isBusy) return;
  isBusy = true;
  try {
    // Never push Super Admin to cloud — it lives locally only
    const users = userStore.getUsers().filter(u => u.email !== SA_EMAIL && u.role !== 'SUPER_ADMIN');
    const institutions = institutionStore.getInstitutions();

    await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users, institutions }),
    });
  } catch (err) {
    console.warn('[CloudSync] push failed (offline?):', err.message);
  } finally {
    isBusy = false;
  }
}

/**
 * Pull from MongoDB Atlas and merge into local stores
 * Uses smart merge: cloud wins for non-SA accounts, local SA is always preserved
 */
async function pull() {
  if (isBusy) return;
  isBusy = true;
  try {
    const res = await fetch(SYNC_URL, { method: 'GET' });
    if (!res.ok) return;

    const json = await res.json();
    if (!json.success || !json.data) return;

    const { users: cloudUsers, institutions: cloudInsts, updatedAt } = json.data;

    // Avoid re-applying same payload
    const cloudTs = new Date(updatedAt).getTime() || 0;
    if (cloudTs && cloudTs <= lastCloudTimestamp) return;
    if (cloudTs) lastCloudTimestamp = cloudTs;

    // Sync users (Super Admin always preserved from local)
    if (Array.isArray(cloudUsers)) {
      userStore.syncCloudUsers(cloudUsers);
    }

    // Sync institutions
    if (Array.isArray(cloudInsts) && cloudInsts.length > 0) {
      institutionStore.syncCloudInstitutions(cloudInsts);
    }
  } catch (err) {
    console.warn('[CloudSync] pull failed (offline?):', err.message);
  } finally {
    isBusy = false;
  }
}

export const cloudSync = {
  push,
  pull,

  /** Start real-time background sync */
  startAutoSync() {
    if (pollInterval) return;
    // Initial pull to get latest state from cloud
    pull();
    // Then poll every 4 seconds
    pollInterval = setInterval(pull, 4000);
  },

  stopAutoSync() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },
};
