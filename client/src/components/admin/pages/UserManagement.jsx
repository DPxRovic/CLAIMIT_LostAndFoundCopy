import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AddAccountModal from '../modals/AddAccountModal.jsx';
import AdminAccountModals from '../modals/AdminAccountModals.jsx';
import UserAccountModals from '../modals/UserAccountModals.jsx';
import {
  isSupabaseConfigured,
  adminFetchAllProfiles,
  adminApproveFaculty,
  adminDeclineFaculty,
  adminSuspendUser,
  adminReactivateUser,
  adminDeactivateUser,
  adminUpdateUserDetails,
  adminResetUserPassword,
  adminCreateAccount,
} from '../../../lib/supabase.js';

// Fallback seed data for unconfigured development preview
const INITIAL_ALL_USERS = [
  {
    id: 'u-1',
    name: 'Crystal Florano',
    email: 'florano.crystal@campus.edu',
    avatarBg: 'bg-[#e11d48]',
    role: 'Student',
    program: 'BS Nursing',
    section: '1st Year, Section 1C',
    status: 'Active',
    joined: 'Jul 26, 2026',
    username: '@crystal',
    idNumber: '#STU-2026-4492',
    campus: 'Main Campus',
    stats: { reports: 3, claims: 0, resolved: 0, chats: 1 },
  },
  {
    id: 'u-2',
    name: 'Alyssa Cruz',
    email: 'cruz.alyssa@campus.edu',
    avatarBg: 'bg-[#ea580c]',
    role: 'Student',
    program: 'BS Education',
    section: '2nd Year, Section 2D',
    status: 'Active',
    joined: 'Aug 13, 2026',
    username: '@alyssa',
    idNumber: '#STU-2026-3187',
    campus: 'Main Campus',
    stats: { reports: 1, claims: 1, resolved: 1, chats: 0 },
  },
  {
    id: 'u-3',
    name: 'Aedri Mangulabnan',
    email: 'mangulaban.aedri@campus.edu',
    avatarBg: 'bg-[#9333ea]',
    role: 'Student',
    program: 'BS Psychology',
    section: '1st Year, Section 1B',
    status: 'Suspended',
    suspendReason: 'Repeated unauthorized claims on found items',
    joined: 'Aug 03, 2026',
    username: '@aedri',
    idNumber: '#STU-2026-5521',
    campus: 'Main Campus',
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
  },
  {
    id: 'u-4',
    name: 'Joshua Santiago',
    email: 'santiago.joshua@campus.edu',
    avatarBg: 'bg-[#2563eb]',
    role: 'Student',
    program: 'BS Accountancy',
    section: '2nd Year, Section 2B',
    status: 'Active',
    joined: 'Sep 01, 2026',
    username: '@joshua',
    idNumber: '#STU-2026-6604',
    campus: 'Main Campus',
    stats: { reports: 2, claims: 1, resolved: 1, chats: 2 },
  },
  {
    id: 'u-5',
    name: 'Rovic Rosales',
    email: 'rosales.rovic@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Student',
    program: 'BS Computer Science',
    section: '3rd Year, Section 3B',
    status: 'Active',
    joined: 'Sep 10, 2026',
    username: '@rovic',
    idNumber: '#STU-2026-2219',
    campus: 'Main Campus',
    stats: { reports: 4, claims: 2, resolved: 1, chats: 1 },
  },
  {
    id: 'u-6',
    name: 'Sam Aquino',
    email: 'aquino.sam@campus.edu',
    avatarBg: 'bg-[#4f46e5]',
    role: 'Staff',
    program: 'Campus Administration',
    section: 'Office of Student Affairs',
    status: 'Active',
    joined: 'Jun 15, 2026',
    username: '@sam',
    idNumber: '#STF-2026-0912',
    campus: 'Main Campus',
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
  },
  {
    id: 'u-10',
    name: 'Prof. Mark Rhicky Raby',
    email: 'raby.mark@campus.edu',
    avatarBg: 'bg-[#059669]',
    role: 'Faculty',
    program: 'College of Arts and Sciences',
    section: 'Associate Professor',
    status: 'Active',
    joined: 'Sep 10, 2026',
    username: '@mark',
    idNumber: '#FAC-2026-0347',
    campus: 'Main Campus',
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
  },
];

