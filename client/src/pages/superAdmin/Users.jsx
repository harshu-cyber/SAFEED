import React, { useState, useEffect } from 'react';
import { userStore } from '../../api/userStore';
import { cloudSync } from '../../api/cloudSync';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import {
  FiUserPlus, FiSearch, FiEye, FiTrash2, FiShield,
  FiPhone, FiMail, FiMapPin, FiKey, FiX, FiCheck, FiAlertTriangle,
  FiUser, FiCalendar, FiLock, FiUnlock, FiCopy, FiEdit3, FiAward, FiRefreshCw
} from 'react-icons/fi';
import { MdLocalPolice } from 'react-icons/md';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'INSPECTION_OFFICER', label: 'DCP Inspection Officer' },
  { value: 'DISTRICT_ADMIN', label: 'District Authority' },
  { value: 'POLICE_OFFICER', label: 'Police Officer' },
  { value: 'FIRE_OFFICER', label: 'Fire & Emergency Officer' },
  { value: 'SUPER_ADMIN', label: 'Super Administrator' },
];

const DCP_ZONES = ['DCP West', 'DCP Central', 'DCP North', 'DCP East', 'DCP South'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// 🏛️ Police Ranks mapped to designated Portals (Inspection vs District Admin)
const POLICE_RANKS = [
  // 🛡️ Inspection Portal Ranks (Field Officers for Zone Safety Audits)
  { value: 'PS',   label: 'PS — Police Station Official (Inspection Portal)', portal: 'INSPECTION_OFFICER', category: 'Inspection Portal' },
  { value: 'SI',   label: 'SI — Sub-Inspector (Inspection Portal)', portal: 'INSPECTION_OFFICER', category: 'Inspection Portal' },
  { value: 'SHO',  label: 'SHO — Station House Officer (Inspection Portal)', portal: 'INSPECTION_OFFICER', category: 'Inspection Portal' },
  
  // 🏛️ District Authority Admin Portal Ranks (Command Officers — District-wide Oversight)
  { value: 'ACP',  label: 'ACP — Assistant Commissioner of Police (District Admin Portal)', portal: 'DISTRICT_ADMIN', category: 'District Authority Portal' },
  { value: 'ADCP', label: 'ADCP — Additional Deputy Commissioner of Police (District Admin Portal)', portal: 'DISTRICT_ADMIN', category: 'District Authority Portal' },
  { value: 'DCP',  label: 'DCP — Deputy Commissioner of Police (District Admin Portal)', portal: 'DISTRICT_ADMIN', category: 'District Authority Portal' },
  { value: 'JCP',  label: 'JCP — Joint Commissioner of Police (District Admin Portal)', portal: 'DISTRICT_ADMIN', category: 'District Authority Portal' },
  { value: 'CP',   label: 'CP — Commissioner of Police (District Admin Portal)', portal: 'DISTRICT_ADMIN', category: 'District Authority Portal' },
  { value: 'DGP',  label: 'DGP — Director General of Police (District Admin Portal)', portal: 'DISTRICT_ADMIN', category: 'District Authority Portal' },
];

const LUCKNOW_POLICE_STATIONS = [
  'Chowk', 'Wazirganj', 'Thakurganj', 'Saadatganj', 'Bazarkhala', 'Talkatora',
  'Kaisarbagh', 'Aminabad', 'Naka', 'Kakori', 'Dubagga', 'Para',
  'Hazratganj', 'Husainganj', 'Gautampalli', 'Mahila Thana', 'Mahanagar',
  'Hasanganj', 'Madehganj', 'Cantt', 'Ashiyana', 'Alambagh', 'Manaknagar',
  'Aliganj', 'Madiyaon', 'Janakipuram', 'Malihabad', 'Rahimabad', 'Maal',
  'Itunja', 'B.K.T.', 'Sairpur', 'Mahigawan', 'Mahila Thana-2', 'Ghazipur',
  'Gudamba', 'Indiranagar', 'Vikasnagar', 'Gomtinagar', 'Gomtinagar Vistar',
  'Cyber Thana', 'Vibhutikhand', 'Chinhat', 'BBD', 'Mohanlalganj', 'Nagram',
  'Nigoha', 'Gosainganj', 'PGI', 'Sushant Golf City', 'Krishnanagar',
  'Sarojininagar', 'Banthra', 'Bijnour'
];

const ROLE_BADGE_COLOR = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  INSPECTION_OFFICER: 'bg-blue-100 text-blue-800 border-blue-200',
  DISTRICT_ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  POLICE_OFFICER: 'bg-sky-100 text-sky-800 border-sky-200',
  FIRE_OFFICER: 'bg-orange-100 text-orange-700 border-orange-200',
};

