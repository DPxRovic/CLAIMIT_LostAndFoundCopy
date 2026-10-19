import React, { useEffect } from 'react';

/**
 * ReportSubmittedConfirmation
 * Shown after "Report an Item". Same look as the other success popups
 * (green check, report strip with status badge, Close / View Reports).
 */

// Same badge colors as My Reports
const STATUS_STYLES = {
  Active: { badge: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
  'Active Listing': { badge: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
  'Pending Match': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  'Pending Claim': { badge: 'bg-[#FFEDD5] text-[#9A3412]', dot: 'bg-[#EA580C]' },
  Resolved: { badge: 'bg-[#EFF6FF] text-[#1D4ED8]', dot: 'bg-[#1D4ED8]' },
  Closed: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

export default function ReportSubmittedConfirmation({
  isOpen = false,
  onClose,
  onViewReports,
  reportId = 'R-1102',
  reportType = 'lost',
  title = 'Report Submitted',
  subtitle,
  statusLabel = 'Active Listing',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFound = reportType?.toLowerCase() === 'found';
  const defaultSubtitle = isFound
    ? 'Your found item is now on the board.'
    : 'Your lost item is now on the board.';

  const displaySubtitle = subtitle || defaultSubtitle;
  const s = STATUS_STYLES[statusLabel] || STATUS_STYLES.Active;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-submitted-confirmation-title"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative flex w-full max-w-[400px] flex-col overflow-hidden rounded-xl border border-[#E8E4D8] bg-white font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F] shadow-xl animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close confirmation"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#444655] transition-colors hover:bg-[#e5eeff] hover:text-[#0b1c30] cursor-pointer"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Confirmation Content */}
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5]">
            <svg
              className="h-6 w-6 text-[#047857]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2
            id="report-submitted-confirmation-title"
            className="text-[20px] font-bold tracking-tight text-[#23261F]"
          >
            {title}
          </h2>

          <p className="mt-1.5 text-sm leading-relaxed text-[#6E6858]">
            {displaySubtitle}
          </p>

          {/* Report ID and Status */}
          <div className="mt-5 flex w-full items-center justify-between gap-3 rounded-lg border border-[#E8E4D8] bg-[#eff4ff] p-3 text-left">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]">
                REPORT ID
              </span>

              <span className="mt-0.5 text-base font-bold tracking-tight text-[#23261F]">
                {reportId}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold text-white tracking-wider ${
                  isFound ? 'bg-[#0D6E6E]' : 'bg-[#881337]'
                }`}
              >
                {isFound ? 'FOUND' : 'LOST'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#E8E4D8] bg-white px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E8E4D8] bg-white px-5 py-1.5 text-sm font-medium text-[#23261F] transition-colors hover:bg-[#e5eeff] cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onViewReports || onClose}
            className="rounded-lg bg-[#5170ff] px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#4767f6] cursor-pointer"
          >
            View Reports
          </button>
        </div>
      </div>
    </div>
  );
}

export { ReportSubmittedConfirmation };