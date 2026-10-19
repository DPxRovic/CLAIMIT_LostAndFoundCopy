import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Tag,
  ImageOff,
  Lock,
  Send,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import ConversationMessage from './ConversationMessage.jsx';
import SubmissionDetails from './SubmissionDetails.jsx';

/**
 * ClaimMatchVerificationModal Component
 *
 * Reusable modal for verifying item claims and matches.
 * Uses lucide-react vector icons so icons never render as raw text.
 * Colors follow the rest of ClaimIt (#E8E4D8 borders, #23261F / #6E6858 text, #5170ff brand blue).
 *
 * Buttons:
 * - Approve = the only solid blue button (main action)
 * - Decline = red outline
 * - Reply   = icon button inside the message box, so it doesn't compete with Approve
 *
 * @param {Object} props
 * @param {boolean} [props.isOpen=true] - Controls visibility of the modal
 * @param {Function} [props.onClose] - Callback when modal is closed
 * @param {Function} [props.onBack] - Callback when "< Back" button is clicked
 * @param {Object} props.verification - Dynamic claim or match verification data
 * @param {string} props.verification.id - Reference ID (e.g. "C-495", "C-512")
 * @param {'match'|'claim'} [props.verification.type='claim'] - Type of verification
 * @param {string} props.verification.itemTitle - Title of the item
 * @param {string} props.verification.reportTicket - Related report ticket (e.g. "R-1073")
 * @param {string} props.verification.submitterName - Name of the person who claimed/matched
 * @param {string} props.verification.submittedDate - Date submitted
 * @param {'Approved'|'Pending'|'Declined'|'Withdrawn'|string} [props.verification.status='Pending'] - Current status
 * @param {string} [props.verification.imageUrl] - Image evidence URL
 * @param {string} [props.verification.messagePreview] - Message quote
 * @param {string} [props.verification.statement] - Full statement (shown in "Inspect details")
 * @param {Array<Object>} [props.verification.messages] - Conversation messages thread
 * @param {boolean} [props.verification.isClosed] - Explicit closed/readonly flag
 * @param {Function} [props.onApprove] - Callback when "Approve Claim/Match" is clicked
 * @param {Function} [props.onDecline] - Callback when "Decline" is clicked
 * @param {Function} [props.onSendMessage] - Callback when a new reply message is sent: `(text) => void`
 * @param {Function} [props.onInspectDetails] - Optional callback when "Inspect details" is opened
 *   (the details open inside this same popup, as a second view; no extra popup on top)
 * @param {Object} [props.currentUser={ name: 'You' }] - Viewer details for outgoing replies
 * @param {string} [props.className] - Additional styling classes
 */
