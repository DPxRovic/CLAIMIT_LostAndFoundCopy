import React, { useEffect } from 'react';
import {
  X,
  Tag,
  MapPin,
  Calendar,
  Shield,
  FileText,
  AlertTriangle,
  Trash2,
  Check,
  Clock,
  Shirt,
  Umbrella,
  Headphones,
  Laptop,
  Smartphone,
  Watch,
  Glasses,
  Key,
  Package,
} from 'lucide-react';

// Return an icon based on the item's category or title.
const getItemIcon = (category = '', title = '') => {
  const text = `${category} ${title}`.toLowerCase();

  if (
    text.includes('hoodie') ||
    text.includes('shirt') ||
    text.includes('jacket') ||
    text.includes('cloth')
  ) return Shirt;

  if (text.includes('umbrella')) return Umbrella;

  if (
    text.includes('earbud') ||
    text.includes('airpod') ||
    text.includes('headphone') ||
    text.includes('audio')
  ) return Headphones;

  if (
    text.includes('laptop') ||
    text.includes('macbook') ||
    text.includes('dell')
  ) return Laptop;

  if (
    text.includes('phone') ||
    text.includes('iphone') ||
    text.includes('ipad') ||
    text.includes('tablet')
  ) return Smartphone;

  if (text.includes('watch')) return Watch;
  if (text.includes('glass')) return Glasses;
  if (text.includes('key')) return Key;

  return Package;
};

// Get reporter initials while skipping titles such as Dr. and Prof.
const getReporterInitials = (name = '') => {
  if (!name) return '??';

  const clean = name
    .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
    .trim();

  const parts = clean.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
};

