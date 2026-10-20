import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdminAccountModals from '../modals/AdminAccountModals.jsx';
import AddAccountModal from '../modals/AddAccountModal.jsx';
import {
  isSupabaseConfigured,
  adminFetchAllProfiles,
  adminApproveFaculty,
  adminDeclineFaculty,
  adminCreateAccount,
} from '../../../lib/supabase.js';

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

function getInitials(name = '') {
  const parts = name.replace(/Dr\.|Prof\.|Engr\./g, '').trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
}

function mapProfileToDashboardAccount(p) {
  const isStudent = p.role === 'Student';
  return {
    id: p.id,
    name: p.full_name || p.username || 'User',
    email: p.email,
    username: p.username ? p.username.replace(/^@/, '') : (p.email ? p.email.split('@')[0] : ''),
    idNumber: p.school_id || p.faculty_id || '',
    role: isStudent ? 'Students' : p.role,
    department: isStudent
      ? (p.program || 'General Enrollment')
      : (p.department || p.program || 'Faculty Department'),
    position: isStudent
      ? [p.year_level, p.section && `Section ${p.section}`].filter(Boolean).join(', ') || 'Undergraduate'
      : (p.position || p.section || 'Faculty Member'),
    campus: p.campus || 'Congress Campus',
    status: p.status,
    joined: formatJoinedDate(p.created_at),
    initials: getInitials(p.full_name || p.username || 'User'),
    avatarColor: isStudent ? '#7c3aed' : '#0d9488',
    avatarUrl: p.avatar_url || null,
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
    suspendReason: p.suspend_reason || '',
    inactiveReason: p.inactive_reason || '',
    declinedReason: p.declined_reason || '',
    declinedNote: p.declined_note || '',
    raw: p,
  };
}

/**
 * Initial Mock Data for Admin Dashboard Accounts
 * Matching Image 1 & Image 2 specifications:
 * Total: 10 accounts (7 Students, 2 Faculty, 1 Suspended)
 * With 1 Faculty pending approval initially.
 */
