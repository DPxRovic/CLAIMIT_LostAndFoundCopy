import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Lightbulb,
  Check,
  ChevronDown,
} from 'lucide-react';

const INTER_FONT_FAMILY =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

// ---------------------------------------------------------------------------
// Reason options
// ---------------------------------------------------------------------------
const REASON_OPTIONS = [
  { value: '', label: 'Select a reason...' },
  { value: 'Found the item on my own', label: 'I found the item on my own' },
  { value: 'Filed duplicate claim', label: 'Filed duplicate claim by mistake' },
  { value: 'Description did not match', label: "Item description didn't match mine" },
  { value: 'Other', label: 'Other' },
];

const STATUS_STYLES = {
  Approved: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
  Pending: { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  Declined: { badge: 'bg-[#FFE4E6] text-[#9F1239]', dot: 'bg-[#E11D48]' },
  Withdrawn: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.Withdrawn;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Popover-style dropdown (same look as the filters in ClaimsAndMatches)
// ---------------------------------------------------------------------------
const ReasonDropdown = ({ title, value, options, onChange, resetValue = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) || options[0],
    [options, value]
  );
  const isDefault = value === resetValue;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };

    // Capture phase + stopPropagation so Escape closes only the dropdown,
    // not the whole modal (the modal listens for Escape on window).
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [isOpen]);

  return (
    <div className="relative block w-full" ref={wrapperRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={title}
        className={`w-full inline-flex items-center justify-between gap-2.5 h-10 px-3.5 bg-white border rounded-xl text-sm transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CF0]/30 ${
          isOpen ? 'border-[#5B6CF0]' : 'border-[#E8E4D8] hover:bg-gray-50'
        } ${isDefault ? 'text-[#9A957F]' : 'text-[#23261F]'}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#6E6858] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Menu */}
      {isOpen && (
        <div className="absolute left-0 z-30 mt-2 w-full bg-white border border-[#E8E4D8] rounded-2xl shadow-xl">
          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]">
            {title}
          </div>

          <div role="listbox" aria-label={title} className="px-2 py-1 flex flex-col gap-0.5">
            {options.map((item) => {
              const isActive = item.value === value;
              return (
                <button
                  key={item.value || 'none'}
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
              onClick={() => onChange(resetValue)}
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

/**
 * WithdrawClaimMatchModal Component (Claims & Matches → Withdraw)
 * Wording follows the type: claim (on a FOUND post) or match (on a LOST post).
 *
 * Same style as "Close this report?" in My Reports:
 * icon badge + close (X), heading and copy, item strip, divider, action row.
 * - Step 1: "Withdraw Your Claim?"  (Cancel goes back to Claim Details when onBack is given)
 * - Step 2: "Claim Withdrawn Successfully"
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen]
 * @param {any} props.claim
 * @param {() => void} [props.onClose]
 * @param {() => void} [props.onBack] - Optional: "Never mind, keep claim" returns to Claim Details
 * @param {((claimId: string, reason: string) => void)} [props.onWithdraw]
 * @param {((claimId: string, reason: string) => void)} [props.onConfirm]
 */
export const WithdrawClaimMatchModal = ({
  isOpen = true,
  claim,
  onClose = () => {},
  onBack = undefined,
  onWithdraw = undefined,
  onConfirm = undefined,
}) => {
  const modalCardRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [reason, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Focus and Escape key handling
  useEffect(() => {
    if (!isOpen || !claim) {
      setIsSuccess(false);
      setReason('');
      return;
    }

    previousFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      if (modalCardRef.current) {
        modalCardRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, claim, onClose]);

  if (!isOpen || !claim) return null;

  // On a FOUND post you submit a claim; on a LOST post you submit a match (found report)
  const isMatch = !(claim.type || '').toUpperCase().includes('FOUND');
  const noun = isMatch ? 'match' : 'claim';
  const Noun = isMatch ? 'Match' : 'Claim';
  const poster = claim.posterName || 'Marco Villanueva';
  const location = claim.location || 'Social Hall';

  const handleConfirm = () => {
    (onWithdraw || onConfirm)?.(claim.id, reason || 'Found the item on my own');
    setIsSuccess(true);
  };

  const handleKeep = onBack || onClose;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Item strip (same as the one in "Close this report?")
  const ItemStrip = ({ status }) => (
    <div className="p-3 rounded-lg bg-[#eff4ff] border border-[#E8E4D8] flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#23261F] truncate">{claim.title}</p>
        <p className="text-xs text-[#6E6858] mt-0.5 truncate">
          Posted by {poster} • {location}
        </p>
      </div>
      <StatusBadge status={status} />
    </div>
  );

  const closeBtn = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close dialog"
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:bg-[#e5eeff] hover:text-[#0b1c30] transition-colors focus:outline-none cursor-pointer shrink-0"
    >
      <X className="w-5 h-5" />
    </button>
  );

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-dialog-title"
    >
      {/* No overflow-hidden here, so the dropdown menu isn't clipped */}
      <div
        ref={modalCardRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] bg-white rounded-xl shadow-xl border border-[#E8E4D8] p-6 flex flex-col animate-in zoom-in-95 duration-200 focus:outline-none text-[#23261F]"
        style={{ fontFamily: INTER_FONT_FAMILY }}
      >
        {isSuccess ? (
          /* Step 2: "Claim Withdrawn Successfully" */
          <>
            <div className="flex items-start justify-between w-full mb-4">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#047857] shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              {closeBtn}
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <h2 id="withdraw-dialog-title" className="text-[20px] font-bold text-[#23261F] tracking-tight">
                {Noun} Withdrawn Successfully
              </h2>
              <p className="text-sm text-[#6E6858] leading-relaxed">
                Your {noun} for this item has been canceled. The poster has been notified and the item has returned to open status.
              </p>
            </div>

            <div className="mb-3">
              <ItemStrip status="Withdrawn" />
            </div>

            {/* Tip */}
            <div className="mb-5 rounded-lg px-3 py-2.5 bg-[#FEF3C7]/50 flex items-start gap-2.5 text-xs text-[#23261F] leading-relaxed">
              <Lightbulb className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Made a mistake?</strong> {isMatch
                  ? 'If you still believe you found this item, you can submit a new match with updated details from the Browse Items page at any time.'
                  : 'If you still believe this item belongs to you, you can submit a new claim with updated proof from the Browse Items page at any time.'}
              </div>
            </div>

            <div className="w-full mb-5 border-t border-[#E8E4D8]" />

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-semibold text-sm hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
              >
                Browse Other Items
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Back to Claims &amp; Matches</span>
              </button>
            </div>
          </>
        ) : (
          /* Step 1: "Withdraw Your Claim?" */
          <>
            <div className="flex items-start justify-between w-full mb-4">
              <div className="w-11 h-11 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a] shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              {closeBtn}
            </div>

            <div className="flex flex-col gap-1.5 mb-4">
              <h2 id="withdraw-dialog-title" className="text-[20px] font-bold text-[#23261F] tracking-tight">
                Withdraw Your {Noun}?
              </h2>
              <p className="text-sm text-[#6E6858] leading-relaxed">
                This action will cancel your pending {noun} request. Are you sure you want to withdraw this {noun}? You can re-submit a {noun} later if this was a mistake.
              </p>
            </div>

            <div className="mb-4">
              <ItemStrip status={claim.status || 'Pending'} />
            </div>

            {/* Reason Dropdown */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">
                Reason for withdrawal (optional)
              </label>
              <ReasonDropdown
                title="Reason for withdrawal"
                value={reason}
                options={REASON_OPTIONS}
                onChange={setReason}
              />
            </div>

            <div className="w-full mb-5 border-t border-[#E8E4D8]" />

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={handleKeep}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-semibold text-sm hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
              >
                Never mind, keep {noun}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ba1a1a] text-white font-semibold text-sm shadow-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Withdrawal</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WithdrawClaimMatchModal;