import React, { useEffect } from 'react';

/**
 * CloseThisReportModal Component
 * Standalone confirmation modal for closing/retiring a lost or found report.
 * Based closely on the Stitch design with exact colors, spacing, and typography.
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen=true] - Visibility toggle
 * @param {Function} [props.onCancel] - Cancel/close callback
 * @param {Function} [props.onClose] - Alias for onCancel
 * @param {Function} [props.onConfirm] - Confirm close report callback
 * @param {Function} [props.onCloseReport] - Alias for onConfirm
 * @param {Object} [props.report] - Optional report object { title, ticket }
 * @param {string} [props.itemTitle] - Fallback title of item
 * @param {string} [props.ticket] - Fallback ticket code (e.g. R-1070)
 * @param {string} [props.className]
 */
export const CloseThisReportModal = ({
  isOpen = true,
  onCancel,
  onClose,
  onConfirm,
  onCloseReport,
  report,
  itemTitle,
  ticket,
  className = '',
}) => {
  const handleCancel = onCancel || onClose;
  const handleConfirm = onConfirm || onCloseReport;

  const displayTitle = itemTitle || report?.title || 'Grey Folded Umbrella';
  const displayTicket = ticket || report?.ticket || 'R-1070';

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && handleCancel) {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-report-title"
    >
      {/* Outer Wrapper for Modal Card & Footnote */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[480px] flex flex-col items-center animate-in zoom-in-95 duration-200 ${className}`}
      >
        {/* Modal Card Container */}
        <div
          className="w-full bg-white rounded-xl shadow-xl p-6 sm:p-8 flex flex-col relative transition-all"
          style={{ border: '1px solid #E8E4D8' }}
        >
          {/* Top Bar: Alert Badge & Close Icon */}
          <div className="flex items-start justify-between w-full mb-5">
            {/* Icon Badge */}
            <div className="w-11 h-11 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a] shrink-0">
              <span className="material-symbols-outlined text-[24px]">report</span>
            </div>

            {/* Dismiss / Cross Button */}
            <button
              aria-label="Close dialog"
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:bg-[#e5eeff] hover:text-[#0b1c30] transition-colors focus:outline-none cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Heading & Core Copy */}
          <div className="flex flex-col gap-2 mb-6">
            <h2
              id="close-report-title"
              className="text-xl sm:text-[20px] font-bold text-[#0b1c30] tracking-tight"
            >
              Close this report?
            </h2>
            <p className="text-sm sm:text-base text-[#444655] leading-relaxed">
              This removes it from Browse Items. Use this if the item is no longer relevant — for
              example, you found your lost item yourself.
            </p>
          </div>

          {/* Item Context Summary Strip */}
          <div
            className="mb-6 p-3.5 rounded-lg bg-[#eff4ff] flex items-center justify-between gap-3"
            style={{ border: '1px solid #E8E4D8' }}
          >
            <div className="min-w-0">
              <span className="text-sm sm:text-base text-[#23261F] font-semibold block truncate">
                {displayTitle}
              </span>
            </div>
            <div className="flex items-center shrink-0">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E8E4D8]/60 text-[#23261F] tracking-wide"
                style={{ border: '1px solid #E8E4D8' }}
              >
                {displayTicket}
              </span>
            </div>
          </div>

          {/* Actions Divider */}
          <div
            className="w-full mb-6"
            style={{ borderTop: '1px solid #E8E4D8' }}
          />

          {/* Actions Row */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
            {/* Secondary / Cancel Action */}
            <button
              onClick={handleCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-semibold text-sm hover:bg-[#e5eeff] transition-colors focus:outline-none text-center cursor-pointer"
              type="button"
            >
              Cancel
            </button>

            {/* Destructive / Confirm Action */}
            <button
              onClick={() => handleConfirm?.(report || { title: displayTitle, ticket: displayTicket })}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ba1a1a] text-white font-semibold text-sm shadow-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 focus:outline-none text-center cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              <span>Close report</span>
            </button>
          </div>
        </div>

        {/* Security & Audit Microcopy Footnote */}
        <div className="mt-4 flex items-center gap-1.5 text-[#444655] opacity-75">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span className="text-xs tracking-wide">
            Campus Safety Audit Logged • Action is permanent
          </span>
        </div>
      </div>
    </div>
  );
};

export default CloseThisReportModal;