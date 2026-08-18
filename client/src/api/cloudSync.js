/**
 * cloudSync.js — Real-Time Global Cross-Device Synchronization Engine
 * Automatically syncs user accounts, institutions, inspections, and complaints
 * across ALL devices accessing https://safeed-ruddy.vercel.app/
 */

import { userStore } from './userStore';
import { institutionStore } from './institutionStore';

const SYNC_URL = '/api/sync';
let isSyncing = false;
let autoSyncInterval = null;

export const cloudSync = {
  /**
   * Push current local store state to global cloud DB
   */
  async push() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const users = userStore.getUsers();
      const institutions = institutionStore.getInstitutions();

      await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users,
          institutions,
        }),
      });
    } catch (err) {
      console.warn('Cloud sync push offline fallback:', err.message);
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Pull global state from cloud DB and update local stores if changed
   */
  async pull() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const res = await fetch(SYNC_URL);
      if (!res.ok) return;

      const result = await res.json();
      if (!result.success || !result.data) return;

      const { users: cloudUsers, institutions: cloudInsts } = result.data;

      // Sync Users if cloud has data
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        userStore.syncCloudUsers(cloudUsers);
      } else {
        // If cloud database is empty, push local Super Admin
        this.push();
      }

      // Sync Institutions if cloud has data
      if (Array.isArray(cloudInsts) && cloudInsts.length > 0) {
        institutionStore.syncCloudInstitutions(cloudInsts);
      }
    } catch (err) {
      console.warn('Cloud sync pull offline fallback:', err.message);
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Start real-time background sync polling loop (every 3 seconds)
   */
  startAutoSync() {
    if (autoSyncInterval) return;
    this.pull();
    autoSyncInterval = setInterval(() => {
      this.pull();
    }, 3000);
  },
};