const DEFAULT_FORM = {
  name: '',
  email: '',
  phone: '',
  role: 'INSPECTION_OFFICER',
  designation: 'Sub-Inspector',
  badgeNumber: '',
  department: 'UP Police',
  dcpZone: 'DCP Central',
  district: 'Lucknow',
  state: 'Uttar Pradesh',
  joiningDate: new Date().toISOString().split('T')[0],
  bloodGroup: '',
  rankLevel: 'SI',
  postingStation: 'Hazratganj',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Field = ({ label, hint, required, children }) => (
  <div>
    <label className="block text-[11px] font-black text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const inputClass = "w-full px-3.5 py-2.5 text-xs font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] bg-white text-[#0F2038] placeholder:text-gray-400 shadow-xs transition-all";

// Popup shown right after creating a user — shows credentials
const CredentialsPopup = ({ user, onClose }) => {
  const [copiedKey, setCopiedKey] = useState('');

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1500);
    }).catch(() => {});
  };

  const portalName =
    user.assignedPortal === 'INSPECTION_OFFICER' ? '🛡️ Inspector Dashboard Admin Portal (/dashboard/inspector)' :
    user.assignedPortal === 'DISTRICT_ADMIN' ? '🏛️ District Authority Admin Portal (/dashboard/district-admin)' :
    user.assignedPortal === 'SUPER_ADMIN' ? '⚡ Super Admin Control Portal (/dashboard/super-admin)' :
    '🛡️ Inspector Dashboard Admin Portal (/dashboard/inspector)';

  const rows = [
    { label: '🏢 Assigned Admin Portal (Login Destination)', value: portalName, highlight: true },
    { label: '📧 Username (Email / Gmail)', value: user.email || '' },
    { label: '🔑 Password (Phone Number)', value: user.phone || '' },
    { label: '🏷️ Badge / Employee Number', value: user.badgeNumber || '—' },
    { label: '📍 District / Zone', value: `${user.district || ''}${user.dcpZone ? ' · ' + user.dcpZone : ''}` },
    { label: '💼 Designation & Role', value: `${user.designation || 'Officer'} (${ROLE_LABELS[user.role] || user.role || ''})` },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden max-h-[85vh] flex flex-col">
        {/* Fixed Header */}
        <div className="bg-gradient-to-r from-[#0F2038] via-[#1E3A5F] to-[#0F2038] px-4 py-3 text-white flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
              <FiCheck size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Official Account Created</p>
              <h2 className="text-base font-black text-white leading-tight">{user.name}</h2>
            </div>
          </div>
          <span className="text-[10px] text-blue-200 font-semibold bg-white/10 px-2 py-0.5 rounded border border-white/20 whitespace-nowrap">
            {user.district}
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="p-3.5 overflow-y-auto flex-1 space-y-2 text-xs">
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            <FiCheck size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-900 font-bold leading-snug">
              When this officer logs in, they will be redirected to <strong>{portalName}</strong>!
            </p>
          </div>

          {rows.map(row => (
            <div key={row.label} className={`flex items-center gap-2 rounded-xl p-2.5 border ${row.highlight ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-gray-500 font-bold mb-0.5">{row.label}</p>
                <p className={`font-mono font-black text-[#0F2038] text-xs truncate ${row.highlight ? 'text-blue-900 font-sans' : ''}`}>{row.value}</p>
              </div>
              <button
                onClick={() => copyText(row.value, row.label)}
                className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-1 border border-blue-300 rounded-lg text-blue-800 hover:bg-blue-100 transition-all shadow-xs cursor-pointer"
              >
                {copiedKey === row.label ? <FiCheck size={10} className="text-emerald-600" /> : <FiCopy size={10} />}
                {copiedKey === row.label ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>

        {/* Pinned Bottom Footer Button */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] font-black rounded-xl hover:bg-[#1E3A5F] transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <FiCheck size={14} className="text-emerald-400" /> Done — Close Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

// User detail side-panel / modal with Edit capability
const UserDetailModal = ({ user, onClose, onToggle, onDelete, onEdit }) => {
  if (!user) return null;
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const formattedDate = (() => {
    if (!user.createdAt) return '';
    try {
      const d = new Date(user.createdAt);
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  })();

  const portalBadge =
    (user.assignedPortal || user.role) === 'DISTRICT_ADMIN' ? '🏛️ District Authority Admin Portal' :
    (user.assignedPortal || user.role) === 'SUPER_ADMIN' ? '⚡ Super Admin Control Portal' :
    '🛡️ Inspector Dashboard Admin Portal';

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F2038] to-[#1E3A5F] p-5 text-white flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MdLocalPolice className="text-[#D4AF37]" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Officer Profile</span>
              </div>
              <h2 className="text-xl font-black">{user.name || 'Officer'}</h2>
              <p className="text-xs opacity-70 mt-0.5">{user.designation || 'Police Officer'}</p>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1 flex-shrink-0 cursor-pointer">
              <FiX size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${ROLE_BADGE_COLOR[user.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {ROLE_LABELS[user.role] || user.role || 'OFFICER'}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${user.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
              {user.isActive ? '● Active' : '○ Inactive'}
            </span>
            {isSuperAdmin && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">PROTECTED SUPER ADMIN</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-bold flex items-center gap-2">
            <span>🏢 Assigned Admin Portal:</span>
            <span className="text-blue-900 font-black">{portalBadge}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: FiMail, label: 'Email / Username', value: user.email || '—' },
              { icon: FiPhone, label: 'Phone / Password', value: user.phone || '—', mono: true },
              { icon: FiAward, label: 'Badge Number', value: user.badgeNumber || '—' },
              { icon: FiShield, label: 'Department', value: user.department || '—' },
              { icon: FiMapPin, label: 'District', value: user.district || '—' },
              { icon: FiCalendar, label: 'Joining Date', value: user.joiningDate || '—' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-1 mb-1">
                  {typeof item.icon === 'function' && <item.icon size={10} className="text-gray-400" />}
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
                </div>
                <p className={`text-xs font-black text-[#0F2038] break-all ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {user.dcpZone && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mb-1">DCP Zone</p>
              <p className="text-sm font-black text-blue-800 flex items-center gap-2">
                <MdLocalPolice className="text-[#D4AF37]" /> {user.dcpZone}
              </p>
            </div>
          )}

          {(user.bloodGroup || user.rankLevel || user.postingStation) && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Blood Group', value: user.bloodGroup },
                { label: 'Rank', value: user.rankLevel },
                { label: 'Posting Station', value: user.postingStation },
              ].filter(x => x.value).map(item => (
                <div key={item.label} className="bg-red-50 rounded-xl p-3 border border-red-100 text-center">
                  <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-xs font-black text-red-700">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
            Created by: <span className="font-bold text-gray-600">{user.createdBy || 'System'}</span>
            {formattedDate && ` · ${formattedDate}`}
          </p>

          {!isSuperAdmin && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={onEdit}
                className="py-2.5 rounded-xl text-xs font-black bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FiEdit3 size={13} /> Edit Profile
              </button>
              <button
                onClick={onToggle}
                className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  user.isActive
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {user.isActive ? <><FiLock size={13} /> Lock</> : <><FiUnlock size={13} /> Unlock</>}
              </button>
              <button
                onClick={onDelete}
                className="py-2.5 rounded-xl text-xs font-black bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FiTrash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
// Edit User Modal
const EditUserModal = ({ user, onClose, onSave }) => {
  const [editForm, setEditForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    badgeNumber: user.badgeNumber || '',
    designation: user.designation || '',
    department: user.department || 'UP Police',
    dcpZone: user.dcpZone || 'DCP Central',
    district: user.district || 'Lucknow',
    assignedPortal: user.assignedPortal || user.role || 'INSPECTION_OFFICER',
  });
  const [err, setErr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr('');
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      setErr('Name, email, and phone are required.');
      return;
    }
    onSave(user._id, editForm);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-2 border-blue-500 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-r from-[#0F2038] to-blue-900 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiEdit3 className="text-[#D4AF37]" size={18} />
            <div>
              <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">SafeED-UP Admin</p>
              <h2 className="text-sm font-black">Edit Officer Profile Details</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white p-1">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          <Field label="Full Name" required>
            <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge Number" required>
              <input type="text" required value={editForm.badgeNumber} onChange={e => setEditForm({ ...editForm, badgeNumber: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Official Designation" required>
              <input type="text" required value={editForm.designation} onChange={e => setEditForm({ ...editForm, designation: e.target.value })} className={inputClass} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email / Username" required>
              <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Phone / Password" required>
              <input type="text" required value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass + ' font-mono'} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="District">
              <input type="text" value="Lucknow" readOnly className={inputClass + ' bg-gray-100 text-gray-400 cursor-not-allowed'} />
            </Field>
            {(editForm.assignedPortal === 'INSPECTION_OFFICER' || editForm.role === 'INSPECTION_OFFICER' || ['DCP', 'ADCP', 'ACP', 'PS', 'SI', 'SHO'].includes(user.rankLevel)) && (
              <Field label="DCP Zone Assignment">
                <select value={editForm.dcpZone || 'DCP Central'} onChange={e => setEditForm({ ...editForm, dcpZone: e.target.value })} className={inputClass}>
                  {DCP_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </Field>
            )}
          </div>

          <Field label="Assigned Admin Portal (Login Destination)" required>
            <select
              value={editForm.assignedPortal}
              onChange={e => setEditForm({ ...editForm, assignedPortal: e.target.value, role: e.target.value })}
              className={inputClass + ' font-bold text-blue-900'}
            >
              <option value="INSPECTION_OFFICER">🛡️ Inspector Dashboard Admin Portal (/dashboard/inspector)</option>
              <option value="DISTRICT_ADMIN">🏛️ District Authority Admin Portal (/dashboard/district-admin)</option>
              <option value="SUPER_ADMIN">⚡ Super Admin Control Portal (/dashboard/super-admin)</option>
            </select>
          </Field>

          {err && <p className="text-red-600 font-bold text-xs bg-red-50 p-2.5 rounded-lg border border-red-200">{err}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 font-black text-gray-600 border rounded-xl hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2.5 font-black text-[#0F2038] bg-[#D4AF37] rounded-xl hover:bg-yellow-400 shadow-md">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  const loadUsers = () => {
    setUsers(userStore.getUsers());
  };

  useEffect(() => {
    // Pull from MongoDB Atlas then read local cache
    cloudSync.pull().then(loadUsers).catch(loadUsers);
    cloudSync.startAutoSync();
    const iv = setInterval(loadUsers, 5000);
    return () => {
      clearInterval(iv);
      cloudSync.stopAutoSync();
    };
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await cloudSync.pull();
      loadUsers();
      showToast('🔄 MongoDB Atlas Synced & Refreshed!');
    } catch {
      showToast('⚠️ Sync error, loaded local cache.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setFormError('');
  };

  const closeCreate = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Full name, email, and phone are required.');
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setFormError('Phone number must be exactly 10 digits (this becomes the password).');
      return;
    }
    if (!form.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    try {
      // Determine portal assignment
      let assignedPortal = form.assignedPortal || form.role;
      const payload = {
        ...form,
        email: form.email.toLowerCase(),
        password: form.phone,
        assignedPortal,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Super Admin',
      };
      // Write directly to MongoDB Atlas
      await cloudSync.syncAction('CREATE_USER', payload);
      loadUsers();
      closeCreate();
      setCreatedUser(payload);
    } catch (err) {
      setFormError(err.message || 'Failed to create user. The email may already exist in MongoDB Atlas.');
    }
  };

  const handleSaveEdit = async (id, updatedFields) => {
    try {
      // Find current user to include email for Atlas update
      const existing = userStore.getUserById(id) || {};
      await cloudSync.syncAction('UPDATE_USER', { _id: id, email: existing.email, ...updatedFields });
      loadUsers();
      setEditUser(null);
      setViewUser(null);
      showToast(`✅ Profile updated for ${updatedFields.name || existing.name}`);
    } catch (err) {
      showToast(`❌ ${err.message || 'Failed to update user.'}`);
    }
  };

  const handleToggle = async (u) => {
    try {
      await cloudSync.syncAction('TOGGLE_USER', { id: u._id });
      loadUsers();
      setViewUser(prev => prev && prev._id === u._id ? { ...prev, isActive: !prev.isActive } : prev);
      showToast(u.isActive ? '🔒 Account Locked.' : '🔓 Account Unlocked.');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Failed to update status.'));
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete account for ${u.name}? This cannot be undone.`)) return;
    try {
      await cloudSync.syncAction('DELETE_USER', { id: u._id });
      loadUsers();
      setViewUser(null);
      showToast('✅ User account deleted from MongoDB Atlas.');
    } catch (err) {
      showToast('❌ ' + (err.message || 'Failed to delete user.'));
    }
  };

  // Filtered list
  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.badgeNumber || '').toLowerCase().includes(q) ||
      (u.district || '').toLowerCase().includes(q) ||
      (u.designation || '').toLowerCase().includes(q) ||
      (u.dcpZone || '').toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inspectors: users.filter(u => u.role === 'INSPECTION_OFFICER').length,
    districtAdmins: users.filter(u => u.role === 'DISTRICT_ADMIN').length,
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
    police: users.filter(u => u.role === 'POLICE_OFFICER').length,
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[300] bg-[#0F2038] text-[#D4AF37] px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm border border-[#D4AF37]/40 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Credentials Popup */}
      {createdUser && (
        <CredentialsPopup user={createdUser} onClose={() => setCreatedUser(null)} />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* User Detail Modal */}
      {viewUser && (
        <UserDetailModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onEdit={() => { setEditUser(viewUser); setViewUser(null); }}
          onToggle={() => handleToggle(viewUser)}
          onDelete={() => handleDelete(viewUser)}
        />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl border-2 border-[#D4AF37] overflow-hidden max-h-[94vh] flex flex-col">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0F2038] to-[#1E3A5F] p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <img src="/up-police-logo.png" alt="UP Police" className="w-9 h-9 object-contain" />
                <div>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">SafeED-UP</p>
                  <h2 className="text-sm font-black text-white">Create Official Police User Account</h2>
                </div>
              </div>
              <button onClick={closeCreate} className="text-white/60 hover:text-white p-1">
                <FiX size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-5 overflow-y-auto flex-1 space-y-5">

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <FiKey size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  <strong>Auto Credentials:</strong> Username = Gmail/Email &nbsp;|&nbsp; Password = Phone Number (10 digits). Share these with the officer after creation.
                </p>
              </div>


              {/* Personal Identity */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">👤 Personal Identity</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full Name" required>
                    <input type="text" required placeholder="e.g. Rajesh Kumar Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="Badge / Employee Number" required>
                    <input type="text" required placeholder="e.g. DCP-N-02" value={form.badgeNumber} onChange={e => setForm(f => ({ ...f, badgeNumber: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="Official Gmail / Email" required>
                    <input type="email" required placeholder="officer@uppolice.gov.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="Mobile Number (10 digits)" required>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit number"
                      maxLength={10}
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      className={inputClass + ' font-mono'}
                    />
                  </Field>
                  <Field label="Blood Group">
                    <select value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))} className={inputClass}>
                      <option value="">Select…</option>
                      {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Joining Date">
                    <input type="date" value={form.joiningDate} onChange={e => setForm(f => ({ ...f, joiningDate: e.target.value }))} className={inputClass} />
                  </Field>
                </div>
              </div>

              {/* Official Position */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">🏛️ Official Position & Designation</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Official Designation" required>
                    <input type="text" required placeholder="e.g. Deputy Commissioner of Police" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="Police Rank" required hint={form.rankLevel ? `• Will be assigned to: ${POLICE_RANKS.find(r => r.value === form.rankLevel)?.category || ''}` : ''}>
                    <select
                      value={form.rankLevel}
                      onChange={e => {
                        const selectedRankVal = e.target.value;
                        const rank = POLICE_RANKS.find(r => r.value === selectedRankVal);
                        const isZonalRank = ['DCP', 'ADCP', 'ACP', 'PS', 'SI', 'SHO'].includes(selectedRankVal);
                        setForm(f => ({
                          ...f,
                          rankLevel: selectedRankVal,
                          assignedPortal: rank ? rank.portal : f.assignedPortal,
                          role: rank ? rank.portal : f.role,
                          dcpZone: isZonalRank ? (f.dcpZone || 'DCP Central') : '',
                        }));
                      }}
                      className={inputClass}
                    >
                      <option value="">Select Police Rank…</option>
                      <optgroup label="🛡️ Inspection Portal Ranks (Field Officers)">
                        {POLICE_RANKS.filter(r => r.portal === 'INSPECTION_OFFICER').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </optgroup>
                      <optgroup label="🏛️ District Authority Admin Portal Ranks (Command Officers)">
                        {POLICE_RANKS.filter(r => r.portal === 'DISTRICT_ADMIN').map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </optgroup>
                    </select>
                  </Field>
                  <Field label="Department">
                    <input type="text" placeholder="e.g. UP Police — Lucknow Commissionerate" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className={inputClass} />
                  </Field>
                  <Field label="Posting Station (Lucknow)">
                    <select value={form.postingStation} onChange={e => setForm(f => ({ ...f, postingStation: e.target.value }))} className={inputClass}>
                      <option value="">Select Police Station…</option>
                      {LUCKNOW_POLICE_STATIONS.map(s => <option key={s} value={s}>{s} Police Station</option>)}
                    </select>
                  </Field>
                  {(form.role === 'INSPECTION_OFFICER' || ['DCP', 'ADCP', 'ACP', 'PS', 'SI', 'SHO'].includes(form.rankLevel)) && (
                    <Field label="DCP Zone Assignment" required hint="Zonal Command / Inspection Zone">
                      <select value={form.dcpZone || 'DCP Central'} onChange={e => setForm(f => ({ ...f, dcpZone: e.target.value }))} className={inputClass}>
                        {DCP_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                      </select>
                    </Field>
                  )}
                </div>
              </div>

              {/* Jurisdiction */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">📍 Jurisdiction</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="District">
                    <input type="text" value="Lucknow" readOnly className={inputClass + ' bg-gray-100 text-gray-400 cursor-not-allowed'} />
                  </Field>
                  <Field label="State">
                    <input type="text" value="Uttar Pradesh" readOnly className={inputClass + ' bg-gray-100 text-gray-400 cursor-not-allowed'} />
                  </Field>
                </div>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <FiAlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-bold">{formError}</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="flex-1 py-2.5 text-xs font-black text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-black text-[#0F2038] bg-[#D4AF37] rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <FiUserPlus size={13} /> Create Account & Get Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] font-black text-white bg-purple-700 px-3 py-0.5 rounded-full uppercase tracking-widest">Super Admin</span>
          <h1 className="text-2xl font-black text-[#0F2038] mt-1">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Police Officers, DCP Inspectors & District Authorities</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-xs font-black text-[#0F2038] bg-white border border-[#D4AF37] px-4 py-2.5 rounded-xl hover:bg-amber-50 transition-all shadow-md cursor-pointer disabled:opacity-60"
            title="Sync & Refresh MongoDB Atlas Data"
          >
            <FiRefreshCw size={14} className={`text-[#D4AF37] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Data'}</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="flex items-center gap-2 text-sm font-black text-[#0F2038] bg-[#D4AF37] px-5 py-2.5 rounded-xl hover:bg-yellow-400 transition-all shadow-lg cursor-pointer"
          >
            <FiUserPlus size={15} /> Create New Officer Account
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Users', value: stats.total, gradient: 'from-[#0F2038] to-[#1E3A5F]' },
          { label: 'Active', value: stats.active, gradient: 'from-emerald-600 to-green-400' },
          { label: 'DCP Inspectors', value: stats.inspectors, gradient: 'from-blue-700 to-blue-500' },
          { label: 'District Admins', value: stats.districtAdmins, gradient: 'from-indigo-700 to-violet-500' },
          { label: 'Police Officers', value: stats.police, gradient: 'from-sky-600 to-sky-400' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 bg-gradient-to-br ${k.gradient} text-white shadow-lg text-center`}>
            <p className="text-2xl font-black">{k.value}</p>
            <p className="text-[10px] font-semibold opacity-90 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, badge, designation, zone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'ALL', label: 'All Roles' },
            { value: 'INSPECTION_OFFICER', label: 'DCP Inspector' },
            { value: 'DISTRICT_ADMIN', label: 'District Admin' },
            { value: 'POLICE_OFFICER', label: 'Police Officer' },
            { value: 'FIRE_OFFICER', label: 'Fire Officer' },
            { value: 'SUPER_ADMIN', label: 'Super Admin' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${roleFilter === f.value ? 'bg-[#0F2038] text-[#D4AF37]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 font-semibold ml-auto whitespace-nowrap">
          {filtered.length} / {users.length} users
        </span>
      </div>

      {/* ── User Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Officer', 'Assigned Admin Portal', 'Email / Username', 'Phone / Password', 'Role', 'Zone / District', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => {
                const portalKey = u.assignedPortal || u.role;
                const portalBadge =
                  portalKey === 'DISTRICT_ADMIN' ? { label: '🏛️ District Admin', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' } :
                  portalKey === 'SUPER_ADMIN' ? { label: '⚡ Super Admin', color: 'bg-purple-100 text-purple-900 border-purple-200' } :
                  { label: '🛡️ Inspector Admin', color: 'bg-blue-100 text-blue-900 border-blue-200' };

                return (
                  <tr key={u._id} className="hover:bg-purple-50/30 transition-colors">
                    {/* Name + Badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F2038] to-[#1E3A5F] flex items-center justify-center flex-shrink-0 text-[#D4AF37] font-black text-xs">
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button
                            onClick={() => setViewUser(u)}
                            className="font-black text-[#0F2038] hover:text-purple-700 text-left flex items-center gap-1 cursor-pointer"
                          >
                            <span className="max-w-[130px] truncate block">{u.name}</span>
                            <FiEye size={9} className="text-purple-400 flex-shrink-0" />
                          </button>
                          <p className="text-[9px] text-gray-400 font-mono">{u.badgeNumber || '—'}</p>
                        </div>
                      </div>
                    </td>
                    {/* Assigned Admin Portal */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1 w-fit shadow-2xs ${portalBadge.color}`}>
                        {portalBadge.label}
                      </span>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-[#0F2038] font-mono max-w-[160px] block truncate">{u.email}</span>
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{u.phone}</span>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap ${ROLE_BADGE_COLOR[u.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    {/* Zone/District */}
                    <td className="px-4 py-3">
                      {u.dcpZone ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-blue-800 whitespace-nowrap">
                          <MdLocalPolice className="text-[#D4AF37]" size={13} /> {u.dcpZone}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500">{u.district || '—'}</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewUser(u)}
                          title="View / Edit Profile"
                          className="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-all cursor-pointer border border-blue-200"
                        >
                          <FiEye size={13} />
                        </button>
                        {u.role !== 'SUPER_ADMIN' ? (
                          <>
                            <button
                              onClick={() => handleToggle(u)}
                              title={u.isActive ? 'Lock Account' : 'Unlock Account'}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                                u.isActive
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {u.isActive ? <FiLock size={13} /> : <FiUnlock size={13} />}
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              title="Delete Account"
                              className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer border border-red-200"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            PROTECTED
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <FiUser size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold">No users match your search</p>
              <button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className="mt-3 text-xs font-black text-purple-700 hover:underline flex items-center gap-1 mx-auto cursor-pointer"
              >
                <FiUserPlus size={11} /> Create First Officer Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
