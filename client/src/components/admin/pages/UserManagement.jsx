import React, { useState, useMemo } from 'react';
import AddAccountModal from '../modals/AddAccountModal.jsx';
import AdminAccountModals from '../modals/AdminAccountModals.jsx';
import UserAccountModals from '../modals/UserAccountModals.jsx';

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
    joined: 'Jul 26',
    username: 'crystal',
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
    joined: 'Aug 13',
    username: 'alyssa',
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
    joined: 'Aug 3',
    username: 'aedri',
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
    joined: 'Sep 01',
    username: 'joshua',
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
    joined: 'Sep 10',
    username: 'rovic',
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
    joined: 'Jun 15',
    username: 'sam',
    idNumber: '#STF-2026-0912',
    campus: 'Main Campus',
    stats: { reports: 0, claims: 0, resolved: 0, chats: 0 },
  },
  {
    id: 'u-7',
    name: 'Maria Santos',
    email: 'santos.maria@campus.edu',
    avatarBg: 'bg-[#0891b2]',
    role: 'Student',
    program: 'BS Information Technology',
    section: '2nd Year, Section 2A',
    status: 'Active',
    joined: 'Aug 22',
    username: 'maria',
    idNumber: '#STU-2026-7730',
    campus: 'Main Campus',
    stats: { reports: 5, claims: 1, resolved: 1, chats: 3 },
  },
  {
    id: 'u-8',
    name: 'Juan Dela Cruz',
    email: 'delacruz.juan@campus.edu',
    avatarBg: 'bg-[#b91c1c]',
    role: 'Student',
    program: 'BS Criminology',
    section: '4th Year, Section 4A',
    status: 'Suspended',
    joined: 'Jul 10',
    username: 'juan',
    idNumber: '#STU-2026-1185',
    campus: 'Main Campus',
    stats: { reports: 2, claims: 0, resolved: 0, chats: 0 },
  },
  {
    id: 'u-9',
    name: 'Patricia Gomez',
    email: 'gomez.patricia@campus.edu',
    avatarBg: 'bg-[#7c3aed]',
    role: 'Student',
    program: 'BA Communication',
    section: '1st Year, Section 1A',
    status: 'Active',
    joined: 'Aug 29',
    username: 'patricia',
    idNumber: '#STU-2026-8841',
    campus: 'Main Campus',
    stats: { reports: 1, claims: 1, resolved: 0, chats: 1 },
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
    joined: 'Sep 10',
    username: 'mark',
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
  },
  {
    id: 'p-3',
    name: 'Dr. Roberto Mendoza',
    email: 'mendoza.roberto@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Business',
    section: 'Assistant Professor',
    status: 'Pending approval',
    joined: 'Sep 15, 2026',
    username: '@r.mendoza',
  },
  {
    id: 'p-4',
    name: 'Engr. Teresa Lopez',
    email: 'lopez.teresa@campus.edu',
    avatarBg: 'bg-[#0d9488]',
    role: 'Faculty',
    program: 'College of Engineering',
    section: 'Instructor I',
    status: 'Pending approval',
    joined: 'Sep 16, 2026',
    username: '@t.lopez',
  },
];

const ITEMS_PER_PAGE = 8;

// Shared class strings within this file (kept identical to ManageLists & MyReports)
const inputClass =
  'w-full px-3.5 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20';
const selectClass =
  'appearance-none w-full pl-3.5 pr-9 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] font-medium focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 cursor-pointer';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer shrink-0';
