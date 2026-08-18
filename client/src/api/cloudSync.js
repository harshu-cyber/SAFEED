/**
 * cloudSync.js — Real-Time Global Cross-Device Synchronization Engine
 * Uses ntfy.sh high-speed REST pub/sub relay to sync user accounts and institutions
 * across ALL devices accessing https://safeed-ruddy.vercel.app/ (Laptop, Mobile, Tablet, PC)
 */

import { userStore } from './userStore';
import { institutionStore } from './institutionStore';

const TOPIC = 'safeedup_lucknow_sync_2026';
const NTFY_URL = `https://ntfy.sh/${TOPIC}`;

let isSyncing = false;
let autoSyncInterval = null;
let lastSyncTimestamp = 0;

export const cloudSync = {
  /**
   * Push current local store state to global cloud relay
   */
  async push() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const users = userStore.getUsers();
      const institutions = institutionStore.getInstitutions();
      const payload = {
        users,
        institutions,
        timestamp: Date.now(),
      };

      await fetch(NTFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      lastSyncTimestamp = payload.timestamp;
    } catch (err) {
      console.warn('Cloud sync push offline fallback:', err.message);
    } finally {
      isSyncing = false;
    }
  },

  /**
   * Pull global state from cloud relay and update local stores if changed
   */
  async pull() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      const res = await fetch(`${NTFY_URL}/json?poll=1`);
      if (!res.ok) return;

      const text = await res.text();
      if (!text || !text.trim()) return;

      // Parse NDJSON lines returned by ntfy poll
      const lines = text.trim().split('\n');
      let latestPayload = null;

      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const entry = JSON.parse(lines[i]);
          if (entry.message) {
            const data = JSON.parse(entry.message);
            if (data.users || data.institutions) {
              latestPayload = data;
              break;
            }
          }
        } catch (_) {}
      }

      if (!latestPayload) return;

      // Ignore if this payload was sent by local machine or is older
      if (latestPayload.timestamp && latestPayload.timestamp <= lastSyncTimestamp) {
        return;
      }

      if (latestPayload.timestamp) {
        lastSyncTimestamp = latestPayload.timestamp;
      }

      const { users: cloudUsers, institutions: cloudInsts } = latestPayload;

      // Sync Users if cloud has data
      if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
        userStore.syncCloudUsers(cloudUsers);
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
    // Also initial push if local store has data
    setTimeout(() => {
      this.push();
    }, 1000);

    autoSyncInterval = setInterval(() => {
      this.pull();
    }, 3000);
  },
};
