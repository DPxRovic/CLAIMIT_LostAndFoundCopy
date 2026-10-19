import React, { useEffect } from 'react';
import { CheckCircle2, ArrowRight, MapPin, X } from 'lucide-react';

/**
 * BrowseItemSuccessModal
 * Shown after submitting a claim (FOUND item) or a found report / match (LOST item).
 * Same style as "Claim Withdrawn Successfully" in Claims & Matches:
 * icon badge + close (X), heading and copy, ticket chip, item strip, next steps, divider, action row.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.data - { item, mode: 'claim' | 'found_report', ticketId, inputText }
 * @param {() => void} props.onClose
 * @param {() => void} [props.onNavigateToClaims] - Opens the Claims & Matches tab
 */
export const BrowseItemSuccessModal = ({ isOpen, data, onClose, onNavigateToClaims }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const originalOverflow = document.body.style.overflow;
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const { item, mode, ticketId } = data;
  const isFoundReport = mode === 'found_report';
  const isFoundItem = item?.type === 'FOUND';

  const steps = [
    {
      title: 'Verification in progress',
      text: isFoundReport
        ? 'Campus coordinators and the item owner will review your report.'
        : 'The finder will match your proof description against the physical item.',
    },
    {
      title: 'Campus Handover Station',
      text: 'Upon approval, pick up or hand over your item safely at the verified campus desk.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="browse-success-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] my-auto bg-white rounded-xl shadow-xl border border-[#E8E4D8] p-6 flex flex-col animate-in zoom-in-95 duration-200 font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon badge + close */}
        <div className="flex items-start justify-between w-full mb-4">
          <div className="w-11 h-11 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#047857] shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:bg-[#e5eeff] hover:text-[#0b1c30] transition-colors focus:outline-none cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Heading + copy */}
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 id="browse-success-title" className="text-[20px] font-bold text-[#23261F] tracking-tight">
              {isFoundReport ? 'Found Item Report Submitted!' : 'Claim Submitted Successfully!'}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded text-[#444655] bg-[#e5eeff] tracking-wider font-semibold">
              {ticketId || '#CLM-8492'}
            </span>
          </div>
          <p className="text-sm text-[#6E6858] leading-relaxed">
            {isFoundReport
              ? 'Thank you for reporting this item! The owner has been notified and will review your location details.'
              : 'Your claim has been submitted to the finder for review. You can track this verification in Claims & Matches.'}
          </p>
        </div>

        {/* Item strip */}
        {item && (
          <div className="mb-4 p-2.5 rounded-lg bg-[#eff4ff] border border-[#E8E4D8] flex items-center gap-3">
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E8E4D8]"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#23261F] truncate">{item.title}</p>
              <p className="text-xs text-[#6E6858] flex items-center gap-1 truncate mt-0.5">
                <MapPin className="w-3 h-3 text-[#5170ff] shrink-0" />
                <span className="truncate">{item.location}</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold text-white tracking-wider shrink-0 ${
                isFoundItem ? 'bg-[#0D6E6E]' : 'bg-[#881337]'
              }`}
            >
              {isFoundItem ? 'FOUND' : 'LOST'}
            </span>
          </div>
        )}

        {/* Next steps */}
        <div className="mb-5 flex flex-col gap-2.5">
          <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold">What happens next</span>
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-2.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-[#EFF4FF] text-[#5170ff] flex items-center justify-center shrink-0 font-semibold text-[10px] mt-px">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-[#23261F]">{step.title}</p>
                <p className="text-[#6E6858] leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full mb-5 border-t border-[#E8E4D8]" />

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-semibold text-sm hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
          >
            Done
          </button>
          {onNavigateToClaims && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToClaims();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <span>View in Claims &amp; Matches</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseItemSuccessModal;