import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import ReportDetailsModal from './ReportDetailsModal.jsx';
import ClaimMatchVerificationModal from './ClaimMatchVerificationModal.jsx';

// ---------------------------------------------------------------------------
// Shared UI (identical in Browse Items, Claims & Matches and My Reports)
// ---------------------------------------------------------------------------
const INTER_FONT_FAMILY =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

// Loads Inter and applies it app-wide (including modals rendered outside this page)
const INTER_FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
html, body, button, input, select, textarea { font-family: ${INTER_FONT_FAMILY}; }
.font-headline, .font-sans { font-family: ${INTER_FONT_FAMILY} !important; }
`;

const normalizeOption = (opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt);

/**
 * Shared search bar
 * @param {{ value: string, onChange: (v: string) => void, placeholder?: string, className?: string }} props
 */
const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative w-full ${className}`}>
    <Search
      className="w-4 h-4 text-[#6E6858] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
      aria-hidden="true"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full h-10 pl-10 pr-9 bg-white border border-[#E8E4D8] rounded-xl text-sm text-[#23261F] placeholder:text-[#9A957F] focus:outline-none focus:border-[#5B6CF0] focus:ring-2 focus:ring-[#5B6CF0]/20 transition-colors"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6858] hover:text-[#23261F] cursor-pointer"
        aria-label="Clear search"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

/**
 * Shared popover-style filter dropdown
 * @param {{
 *   title: string,
 *   value: string,
 *   options: Array<string | { value: string, label: string }>,
 *   onChange: (v: string) => void,
 *   resetValue?: string,
 *   align?: 'left' | 'right',
 *   className?: string
 * }} props
 */
const FilterDropdown = ({
  title,
  value,
  options,
  onChange,
  resetValue,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const items = useMemo(() => options.map(normalizeOption), [options]);
  const selected = items.find((i) => i.value === value) || items[0];
  const defaultValue = resetValue !== undefined ? resetValue : items[0]?.value;
  const isDefault = value === defaultValue;

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={wrapperRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={title}
        className={`inline-flex items-center justify-between gap-2.5 h-10 px-3.5 bg-white border rounded-xl text-sm text-[#23261F] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CF0]/30 ${
          isOpen ? 'border-[#5B6CF0]' : 'border-[#E8E4D8] hover:bg-gray-50'
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#6E6858] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          className={`absolute z-30 mt-2 w-max min-w-[200px] max-w-[17rem] bg-white border border-[#E8E4D8] rounded-2xl shadow-xl ${
            align === 'right' ? 'left-0 sm:left-auto sm:right-0' : 'left-0'
          }`}
        >
          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]">
            {title}
          </div>

          <div role="listbox" aria-label={title} className="px-2 py-1 flex flex-col gap-0.5">
            {items.map((item) => {
              const isActive = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onChange(item.value)}
                  className={`w-full flex items-center justify-between gap-6 px-3 py-2 rounded-xl text-sm text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CF0]/30 ${
                    isActive
                      ? 'bg-[#E3E7FF] text-[#23261F] font-semibold'
                      : 'text-[#3F4238] font-medium hover:bg-[#EEF0FF]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <Check className="w-4 h-4 text-[#4F5BD5] shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E8E4D8]">
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              disabled={isDefault}
              className={`text-xs font-medium transition-colors ${
                isDefault
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-[#6E6858] hover:text-[#23261F] cursor-pointer'
              }`}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#5B6CF0] hover:bg-[#4A5BDF] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// ---------------------------------------------------------------------------


export const DEFAULT_REPORTS = [
  {
    ticket: 'R-1070',
    title: 'Grey Foldable Umbrella',
    category: 'Others',
    type: 'FOUND',
    dateFiled: 'Sep 16, 2026',
    status: 'Active',
    claims: '—',
    location: 'Main Building Lobby',
    description: 'Found a grey foldable umbrella with a wooden handle near the entrance.',
    imageUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=600&q=80',
    entries: [],
  },
  {
    ticket: 'R-1072',
    title: 'Silver Charm Bracelet',
    category: 'Clothing & Accessories',
    type: 'LOST',
    dateFiled: 'Sep 15, 2026',
    status: 'Pending Match',
    claims: '1 match',
    location: 'Gymnasium Bleachers',
    description: 'Lost my silver chain bracelet with 3 charms (star, heart, moon).',
    imageUrl: 'https://images.unsplash.com/photo-1611591475870-070df16bfe64?auto=format&fit=crop&w=600&q=80',
    entriesType: 'matches',
    entries: [
      {
        id: 'M-301',
        type: 'match',
        isMatch: true,
        name: 'Maria Santos',
        submitterName: 'Maria Santos',
        role: 'Reported Found',
        date: 'Sep 15, 6:30 PM',
        submittedDate: 'Sep 15, 6:30 PM',
        status: 'Pending',
        imageUrl: 'https://images.unsplash.com/photo-1611591475870-070df16bfe64?auto=format&fit=crop&w=600&q=80',
        message: 'I found a silver bracelet matching this description near the bench.',
        messagePreview: 'I found a silver bracelet matching this description near the bench.',
        messages: [
          {
            id: 'm1',
            senderName: 'Maria Santos',
            timestamp: 'Sep 15, 6:35 PM',
            text: 'Hello! I found a silver bracelet with 3 charms by bleacher #4 after volleyball practice.',
            isCurrentUser: false,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1042',
    title: 'Black Ray-Ban–style Wayfarer Sunglasses',
    category: 'Clothing & Accessories',
    type: 'FOUND',
    dateFiled: 'Sep 12, 2026',
    status: 'Pending Claim',
    claims: '4 claims',
    location: 'University Library - 2nd Floor',
    description: 'Black classic style sunglasses found on table #14 in the quiet study area.',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
    entriesType: 'claims',
    entries: [
      {
        id: 'C-512',
        type: 'claim',
        isMatch: false,
        name: 'Joshua Santiago',
        submitterName: 'Joshua Santiago',
        role: 'Claimant',
        date: 'Sep 15, 2026',
        submittedDate: 'Sep 15, 2026',
        status: 'Pending',
        imageUrl: null, // "No photo attached" state
        message:
          'Mine has a tiny chip on the bottom left corner of the frame and came with a brown case,...',
        messagePreview:
          'Mine has a tiny chip on the bottom left corner of the frame and came with a brown case,...',
        messages: [
          {
            id: 'm-512-1',
            senderName: 'Joshua Santiago',
            timestamp: 'Sep 15, 9:12 AM',
            text:
              'Hey, I lost sunglasses around the library too — mine has a tiny chip on the bottom left corner of the frame. Was there a brown case nearby?.',
            isCurrentUser: false,
          },
        ],
      },
      {
        id: 'C-513',
        type: 'claim',
        isMatch: false,
        name: 'Alex Rivera',
        submitterName: 'Alex Rivera',
        role: 'Claimant',
        date: 'Sep 14, 2026',
        submittedDate: 'Sep 14, 2026',
        status: 'Pending',
        imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80',
        message: 'Black sunglasses with polarized lenses left on the desk.',
        messagePreview: 'Black sunglasses with polarized lenses left on the desk.',
        messages: [
          {
            id: 'm-513-1',
            senderName: 'Alex Rivera',
            timestamp: 'Sep 14, 3:20 PM',
            text: 'Hi! I left my black sunglasses there during my afternoon study session.',
            isCurrentUser: false,
          },
        ],
      },
      {
        id: 'C-509',
        type: 'claim',
        isMatch: false,
        name: 'Bea Mendoza',
        submitterName: 'Bea Mendoza',
        role: 'Claimant',
        date: 'Sep 13, 2026',
        submittedDate: 'Sep 13, 2026',
        status: 'Declined',
        imageUrl: null,
        message: 'Mine are round tortoiseshell frames, left near the printers.',
        messagePreview: 'Mine are round tortoiseshell frames, left near the printers.',
        isClosed: true,
        messages: [
          {
            id: 'm-509-1',
            senderName: 'Bea Mendoza',
            timestamp: 'Sep 13, 1:05 PM',
            text: 'Hi, are these round tortoiseshell frames? I left mine near the printers.',
            isCurrentUser: false,
          },
          {
            id: 'm-509-2',
            senderName: 'You',
            timestamp: 'Sep 13, 1:20 PM',
            text: 'Sorry, these are black wayfarer-style frames, not tortoiseshell.',
            isCurrentUser: true,
          },
        ],
      },
      {
        id: 'C-506',
        type: 'claim',
        isMatch: false,
        name: 'Paolo Cruz',
        submitterName: 'Paolo Cruz',
        role: 'Claimant',
        date: 'Sep 12, 2026',
        submittedDate: 'Sep 12, 2026',
        status: 'Withdrawn',
        imageUrl: null,
        message: 'Black sunglasses, I think I left them on the 2nd floor.',
        messagePreview: 'Black sunglasses, I think I left them on the 2nd floor.',
        isClosed: true,
        messages: [
          {
            id: 'm-506-1',
            senderName: 'Paolo Cruz',
            timestamp: 'Sep 12, 4:40 PM',
            text: 'Never mind, I found mine in my bag. Sorry about that!',
            isCurrentUser: false,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1039',
    title: 'Casio fx-991 Scientific Calculator',
    category: 'Books & School Supplies',
    type: 'LOST',
    dateFiled: 'Sep 10, 2026',
    status: 'Active',
    claims: '—',
    location: 'Engineering Building Room 302',
    description: 'Black and silver scientific calculator with my initials (JD) carved inside the cover.',
    entries: [],
  },
  {
    ticket: 'R-1021',
    title: 'Blue JanSport Backpack',
    category: 'Bags & Wallets',
    type: 'FOUND',
    dateFiled: 'Aug 29, 2026',
    status: 'Resolved',
    claims: '1 claim',
    location: 'Student Activity Center',
    description: 'Navy blue JanSport backpack with a grey bottom patch.',
    entriesType: 'claims',
    entries: [
      {
        id: 'C-480',
        type: 'claim',
        isMatch: false,
        submitterName: 'Mark Gonzales',
        submittedDate: 'Aug 30, 11:15 AM',
        status: 'Approved',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80',
        messagePreview: 'Contains notebooks and a blue spiral binder.',
        isClosed: true,
        messages: [
          {
            id: 'm-480-1',
            senderName: 'Mark Gonzales',
            timestamp: 'Aug 30, 11:20 AM',
            text: 'Hello, I left my blue JanSport backpack in the student lounge yesterday.',
            isCurrentUser: false,
          },
          {
            id: 'm-480-2',
            senderName: 'You',
            timestamp: 'Aug 30, 1:45 PM',
            text: 'Verified! All items inside match your description. Meet me at SAC security desk.',
            isCurrentUser: true,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1073',
    title: 'Blue Stainless Water Bottle',
    category: 'Bags & Wallets',
    type: 'LOST',
    dateFiled: 'Aug 22, 2026',
    status: 'Resolved',
    claims: '1 match',
    location: 'Covered Court',
    description: 'Blue steel insulated bottle with UCC organization sticker and small dent on bottom.',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    entriesType: 'matches',
    entries: [
      {
        id: 'C-495',
        type: 'match',
        isMatch: true,
        name: 'Crystal Florano',
        submitterName: 'Crystal Florano',
        role: 'Reported Found',
        date: 'Aug 22, 5:02 PM',
        submittedDate: 'Aug 22, 5:02 PM',
        status: 'Approved',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80',
        message:
          'Found a blue steel water bottle at the Covered Court, dent on the bottom, UCC org sticker on...',
        messagePreview:
          'Found a blue steel water bottle at the Covered Court, dent on the bottom, UCC org sticker on...',
        isClosed: true,
        messages: [
          {
            id: 'm-495-1',
            senderName: 'Crystal Florano',
            timestamp: 'Aug 22, 5:10 PM',
            text:
              'Hi, I think I found your water bottle at the Covered Court — blue, dented bottom, UCC sticker.',
            isCurrentUser: false,
          },
          {
            id: 'm-495-2',
            senderName: 'You',
            timestamp: 'Aug 22, 6:10 PM',
            text:
              'That sounds exactly like mine! Thank you so much — approving this. Would you mind if we switch to Messenger so we can arrange the meetup details more easily?',
            isCurrentUser: true,
          },
        ],
      },
    ],
  },
  {
    ticket: 'R-1005',
    title: 'School ID — Juan Dela Cruz',
    category: 'IDs & Cards',
    type: 'LOST',
    dateFiled: 'Aug 15, 2026',
    status: 'Closed',
    claims: '—',
    location: 'Cafeteria cashier',
    description: 'Lost ID card in transparent plastic case with blue lanyard.',
    entries: [],
  },
  {
    ticket: 'R-1071',
    title: 'Used Chemistry Textbook',
    category: 'Books & School Supplies',
    type: 'FOUND',
    dateFiled: 'Aug 5, 2026',
    status: 'Closed',
    claims: '—',
    location: 'Science Lab 101',
    description: 'Organic Chemistry 9th Edition hardcover book found on front counter.',
    entries: [],
  },
];

// ---------------------------------------------------------------------------
// Pagination (same design as the admin tables)
// ---------------------------------------------------------------------------
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

function Pagination({ page, totalPages, totalItems, itemsPerPage, onPageChange, itemLabel }) {
  const start = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems);
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
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
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
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

const STATUS_OPTIONS = [
  'All statuses',
  'Active',
  'Pending Match',
  'Pending Claim',
  'Resolved',
  'Closed',
];

/**
 * MyReports Component with built-in modal verification flow
 */
export const MyReports = ({
  reports = DEFAULT_REPORTS,
  className = '',
}) => {
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal Flow States
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);

  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return reports.filter((report) => {
      if (selectedStatus !== 'All statuses' && report.status !== selectedStatus) {
        return false;
      }

      if (q) {
        const haystack = [
          report.ticket,
          report.title,
          report.category,
          report.type,
          report.status,
          report.location,
          report.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [reports, selectedStatus, searchQuery]);

  // Pagination calculation
  const totalReportsCount = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalReportsCount / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalReportsCount);
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const handleOpenReport = (report) => {
    setSelectedReport(report);
  };

  const handleOpenVerification = (entry) => {
    if (!selectedReport) return;

    setSelectedVerification({
      id: entry.id,
      type: entry.type || (selectedReport.type === 'LOST' ? 'match' : 'claim'),
      itemTitle: selectedReport.title,
      reportTicket: selectedReport.ticket,
      submitterName: entry.name || entry.submitterName,
      submittedDate: entry.date || entry.submittedDate,
      status: entry.status || 'Pending',
      imageUrl: entry.imageUrl,
      messagePreview: entry.message || entry.messagePreview,
      // Full statement for "Inspect details" (falls back to the preview)
      statement: entry.statement || entry.message || entry.messagePreview,
      messages: entry.messages || [],
      isClosed: entry.isClosed,
    });
  };

  const handleApprove = (ver) => {
    alert(`Approved ${ver.type === 'match' ? 'Match' : 'Claim'} ${ver.id} for ${ver.submitterName}!`);
    setSelectedVerification((prev) => (prev ? { ...prev, status: 'Approved', isClosed: true } : null));
  };

  const handleDecline = (ver) => {
    alert(`Declined ${ver.type === 'match' ? 'Match' : 'Claim'} ${ver.id}.`);
    setSelectedVerification((prev) => (prev ? { ...prev, status: 'Declined', isClosed: true } : null));
  };

  const handleSendMessage = (text) => {
    console.log('Sending message to conversation:', text);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#4F46E5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" aria-hidden="true" />
            Active
          </span>
        );
      case 'Pending Match':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
            Pending Match
          </span>
        );
      case 'Pending Claim':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFEDD5] text-[#9A3412]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" aria-hidden="true" />
            Pending Claim
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1D4ED8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" aria-hidden="true" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" aria-hidden="true" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const renderTypeBadge = (type) => {
    if (type === 'FOUND') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#0D6E6E] text-white">
          FOUND
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#881337] text-white">
        LOST
      </span>
    );
  };

  return (
    <div
      className={`flex flex-col gap-6 w-full ${className}`}
      style={{ fontFamily: INTER_FONT_FAMILY }}
    >
      <style>{INTER_FONT_CSS}</style>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">
            My Reports
          </h1>
          <p className="text-sm text-[#6E6858] mt-1">
            Items you&apos;ve reported as lost or found, and their current status.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <SearchBar
            className="flex-1"
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
            placeholder="Search reports, items, ticket numbers..."
          />

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              title="Filter by status"
              value={selectedStatus}
              options={STATUS_OPTIONS}
              align="right"
              onChange={(v) => {
                setSelectedStatus(v);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Reports Table Container */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-left border-collapse">
            {/* Fixed column widths (percent) so columns don't shift between pages; long item names get … */}
            <colgroup>
              <col style={{ width: '11%' }} />
              <col style={{ width: '31%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 px-6" scope="col">
                  TICKET
                </th>
                <th className="py-3.5 px-6" scope="col">
                  ITEM
                </th>
                <th className="py-3.5 px-6" scope="col">
                  TYPE
                </th>
                <th className="py-3.5 px-6" scope="col">
                  DATE FILED
                </th>
                <th className="py-3.5 px-6" scope="col">
                  STATUS
                </th>
                <th className="py-3.5 px-6" scope="col">
                  CLAIMS
                </th>
                <th className="py-3.5 px-6 text-right" scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm">
              {currentReports.length > 0 ? (
                currentReports.map((report) => (
                  <tr key={report.ticket} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Ticket */}
                    <td className="py-4 px-6 text-[#23261F] font-medium text-xs sm:text-sm whitespace-nowrap">
                      {report.ticket}
                    </td>

                    {/* Item Title & Category */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#23261F] truncate" title={report.title}>{report.title}</div>
                      <div className="text-xs text-[#6E6858] mt-0.5 truncate">{report.category}</div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderTypeBadge(report.type)}
                    </td>

                    {/* Date Filed */}
                    <td className="py-4 px-6 text-[#23261F] whitespace-nowrap">
                      {report.dateFiled}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {renderStatusBadge(report.status)}
                    </td>

                    {/* Claims count */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {report.claims === '—' ? (
                        <span className="text-[#6E6858]">{report.claims}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-xs">
                          {report.claims}
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReport(report)}
                        className="inline-flex items-center justify-center px-3.5 py-1.5 border border-[#E8E4D8] rounded-lg text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        type="button"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 px-6 text-center text-sm text-[#6E6858]">
                    No reports found matching your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={safePage}
          totalPages={totalPages}
          totalItems={totalReportsCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="reports"
        />
      </div>

      {/* ================= MODAL CONNECTIONS ================= */}

      {/* 1. Report Details Modal */}
      <ReportDetailsModal
        isOpen={Boolean(selectedReport) && !selectedVerification}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onViewClaimOrMatch={handleOpenVerification}
      />

      {/* 2. Claim / Match Verification Modal */}
      <ClaimMatchVerificationModal
        isOpen={Boolean(selectedVerification)}
        verification={selectedVerification}
        onClose={() => {
          setSelectedVerification(null);
          setSelectedReport(null);
        }}
        onBack={() => {
          // Returning back to ReportDetailsModal
          setSelectedVerification(null);
        }}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default MyReports;