export const INITIAL_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Dr. Miguel Aquino',
    email: 'miguel.aquino@campus.edu',
    username: 'm.aquino',
    idNumber: '#FAC-2026-8812',
    role: 'Faculty',
    department: 'College of Nursing',
    position: 'Professor',
    campus: 'Congress Campus',
    status: 'Pending approval',
    joined: 'Sep 13, 2026',
    initials: 'MA',
    avatarColor: '#0d9488',
    stats: {
      reports: 0,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
  {
    id: 'acc-2',
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@campus.edu',
    username: 'e.rostova',
    idNumber: '#FAC-2026-7241',
    role: 'Faculty',
    department: 'College of Arts & Sciences',
    position: 'Associate Professor',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 10, 2026',
    initials: 'ER',
    avatarColor: '#0284c7',
    stats: {
      reports: 2,
      claims: 1,
      resolved: 1,
      chats: 3,
    },
  },
  {
    id: 'acc-3',
    name: 'Hannah Puerta',
    email: 'hannah.puerta@campus.edu',
    username: 'h.puerta',
    idNumber: '#STU-2024-4912',
    role: 'Students',
    department: 'BS Computer Science',
    position: '3rd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 09, 2026',
    initials: 'HP',
    avatarColor: '#7c3aed',
    stats: {
      reports: 3,
      claims: 2,
      resolved: 2,
      chats: 4,
    },
  },
  {
    id: 'acc-4',
    name: 'Marcus Vance',
    email: 'marcus.vance@campus.edu',
    username: 'm.vance',
    idNumber: '#STU-2025-6321',
    role: 'Students',
    department: 'BS Information Technology',
    position: '2nd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 08, 2026',
    initials: 'MV',
    avatarColor: '#2563eb',
    stats: {
      reports: 1,
      claims: 0,
      resolved: 0,
      chats: 1,
    },
  },
  {
    id: 'acc-5',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@campus.edu',
    username: 's.jenkins',
    idNumber: '#STU-2026-9041',
    role: 'Students',
    department: 'BA Psychology',
    position: '1st Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 06, 2026',
    initials: 'SJ',
    avatarColor: '#db2777',
    stats: {
      reports: 1,
      claims: 1,
      resolved: 0,
      chats: 2,
    },
  },
  {
    id: 'acc-6',
    name: 'Joshua Kim',
    email: 'joshua.kim@campus.edu',
    username: 'j.kim',
    idNumber: '#STU-2023-3108',
    role: 'Students',
    department: 'BS Business Administration',
    position: '4th Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Suspended',
    joined: 'Aug 28, 2026',
    initials: 'JK',
    avatarColor: '#dc2626',
    stats: {
      reports: 0,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
  {
    id: 'acc-7',
    name: 'Chloe Morales',
    email: 'chloe.morales@campus.edu',
    username: 'c.morales',
    idNumber: '#STU-2025-1192',
    role: 'Students',
    department: 'BS Nursing',
    position: '2nd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 02, 2026',
    initials: 'CM',
    avatarColor: '#059669',
    stats: {
      reports: 2,
      claims: 1,
      resolved: 1,
      chats: 1,
    },
  },
  {
    id: 'acc-8',
    name: 'David Chen',
    email: 'david.chen@campus.edu',
    username: 'd.chen',
    idNumber: '#STU-2024-8714',
    role: 'Students',
    department: 'BS Mechanical Engineering',
    position: '3rd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Sep 01, 2026',
    initials: 'DC',
    avatarColor: '#4f46e5',
    stats: {
      reports: 0,
      claims: 1,
      resolved: 0,
      chats: 1,
    },
  },
  {
    id: 'acc-9',
    name: 'Mia Santos',
    email: 'mia.santos@campus.edu',
    username: 'm.santos',
    idNumber: '#STU-2026-4421',
    role: 'Students',
    department: 'BS Architecture',
    position: '1st Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Aug 30, 2026',
    initials: 'MS',
    avatarColor: '#ea580c',
    stats: {
      reports: 1,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
  {
    id: 'acc-10',
    name: 'Arthur Pendelton',
    email: 'arthur.pendelton@campus.edu',
    username: 'a.pendelton',
    idNumber: '#STU-2024-5510',
    role: 'Students',
    department: 'BS Civil Engineering',
    position: '3rd Year Undergraduate',
    campus: 'Congress Campus',
    status: 'Active',
    joined: 'Aug 25, 2026',
    initials: 'AP',
    avatarColor: '#0891b2',
    stats: {
      reports: 0,
      claims: 0,
      resolved: 0,
      chats: 0,
    },
  },
];

const ITEMS_PER_PAGE = 4;

const ROLE_OPTIONS = [
  { value: 'All Roles', label: 'All Roles' },
  { value: 'Students', label: 'Students' },
  { value: 'Faculty', label: 'Faculty' },
];

const STATUS_OPTIONS = [
  { value: 'All Statuses', label: 'All Statuses' },
  { value: 'Pending approval', label: 'Pending approval' },
  { value: 'Active', label: 'Active' },
  { value: 'Suspended', label: 'Suspended' },
];

// Same colors as User Management
function StatusBadge({ status }) {
  const styles = {
    Active: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
    Suspended: { badge: 'bg-[#FEF2F2] text-[#B91C1C]', dot: 'bg-[#EF4444]' },
    'Pending approval': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
    Declined: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
  };
  const s = styles[status] || styles.Declined;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

function FilterSelect({ value, onChange, options, ...rest }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none w-full pl-3.5 pr-9 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] font-medium focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 cursor-pointer"
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
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
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Next</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
        </button>
      </nav>
    </div>
  );
}

export default function Dashboard({ onNavigate = () => {} }) {
  // Master state for accounts
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Search, filters, pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal flow state: 'manage' | 'decline' | 'approved' | 'declined' | null
  const [modalState, setModalState] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load authoritative accounts from Supabase
  const loadAccounts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAccounts(INITIAL_ACCOUNTS);
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

      const mapped = (res.data || []).map(mapProfileToDashboardAccount);
      setAccounts(mapped);
    } catch (err) {
      setLoadError(err?.message || 'Unexpected error loading accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Snapshot counts (live from the data)
  const stats = useMemo(
    () => [
      {
        label: 'Total Accounts',
        value: accounts.length,
        icon: 'group',
        iconClass: 'bg-[#EFF4FF] text-[#5170ff]',
      },
      {
        label: 'Students',
        value: accounts.filter((a) => a.role === 'Students' || a.role === 'Student').length,
        icon: 'school',
        iconClass: 'bg-[#F3F0FF] text-[#7C3AED]',
      },
      {
        label: 'Faculty',
        value: accounts.filter((a) => a.role === 'Faculty').length,
        icon: 'badge',
        iconClass: 'bg-[#E6F4F4] text-[#0D6E6E]',
      },
      {
        label: 'Suspended',
        value: accounts.filter((a) => a.status === 'Suspended').length,
        icon: 'block',
        iconClass: 'bg-[#FEF2F2] text-[#B91C1C]',
      },
    ],
    [accounts]
  );

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return accounts.filter((acc) => {
      const matchesSearch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        (acc.username && acc.username.toLowerCase().includes(q));

      const matchesRole =
        selectedRole === 'All Roles' ||
        acc.role === selectedRole ||
        (selectedRole === 'Students' && acc.role === 'Student');

      const matchesStatus =
        selectedStatus === 'All Statuses' ||
        acc.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, searchQuery, selectedRole, selectedStatus]);

  // Pagination (page is clamped in case the list shrinks)
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedAccounts = filteredAccounts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Modal handlers
  const handleOpenManage = (account) => {
    setActionError(null);
    setModalState({ type: 'manage', account });
  };

  const handleApproveAccount = async (accountToApprove) => {
    setActionError(null);
    if (isSupabaseConfigured()) {
      const res = await adminApproveFaculty(accountToApprove.id);
      if (res.error || !res.data?.success) {
        setActionError(res.error?.message || res.data?.error || res.data?.message || 'Failed to approve account in database.');
        return;
      }
    }

    const updatedAccount = { ...accountToApprove, status: 'Active' };
    setAccounts((prev) => prev.map((acc) => (acc.id === accountToApprove.id ? updatedAccount : acc)));
    setModalState({ type: 'approved', account: updatedAccount });
    showToast(`Faculty registration approved for ${accountToApprove.name}`);
  };

  const handleDeclineRequest = (account) => setModalState({ type: 'decline', account });

  const handleCancelDecline = () => {
    if (modalState?.account) {
      setModalState({ type: 'manage', account: modalState.account });
    } else {
      setModalState(null);
    }
  };

  const handleConfirmDecline = async ({ account, reason, note }) => {
    setActionError(null);
    if (isSupabaseConfigured()) {
      const res = await adminDeclineFaculty(account.id, reason, note);
      if (res.error || !res.data?.success) {
        setActionError(res.error?.message || res.data?.error || res.data?.message || 'Failed to decline registration in database.');
        return;
      }
    }

    const declinedAccount = { ...account, status: 'Declined', declinedReason: reason, declinedNote: note };
    setAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
    setModalState({ type: 'declined', account: declinedAccount, reason });
    showToast(`Registration declined for ${account.name}`);
  };

  const handleCloseModal = () => setModalState(null);

  const handleViewActivityLog = () => {
    setModalState(null);
    onNavigate('activity-logs');
  };

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

    const isStudent = payload.type === 'student';
    const initials =
      payload.name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U';

    const username = payload.email.split('@')[0];
    const todayFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const newAcc = {
      id: `acc-${Date.now()}`,
      refNo: isStudent ? payload.schoolId : payload.facultyId,
      idNumber: isStudent ? payload.schoolId : payload.facultyId,
      name: payload.name,
      email: payload.email,
      username,
      role: isStudent ? 'Students' : 'Faculty',
      department: isStudent ? payload.program : payload.department,
      position: isStudent
        ? [payload.yearLevel, payload.section && `Section ${payload.section}`].filter(Boolean).join(', ')
        : '',
      campus: 'Congress Campus',
      status: isStudent ? 'Active' : 'Pending approval',
      joined: todayFormatted,
      joinedAt: new Date().toISOString(),
      initials,
      avatarColor: isStudent ? '#7c3aed' : '#0d9488',
      reportsFiled: 0,
      claimsSubmitted: 0,
      claimsResolved: 0,
      activeChats: 0,
      stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
    };

    setAccounts((prev) => [newAcc, ...prev]);
    setCurrentPage(1);
    showToast(`Account created successfully for ${payload.name}`);
    return { success: true };
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Position', 'Status', 'Joined'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filteredAccounts.map((a) =>
      [a.name, a.email, a.role, a.department, a.position, a.status, a.joined].map(esc)
    );
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `claimit_accounts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#23261F] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-white/10 animate-in fade-in">
          <span className="material-symbols-outlined text-[#5170ff] text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#6E6858]">Manage student, faculty and staff accounts on ClaimIt.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer shrink-0"
        >
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

      {/* Load Error Banner */}
      {loadError && (
        <div className="p-4 text-center text-sm text-[#ba1a1a] bg-[#fff5f5] border border-[#ba1a1a]/20 rounded-xl flex flex-col items-center gap-2">
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

      {/* Snapshot cards (compact, counts only — same as Reports) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm px-4 py-3 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.iconClass}`}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{s.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-wider uppercase text-[#6E6858]">{s.label}</div>
              <div className="text-xl font-bold text-[#23261F] leading-tight">{s.value}</div>
            </div>
          </div>
        ))}
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
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20"
            placeholder="Search by name, email or username"
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
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            options={ROLE_OPTIONS}
            aria-label="Filter by role"
          />
          <FilterSelect
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {/* Section label + export */}
      <div className="flex items-center justify-between -mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6E6858]">Most recent</span>
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5170ff] hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 pl-6 pr-3 whitespace-nowrap" scope="col">Account</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Role</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Details</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Status</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Joined</th>
                <th className="py-3.5 pl-3 pr-6 text-right" scope="col">
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
              ) : paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-6 text-center text-sm text-[#6E6858]">
                    No accounts found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 pl-6 pr-3 min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0"
                          style={{ backgroundColor: account.avatarColor || '#0d9488' }}
                          aria-hidden="true"
                        >
                          {account.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#23261F] truncate">{account.name}</div>
                          <div className="text-xs text-[#6E6858] mt-0.5 truncate">{account.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF4FF] text-[#5170ff]">
                        {account.role}
                      </span>
                    </td>

                    <td className="py-3 px-3 min-w-[200px]">
                      <div className="font-medium text-[#23261F]">{account.department}</div>
                      {account.position && (
                        <div className="text-xs text-[#6E6858] mt-0.5">{account.position}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={account.status} />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">{account.joined}</td>

                    <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenManage(account)}
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
          totalItems={filteredAccounts.length}
          onPageChange={setCurrentPage}
          itemLabel="accounts"
        />
      </div>

      <AdminAccountModals
        modalState={modalState}
        onClose={handleCloseModal}
        onApprove={handleApproveAccount}
        onDeclineRequest={handleDeclineRequest}
        onCancelDecline={handleCancelDecline}
        onConfirmDecline={handleConfirmDecline}
        onViewActivityLog={handleViewActivityLog}
      />

      <AddAccountModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleAddAccount} />
    </div>
  );
}

export { Dashboard };