const INITIAL_PENDING_USERS = [
  {
    id: 'p-1',
    name: 'Dr. Miguel Aquino',
    email: 'miguel.aquino@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Nursing',
    section: 'Professor',
    status: 'Pending approval',
    joined: 'Sep 13, 2026',
    username: '@m.aquino',
    idNumber: '#FAC-2026-8812',
    campus: 'Main Campus',
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
  },
  {
    id: 'p-2',
    name: 'Ariana Grande',
    email: 'grande.ariana@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Engineering',
    section: 'Professor',
    status: 'Pending approval',
    joined: 'Sep 14, 2026',
    username: '@a.grande',
    idNumber: '#FAC-2026-9934',
    campus: 'Main Campus',
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
  },
];

const ITEMS_PER_PAGE = 8;

// Shared class strings matching ClaimIt admin UI design tokens
const inputClass =
  'w-full px-3.5 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20';
const selectClass =
  'appearance-none w-full pl-3.5 pr-9 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] font-medium focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 cursor-pointer';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer shrink-0';

function formatJoinedDate(isoString) {
  if (!isoString) return 'Today';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return isoString;
  }
}

function getRoleAvatarBg(role) {
  switch (role) {
    case 'Faculty':
      return 'bg-[#059669]';
    case 'Admin':
      return 'bg-[#e11d48]';
    case 'Staff':
      return 'bg-[#4f46e5]';
    case 'Student':
    default:
      return 'bg-[#2563eb]';
  }
}

function getInitials(name = '') {
  const parts = name.replace(/Dr\.|Prof\.|Engr\./g, '').trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
}

function mapProfileToAccount(p) {
  const isStudent = p.role === 'Student';
  return {
    id: p.id,
    name: p.full_name || p.username || 'User',
    email: p.email,
    avatarBg: getRoleAvatarBg(p.role),
    avatarUrl: p.avatar_url || null,
    role: p.role,
    program: isStudent
      ? (p.program || 'General Enrollment')
      : (p.department || p.program || 'Faculty Department'),
    section: isStudent
      ? [p.year_level, p.section && `Section ${p.section}`].filter(Boolean).join(', ') || '—'
      : (p.position || p.section || 'Faculty Member'),
    status: p.status,
    joined: formatJoinedDate(p.created_at),
    username: p.username ? `@${p.username.replace(/^@/, '')}` : (p.email ? `@${p.email.split('@')[0]}` : ''),
    idNumber: p.school_id || p.faculty_id || '',
    campus: p.campus || 'Main Campus',
    suspendReason: p.suspend_reason || '',
    inactiveReason: p.inactive_reason || '',
    declinedReason: p.declined_reason || '',
    declinedNote: p.declined_note || '',
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
    raw: p,
  };
}

function Avatar({ user, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
  const [imgError, setImgError] = useState(false);

  if (user.avatarUrl && !imgError) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover shrink-0 border border-[#E8E4D8] bg-[#eff4ff]`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full ${user.avatarBg || 'bg-[#2563eb]'} text-white font-semibold flex items-center justify-center shrink-0`}
      aria-hidden="true"
    >
      {getInitials(user.name)}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
    Suspended: { badge: 'bg-[#FEF2F2] text-[#B91C1C]', dot: 'bg-[#EF4444]' },
    Inactive: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
    'Pending approval': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
    Declined: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
  };
  const s = styles[status] || { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

function getPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) pages.push('…');
  for (let p = from; p <= to; p += 1) pages.push(p);
  if (to < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

function Pagination({ page, totalPages, totalItems, onPageChange, itemLabel }) {
  const start = totalItems === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, totalItems);
  const arrowClass =
    'h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-[#E8E4D8] bg-white text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-[#E8E4D8] text-xs text-[#6E6858]">
      <p>
        Showing{' '}
        <span className="font-semibold text-[#23261F]">{start === end ? start : `${start}–${end}`}</span>{' '}
        of <span className="font-semibold text-[#23261F]">{totalItems}</span> {itemLabel}
      </p>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          className={arrowClass}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
          <span>Previous</span>
        </button>

        {getPageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={
                p === page
                  ? 'h-8 min-w-8 px-2 rounded-lg border border-[#5170ff] bg-[#5170ff] text-xs font-semibold text-white'
                  : 'h-8 min-w-8 px-2 rounded-lg border border-[#E8E4D8] bg-white text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer'
              }
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className={arrowClass}
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Next</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
        </button>
      </nav>
    </div>
  );
}

function FilterSelect({ value, onChange, options, ...rest }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className={selectClass} {...rest}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <span
        className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6858] pointer-events-none"
        aria-hidden="true"
      >
        expand_more
      </span>
    </div>
  );
}

