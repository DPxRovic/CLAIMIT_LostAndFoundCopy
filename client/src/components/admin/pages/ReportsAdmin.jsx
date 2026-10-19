import React, { useState, useMemo } from 'react';
import ItemDetailsModal from '../modals/ItemDetailsModal.jsx';

export const TABLE_DATA = [
  {
    ticketId: '#CLM-8492',
    itemTitle: 'Gray zip-up hoodie',
    category: 'Clothing & Apparel',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Paolo Dizon',
    role: 'Student',
    submitted: 'Sep 15, 2026',
    claims: 'None',
    location: 'Bleachers, main oval',
    locationFound: 'Bleachers, main oval',
    locationSub: 'Near North Concession Stand',
    date: 'Sep 15, 2026',
    reportedDateSubtitle: 'Today, 10:24 AM',
    dateReportedFull: 'Today, Sep 15, 2026',
    dateReportedSub: 'Approx. 4 hours ago',
    description: 'Size M, gray, with a small embroidered logo on the chest. Slightly damp when found.',
  },
  {
    ticketId: '#CLM-4819',
    itemTitle: 'Clear umbrella with green trim',
    category: 'Others',
    type: 'Lost',
    status: 'Pending Claim',
    reportedBy: 'Ana Reyes',
    role: 'Student',
    submitted: 'Sep 14, 2026',
    claims: '1 pending',
    location: 'Near guard house / oval walkway',
    locationFound: 'Near guard house / oval walkway',
    locationSub: 'Reported near campus gate 1',
    date: 'Sep 14, 2026',
    reportedDateSubtitle: 'Sep 14, 2026',
    dateReportedFull: 'Monday, Sep 14, 2026',
    dateReportedSub: 'Approx. 2 days ago',
    description: 'Clear folding umbrella with green trim, one rib is bent near edge. Left near the guard House / oval walkway.',
  },
  {
    ticketId: '#CLM-6631',
    itemTitle: 'Silver earbuds case',
    category: 'Electronics',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Lia Mendoza',
    role: 'Student',
    submitted: 'Sep 14, 2026',
    claims: '2 pending',
    location: 'Cafeteria, near water station',
    locationFound: 'Cafeteria, near water station',
    locationSub: 'Main Student Commons Hall',
    date: 'Sep 14, 2026',
    reportedDateSubtitle: 'Sep 14, 2026',
    dateReportedFull: 'Sep 14, 2026',
    dateReportedSub: 'Approx. 1 day ago',
    description: 'Metallic silver earbuds case. Minor hairline scuff on the hinge. Turned over to Guard House / Campus Security Lockbox #B-04.',
  },
  {
    ticketId: '#CLM-9014',
    itemTitle: 'Sony WH-1000XM4 Noise Canceling',
    category: 'Electronics',
    type: 'Found',
    status: 'Resolved',
    reportedBy: 'Dr. Miguel Aquino',
    role: 'Faculty',
    submitted: 'Sep 12, 2026',
    claims: '1 verified',
    location: 'Library 2F, silent cubicle',
    locationFound: 'Library 2F, silent cubicle',
    locationSub: 'Near South Study Wing',
    date: 'Sep 12, 2026',
    reportedDateSubtitle: 'Sep 12, 2026',
    dateReportedFull: 'Sep 12, 2026',
    dateReportedSub: 'Resolved on Sep 13, 2026',
    resolvedDateSub: 'Resolved on Sep 13, 2026',
    description: 'Sony WH-1000XM4 black over-ear headphones with travel case. Verified via serial number match and student ID.',
  },
  {
    ticketId: '#CLM-7720',
    itemTitle: 'Navy blue backpack',
    category: 'Bags & Luggage',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Carlo Santos',
    role: 'Student',
    submitted: 'Sep 11, 2026',
    claims: 'None',
    location: 'Student Lounge 2F',
    locationFound: 'Student Lounge 2F',
    locationSub: 'Left near couches',
    date: 'Sep 11, 2026',
    reportedDateSubtitle: 'Sep 11, 2026',
    dateReportedFull: 'Sep 11, 2026',
    dateReportedSub: 'Approx. 4 days ago',
    description: 'Navy blue canvas backpack containing notebooks and pencil pouch.',
  },
  {
    ticketId: '#CLM-3358',
    itemTitle: 'Black leather wallet',
    category: 'Wallets & Cards',
    type: 'Lost',
    status: 'Pending Claim',
    reportedBy: 'Maria Cruz',
    role: 'Student',
    submitted: 'Sep 11, 2026',
    claims: '1 pending',
    location: 'Cafeteria cashier line',
    locationFound: 'Cafeteria cashier line',
    locationSub: 'East Dining Area',
    date: 'Sep 11, 2026',
    reportedDateSubtitle: 'Sep 11, 2026',
    dateReportedFull: 'Sep 11, 2026',
    dateReportedSub: 'Approx. 4 days ago',
    description: 'Black bi-fold leather wallet with campus card and transit pass inside.',
  },
  {
    ticketId: '#CLM-5102',
    itemTitle: 'Student ID lanyard',
    category: 'IDs & Documents',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Joel Ramirez',
    role: 'Staff',
    submitted: 'Sep 10, 2026',
    claims: '1 pending',
    location: 'Administration Lobby',
    locationFound: 'Administration Lobby',
    locationSub: 'Visitor registration desk',
    date: 'Sep 10, 2026',
    reportedDateSubtitle: 'Sep 10, 2026',
    dateReportedFull: 'Sep 10, 2026',
    dateReportedSub: 'Approx. 5 days ago',
    description: 'Blue university lanyard with transparent ID card sleeve holder.',
  },
  {
    ticketId: '#CLM-2946',
    itemTitle: 'Casio fx-991 calculator',
    category: 'Electronics',
    type: 'Lost',
    status: 'Active',
    reportedBy: 'Kyle Bautista',
    role: 'Student',
    submitted: 'Sep 9, 2026',
    claims: 'None',
    location: 'Engineering Building Rm 204',
    locationFound: 'Engineering Building Rm 204',
    locationSub: 'Left in second row desk',
    date: 'Sep 9, 2026',
    reportedDateSubtitle: 'Sep 9, 2026',
    dateReportedFull: 'Sep 9, 2026',
    dateReportedSub: 'Approx. 6 days ago',
    description: 'Casio scientific calculator with silver hard sliding cover.',
  },
  {
    ticketId: '#CLM-8073',
    itemTitle: 'Blue water tumbler',
    category: 'Others',
    type: 'Found',
    status: 'Resolved',
    reportedBy: 'Prof. Elena Santos',
    role: 'Faculty',
    submitted: 'Sep 9, 2026',
    claims: '1 verified',
    location: 'Faculty Hall Rm 310',
    locationFound: 'Faculty Hall Rm 310',
    locationSub: 'Conference room table',
    date: 'Sep 9, 2026',
    reportedDateSubtitle: 'Sep 9, 2026',
    dateReportedFull: 'Sep 9, 2026',
    dateReportedSub: 'Resolved on Sep 10, 2026',
    resolvedDateSub: 'Resolved on Sep 10, 2026',
    description: 'Cobalt blue metallic flask with flip spout. Returned to faculty member.',
  },
  {
    ticketId: '#CLM-1685',
    itemTitle: 'House keys with red tag',
    category: 'Keys',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Ramon Villanueva',
    role: 'Staff',
    submitted: 'Sep 8, 2026',
    claims: 'None',
    location: 'Maintenance Gate B',
    locationFound: 'Maintenance Gate B',
    locationSub: 'Security checkpoint guard box',
    date: 'Sep 8, 2026',
    reportedDateSubtitle: 'Sep 8, 2026',
    dateReportedFull: 'Sep 8, 2026',
    dateReportedSub: 'Approx. 1 week ago',
    description: 'Set of two keys with red plastic label tag attached.',
  },
  {
    ticketId: '#CLM-4417',
    itemTitle: 'Prescription eyeglasses',
    category: 'Personal Items',
    type: 'Lost',
    status: 'Pending Claim',
    reportedBy: 'Bea Navarro',
    role: 'Student',
    submitted: 'Sep 7, 2026',
    claims: '1 pending',
    location: 'Science Library 1F',
    locationFound: 'Science Library 1F',
    locationSub: 'Corner reading desk',
    date: 'Sep 7, 2026',
    reportedDateSubtitle: 'Sep 7, 2026',
    dateReportedFull: 'Sep 7, 2026',
    dateReportedSub: 'Approx. 8 days ago',
    description: 'Tortoiseshell frame prescription reading glasses.',
  },
  {
    ticketId: '#CLM-9261',
    itemTitle: 'White AirPods Pro',
    category: 'Electronics',
    type: 'Found',
    status: 'Resolved',
    reportedBy: 'Noel Garcia',
    role: 'Student',
    submitted: 'Sep 6, 2026',
    claims: '1 verified',
    location: 'Gymnasium Bleachers',
    locationFound: 'Gymnasium Bleachers',
    locationSub: 'Under row 4 seats',
    date: 'Sep 6, 2026',
    reportedDateSubtitle: 'Sep 6, 2026',
    dateReportedFull: 'Sep 6, 2026',
    dateReportedSub: 'Resolved on Sep 7, 2026',
    resolvedDateSub: 'Resolved on Sep 7, 2026',
    description: 'AirPods Pro charging case with earbuds inside. Returned to owner.',
  },
  {
    ticketId: '#CLM-6039',
    itemTitle: 'Green hardbound notebook',
    category: 'Books & Stationery',
    type: 'Lost',
    status: 'Active',
    reportedBy: 'Trisha Lim',
    role: 'Student',
    submitted: 'Sep 5, 2026',
    claims: 'None',
    location: 'Education Hall 102',
    locationFound: 'Education Hall 102',
    locationSub: 'Back row desk',
    date: 'Sep 5, 2026',
    reportedDateSubtitle: 'Sep 5, 2026',
    dateReportedFull: 'Sep 5, 2026',
    dateReportedSub: 'Approx. 10 days ago',
    description: 'Dark green A5 hardcover notebook with handwritten lecture notes.',
  },
  {
    ticketId: '#CLM-2874',
    itemTitle: 'Black umbrella',
    category: 'Others',
    type: 'Found',
    status: 'Active',
    reportedBy: 'Dr. Rosa Mercado',
    role: 'Faculty',
    submitted: 'Sep 4, 2026',
    claims: '2 pending',
    location: 'Main Amphitheater Lobby',
    locationFound: 'Main Amphitheater Lobby',
    locationSub: 'Entrance umbrella stand',
    date: 'Sep 4, 2026',
    reportedDateSubtitle: 'Sep 4, 2026',
    dateReportedFull: 'Sep 4, 2026',
    dateReportedSub: 'Approx. 11 days ago',
    description: 'Standard black automatic folding umbrella with wooden handle.',
  },
  {
    ticketId: '#CLM-5590',
    itemTitle: 'Adidas gym bag',
    category: 'Bags & Luggage',
    type: 'Lost',
    status: 'Resolved',
    reportedBy: 'Miko Tan',
    role: 'Student',
    submitted: 'Sep 2, 2026',
    claims: '1 verified',
    location: 'Swimming Pool Locker Area',
    locationFound: 'Swimming Pool Locker Area',
    locationSub: "Men's locker room bench",
    date: 'Sep 2, 2026',
    reportedDateSubtitle: 'Sep 2, 2026',
    dateReportedFull: 'Sep 2, 2026',
    dateReportedSub: 'Resolved on Sep 3, 2026',
    resolvedDateSub: 'Resolved on Sep 3, 2026',
    description: 'Black and white striped Adidas duffle gym bag. Returned to owner.',
  },
];

