import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Paperclip,
  Clock,
  Package,
  MapPin,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Undo2,
} from 'lucide-react';

/**
 * ClaimMatchDetailsModal Component (Claims & Matches → View)
 * Title and wording follow the type: claim (on a FOUND post) or match (on a LOST post).
 *
 * Same look as Report Details in My Reports:
 * - Header: "Claim Details" + claim ID chip, close (X)
 * - Body: type + status badges, title, photo (click → full-size viewer),
 *   Location / Found / Category / Posted by grid, description,
 *   status notice, your submitted proof
 * - Your submitted proof: the attached photo is clickable (opens the same full-size viewer)
 * - Footer: "Withdraw claim" (neutral link, Pending only) · Message (Pending) / View conversation (other statuses) · Close
 *
 * Statuses: Pending, Approved, Declined, Withdrawn
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen]
 * @param {any} props.claim
 * @param {() => void} [props.onClose]
 * @param {((type: string, claim: any) => void)} [props.onSwitchModal]
 * @param {((claim: any) => void)} [props.onOpenMessage]
 * @param {((claim: any) => void)} [props.onWithdraw]
 */

const STATUS_STYLES = {
  Approved: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
  Pending: { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  Declined: { badge: 'bg-[#FFE4E6] text-[#9F1239]', dot: 'bg-[#E11D48]' },
  Withdrawn: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

const labelClass = 'text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block';

export const ClaimMatchDetailsModal = ({
  isOpen = true,
  claim,
  onClose = () => {},
  onSwitchModal = undefined,
  onOpenMessage = undefined,
  onWithdraw = undefined,
}) => {
  const modalCardRef = useRef(null);
  const previousFocusRef = useRef(null);
  // Which photo is open in the full-size viewer (item photo or proof photo), or null
  const [zoomedSrc, setZoomedSrc] = useState(null);
  const isImageZoomed = Boolean(zoomedSrc);

  // Reset the photo viewer when switching claims / closing
  useEffect(() => {
    setZoomedSrc(null);
  }, [isOpen, claim?.id]);

  // Focus and Escape key handling (Esc closes the full-size photo first)
  useEffect(() => {
    if (!isOpen || !claim) return;

    previousFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      if (modalCardRef.current) {
        modalCardRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isImageZoomed) {
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
  }, [isOpen, claim, onClose, isImageZoomed]);

  if (!isOpen || !claim) return null;

  const status = claim.status || 'Pending';
  const s = STATUS_STYLES[status] || STATUS_STYLES.Withdrawn;
  const posterName = claim.posterName || claim.contactPerson || 'Marco Villanueva (BS Computer Science)';
  const location = claim.location || claim.handoverLocation || 'Guard House';
  const foundDate = claim.foundDate || 'September 15, 2026';
  const claimedDate = claim.claimedDate || 'Claimed 4 days ago';
  const contactFirstName = (claim.contactPerson || claim.posterName || 'Finder').split(' ')[0];
  const isFound = (claim.type || 'FOUND').toUpperCase().includes('FOUND');
  // On a FOUND post you submit a claim; on a LOST post you submit a match (found report)
  const isMatch = !(claim.type || '').toUpperCase().includes('FOUND');
  const noun = isMatch ? 'match' : 'claim';
  const Noun = isMatch ? 'Match' : 'Claim';
  // Photo attached to your proof (attachmentUrl / proofImageUrl)
  const proofImageUrl = claim.attachmentUrl || claim.proofImageUrl;

  const handleMessageAction = () => {
    if (onSwitchModal) {
      onSwitchModal('message', claim);
    } else if (onOpenMessage) {
      onOpenMessage(claim);
    }
  };

  const handleWithdrawAction = () => {
    if (onSwitchModal) {
      onSwitchModal('withdraw', claim);
    } else if (onWithdraw) {
      onWithdraw(claim);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-details-dialog-title"
    >
      <div
        ref={modalCardRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] border border-[#E8E4D8] animate-in zoom-in-95 duration-200 focus:outline-none font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#E8E4D8] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 id="claim-details-dialog-title" className="text-[18px] font-bold text-[#23261F] tracking-tight truncate">
              {Noun} Details
            </h2>
            {claim.id && (
              <span className="text-[11px] px-2 py-0.5 rounded text-[#444655] bg-[#e5eeff] tracking-wider font-semibold shrink-0">
                {claim.id}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (scrolls if needed; bottom spacer keeps bottom padding equal to the top) */}
        <div className="px-4 pt-4 flex flex-col gap-3 flex-auto min-h-0 overflow-y-auto">
          {/* Badges, title and claimed date */}
          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold text-white tracking-wider ${
                  isFound ? 'bg-[#0D6E6E]' : 'bg-[#881337]'
                }`}
              >
                {isFound ? 'FOUND' : 'LOST'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                {status}
              </span>
            </div>
            <h3 className="text-[18px] text-[#23261F] font-bold leading-tight tracking-tight">{claim.title}</h3>
            <p className="text-xs text-[#6E6858] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {claimedDate}
            </p>
          </div>

          {/* Photo (click to view full size) */}
          {claim.imageUrl ? (
            <button
              type="button"
              onClick={() => setZoomedSrc(claim.imageUrl)}
              aria-label="View photo full size"
              className="group w-full h-28 rounded-xl overflow-hidden relative bg-[#e5eeff] border border-[#E8E4D8] shrink-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5170ff]/40"
            >
              <img
                alt={claim.title}
                src={claim.imageUrl}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
              />
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-medium opacity-90 group-hover:opacity-100">
                <Maximize2 className="w-3.5 h-3.5" />
                View full size
              </span>
            </button>
          ) : (
            <div className="w-full h-16 rounded-xl border border-dashed border-[#E8E4D8] bg-[#F9FAFB] flex items-center justify-center gap-2 text-[#6E6858] shrink-0">
              <Package className="w-5 h-5" />
              <span className="text-xs font-medium">Original Item Reference</span>
            </div>
          )}

          {/* Location / Found / Category / Posted by */}
          <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#E8E4D8] shrink-0">
            <div className="space-y-0.5 min-w-0">
              <span className={labelClass}>Location</span>
              <p className="text-sm font-medium text-[#23261F] flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#5170ff] shrink-0 mt-[3px]" />
                <span>{location}</span>
              </p>
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className={labelClass}>Found</span>
              <p className="text-sm font-medium text-[#23261F]">{foundDate}</p>
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className={labelClass}>Category</span>
              <p className="text-sm font-medium text-[#23261F]">{claim.category || '—'}</p>
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className={labelClass}>Posted by</span>
              <p className="text-sm font-medium text-[#23261F]">{posterName}</p>
            </div>
          </div>

          {/* Description */}
          {claim.description && (
            <div className="space-y-1 shrink-0">
              <span className={labelClass}>Description</span>
              <div className="p-2 rounded-lg bg-white border border-[#E8E4D8]">
                <p className="text-sm leading-relaxed text-[#23261F]">{claim.description}</p>
              </div>
            </div>
          )}

          {/* Status notice */}
          {status === 'Pending' ? (
            <div className="rounded-lg px-3 py-2 bg-[#FEF3C7]/60 flex items-center gap-2 text-xs text-[#92400E] shrink-0">
              <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>
                {isMatch ? 'You reported finding this item.' : 'You claimed this item.'} Waiting for {contactFirstName} to review your proof.
              </span>
            </div>
          ) : status === 'Declined' ? (
            <div className="rounded-lg px-3 py-2.5 bg-[#FFE4E6]/50 text-xs space-y-1 shrink-0">
              <div className="flex items-center gap-2 text-[#9F1239] font-semibold">
                <XCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                <span>{Noun} Declined by {isMatch ? 'Owner' : 'Finder'}</span>
              </div>
              <p className="text-[#9F1239] leading-relaxed pl-6">
                {claim.declinedReason ||
                  `${posterName} reviewed your submitted proof and marked it as non-matching with the found item.`}
              </p>
              <p className="text-[#9F1239]/80 leading-relaxed pl-6">
                If this was a misunderstanding, you may contact the finder or submit an appeal with additional photos or identifiers.
              </p>
            </div>
          ) : status === 'Approved' ? (
            <div className="rounded-lg px-3 py-2 bg-[#ECFDF5] flex items-center gap-2 text-xs text-[#047857] shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>{Noun} verified &amp; approved. For campus safety, meet in public campus zones.</span>
            </div>
          ) : null}

          {/* Your submitted proof */}
          <div className="space-y-1 shrink-0">
            <span className={labelClass}>Your submitted proof</span>
            <div className="p-2.5 rounded-lg bg-white border border-[#E8E4D8] space-y-2">
              <div className="pl-3 border-l-2 border-[#E8E4D8]">
                <p className="text-sm text-[#23261F] leading-relaxed italic">
                  &ldquo;{claim.userProof || claim.description || 'Submitted proof details on file.'}&rdquo;
                </p>
              </div>
              {proofImageUrl ? (
                /* File name chip: click to open the attached photo full size */
                <button
                  type="button"
                  onClick={() => setZoomedSrc(proofImageUrl)}
                  aria-label={`Open ${claim.attachmentName || 'attached photo'}`}
                  title="View full size"
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F3F4F6] hover:bg-[#EFF4FF] text-xs text-[#23261F] transition-colors cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5170ff]/40"
                >
                  <Paperclip className="w-3.5 h-3.5 text-[#6E6858] group-hover:text-[#5170ff]" />
                  <span className="font-medium group-hover:text-[#5170ff] group-hover:underline">
                    {claim.attachmentName || 'Attached photo'}
                  </span>
                  <span className="text-[#6E6858]">({claim.attachmentSize || '840 KB'})</span>
                </button>
              ) : (
                claim.attachmentName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F3F4F6] text-xs text-[#23261F]">
                    <Paperclip className="w-3.5 h-3.5 text-[#6E6858]" />
                    <span className="font-medium">{claim.attachmentName}</span>
                    <span className="text-[#6E6858]">({claim.attachmentSize || '840 KB'})</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Bottom spacer: 4px + the 12px gap = 16px, same as the top padding */}
          <div className="h-1 shrink-0" aria-hidden="true" />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-[#E8E4D8] flex items-center justify-between gap-3 shrink-0">
          {status === 'Pending' ? (
            <button
              type="button"
              onClick={handleWithdrawAction}
              className="text-sm font-medium text-[#6E6858] hover:text-[#23261F] hover:underline cursor-pointer transition-colors focus:outline-none flex items-center gap-1"
            >
              <Undo2 className="w-4 h-4" />
              <span>Withdraw {noun}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {/* Same flow as My Reports: you chat with the poster while the claim is Pending
                (they approve/decline based on the chat). After that the thread is read-only. */}
            {status === 'Pending' ? (
              <button
                type="button"
                onClick={handleMessageAction}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message {contactFirstName}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMessageAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#e5eeff] border border-[#E8E4D8] text-[#23261F] text-xs font-medium transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#6E6858]" />
                <span>View conversation</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-lg bg-white hover:bg-[#e5eeff] border border-[#E8E4D8] text-[#23261F] text-xs font-medium transition-colors focus:outline-none cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Full-size photo viewer (same as My Reports) */}
      {zoomedSrc && <PhotoViewer src={zoomedSrc} alt={claim.title} onClose={() => setZoomedSrc(null)} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Full-size photo viewer (Facebook-style, same as My Reports)          */
/* Faded dark backdrop · Close top-left · Zoom in/out top-right         */
/* Photo enlarges when zoomed · drag only within the photo's edges     */
/* ------------------------------------------------------------------ */
const VIEWER_MIN = 1;
const VIEWER_MAX = 4;
const VIEWER_STEP = 0.5;
const viewerBtn =
  'w-10 h-10 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/15';

function PhotoViewer({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const imgRef = useRef(null);

  const clampOffset = (x, y, sc) => {
    const w = (imgRef.current?.offsetWidth || 0) * sc;
    const h = (imgRef.current?.offsetHeight || 0) * sc;
    const maxX = Math.max(0, (w - window.innerWidth) / 2);
    const maxY = Math.max(0, (h - window.innerHeight) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  const zoomTo = (next) => {
    const clamped = Math.min(VIEWER_MAX, Math.max(VIEWER_MIN, next));
    setScale(clamped);
    setOffset((o) => clampOffset(o.x, o.y, clamped));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') zoomTo(scale + VIEWER_STEP);
      else if (e.key === '-') zoomTo(scale - VIEWER_STEP);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, onClose]);

  const handlePointerDown = (e) => {
    if (scale === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y, moved: false };
    setIsDragging(true);
  };
  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setOffset(clampOffset(d.originX + dx, d.originY + dy, scale));
  };
  const handlePointerUp = () => {
    setIsDragging(false);
    setTimeout(() => {
      dragRef.current = null;
    }, 0);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] bg-black/80 animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        e.stopPropagation();
        if (dragRef.current?.moved) return;
        if (scale === 1) onClose();
      }}
      onWheel={(e) => zoomTo(scale + (e.deltaY < 0 ? VIEWER_STEP : -VIEWER_STEP))}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="absolute top-4 left-4 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close photo"
          title="Close"
          className={viewerBtn}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomTo(scale + VIEWER_STEP);
          }}
          disabled={scale >= VIEWER_MAX}
          aria-label="Zoom in"
          title="Zoom in"
          className={viewerBtn}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            zoomTo(scale - VIEWER_STEP);
          }}
          disabled={scale <= VIEWER_MIN}
          aria-label="Zoom out"
          title="Zoom out"
          className={viewerBtn}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden">
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          referrerPolicy="no-referrer"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`block max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] object-contain rounded-xl touch-none ${
            isDragging ? 'cursor-grabbing' : `transition-transform duration-150 ${scale > 1 ? 'cursor-grab' : 'cursor-default'}`
          }`}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />
      </div>
    </div>,
    document.body
  );
}

export default ClaimMatchDetailsModal;