export default function UserManagement({ onNavigate = () => {} }) {
  const [activeSubtab, setActiveSubtab] = useState('all'); // 'all' | 'pending'
  const [allUsers, setAllUsers] = useState(INITIAL_ALL_USERS);
  const [pendingUsers, setPendingUsers] = useState(INITIAL_PENDING_USERS);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Feedback
  const [modalState, setModalState] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // Load authoritative database accounts
  // ---------------------------------------------------------------------------
  const loadAccounts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAllUsers(INITIAL_ALL_USERS);
      setPendingUsers(INITIAL_PENDING_USERS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const res = await adminFetchAllProfiles();
      if (!res.success) {
        setLoadError(res.error || 'Failed to load accounts from database.');
        setLoading(false);
        return;
      }

      const all = [];
      const pending = [];

      for (const p of res.data) {
        const mapped = mapProfileToAccount(p);
        if (p.status === 'Pending approval') {
          pending.push(mapped);
        } else {
          all.push(mapped);
        }
      }

      setAllUsers(all);
      setPendingUsers(pending);
    } catch (err) {
      setLoadError(err?.message || 'Unexpected error loading accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const subtabs = [
    { id: 'all', label: 'All Users', icon: 'group', count: allUsers.length },
    { id: 'pending', label: 'Pending Approvals', icon: 'hourglass_top', count: pendingUsers.length },
  ];

  const activeDataset = activeSubtab === 'all' ? allUsers : pendingUsers;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return activeDataset.filter((user) => {
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.username || '').toLowerCase().includes(q) ||
        user.program.toLowerCase().includes(q) ||
        (user.idNumber || '').toLowerCase().includes(q);

      const matchesRole =
        roleFilter === 'All Roles' || user.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'All Statuses' ||
        user.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeDataset, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Manage trigger
  const handleOpenManage = (user) => {
    setActionError(null);
    if (user.status === 'Pending approval') {
      setModalState({
        type: 'manage',
        account: {
          ...user,
          department: user.program,
          position: user.section,
          username: (user.username || user.email.split('@')[0]).replace(/^@/, ''),
        },
      });
    } else {
      setUserModal({ type: 'details', userId: user.id });
    }
  };

  const handleCloseModal = () => setModalState(null);

  // ---------------------------------------------------------------------------
  // 1. Approve Faculty
  // ---------------------------------------------------------------------------
  const handleApprove = async (account) => {
    setActionError(null);
    if (isSupabaseConfigured()) {
      const res = await adminApproveFaculty(account.id);
      if (res.error || !res.data?.success) {
        const errMsg = res.error?.message || res.data?.error || res.data?.message || 'Failed to approve account in database.';
        if (errMsg.toLowerCase().includes('no longer pending') || errMsg.toLowerCase().includes('already been approved')) {
          setActionError(`This application is no longer pending approval (${errMsg}). The accounts list has been refreshed.`);
          await loadAccounts();
          setModalState(null);
          return;
        }
        setActionError(errMsg);
        return;
      }
    }

    const approvedUser = { ...account, status: 'Active', joined: 'Today' };
    setPendingUsers((prev) => prev.filter((u) => u.id !== account.id));
    setAllUsers((prev) => [approvedUser, ...prev]);
    setModalState({ type: 'approved', account: approvedUser });
    showToast(`Faculty registration approved for ${account.name}`);
    if (isSupabaseConfigured()) {
      loadAccounts();
    }
  };

  const handleDeclineRequest = (account) => setModalState({ type: 'decline', account });

  const handleCancelDecline = () => {
    setModalState((prev) => (prev?.account ? { type: 'manage', account: prev.account } : null));
  };

  // ---------------------------------------------------------------------------
  // 2. Decline Faculty
  // ---------------------------------------------------------------------------
  const handleConfirmDecline = async ({ account, reason, note }) => {
    setActionError(null);
    if (isSupabaseConfigured()) {
      const res = await adminDeclineFaculty(account.id, reason, note);
      if (res.error || !res.data?.success) {
        const errMsg = res.error?.message || res.data?.error || res.data?.message || 'Failed to decline registration in database.';
        if (errMsg.toLowerCase().includes('no longer pending')) {
          setActionError(`This application is no longer pending approval (${errMsg}). The accounts list has been refreshed.`);
          await loadAccounts();
          setModalState(null);
          return;
        }
        setActionError(errMsg);
        return;
      }
    }

    const declinedUser = {
      ...account,
      status: 'Declined',
      declinedReason: reason,
      declinedNote: note,
    };
    setPendingUsers((prev) => prev.filter((u) => u.id !== account.id));
    setAllUsers((prev) => [declinedUser, ...prev]);
    setModalState({ type: 'declined', account: declinedUser, reason });
    showToast(`Registration declined for ${account.name}`);
    if (isSupabaseConfigured()) {
      loadAccounts();
    }
  };

  // ---------------------------------------------------------------------------
  // 3. Suspend Account
  // ---------------------------------------------------------------------------
  const handleConfirmSuspend = async (account, reason) => {
    setActionError(null);
    if (isSupabaseConfigured()) {
      const res = await adminSuspendUser(account.id, reason);
      if (res.error || !res.data?.success) {
        setActionError(res.error?.message || res.data?.error || res.data?.message || 'Failed to suspend account in database.');
        return;
      }
    }

    const updated = { ...account, status: 'Suspended', suspendReason: reason };
    setAllUsers((prev) => prev.map((u) => (u.id === account.id ? updated : u)));
    setUserModal({ type: 'details', userId: account.id });
    showToast(`Account suspended for ${account.name}`);
  };

  // ---------------------------------------------------------------------------
  // 4. Reactivate Account (Safe check for unapproved faculty)
  // ---------------------------------------------------------------------------
  const handleReactivate = async (account) => {
    setActionError(null);
    let targetStatus = 'Active';

    if (isSupabaseConfigured()) {
      const res = await adminReactivateUser(account.id);
      if (res.error || !res.data?.success) {
        setActionError(res.error?.message || res.data?.error || res.data?.message || 'Failed to reactivate account in database.');
        return;
      }
      targetStatus = res.data?.status || 'Active';
    }

    if (targetStatus === 'Pending approval') {
      // Returned to Pending Approvals queue
      const reactivated = {
        ...account,
        status: 'Pending approval',
        suspendReason: '',
        inactiveReason: '',
      };
      setAllUsers((prev) => prev.filter((u) => u.id !== account.id));
      setPendingUsers((prev) => [reactivated, ...prev]);
      setUserModal(null);
      showToast(`${account.name} returned to Pending Approvals queue`);
    } else {
      const updated = {
        ...account,
        status: 'Active',
        suspendReason: '',
        inactiveReason: '',
      };
      setAllUsers((prev) => prev.map((u) => (u.id === account.id ? updated : u)));
      setUserModal({ type: 'details', userId: account.id });
      showToast(`Account reactivated for ${account.name}`);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Deactivate Account (Soft delete: status Inactive, records kept)
  // ---------------------------------------------------------------------------
  const handleConfirmDeactivate = async (account, reason) => {
    setActionError(null);
    if (isSupabaseConfigured()) {
      const res = await adminDeactivateUser(account.id, reason);
      if (res.error || !res.data?.success) {
        setActionError(res.error?.message || res.data?.error || res.data?.message || 'Failed to deactivate account in database.');
        return;
      }
    }

    const updated = { ...account, status: 'Inactive', inactiveReason: reason };
    setAllUsers((prev) => prev.map((u) => (u.id === account.id ? updated : u)));
    setUserModal({ type: 'details', userId: account.id });
    showToast(`Account deactivated for ${account.name}`);
  };

  // ---------------------------------------------------------------------------
  // 6. Edit Details
  // ---------------------------------------------------------------------------
  const handleSaveEdit = async (account, updates) => {
    setActionError(null);
    if (isSupabaseConfigured()) {
      const res = await adminUpdateUserDetails(account.id, updates);
      if (res.error || !res.data?.success) {
        setActionError(res.error?.message || res.data?.error || res.data?.message || 'Failed to save changes in database.');
        return;
      }
    }

    const updated = { ...account, ...updates };
    setAllUsers((prev) => prev.map((u) => (u.id === account.id ? updated : u)));
    setUserModal({ type: 'details', userId: account.id });
    showToast('User details updated successfully');
  };

  // ---------------------------------------------------------------------------
  // 7. Reset Password (Generates secure temporary password)
  // ---------------------------------------------------------------------------
  const handleConfirmReset = async (account) => {
    setActionError(null);
    const password = `Campus-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isSupabaseConfigured()) {
      const res = await adminResetUserPassword(account.id, password);
      if (res.error || !res.data?.success) {
        setActionError(res.error?.message || res.data?.error || res.data?.message || 'Failed to reset password in authentication database.');
        return;
      }
    }

    setUserModal({ type: 'tempPassword', userId: account.id, password });
    showToast(`Temporary password generated for ${account.name}`);
  };

  // ---------------------------------------------------------------------------
  // 8. Add Account
  // ---------------------------------------------------------------------------
  const handleAddAccount = async (payload) => {
    setActionError(null);

    if (isSupabaseConfigured()) {
      const res = await adminCreateAccount(payload);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      await loadAccounts();
      showToast(`Account created successfully for ${payload.name}`);
      return { success: true };
    }

    // In-memory preview fallback
    const isStudent = payload.type === 'student';
    const newUser = {
      id: `${isStudent ? 'u' : 'p'}-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      avatarBg: isStudent ? 'bg-[#2563eb]' : 'bg-[#0d9488]',
      role: isStudent ? 'Student' : 'Faculty',
      program: isStudent ? payload.program || 'General Enrollment' : payload.department || 'Faculty',
      section: isStudent
        ? [payload.yearLevel, payload.section && `Section ${payload.section}`].filter(Boolean).join(', ') || '—'
        : 'Faculty',
      status: isStudent ? 'Active' : 'Pending approval',
      joined: 'Today',
      idNumber: isStudent ? payload.schoolId : payload.facultyId,
      campus: 'Main Campus',
      username: `@${payload.email.split('@')[0]}`,
      stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
    };

    if (isStudent) {
      setAllUsers((prev) => [newUser, ...prev]);
    } else {
      setPendingUsers((prev) => [newUser, ...prev]);
    }
    setCurrentPage(1);
    showToast(`Account created successfully for ${payload.name}`);
    return { success: true };
  };

  const userModalAccount = userModal
    ? allUsers.find((u) => u.id === userModal.userId) ||
      pendingUsers.find((u) => u.id === userModal.userId)
    : null;

  const handleViewActivityLog = () => {
    setModalState(null);
    onNavigate('activity-logs');
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Program / Details', 'Status', 'Joined'];
    const rows = filteredUsers.map((u) => [
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.program} - ${u.section}"`,
      `"${u.status}"`,
      `"${u.joined}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `claimit_${activeSubtab}_users.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">User Management</h1>
          <p className="text-sm text-[#6E6858]">
            Manage student, faculty and staff accounts on ClaimIt.
          </p>
        </div>
        <button onClick={() => setIsAddUserModalOpen(true)} className={btnPrimary} type="button">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
          <span>Add Account</span>
        </button>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          className="p-3 bg-[#fff5f5] text-[#ba1a1a] border border-[#ba1a1a]/20 rounded-lg text-sm flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#E8E4D8] pb-1">
        <div className="flex items-center gap-2 overflow-x-auto" role="tablist">
          {subtabs.map((tab) => {
            const isActive = activeSubtab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveSubtab(tab.id);
                  setCurrentPage(1);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'font-semibold border-b-2 border-[#5170ff] text-[#5170ff] bg-white'
                    : 'font-medium text-[#6E6858] hover:text-[#23261F] hover:bg-[#F3F4F6]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    isActive
                      ? 'font-semibold bg-[#5170ff] text-white'
                      : 'font-medium bg-[#E8E4D8]/60 text-[#6E6858]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex items-center flex-1 max-w-xl">
          <span
            className="material-symbols-outlined absolute left-3 text-[18px] text-[#6E6858] pointer-events-none"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="text"
            className={`${inputClass} pl-9`}
            placeholder="Search by name, email, username or ID"
            aria-label="Search accounts"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-[#6E6858] hover:text-[#23261F] text-xs font-semibold cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <FilterSelect
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={['All Roles', 'Student', 'Faculty', 'Staff', 'Admin']}
            aria-label="Filter by role"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={['All Statuses', 'Active', 'Suspended', 'Inactive', 'Pending approval', 'Declined']}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {/* Count + export */}
      <div className="flex items-center justify-between -mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6E6858]">
          {filteredUsers.length} accounts
        </span>
        <button
          onClick={handleExportCSV}
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5170ff] hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        {loadError && (
          <div className="p-6 text-center text-sm text-[#ba1a1a] bg-[#fff5f5] flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <p className="font-semibold">{loadError}</p>
            <button
              type="button"
              onClick={loadAccounts}
              className="px-3 py-1 bg-[#ba1a1a] text-white rounded text-xs font-medium cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Account</th>
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Role</th>
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Details</th>
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Status</th>
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Joined</th>
                <th className="py-3.5 px-6 text-right" scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-sm text-[#6E6858]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#5170ff] animate-spin">
                        progress_activity
                      </span>
                      <span>Loading database accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-sm text-[#6E6858]">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="material-symbols-outlined text-[28px] text-[#6E6858]/50">person_search</span>
                      <span className="font-medium">No accounts found matching your search or filters.</span>
                      {(searchQuery || roleFilter !== 'All Roles' || statusFilter !== 'All Statuses') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setRoleFilter('All Roles');
                            setStatusFilter('All Statuses');
                          }}
                          className="text-xs text-[#5170ff] hover:underline font-semibold mt-1 cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div>
                          <div className="font-medium text-[#23261F]">{user.name}</div>
                          <div className="text-xs text-[#6E6858] mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF4FF] text-[#5170ff]">
                        {user.role}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-[#23261F]">{user.program}</div>
                      <div className="text-xs text-[#6E6858] mt-0.5">{user.section}</div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">{user.joined}</td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenManage(user)}
                        className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#F3F4F6] text-xs font-medium text-[#23261F] transition-colors cursor-pointer"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          onPageChange={setCurrentPage}
          itemLabel="accounts"
        />
      </div>

      {/* All Users popups */}
      <UserAccountModals
        modal={userModal && userModalAccount ? { ...userModal, account: userModalAccount } : null}
        onClose={() => setUserModal(null)}
        onOpen={(type) => setUserModal((prev) => (prev ? { ...prev, type } : prev))}
        onSaveEdit={handleSaveEdit}
        onConfirmReset={handleConfirmReset}
        onConfirmSuspend={handleConfirmSuspend}
        onReactivate={handleReactivate}
        onConfirmDeactivate={handleConfirmDeactivate}
      />

      {/* Pending Approvals popups (shared with Dashboard) */}
      <AdminAccountModals
        modalState={modalState}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onDeclineRequest={handleDeclineRequest}
        onCancelDecline={handleCancelDecline}
        onConfirmDecline={handleConfirmDecline}
        onViewActivityLog={handleViewActivityLog}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddAccount}
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-[#23261F] text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export { UserManagement };