// Two-line rows (item + category, reporter + role), same as User Management
const ITEMS_PER_PAGE = 8;

const TYPE_OPTIONS = [
  { value: 'All', label: 'All Types' },
  { value: 'Found', label: 'Found' },
  { value: 'Lost', label: 'Lost' },
];

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Pending Claim', label: 'Pending Claim' },
  { value: 'Resolved', label: 'Resolved' },
];

const SORT_OPTIONS = [
  { value: 'Newest', label: 'Newest first' },
  { value: 'Oldest', label: 'Oldest first' },
  { value: 'A-Z', label: 'Item name (A–Z)' },
];

// Same colors as the user-side My Reports page
function StatusBadge({ status }) {
  const styles = {
    Active: { badge: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
    'Pending Claim': { badge: 'bg-[#FFEDD5] text-[#9A3412]', dot: 'bg-[#EA580C]' },
    Resolved: { badge: 'bg-[#EFF6FF] text-[#1D4ED8]', dot: 'bg-[#1D4ED8]' },
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

// Same as the user-side My Reports page
function TypeBadge({ type }) {
  const isFound = type === 'Found';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold text-white ${
        isFound ? 'bg-[#0D6E6E]' : 'bg-[#881337]'
      }`}
    >
      {isFound ? 'FOUND' : 'LOST'}
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

export default function ReportsAdmin() {
  const [selectedRow, setSelectedRow] = useState(null);

  // Search, filters, sort, pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);

  const categoryOptions = useMemo(() => {
    const set = new Set(TABLE_DATA.map((d) => d.category));
    return [
      { value: 'All', label: 'All Categories' },
      ...Array.from(set).map((c) => ({ value: c, label: c })),
    ];
  }, []);

  // Snapshot counts (computed from the data, not hard-coded)
  const stats = useMemo(
    () => [
      {
        label: 'Total Reports',
        value: TABLE_DATA.length,
        icon: 'inventory_2',
        iconClass: 'bg-[#F3F4F6] text-[#6E6858]',
        filter: { type: 'All', status: 'All' },
      },
      {
        label: 'Lost',
        value: TABLE_DATA.filter((d) => d.type === 'Lost').length,
        icon: 'search',
        iconClass: 'bg-[#FFE4E6] text-[#881337]',
        filter: { type: 'Lost', status: 'All' },
      },
      {
        label: 'Found',
        value: TABLE_DATA.filter((d) => d.type === 'Found').length,
        icon: 'location_on',
        iconClass: 'bg-[#E6F4F4] text-[#0D6E6E]',
        filter: { type: 'Found', status: 'All' },
      },
      {
        label: 'Resolved',
        value: TABLE_DATA.filter((d) => d.status === 'Resolved').length,
        icon: 'assignment_turned_in',
        iconClass: 'bg-[#EFF6FF] text-[#1D4ED8]',
        filter: { type: 'All', status: 'Resolved' },
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = TABLE_DATA.filter((item) => {
      const matchesSearch =
        !q ||
        item.itemTitle.toLowerCase().includes(q) ||
        item.ticketId.toLowerCase().includes(q) ||
        item.reportedBy.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });

    return [...result].sort((a, b) => {
      if (sortOrder === 'Oldest') return TABLE_DATA.indexOf(b) - TABLE_DATA.indexOf(a);
      if (sortOrder === 'A-Z') return a.itemTitle.localeCompare(b.itemTitle);
      return TABLE_DATA.indexOf(a) - TABLE_DATA.indexOf(b); // Newest
    });
  }, [searchQuery, typeFilter, statusFilter, categoryFilter, sortOrder]);

  // Pagination (page is clamped in case the list shrinks)
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'All' ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    sortOrder !== 'Newest';

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSortOrder('Newest');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Item', 'Category', 'Type', 'Status', 'Reported By', 'Role', 'Submitted', 'Claims'];
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = filteredData.map((d) =>
      [d.ticketId, d.itemTitle, d.category, d.type, d.status, d.reportedBy, d.role, d.submitted, d.claims].map(esc)
    );
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `claimit_reports_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Wraps a setter so changing a filter also jumps back to page 1
  const withPageReset = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  // Added: determines whether a statistics card matches the active type/status filters
  const isStatActive = (filter) =>
    typeFilter === filter.type && statusFilter === filter.status;

  // Added: clicking an active card resets type/status; otherwise applies its filter
  const handleStatClick = (filter) => {
    const next = isStatActive(filter)
      ? { type: 'All', status: 'All' }
      : filter;

    setTypeFilter(next.type);
    setStatusFilter(next.status);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">Reports</h1>
          <p className="text-sm text-[#6E6858]">
            Every lost and found report on ClaimIt. This list is read-only. Claims and chats stay private between students.
          </p>
        </div>
      </div>

      {/* Snapshot cards (compact and clickable) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const isActive = isStatActive(s.filter);

          return (
            <button
              key={s.label}
              type="button"
              onClick={() => handleStatClick(s.filter)}
              aria-pressed={isActive}
              className={`text-left bg-white rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5170ff]/30 ${
                isActive
                  ? 'border-[#5170ff] ring-1 ring-[#5170ff]/30'
                  : 'border-[#E8E4D8] hover:border-[#C9C4B6]'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.iconClass}`}>
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{s.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold tracking-wider uppercase text-[#6E6858]">{s.label}</div>
                <div className="text-xl font-bold text-[#23261F] leading-tight">{s.value}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and filters (no container, same as other admin pages) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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
            placeholder="Search by item, location, ticket ID or reporter"
            aria-label="Search reports"
            value={searchQuery}
            onChange={withPageReset(setSearchQuery)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 text-[#6E6858] hover:text-[#23261F] text-xs font-semibold cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <FilterSelect value={typeFilter} onChange={withPageReset(setTypeFilter)} options={TYPE_OPTIONS} aria-label="Filter by type" />
          <FilterSelect value={statusFilter} onChange={withPageReset(setStatusFilter)} options={STATUS_OPTIONS} aria-label="Filter by status" />
          <FilterSelect value={categoryFilter} onChange={withPageReset(setCategoryFilter)} options={categoryOptions} aria-label="Filter by category" />
          <FilterSelect value={sortOrder} onChange={withPageReset(setSortOrder)} options={SORT_OPTIONS} aria-label="Sort reports" />
        </div>
      </div>

      {/* Count, reset, export */}
      <div className="flex items-center justify-between -mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6E6858]">
          {filteredData.length} reports
        </span>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#6E6858] hover:text-[#23261F] hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5170ff] hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 pl-6 pr-3 whitespace-nowrap" scope="col">Ticket</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Item</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Type</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Status</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Reported By</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Submitted</th>
                <th className="py-3.5 px-3 whitespace-nowrap" scope="col">Claims</th>
                <th className="py-3.5 pl-3 pr-6 text-right" scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-6 text-center text-sm text-[#6E6858]">
                    No reports found matching your search or filters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr key={row.ticketId} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 pl-6 pr-3 font-medium whitespace-nowrap">{row.ticketId}</td>

                    <td className="py-3 px-3 min-w-[220px]">
                      <div className="font-medium text-[#23261F]">{row.itemTitle}</div>
                      <div className="text-xs text-[#6E6858] mt-0.5">{row.category}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <TypeBadge type={row.type} />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={row.status} />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-[#23261F]">{row.reportedBy}</div>
                      <div className="text-xs text-[#6E6858] mt-0.5">{row.role}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">{row.submitted}</td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {row.claims === 'None' ? (
                        <span className="text-[#6E6858]">—</span>
                      ) : (
                        <span
                          className={`text-xs font-medium ${
                            row.claims.includes('verified') ? 'text-[#047857]' : 'text-[#92400E]'
                          }`}
                        >
                          {row.claims}
                        </span>
                      )}
                    </td>

                    <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#F3F4F6] text-xs font-medium text-[#23261F] transition-colors cursor-pointer"
                      >
                        View
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
          totalItems={filteredData.length}
          onPageChange={setCurrentPage}
          itemLabel="reports"
        />
      </div>

      {selectedRow && <ItemDetailsModal item={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
}

export { ReportsAdmin };