import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * ClaimOrMatchCard Component
 * Compact, clickable row for one claim or match (used in a list inside ReportDetailsModal).
 * Built to stay readable with many entries:
 * - Avatar + name + status badge on the first line
 * - Role · date · message preview on one truncated second line
 * - Whole row opens the conversation (chevron hint on the right)
 *
 * @param {Object} props
 * @param {Object} props.entry - The match or claim record
 * @param {string} [props.entry.name] - Name of person reporting/claiming
 * @param {string} [props.entry.submitterName] - Alternate name field
 * @param {string} [props.entry.avatarUrl] - Optional avatar image URL
 * @param {string} [props.entry.role] - e.g. "Reported Found" or "Claimant"
 * @param {string} [props.entry.date] - Date string, e.g. "Sep 16, 2026"
 * @param {string} [props.entry.submittedDate] - Alternate date field
 * @param {string} [props.entry.status] - Status, e.g. "Pending", "Approved"
 * @param {string} [props.entry.message] - Quote message
 * @param {string} [props.entry.messagePreview] - Alternate quote message field
 * @param {Function} [props.onView] - Callback when the row is clicked
 * @param {string} [props.className]
 */
export const ClaimOrMatchCard = ({ entry, onView, className = '' }) => {
  if (!entry) return null;

  const displayName = entry.name || entry.submitterName || 'Anonymous';
  const displayDate = entry.date || entry.submittedDate || '';
  const displayMessage = entry.message || entry.messagePreview || '';
  const displayStatus = entry.status || 'Pending';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Same badge colors as the tables
  const statusStyles = {
    Approved: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
    Declined: { badge: 'bg-[#FFE4E6] text-[#9F1239]', dot: 'bg-[#E11D48]' },
    Withdrawn: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
    Pending: { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  };
  const s = statusStyles[displayStatus] || statusStyles.Pending;

  const meta = [entry.role, displayDate].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      onClick={() => onView?.(entry)}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 text-left bg-white hover:bg-[#F9FAFB] transition-colors cursor-pointer focus:outline-none focus-visible:bg-[#F9FAFB] ${className}`}
      aria-label={`View ${displayName}'s ${entry.type === 'match' ? 'match' : 'claim'}`}
    >
      {entry.avatarUrl ? (
        <img
          src={entry.avatarUrl}
          alt=""
          className="w-9 h-9 rounded-full object-cover shrink-0 border border-[#E8E4D8]"
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full bg-[#EFF4FF] text-[#5170ff] font-semibold text-xs flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          {initials || '?'}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-[#23261F] truncate">{displayName}</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${s.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
            {displayStatus}
          </span>
        </div>
        <p className="text-xs text-[#6E6858] truncate mt-0.5">
          {meta}
          {meta && displayMessage ? ' · ' : ''}
          {displayMessage && <span className="italic">&ldquo;{displayMessage}&rdquo;</span>}
        </p>
      </div>

      <ChevronRight
        className="w-4 h-4 text-[#6E6858] shrink-0 group-hover:text-[#23261F] transition-colors"
        aria-hidden="true"
      />
    </button>
  );
};

export default ClaimOrMatchCard;