// Convert a date or timestamp into a readable date.
// Date-only strings are parsed locally to avoid a timezone date shift.
const formatReportedDate = (value) => {
  if (!value) return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';

    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (typeof value === 'string') {
    const dateOnlyMatch = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    // Keep an already formatted date string if it cannot be parsed.
    return typeof value === 'string' ? value : '';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Display the exact report time when the source includes a time.
const formatExactTime = (value) => {
  if (!value) return '';

  // A date without a time (e.g. "2026-09-15" or "Sep 15, 2026") has no exact report time.
  if (typeof value === 'string' && !/\d{1,2}:\d{2}/.test(value)) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Get claim information for the Claims card.
const getClaimsDetails = (claimsRaw = '', isResolved = false) => {
  const claims = String(claimsRaw || '').toLowerCase();

  if (
    claims.includes('verified') ||
    isResolved ||
    claims.includes('closed') ||
    claims.includes('handover')
  ) {
    return {
      value: '1 Verified Claim',
      subLine: 'Handover Complete',
      badgeLabel: 'Claim Closed',
      badgeBg: 'bg-[#ECFDF5]',
      badgeText: 'text-[#047857]',
    };
  }

  if (claims.includes('2') || claims.includes('pendings')) {
    const match = claims.match(/\d+/);
    const count = match ? match[0] : '2';

    return {
      value: `${count} pendings`,
      subLine: 'Awaiting claimant review',
      badgeLabel: 'Needs Review',
      badgeBg: 'bg-[#FEF3C7]',
      badgeText: 'text-[#92400E]',
    };
  }

  if (claims.includes('1') || claims.includes('pending')) {
    return {
      value: '1 pending claim',
      subLine: 'Awaiting staff confirmation',
      badgeLabel: '1 Pending',
      badgeBg: 'bg-[#FEF3C7]',
      badgeText: 'text-[#92400E]',
    };
  }

  return {
    value: 'None yet',
    subLine: '0 open student claims',
    badgeLabel: 'Available to Claim',
    badgeBg: 'bg-[#ECFDF5]',
    badgeText: 'text-[#047857]',
  };
};

const STATUS_STYLES = {
  Active: {
    badge: 'bg-[#EEF2FF] text-[#4F46E5]',
    dot: 'bg-[#4F46E5]',
  },
  'Pending Match': {
    badge: 'bg-[#FEF3C7] text-[#92400E]',
    dot: 'bg-[#D97706]',
  },
  'Pending Claim': {
    badge: 'bg-[#FFEDD5] text-[#9A3412]',
    dot: 'bg-[#EA580C]',
  },
  Resolved: {
    badge: 'bg-[#EFF6FF] text-[#1D4ED8]',
    dot: 'bg-[#1D4ED8]',
  },
  Closed: {
    badge: 'bg-[#F3F4F6] text-[#4B5563]',
    dot: 'bg-[#6B7280]',
  },
};

const tileClass =
  'p-3 bg-[#F9FAFB] rounded-lg border border-[#E8E4D8] flex flex-col justify-between';

const tileLabelClass =
  'text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]';

export default function ItemDetailsModal({
  item,
  onClose,
  onDeleteListing,
}) {
  // Close the modal with Escape.
  useEffect(() => {
    if (!item) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const isFound = (item.type || '').toLowerCase() === 'found';

  const status =
    item.status ||
    item.statusBadge?.label ||
    'Active';

  const normalizedStatus = String(status).toLowerCase();

  const isResolved =
    normalizedStatus.includes('resolved') ||
    normalizedStatus.includes('closed') ||
    String(item.statusBadge?.label || '')
      .toLowerCase()
      .includes('resolved');

  // Match status labels without depending on capitalization.
  const matchedStatus = Object.keys(STATUS_STYLES).find(
    (key) => key.toLowerCase() === normalizedStatus
  );

  const statusStyle =
    STATUS_STYLES[matchedStatus || 'Active'];

  // Support reportedBy as either a string or an object.
  const reporter =
    typeof item.reportedBy === 'string'
      ? { name: item.reportedBy }
      : item.reportedBy || {};

  const reporterName =
    reporter.name ||
    item.reportedByName ||
    item.reporterName ||
    'Unknown reporter';

  const reporterDetail =
    reporter.roleDetail ||
    reporter.email ||
    item.role ||
    '';

  const initials =
    reporter.initials ||
    getReporterInitials(reporterName);

  const IconComponent = getItemIcon(
    item.category,
    item.itemTitle
  );

  const claimsInfo = getClaimsDetails(
    item.claims,
    isResolved
  );

  // Use the actual timestamp first, when available.
  const reportDateSource =
    item.reportedAt ||
    item.createdAt ||
    item.dateReported ||
    item.dateReportedFull ||
    item.date;

  const reportedDate = formatReportedDate(reportDateSource);
  const reportedTime = formatExactTime(reportDateSource);

  const handleDelete = () => {
    if (onDeleteListing) {
      onDeleteListing(item);
    }

    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-details-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[500px] max-h-[92vh] flex flex-col bg-white rounded-xl shadow-xl border border-[#E8E4D8] overflow-hidden text-[#23261F] animate-in zoom-in-95 duration-200 font-['Inter',ui-sans-serif,system-ui,sans-serif]"
      >
        {/* Header: type, status, ticket ID, and close button */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-[#E8E4D8] shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold text-white tracking-wider ${
                isFound ? 'bg-[#0D6E6E]' : 'bg-[#881337]'
              }`}
            >
              {isFound ? 'FOUND' : 'LOST'}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.badge}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                aria-hidden="true"
              />
              {status}
            </span>

            {item.ticketId && (
              <span className="text-[11px] px-2 py-0.5 rounded text-[#444655] bg-[#E5EEFF] tracking-wider font-semibold">
                {item.ticketId}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close popup"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0B1C30] hover:bg-[#E5EEFF] transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable modal body */}
        <div className="px-5 pt-4 pb-4 flex flex-col gap-3 flex-auto min-h-0 overflow-y-auto">
          {/* Item title and category. The date is kept in its card below. */}
          <div className="flex items-start gap-3 shrink-0">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-[#EFF4FF] text-[#5170FF]">
              <IconComponent className="w-5 h-5 stroke-[1.75]" />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="item-details-title"
                className="text-[18px] font-bold text-[#23261F] leading-tight tracking-tight"
              >
                {item.itemTitle || 'Untitled item'}
              </h2>

              <div className="flex items-center gap-1.5 text-xs text-[#6E6858] mt-1 flex-wrap">
                <Tag className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium text-[#23261F]">
                  {item.category || 'Uncategorized'}
                </span>
              </div>
            </div>
          </div>

          {/* Information cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs shrink-0">
            {/* Location */}
            <div className={tileClass}>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#5170FF] shrink-0" />
                  <span className={tileLabelClass}>
                    {isFound ? 'LOCATION FOUND' : 'LOCATION LOST'}
                  </span>
                </div>

                <p className="font-semibold text-[#23261F] text-[13px] leading-snug">
                  {item.locationFound ||
                    item.location ||
                    'Not specified'}
                </p>
              </div>

              <p className="text-[11px] text-[#6E6858] mt-1">
                {item.locationSub ||
                  item.locationDetail ||
                  'Reported on campus premises'}
              </p>
            </div>

            {/* Date reported: date first, exact time underneath */}
            <div className={tileClass}>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#5170FF] shrink-0" />
                  <span className={tileLabelClass}>
                    DATE REPORTED
                  </span>
                </div>

                <p className="font-semibold text-[#23261F] text-[13px] leading-snug">
                  {reportedDate || 'Date unavailable'}
                </p>
              </div>

              <p
                className={`text-[11px] mt-1 ${
                  isResolved && item.resolvedDateSub
                    ? 'text-[#047857] font-medium'
                    : 'text-[#6E6858]'
                }`}
              >
                {reportedTime ||
                  item.dateReportedSub ||
                  item.reportedDateSubtitle ||
                  ''}
              </p>
            </div>

            {/* Reporter */}
            <div className={tileClass}>
              <span className={`${tileLabelClass} mb-1.5`}>
                REPORTED BY
              </span>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#EFF4FF] text-[#5170FF] font-semibold text-[11px] flex items-center justify-center shrink-0">
                  {initials}
                </div>

                <div className="min-w-0">
                  <span className="font-semibold text-[#23261F] text-[13px] leading-tight block truncate">
                    {reporterName}
                  </span>

                  {reporterDetail && (
                    <span className="text-[11px] text-[#6E6858] block mt-0.5 truncate">
                      {reporterDetail}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Claims */}
            <div className={tileClass}>
              <div className="flex items-center gap-1.5 mb-1">
                <Shield className="w-3.5 h-3.5 text-[#5170FF] shrink-0" />
                <span className={tileLabelClass}>CLAIMS</span>
              </div>

              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="font-semibold text-[#23261F] text-[13px] leading-snug">
                    {claimsInfo.value}
                  </p>

                  <p className="text-[11px] text-[#6E6858] mt-0.5">
                    {claimsInfo.subLine}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${claimsInfo.badgeBg} ${claimsInfo.badgeText}`}
                >
                  {claimsInfo.badgeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Item description */}
          <div className="space-y-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#6E6858]" />
              <span className={tileLabelClass}>
                ITEM DESCRIPTION &amp; PHYSICAL CONDITION
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-[#E8E4D8]">
              <div
                className="pl-3 border-l-2 border-[#E8E4D8]"
              >
                <p className="text-sm text-[#23261F] leading-relaxed italic">
                  {item.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Admin moderation */}
          <div className="p-3 rounded-lg bg-[#FEF2F2]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />

              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#DC2626]">
                  ADMIN MODERATION &amp; LISTING CONTROLS
                </h4>

                <p className="text-xs text-[#6E6858] mt-0.5 leading-snug">
                  Remove invalid reports, duplicates, or returned
                  property from the active campus registry.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-medium transition-colors shrink-0 cursor-pointer self-end sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Listing</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-[#E8E4D8] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-white hover:bg-[#E5EEFF] border border-[#E8E4D8] text-[#23261F] text-sm font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}