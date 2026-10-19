import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, UploadCloud, Shield, MapPin, Send } from 'lucide-react';

/**
 * BrowseItemActionModal
 * - "Found Item Report" when viewing a LOST item (becomes a match)
 * - "Claim this item" when viewing a FOUND item (becomes a claim)
 *
 * Same look as the My Reports / Claims & Matches popups:
 * - Header: ← back (to Item Details), title, close (X)
 * - Body: subtitle, item strip (photo, title, location, badges), question, one proof photo (optional), privacy note
 *   The proof photo works like the photo in Report an Item: preview, Change and Remove stay inside the same box.
 * - Footer: Cancel · Submit
 * Both modes share the same layout; only the copy changes.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Object|null} props.item
 * @param {'claim' | 'found_report'} props.mode
 * @param {() => void} props.onClose
 * @param {() => void} [props.onBack] - Back to Item Details (falls back to onClose)
 * @param {((submission: any) => void)} props.onSubmitSuccess
 */

// Same badge colors as My Reports (these are the posted reports)
const STATUS_STYLES = {
  Active: { badge: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
  'Pending Match': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  'Pending Claim': { badge: 'bg-[#FFEDD5] text-[#9A3412]', dot: 'bg-[#EA580C]' },
  Resolved: { badge: 'bg-[#EFF6FF] text-[#1D4ED8]', dot: 'bg-[#1D4ED8]' },
  Closed: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

const labelClass = 'text-xs font-semibold text-[#23261F]';

export const BrowseItemActionModal = ({
  isOpen,
  item,
  mode = 'claim',
  onClose,
  onBack,
  onSubmitSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  // One proof photo (optional)
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setInputText('');
      setProofFile(null);
      setProofPreview(null);
      setFileError('');
      setError('');
      return undefined;
    }

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

  if (!isOpen || !item) return null;

  const isFoundReport = mode === 'found_report';
  const isFoundItem = item.type === 'FOUND';
  const status = item.status || 'Active';
  const s = STATUS_STYLES[status] || STATUS_STYLES.Closed;
  const posterName = item.postedBy || 'Hannah Puerta (BS Computer Science)';

  // Shorten name e.g. "Paolo D."
  const nameParts = posterName.replace(/\(.*?\)/, '').trim().split(' ');
  const contactShortName =
    nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1][0]}.` : nameParts[0] || 'Finder';

  // Copy per mode (layout stays identical)
  const copy = isFoundReport
    ? {
        title: 'Found Item Report',
        subtitle: `Tell ${contactShortName} where you spotted or turned in the item.`,
        posterLabel: 'Reported by',
        question: 'Where did you spot/find it?',
        placeholder: 'e.g. Covered Court bleachers, Student Center bench, Library 2F',
        submit: 'Submit Found Report',
        missing: 'Please provide where you spotted or turned in the item.',
      }
    : {
        title: 'Claim this item',
        subtitle: `${contactShortName} will compare your answers with the item before approving. Be specific.`,
        posterLabel: 'Posted by',
        question: 'How can you prove it is yours?',
        placeholder: 'Marks, contents, stickers, serial numbers',
        submit: 'Submit claim',
        missing: 'Please provide proof of ownership details.',
      };

  // Same checks as Report an Item: PNG / JPG / WebP, up to 10MB
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFileError('Please select a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('The image must be 10MB or smaller.');
      return;
    }

    setFileError('');
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result);
    reader.onerror = () => setFileError('Unable to preview this image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    setProofPreview(null);
    setFileError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setError(copy.missing);
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketId = isFoundReport ? `#FND-${randomNum}` : `#CLM-${randomNum}`;

    onSubmitSuccess({
      item,
      mode,
      ticketId,
      inputText,
      // One proof photo (kept as a list too, for older code that reads uploadedFiles)
      proofFile,
      attachmentName: proofFile?.name,
      attachmentSize: proofFile ? `${(proofFile.size / (1024 * 1024)).toFixed(1)} MB` : undefined,
      attachmentUrl: proofPreview || undefined,
      uploadedFiles: proofFile
        ? [{ name: proofFile.name, size: `${(proofFile.size / (1024 * 1024)).toFixed(1)} MB` }]
        : [],
      submittedAt: 'Just now',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="browse-item-action-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] max-h-[85dvh] border border-[#E8E4D8] animate-in zoom-in-95 duration-200 font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#E8E4D8] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack || onClose}
              aria-label="Back to item details"
              title="Back"
              className="-ml-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 id="browse-item-action-title" className="text-[18px] font-bold text-[#23261F] tracking-tight truncate">
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-auto min-h-0">
          {/* Body (scrolls if needed; bottom spacer keeps bottom padding equal to the top) */}
          <div className="px-4 pt-4 flex flex-col gap-3 flex-auto min-h-0 overflow-y-auto overscroll-contain">
            {/* Subtitle + poster */}
            <div className="shrink-0">
              <p className="text-sm text-[#6E6858] leading-relaxed">{copy.subtitle}</p>
            </div>

            {/* Item strip */}
            <div className="p-2.5 rounded-xl bg-[#eff4ff]/60 border border-[#E8E4D8] flex items-center gap-3 shrink-0">
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E8E4D8]"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`inline-flex items-center px-2 py-px rounded text-[10px] font-semibold text-white tracking-wider ${
                      isFoundItem ? 'bg-[#0D6E6E]' : 'bg-[#881337]'
                    }`}
                  >
                    {isFoundItem ? 'FOUND' : 'LOST'}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-px rounded-full text-[10px] font-medium ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                    {status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#23261F] truncate">{item.title}</p>
                <p className="text-xs text-[#6E6858] flex items-center gap-1 truncate mt-0.5">
                  <MapPin className="w-3 h-3 text-[#5170ff] shrink-0" />
                  <span className="truncate">{item.location}</span>
                  <span className="shrink-0">
                    · {copy.posterLabel} <span className="font-medium text-[#23261F]">{contactShortName}</span>
                  </span>
                </p>
              </div>
            </div>

            {/* Main question */}
            <div className="shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="details-input" className={labelClass}>
                  {copy.question}
                </label>
                <span className="text-[11px] font-medium text-[#DC2626]">*Required</span>
              </div>

              <textarea
                id="details-input"
                rows={3}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (error) setError('');
                }}
                placeholder={copy.placeholder}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-[#23261F] placeholder:text-[#6E6858]/60 bg-white focus:outline-none focus:ring-2 resize-none transition-colors ${
                  error
                    ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-[#5170ff]/20'
                }`}
              />

              {error ? (
                <p className="text-xs text-[#DC2626] font-medium mt-1">{error}</p>
              ) : (
                <p className="text-[11px] text-[#6E6858] mt-1">Describe details only the owner would know.</p>
              )}
            </div>

            {/* One proof photo (same as the photo field in Report an Item) */}
            <div className="shrink-0">
              <span className={`${labelClass} block mb-1.5`}>
                Upload a supporting photo <span className="font-normal text-[#6E6858]">(Optional)</span>
              </span>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              <div className="rounded-xl border-2 border-dashed border-[#E8E4D8] px-3 py-3 text-center transition-all hover:border-[#5170ff]/50 hover:bg-[#F9FAFB]">
                {proofPreview ? (
                  /* Preview, Change and Remove stay inside the same box */
                  <div className="flex items-center justify-center gap-2 min-w-0">
                    <img
                      src={proofPreview}
                      alt="Selected proof preview"
                      className="h-10 w-10 rounded-md border border-[#E8E4D8] object-cover shrink-0"
                    />
                    <span className="max-w-[200px] truncate text-xs font-semibold text-[#23261F]">
                      {proofFile?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium text-[#5170ff] underline cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-xs font-medium text-[#DC2626] hover:underline cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center cursor-pointer"
                  >
                    <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#5170ff]/10 text-[#5170ff]">
                      <UploadCloud className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-semibold text-[#23261F]">
                      Drop an image here or{' '}
                      <span className="text-[#5170ff] underline underline-offset-2">click to browse</span>
                    </span>
                    <span className="mt-1 text-[11px] text-[#6E6858]">
                      PNG, JPG, or WebP up to 10MB (receipts, past photos wearing it, marks)
                    </span>
                  </button>
                )}
              </div>

              {fileError && <p className="text-xs text-[#DC2626] font-medium mt-1">{fileError}</p>}
            </div>

            {/* Privacy note */}
            <div className="rounded-lg px-3 py-2 bg-[#EFF4FF]/60 flex items-center gap-2 text-xs text-[#6E6858] shrink-0">
              <Shield className="w-4 h-4 text-[#5170ff] shrink-0" />
              <p className="leading-snug">
                Claim submissions are protected and only shared with the verified campus finder.
              </p>
            </div>

            {/* Bottom spacer: 4px + the 12px gap = 16px, same as the top padding */}
            <div className="h-1 shrink-0" aria-hidden="true" />
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-white border-t border-[#E8E4D8] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-lg bg-white hover:bg-[#e5eeff] border border-[#E8E4D8] text-[#23261F] text-sm font-medium transition-colors focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
            >
              <span>{copy.submit}</span>
              <Send className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrowseItemActionModal;