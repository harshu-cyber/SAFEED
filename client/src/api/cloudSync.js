/**
 * cloudSync.js — SafeED-UP Direct MongoDB Atlas Sync Engine
 *
 * ARCHITECTURE:  MongoDB Atlas → /api/sync → React State
 *
 * CRITICAL RULES:
 * - pull() is the ONLY data source for all React components
 * - push() is DISABLED — localStorage state never overwrites MongoDB Atlas
 * - All mutations go through /api/sync POST with explicit action payloads
 * - LocalStorage is ONLY a temporary render cache, NEVER a source of truth
 */

import { userStore } from './userStore';
import { institutionStore } from './institutionStore';

const API_BASE = import.meta.env.VITE_API_URL || '';
const SYNC_URL = API_BASE ? `${API_BASE.replace(/\/v1\/?$/, '')}/sync` : '/api/sync';

let pollInterval = null;
let isBusy = false;

// ── PULL: MongoDB Atlas → localStorage render cache ─────────────────────────
export async function pull() {
  if (isBusy) return;
  isBusy = true;
  try {
    const res = await fetch(SYNC_URL, { method: 'GET' });
    if (!res.ok) return;

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return;
    }
    if (!json || !json.success || !json.data) return;

    const { users: cloudUsers, institutions: cloudInsts } = json.data;

    // Always overwrite localStorage from MongoDB Atlas — this IS the truth
    if (Array.isArray(cloudUsers)) {
      userStore.syncCloudUsers(cloudUsers);
    }
    if (Array.isArray(cloudInsts)) {
      institutionStore.syncCloudInstitutions(cloudInsts);
    }
  } catch (err) {
    console.warn('[CloudSync] pull failed:', err.message);
  } finally {
    isBusy = false;
  }
}

// ── PUSH: DISABLED ───────────────────────────────────────────────────────────
// push() is intentionally disabled. All mutations are sent directly via
// syncAction() with an explicit action, not from local state.
export async function push() {
  // NO-OP: Do not push localStorage state to MongoDB Atlas.
  // Use syncAction() for all create/update/delete operations.
}

// ── SYNC ACTION: React → MongoDB Atlas (explicit mutation) ───────────────────
export async function syncAction(action, payload) {
  try {
    const res = await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      const cleanSnippet = text.replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ').slice(0, 120);
      throw new Error(`Server error (${res.status}): ${cleanSnippet || 'Invalid response format'}`);
    }

    if (!json.success) {
      const errMsg = json.error || json.message || (typeof json.data === 'string' ? json.data : '') || 'MongoDB Atlas action failed';
      throw new Error(errMsg);
    }
    // After any mutation, refresh local cache from Atlas
    if (json.data) {
      if (Array.isArray(json.data.users)) userStore.syncCloudUsers(json.data.users);
      if (Array.isArray(json.data.institutions)) institutionStore.syncCloudInstitutions(json.data.institutions);
    }
    return json.data;
  } catch (err) {
    console.error(`[CloudSync] ${action} failed:`, err.message);
    throw err;
  }
}

export const cloudSync = {
  push,
  pull,
  syncAction,
  startAutoSync() {
    if (pollInterval) return;
    pull(); // Immediate pull on start
    pollInterval = setInterval(pull, 5000); // Poll every 5s for live updates
  },
  stopAutoSync() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },
};