const getInitials = (name) => {
  const parts = name.replace(/Dr\.|Prof\.|Engr\./g, '').trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

function Avatar({ user, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  // Account popups (same as the Dashboard): 'manage' | 'decline' | 'approved' | 'declined' | null
  const [modalState, setModalState] = useState(null);
  // All Users popups (details, edit, reset password, suspend, deactivate): { type, userId, password? }
  const [userModal, setUserModal] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

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
        user.program.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === 'All Roles' || user.role.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'All Statuses' ||
        user.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeDataset, searchQuery, roleFilter, statusFilter]);

  // Pagination (page is clamped in case the list shrinks after approve/decline)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Handlers
  const handleOpenManage = (user) => {
    if (user.status === 'Pending approval') {
      // Same approval popups as the Dashboard (fields mapped to what they display)
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

  // Approve: move from Pending Approvals to All Users as Active
  const handleApprove = (account) => {
    const approvedUser = { ...account, status: 'Active', joined: 'Today' };
    setPendingUsers((prev) => prev.filter((u) => u.id !== account.id));
    setAllUsers((prev) => [approvedUser, ...prev]);
    setModalState({ type: 'approved', account: approvedUser });
  };

  const handleDeclineRequest = (account) => setModalState({ type: 'decline', account });

  const handleCancelDecline = () => {
    setModalState((prev) => (prev?.account ? { type: 'manage', account: prev.account } : null));
  };

  // Decline: remove from Pending Approvals
  const handleConfirmDecline = ({ account, reason, note }) => {
    const declinedUser = { ...account, status: 'Declined', declinedReason: reason, declinedNote: note };
    setPendingUsers((prev) => prev.filter((u) => u.id !== account.id));
    setModalState({ type: 'declined', account: declinedUser, reason });
  };

  // ----- All Users popups -----
  const updateUser = (id, changes) =>
    setAllUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u)));

  const openUserModal = (type) => setUserModal((prev) => (prev ? { ...prev, type } : prev));
  const closeUserModal = () => setUserModal(null);

  const handleSaveEdit = (account, updates) => {
    updateUser(account.id, updates);
    openUserModal('details');
  };

  const handleConfirmReset = () => {
    const password = `Campus-${Math.floor(1000 + Math.random() * 9000)}`;
    setUserModal((prev) => (prev ? { ...prev, type: 'tempPassword', password } : prev));
  };

  const handleConfirmSuspend = (account, reason) => {
    updateUser(account.id, { status: 'Suspended', suspendReason: reason });
    openUserModal('details');
  };

  const handleReactivate = (account) => {
    updateUser(account.id, { status: 'Active', suspendReason: '', inactiveReason: '' });
  };

  // Deactivate = soft delete: status Inactive, all records are kept
  const handleConfirmDeactivate = (account, reason) => {
    updateUser(account.id, { status: 'Inactive', inactiveReason: reason });
    openUserModal('details');
  };

  const userModalAccount = userModal ? allUsers.find((u) => u.id === userModal.userId) : null;

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

  // Receives the form from AddAccountModal.jsx (same modal as the Dashboard)
  const handleAddAccount = (payload) => {
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
      // Faculty accounts need approval first, same as the Dashboard
      status: isStudent ? 'Active' : 'Pending approval',
      joined: 'Today',
    };

    if (isStudent) {
      setAllUsers((prev) => [newUser, ...prev]);
    } else {
      setPendingUsers((prev) => [newUser, ...prev]);
    }
    setCurrentPage(1);
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
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={['All Roles', 'Student', 'Faculty', 'Staff']}
            aria-label="Filter by role"
          />
          <FilterSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={['All Statuses', 'Active', 'Suspended', 'Inactive', 'Pending approval']}
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
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-6 text-center text-sm text-[#6E6858]">
                    No accounts found matching your search or filters.
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
        onClose={closeUserModal}
        onOpen={openUserModal}
        onSaveEdit={handleSaveEdit}
        onConfirmReset={handleConfirmReset}
        onConfirmSuspend={handleConfirmSuspend}
        onReactivate={handleReactivate}
        onConfirmDeactivate={handleConfirmDeactivate}
      />

      {/* Pending Approvals popups (shared with the Dashboard) */}
      <AdminAccountModals
        modalState={modalState}
        onClose={handleCloseModal}
        onApprove={handleApprove}
        onDeclineRequest={handleDeclineRequest}
        onCancelDecline={handleCancelDecline}
        onConfirmDecline={handleConfirmDecline}
        onViewActivityLog={handleViewActivityLog}
      />

      {/* Add Account Modal (shared with the Dashboard) */}
      <AddAccountModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleAddAccount}
      />
    </div>
  );
}

export { UserManagement };