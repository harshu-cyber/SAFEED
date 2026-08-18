/**
 * cloudSync.js — SafeED-UP Global Cloud Sync Engine
 * Syncs userStore and institutionStore across all devices (Laptop, Mobile, PC).
 */

import { userStore } from './userStore';
import { institutionStore } from './institutionStore';

const SYNC_URL = '/api/sync';
const SA_EMAIL = 'superadmin@safeed.ac.in';

let pollInterval = null;
let isBusy = false;
let lastCloudTs = 0;

export async function push() {
  if (isBusy) return;
  isBusy = true;
  try {
    const users = userStore.getUsers().filter(u => u.email !== SA_EMAIL && u.role !== 'SUPER_ADMIN');
    const institutions = institutionStore.getInstitutions();

    await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users, institutions }),
    });
  } catch (_) {
    // ignore network errors
  } finally {
    isBusy = false;
  }
}

export async function pull() {
  if (isBusy) return;
  isBusy = true;
  try {
    const res = await fetch(SYNC_URL, { method: 'GET' });
    if (!res.ok) return;

    const json = await res.json();
    if (!json.success || !json.data) return;

    const { users: cloudUsers, institutions: cloudInsts, updatedAt } = json.data;
    const ts = new Date(updatedAt).getTime() || 0;

    if (ts && ts <= lastCloudTs) return;
    if (ts) lastCloudTs = ts;

    if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      userStore.syncCloudUsers(cloudUsers);
    }
    if (Array.isArray(cloudInsts) && cloudInsts.length > 0) {
      institutionStore.syncCloudInstitutions(cloudInsts);
    }
  } catch (_) {
    // ignore network errors
  } finally {
    isBusy = false;
  }
}

export const cloudSync = {
  push,
  pull,
  startAutoSync() {
    if (pollInterval) return;
    pull();
    pollInterval = setInterval(pull, 3000);
  },
  stopAutoSync() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },
};