export default function ClaimMatchVerificationModal({
  isOpen = true,
  onClose,
  onBack,
  verification,
  onApprove,
  onDecline,
  onSendMessage,
  onInspectDetails,
  currentUser = { name: 'You' },
  className = '',
}) {
  const [replyText, setReplyText] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [view, setView] = useState('conversation'); // 'conversation' | 'details'
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const messagesEndRef = useRef(null);

  // Sync incoming verification messages with local state
  useEffect(() => {
    if (verification?.messages) {
      setLocalMessages(verification.messages);
    } else {
      setLocalMessages([]);
    }
  }, [verification?.messages]);

  // Always start on the conversation view when opening / switching verification
  useEffect(() => {
    setView('conversation');
    setIsPhotoZoomed(false);
  }, [isOpen, verification?.id]);

  // Scroll to bottom of conversation on message update
  useEffect(() => {
    if (isOpen && view === 'conversation') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages, isOpen, view]);

  // Esc: full-size photo closes itself; details view goes back to the conversation; otherwise close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key !== 'Escape' || isPhotoZoomed) return;
      if (view === 'details') setView('conversation');
      else if (onClose) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, view, isPhotoZoomed]);

  if (!isOpen || !verification) {
    return null;
  }

  const isMatch =
    verification.type === 'match' ||
    verification.isMatch === true ||
    (verification.title && verification.title.toLowerCase().includes('match'));

  const modalTitle = isMatch ? 'Item Match Verification' : 'Item Claim Verification';
  const approveButtonText = isMatch ? 'Approve Match' : 'Approve Claim';

  const status = verification.status || 'Pending';
  const isClosed =
    Boolean(verification.isClosed) ||
    status === 'Approved' ||
    status === 'Declined' ||
    status === 'Withdrawn' ||
    status === 'Resolved' ||
    status === 'Closed';

  const submitterFirstName = verification.submitterName
    ? verification.submitterName.split(' ')[0]
    : 'User';

  // Same badge colors as the tables
  const statusStyles = {
    Approved: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
    Pending: { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
    Declined: { badge: 'bg-[#FFE4E6] text-[#9F1239]', dot: 'bg-[#E11D48]' },
    Withdrawn: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
  };
  const s = statusStyles[status] || statusStyles.Withdrawn;

  const handleSendReply = (e) => {
    if (e) e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderName: currentUser.name || 'You',
      timestamp: 'Just now',
      text: trimmed,
      isCurrentUser: true,
    };

    setLocalMessages((prev) => [...prev, newMsg]);
    setReplyText('');

    if (onSendMessage) {
      onSendMessage(trimmed);
    }
  };

  const handleInspect = () => {
    setView('details');
    onInspectDetails?.(verification);
  };

  const isDetails = view === 'details';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-dialog-title"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-[540px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200 animate-in zoom-in-95 border border-[#E8E4D8] ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#E8E4D8] shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Back: details view → conversation; conversation view → Report Details */}
              <button
                type="button"
                onClick={isDetails ? () => setView('conversation') : onBack || onClose}
                aria-label={isDetails ? 'Back to conversation' : 'Back to report details'}
                title="Back"
                className="-ml-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 id="verification-dialog-title" className="text-[18px] font-bold text-[#23261F] tracking-tight truncate">
                {isDetails ? (isMatch ? 'Match Details' : 'Claim Details') : modalTitle}
              </h2>
              {verification.id && (
                <span className="text-[11px] px-2 py-0.5 rounded text-[#444655] bg-[#e5eeff] tracking-wider font-semibold">
                  {verification.id}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
            {isDetails ? (
              <SubmissionDetails verification={verification} onZoomChange={setIsPhotoZoomed} />
            ) : (
            <>
            {/* 1. Item Summary Bar */}
            <div className="bg-[#EFF4FF]/60 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-[#23261F]">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Tag className="w-4 h-4 text-[#5170ff] shrink-0" />
                <span className="font-medium truncate">Item: {verification.itemTitle || 'Unspecified Item'}</span>
              </div>
              {verification.reportTicket && (
                <span className="text-[#6E6858] font-medium shrink-0">
                  · Report {verification.reportTicket.replace(/^Report\s*/i, '')}
                </span>
              )}
            </div>

            {/* 2. Submitter Info & Status Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <span className="font-semibold text-sm text-[#23261F] truncate">
                  {verification.submitterName || 'Claimant'}&apos;s {isMatch ? 'match' : 'claim'}
                </span>
                {verification.submittedDate && (
                  <span className="text-xs text-[#6E6858]">Submitted {verification.submittedDate}</span>
                )}
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${s.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {status}
              </span>
            </div>

            {/* 3. Evidence / Submission Preview */}
            <div className="rounded-lg border border-[#E8E4D8] p-3 flex items-center gap-3.5">
              {verification.imageUrl ? (
                <button
                  type="button"
                  onClick={handleInspect}
                  className="w-28 h-20 rounded-lg overflow-hidden border border-[#E8E4D8] shrink-0 bg-[#F3F4F6] cursor-zoom-in"
                  aria-label="View photo and full statement"
                >
                  <img
                    src={verification.imageUrl}
                    alt={verification.itemTitle || 'Evidence photograph'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ) : (
                <div className="w-28 h-20 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F9FAFB] flex flex-col items-center justify-center text-center p-2 shrink-0">
                  <ImageOff className="w-5 h-5 text-[#94A3B8]" />
                  <span className="text-[10px] font-medium mt-1 leading-tight text-[#6E6858]">No photo attached</span>
                </div>
              )}

              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                <div className="pl-3 border-l-2 border-[#E8E4D8]">
                  <p className="text-xs text-[#23261F] line-clamp-3 leading-relaxed italic">
                    &ldquo;
                    {verification.messagePreview ||
                      verification.description ||
                      'No additional description provided with this submission.'}
                    &rdquo;
                  </p>
                </div>

                <div className="pt-2 pl-3">
                  <button
                    type="button"
                    onClick={handleInspect}
                    className="text-[#5170ff] text-xs font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Inspect details</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Conversation Log Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#6E6858] uppercase tracking-wider">
                  Conversation log
                </span>
                <span className="text-xs text-[#6E6858] font-medium">{isClosed ? 'Closed Thread' : 'Active Thread'}</span>
              </div>

              <div className="rounded-lg border border-[#E8E4D8] bg-[#F9FAFB] p-3.5 max-h-56 overflow-y-auto space-y-3.5">
                {localMessages.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#6E6858]">No messages yet. Start the conversation below.</div>
                ) : (
                  localMessages.map((msg) => <ConversationMessage key={msg.id} message={msg} />)
                )}
                <div ref={messagesEndRef} />
              </div>

              {isClosed ? (
                <div className="rounded-lg px-3 py-2 bg-[#F3F4F6] text-xs text-[#4B5563] font-medium flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    This {isMatch ? 'match' : 'claim'} is {status.toLowerCase()} — messaging is closed.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSendReply}>
                  <div className="flex items-center gap-2 border border-[#E8E4D8] rounded-lg pl-3.5 pr-1.5 py-1.5 bg-white focus-within:border-[#5170ff] focus-within:ring-2 focus-within:ring-[#5170ff]/20 transition-colors">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Write a reply to ${submitterFirstName}...`}
                      aria-label={`Reply to ${submitterFirstName}`}
                      className="flex-1 text-sm text-[#23261F] placeholder:text-[#6E6858]/60 outline-none bg-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      aria-label="Send reply"
                      title="Send"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#5170ff] hover:bg-[#EFF4FF] disabled:text-[#CBD5E1] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
            </>
            )}
          </div>

          {/* Footer: only Decline / Approve, in the conversation view (going back uses the ← in the header).
              Hidden in the details view (view-only) and once the claim/match is decided. */}
          {!isDetails && !isClosed && (
          <div className="px-5 py-3 bg-white border-t border-[#E8E4D8] flex items-center justify-end shrink-0">
            {!isClosed && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDecline?.(verification)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#DC2626] text-sm font-medium transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </button>

                <button
                  type="button"
                  onClick={() => onApprove?.(verification)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{approveButtonText}</span>
                </button>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </>
  );
}

export { ClaimMatchVerificationModal };