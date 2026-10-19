import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Info, ShieldCheck, MapPin, Calendar, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * BrowseItemDetailsModal
 * Small popup for a clicked item card (Lost or Found), with the app's colors and badges:
 * - Header: type + status badges (same colors as My Reports), close (X)
 * - Body: photo (click → full-size viewer), title, details box, description, info note
 * - Footer: Close · "Claim this item" (FOUND) or "I found this item" (LOST)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.item
 * @param {() => void} props.onClose
 * @param {((item: any, actionType: 'claim' | 'found_report') => void)} props.onOpenAction
 */

// Same badge colors as My Reports (these are the posted reports)
const STATUS_STYLES = {
  Active: { badge: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
  'Pending Match': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  'Pending Claim': { badge: 'bg-[#FFEDD5] text-[#9A3412]', dot: 'bg-[#EA580C]' },
  Resolved: { badge: 'bg-[#EFF6FF] text-[#1D4ED8]', dot: 'bg-[#1D4ED8]' },
  Closed: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

// "KEYS & ACCESSORIES" -> "Keys & Accessories", "IDS & CARDS" -> "IDs & Cards"
const formatCategory = (raw = '') =>
  raw
    .split(' ')
    .map((word) => {
      if (word === 'IDS') return 'IDs';
      if (word === '&') return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

export const BrowseItemDetailsModal = ({ isOpen, item, onClose, onOpenAction }) => {
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  useEffect(() => {
    setIsImageZoomed(false);
  }, [isOpen, item?.id]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isImageZoomed) onClose();
    };
    const originalOverflow = document.body.style.overflow;
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, isImageZoomed]);

  if (!isOpen || !item) return null;

  const isFound = item.type === 'FOUND';
  const status = item.status || 'Active';
  const s = STATUS_STYLES[status] || STATUS_STYLES.Closed;
  const posterName = item.postedBy || 'Hannah Puerta (BS Computer Science)';
  const contactFirstName = posterName.split(' ')[0] || 'Finder';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="browse-item-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] max-h-[85dvh] border border-[#E8E4D8] animate-in zoom-in-95 duration-200 font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: badges & close (pinned) */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
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

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body (bottom spacer keeps bottom padding equal) */}
        <div className="px-5 flex flex-col gap-3 flex-auto min-h-0 overflow-y-auto overscroll-contain">
          {/* Item picture (click to view full size) */}
          {item.imageUrl && (
            <button
              type="button"
              onClick={() => setIsImageZoomed(true)}
              aria-label="View photo full size"
              className="group w-full h-40 rounded-xl overflow-hidden relative bg-[#e5eeff] border border-[#E8E4D8] shrink-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5170ff]/40"
            >
              <img
                src={item.imageUrl}
                alt={item.imageAlt || item.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-medium opacity-90 group-hover:opacity-100">
                <Maximize2 className="w-3.5 h-3.5" />
                View full size
              </span>
            </button>
          )}

          {/* Title & listing eyebrow / reported time */}
          <div className="shrink-0">
            {isFound && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5170ff] block mb-0.5">
                LISTING DETAILS
              </span>
            )}
            <h2 id="browse-item-details-title" className="text-[18px] font-bold text-[#23261F] leading-tight tracking-tight">
              {item.title}
            </h2>
            {!isFound && (
              <p className="text-xs font-medium text-[#5170ff] mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {item.reportedTime || 'Reported 2 days ago'}
              </p>
            )}
          </div>

          {/* Details box */}
          <div className="rounded-xl bg-[#eff4ff]/60 border border-[#E8E4D8] px-3 py-2.5 space-y-1.5 text-xs shrink-0">
            <div className="flex items-start">
              <span className="text-[#6E6858] w-24 shrink-0">Location</span>
              <span className="font-medium text-[#23261F] flex-1 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#5170ff] shrink-0 mt-px" />
                <span>{item.location || '—'}</span>
              </span>
            </div>
            <div className="flex items-start">
              <span className="text-[#6E6858] w-24 shrink-0">{isFound ? 'Found' : 'Lost'}</span>
              <span className="font-medium text-[#23261F] flex-1">{item.date || '—'}</span>
            </div>
            <div className="flex items-start">
              <span className="text-[#6E6858] w-24 shrink-0">Category</span>
              <span className="font-medium text-[#23261F] flex-1">{formatCategory(item.category) || '—'}</span>
            </div>
            <div className="flex items-start">
              <span className="text-[#6E6858] w-24 shrink-0">Posted by</span>
              <span className="font-medium text-[#23261F] flex-1">{posterName}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-[#23261F] leading-relaxed shrink-0">
            {item.description ||
              (isFound
                ? 'Item found on campus grounds. Please describe the items inside or distinctive marks if you think this is yours.'
                : 'Lost item left on campus. Looking for anyone who may have spotted or turned it in.')}
          </p>

          {/* Info note */}
          {isFound ? (
            <div className="rounded-lg px-3 py-2.5 bg-[#EFF4FF]/60 flex items-start gap-2.5 text-xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#5170ff] shrink-0 mt-px" />
              <div>
                <p className="font-semibold text-[#23261F]">Proof of Ownership Required</p>
                <p className="text-[#6E6858] mt-0.5 leading-relaxed">
                  Think this is yours? Submit a claim with details only the owner would know.{' '}
                  {contactFirstName} will review it.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg px-3 py-2.5 bg-[#EFF4FF]/60 flex items-start gap-2.5 text-xs shrink-0">
              <Info className="w-4 h-4 text-[#5170ff] shrink-0 mt-px" />
              <p className="text-[#6E6858] leading-relaxed">
                <span className="font-semibold text-[#23261F]">Lost items are open to matching.</span>{' '}
                If you found this, post it as a Found item so the owner can claim it.
              </p>
            </div>
          )}

          {/* Bottom spacer: 4px + the 12px gap = 16px */}
          <div className="h-1 shrink-0" aria-hidden="true" />
        </div>

        {/* Footer actions (pinned) */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#E8E4D8] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-[#6E6858] hover:text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          >
            {isFound ? 'Close' : 'Dismiss'}
          </button>
          <button
            type="button"
            onClick={() => onOpenAction(item, isFound ? 'claim' : 'found_report')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{isFound ? 'Claim this item' : 'I found this item'}</span>
          </button>
        </div>
      </div>

      {/* Full-size photo viewer (same as My Reports) */}
      {isImageZoomed && item.imageUrl && (
        <PhotoViewer src={item.imageUrl} alt={item.imageAlt || item.title} onClose={() => setIsImageZoomed(false)} />
      )}
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

export default BrowseItemDetailsModal;