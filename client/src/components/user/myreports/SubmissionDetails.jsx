import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ImageOff, Maximize2, Tag, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * SubmissionDetails ("Inspect details" view)
 * Content-only view shown INSIDE ClaimMatchVerificationModal (no extra popup on top).
 * - Submitter, status and item reference
 * - Larger photo with "View full size" (full-screen photo viewer)
 * - Full statement (no truncation, scrolls if very long)
 *
 * @param {Object} props
 * @param {Object} props.verification - Same object ClaimMatchVerificationModal receives
 * @param {Function} [props.onZoomChange] - Tells the parent when the full-size photo is open (for Esc handling)
 */

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STATUS_STYLES = {
  Approved: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
  Pending: { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  Declined: { badge: 'bg-[#FFE4E6] text-[#9F1239]', dot: 'bg-[#E11D48]' },
  Withdrawn: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

export default function SubmissionDetails({ verification, onZoomChange }) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    onZoomChange?.(isZoomed);
  }, [isZoomed, onZoomChange]);

  if (!verification) return null;

  const isMatch = verification.type === 'match' || verification.isMatch === true;
  const status = verification.status || 'Pending';
  const s = STATUS_STYLES[status] || STATUS_STYLES.Withdrawn;
  const statement =
    verification.statement ||
    verification.description ||
    verification.messagePreview ||
    'No additional description provided with this submission.';
  const submitter = verification.submitterName || (isMatch ? 'Finder' : 'Claimant');

  return (
    <div className="flex flex-col gap-4">
      {/* Submitter + status */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#EFF4FF] text-[#5170ff] text-xs font-semibold flex items-center justify-center shrink-0">
            {getInitials(submitter)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#23261F] truncate">{submitter}</p>
            {verification.submittedDate && (
              <p className="text-xs text-[#6E6858]">Submitted {verification.submittedDate}</p>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {status}
        </span>
      </div>

      {/* Item reference */}
      <div className="flex items-center gap-2 text-xs text-[#23261F] bg-[#EFF4FF]/60 rounded-lg px-3 py-2">
        <Tag className="w-4 h-4 text-[#5170ff] shrink-0" />
        <span className="font-medium truncate">{verification.itemTitle || 'Unspecified Item'}</span>
        {verification.reportTicket && (
          <span className="text-[#6E6858] shrink-0">· Report {verification.reportTicket}</span>
        )}
      </div>

      {/* Photo */}
      <div className="space-y-1.5">
        <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">Photo</span>
        {verification.imageUrl ? (
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="group relative w-full h-52 rounded-lg overflow-hidden border border-[#E8E4D8] bg-[#F3F4F6] cursor-zoom-in"
            aria-label="View photo full size"
          >
            <img
              src={verification.imageUrl}
              alt={verification.itemTitle || 'Submitted photo'}
              className="w-full h-full object-contain"
            />
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-medium opacity-90 group-hover:opacity-100">
              <Maximize2 className="w-3.5 h-3.5" />
              View full size
            </span>
          </button>
        ) : (
          <div className="w-full h-20 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F9FAFB] flex flex-col items-center justify-center text-center">
            <ImageOff className="w-5 h-5 text-[#94A3B8]" />
            <span className="text-xs text-[#6E6858] mt-1">No photo attached</span>
          </div>
        )}
      </div>

      {/* Full statement */}
      <div className="space-y-1.5">
        <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">
          {isMatch ? 'Finder statement' : 'Claim statement'}
        </span>
        <div className="rounded-lg border border-[#E8E4D8] p-3 max-h-40 overflow-y-auto">
          <p className="text-sm text-[#23261F] leading-relaxed whitespace-pre-wrap break-words">{statement}</p>
        </div>
      </div>

      {/* Full-size photo viewer (Esc / close button / dark area closes) */}
      {isZoomed && verification.imageUrl && (
        <PhotoViewer
          src={verification.imageUrl}
          alt={verification.itemTitle || 'Submitted photo'}
          onClose={() => setIsZoomed(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full-size photo viewer (Facebook-style)                             */
/* Faded dark backdrop · Close top-left · Zoom in/out top-right       */
/* Rounded photo · drag to move when zoomed · wheel zooms · Esc closes */
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

  // The photo can only be moved as far as its own edges reach the screen edges:
  // if the zoomed photo is wider/taller than the screen you can look around it,
  // otherwise it stays centered on that side (can't be dragged around the black area).
  const clampOffset = (x, y, s) => {
    const w = (imgRef.current?.offsetWidth || 0) * s;
    const h = (imgRef.current?.offsetHeight || 0) * s;
    const maxX = Math.max(0, (w - window.innerWidth) / 2);
    const maxY = Math.max(0, (h - window.innerHeight) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  const zoomTo = (next) => {
    const clamped = Math.min(VIEWER_MAX, Math.max(VIEWER_MIN, next));
    setScale(clamped);
    setOffset((o) => clampOffset(o.x, o.y, clamped));
  };

  // Esc closes, + / - zoom
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
      {/* Top-left: close */}
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

      {/* Top-right: zoom in / zoom out */}
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

      {/* Photo: enlarges when zoomed; drag only to look around the parts outside the screen */}
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

export { SubmissionDetails };