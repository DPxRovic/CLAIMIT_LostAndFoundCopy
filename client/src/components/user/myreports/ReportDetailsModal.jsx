import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ClaimOrMatchCard from './ClaimOrMatchCard.jsx';

/**
 * ReportDetailsModal Component
 * Reusable modal matching the exact Stitch design.
 * Auto-injects Material Symbols Outlined font to ensure icons never appear as text.
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen=true] - Controls visibility of the modal
 * @param {Function} [props.onClose] - Callback when modal is closed
 * @param {Object} props.report - Dynamic report data
 * @param {boolean} [props.canCloseReport=false] - Whether "Close this report" action is visible
 * @param {Function} [props.onCloseReport] - Callback when "Close this report" is clicked
 * @param {Function} [props.onViewClaimOrMatch] - Callback when a claim/match row is clicked
 * @param {string} [props.className] - Additional classes
 */
export const ReportDetailsModal = ({
  isOpen = true,
  onClose,
  report,
  canCloseReport = false,
  onCloseReport,
  onViewClaimOrMatch,
  className = '',
}) => {
  // Ensure Material Symbols font is loaded in document head
  useEffect(() => {
    const linkId = 'material-symbols-outlined-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Full-size photo viewer
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Claims/matches list: 3 per page (pagination instead of scrolling)
  const ENTRIES_PER_PAGE = 3;
  const [entriesPage, setEntriesPage] = useState(1);

  // Reset the photo viewer and the list page when the modal closes or shows another report
  useEffect(() => {
    setIsImageZoomed(false);
    setEntriesPage(1);
  }, [isOpen, report?.ticket]);

  // Esc: close the full-size photo first, then the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (isImageZoomed) setIsImageZoomed(false);
      else if (onClose) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isImageZoomed]);

  // Pending entries first, so the ones that need a decision are always on top
  const entries = useMemo(() => {
    const list = report?.entries || [];
    return [...list].sort((a, b) => (a.status === 'Pending' ? 0 : 1) - (b.status === 'Pending' ? 0 : 1));
  }, [report]);

  if (!isOpen || !report) {
    return null;
  }

  const isLost = report.type === 'LOST';
  const entriesCount = entries.length;
  const entriesTotalPages = Math.max(1, Math.ceil(entriesCount / ENTRIES_PER_PAGE));
  const entriesSafePage = Math.min(entriesPage, entriesTotalPages);
  const entriesStart = (entriesSafePage - 1) * ENTRIES_PER_PAGE;
  const pageEntries = entries.slice(entriesStart, entriesStart + ENTRIES_PER_PAGE);
  const pendingCount = entries.filter((e) => (e.status || 'Pending') === 'Pending').length;
  const isMatches = report.entriesType === 'matches' || (isLost && report.entriesType !== 'claims');
  const sectionTitle = isMatches ? 'Matches on this item' : 'Claims on this item';
  const locationLabel = isLost ? 'Lost Location' : 'Found Location';

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#4F46E5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" aria-hidden="true" />
            Active
          </span>
        );
      case 'Pending Match':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
            Pending Match
          </span>
        );
      case 'Pending Claim':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFEDD5] text-[#9A3412]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" aria-hidden="true" />
            Pending Claim
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EFF6FF] text-[#1D4ED8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" aria-hidden="true" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" aria-hidden="true" />
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const renderTypeBadge = (type) => {
    if (type === 'FOUND') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#0D6E6E] text-white tracking-wider">
          FOUND
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#881337] text-white tracking-wider">
        LOST
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-details-dialog-title"
    >
      {/* Modal Card matching exact Stitch max-w-[500px] outline #E8E4D8 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[500px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200 animate-in zoom-in-95 ${className}`}
        style={{ outline: '1px solid #E8E4D8' }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-3 bg-white shrink-0"
          style={{ borderBottom: '1px solid #E8E4D8' }}
        >
          <div className="flex items-center gap-2">
            <span
              id="report-details-dialog-title"
              className="text-[18px] tracking-tight text-[#23261F] font-bold"
            >
              Report Details
            </span>
            {report.ticket && (
              <span className="text-[11px] px-2 py-0.5 rounded text-[#444655] bg-[#e5eeff] tracking-wider font-semibold">
                {report.ticket}
              </span>
            )}
          </div>

          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body
            - Scrolls when the window is too short to show everything.
            - Claims/matches are paged (3 per page), so the list never grows past 3 rows.
            - Bottom padding uses a spacer at the end, so it always matches the top padding
              (padding-bottom on a scrolling flex column can get dropped by the browser). */}
        <div className="px-4 pt-4 flex flex-col gap-3 flex-auto min-h-0 overflow-y-auto">
          {/* Badges and Title */}
          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex items-center gap-2">
              {renderTypeBadge(report.type)}
              {renderStatusBadge(report.status)}
            </div>
            <h2 className="text-[18px] text-[#23261F] font-bold leading-tight tracking-tight">
              {report.title}
            </h2>
          </div>

          {/* Item Image (click to view full size) */}
          {report.imageUrl && (
            <button
              type="button"
              onClick={() => setIsImageZoomed(true)}
              aria-label="View photo full size"
              className="group w-full h-28 rounded-xl overflow-hidden relative bg-[#e5eeff] shrink-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5170ff]/40"
              style={{ border: '1px solid #E8E4D8' }}
            >
              <img
                alt={report.title}
                className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-300"
                src={report.imageUrl}
              />
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-[11px] font-medium opacity-90 group-hover:opacity-100">
                <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                View full size
              </span>
            </button>
          )}

          {/* Category, Date Filed & Location */}
          <div
            className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-[#eff4ff]/60 shrink-0"
            style={{ border: '1px solid #E8E4D8' }}
          >
            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">
                Category
              </span>
              <div className="flex items-center gap-1.5 text-[#23261F]">
                <span className="text-sm font-medium">{report.category || '—'}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">
                Date Filed
              </span>
              <div className="flex items-center gap-1.5 text-[#23261F]">
                <span className="material-symbols-outlined text-[16px] text-[#6E6858]">
                  calendar_today
                </span>
                <span className="text-sm font-medium">{report.dateFiled || '—'}</span>
              </div>
            </div>

            {report.location && (
              <div className="space-y-0.5 col-span-2">
                <span className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold block">
                  {locationLabel}
                </span>
                <div className="flex items-start gap-1.5 text-[#23261F]">
                  <span className="material-symbols-outlined text-[#284bdc] text-[16px] mt-0.5 flex-shrink-0">
                    location_on
                  </span>
                  <span className="text-sm font-medium">{report.location}</span>
                </div>
              </div>
            )}
          </div>

          {/* Description & Notes */}
          {report.description && (
            <div className="space-y-1 shrink-0">
              <label className="text-[11px] uppercase tracking-wider text-[#6E6858] font-semibold">
                Description &amp; Notes
              </label>
              <div
                className="p-2 rounded-lg bg-white text-[#23261F]"
                style={{ border: '1px solid #E8E4D8' }}
              >
                <p className="text-sm leading-relaxed text-[#23261F]">{report.description}</p>
              </div>
            </div>
          )}

          {/* Matches / Claims Section */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#23261F]">
                  {sectionTitle}
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#e5eeff] text-[#6E6858]">
                  {entriesCount}
                </span>
              </div>
              {pendingCount > 0 && (
                <span className="text-[11px] font-semibold text-[#92400E] uppercase tracking-wider">
                  {pendingCount} to review
                </span>
              )}
            </div>

            {/* Compact list: one row per claim/match, 3 per page (pending ones first). */}
            {entriesCount > 0 ? (
              <>
                <div
                  className="rounded-lg divide-y divide-[#E8E4D8]"
                  style={{ border: '1px solid #E8E4D8' }}
                >
                  {pageEntries.map((entry, index) => (
                    <ClaimOrMatchCard
                      key={entry.id || index}
                      entry={entry}
                      onView={onViewClaimOrMatch}
                    />
                  ))}
                </div>

                {/* Pagination (only when there are more than 3) — same style as the tables */}
                {entriesTotalPages > 1 && (
                  <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-[#6E6858]">
                    <p>
                      Showing{' '}
                      <span className="font-semibold text-[#23261F]">
                        {entriesStart + 1 === Math.min(entriesStart + ENTRIES_PER_PAGE, entriesCount)
                          ? entriesStart + 1
                          : `${entriesStart + 1}–${Math.min(entriesStart + ENTRIES_PER_PAGE, entriesCount)}`}
                      </span>{' '}
                      of <span className="font-semibold text-[#23261F]">{entriesCount}</span>
                    </p>

                    <nav className="flex items-center gap-1" aria-label={`${sectionTitle} pages`}>
                      <button
                        type="button"
                        onClick={() => setEntriesPage(entriesSafePage - 1)}
                        disabled={entriesSafePage === 1}
                        aria-label="Previous page"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E8E4D8] bg-white text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      {Array.from({ length: entriesTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEntriesPage(p)}
                          aria-current={p === entriesSafePage ? 'page' : undefined}
                          className={
                            p === entriesSafePage
                              ? 'h-7 min-w-7 px-2 rounded-lg border border-[#5170ff] bg-[#5170ff] text-xs font-semibold text-white'
                              : 'h-7 min-w-7 px-2 rounded-lg border border-[#E8E4D8] bg-white text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer'
                          }
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEntriesPage(entriesSafePage + 1)}
                        disabled={entriesSafePage === entriesTotalPages}
                        aria-label="Next page"
                        className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-[#E8E4D8] bg-white text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              /* Empty state from Stitch AI */
              <div
                className="rounded-lg px-3 py-1.5 flex items-center gap-2 bg-white shrink-0"
                style={{ border: '1px dashed #E8E4D8' }}
              >
                <span className="material-symbols-outlined text-[16px] text-[#6E6858] flex-shrink-0">
                  assignment_late
                </span>
                <p className="text-sm text-[#6E6858]">
                  {isMatches
                    ? 'No one has said they found this yet.'
                    : 'No claims have been submitted yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Bottom spacer: 4px + the 12px gap = 16px, same as the top padding */}
          <div className="h-1 shrink-0" aria-hidden="true" />
        </div>

        {/* Modal Footer */}
        <div
          className="px-5 py-3 bg-white flex items-center justify-between shrink-0"
          style={{ borderTop: '1px solid rgb(232, 228, 216)' }}
        >
          {canCloseReport ? (
            <button
              type="button"
              onClick={() => onCloseReport?.(report)}
              className="text-sm font-medium hover:underline cursor-pointer transition-colors focus:outline-none flex items-center gap-1"
              style={{ color: 'rgb(220, 38, 38)' }}
            >
              <span className="material-symbols-outlined text-[16px]">do_not_disturb_on</span>
              <span>Close this report</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-white hover:bg-[#e5eeff] text-[#23261F] text-xs font-medium transition-colors focus:outline-none cursor-pointer"
            style={{ border: '1px solid #E8E4D8' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Full-size photo viewer (Esc / close button / dark area closes) */}
      {isImageZoomed && report.imageUrl && (
        <PhotoViewer src={report.imageUrl} alt={report.title} onClose={() => setIsImageZoomed(false)} />
      )}
    </div>
  );
};

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
          <span className="material-symbols-outlined text-[22px]">close</span>
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
          <span className="material-symbols-outlined text-[22px]">zoom_in</span>
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
          <span className="material-symbols-outlined text-[22px]">zoom_out</span>
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

export default ReportDetailsModal;