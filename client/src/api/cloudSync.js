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
import { complaintStore } from './complaintStore';
import { evidenceStore } from './evidenceStore';

const rawBase = import.meta.env.VITE_API_URL || '';
const cleanDomain = rawBase ? rawBase.replace(/\/+$/, '').replace(/\/api(\/v1)?$/, '') : '';
const SYNC_URL = cleanDomain ? `${cleanDomain}/api/sync` : '/api/sync';

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

    const { users: cloudUsers, institutions: cloudInsts, complaints: cloudComplaints, evidences: cloudEvidences } = json.data;

    // Always overwrite localStorage from MongoDB Atlas — this IS the truth
    if (Array.isArray(cloudUsers)) {
      userStore.syncCloudUsers(cloudUsers);
    }
    if (Array.isArray(cloudInsts)) {
      institutionStore.syncCloudInstitutions(cloudInsts);
    }
    if (Array.isArray(cloudComplaints)) {
      complaintStore.syncCloudComplaints(cloudComplaints);
    }
    if (Array.isArray(cloudEvidences)) {
      evidenceStore.syncCloudEvidence(cloudEvidences);
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
    // Sanitize payload to prevent Vercel 4.5MB Serverless Body limit (HTTP 413)
    let sanitizedPayload = payload;
    if (payload && typeof payload === 'object') {
      sanitizedPayload = JSON.parse(JSON.stringify(payload));
      if (sanitizedPayload.document && sanitizedPayload.document.fileDataUrl && sanitizedPayload.document.fileDataUrl.length > 500000) {
        // Replace huge Base64 with placeholder for cloud sync payload (metadata is preserved)
        sanitizedPayload.document.fileDataUrl = '[STORED_IN_FILESYSTEM]';
      }
      if (Array.isArray(sanitizedPayload.photos)) {
        sanitizedPayload.photos = sanitizedPayload.photos.map(p => (typeof p === 'string' && p.length > 500000) ? '[PHOTO_STORED]' : p);
      }
    }

    const res = await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload: sanitizedPayload }),
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
      if (Array.isArray(json.data.complaints)) complaintStore.syncCloudComplaints(json.data.complaints);
      if (Array.isArray(json.data.evidences)) evidenceStore.syncCloudEvidence(json.data.evidences);
    }
    return json.data;
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
    pollInterval = setInterval(pull, 60000); // Poll once every 60s
  },
  stopAutoSync() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  },
};
