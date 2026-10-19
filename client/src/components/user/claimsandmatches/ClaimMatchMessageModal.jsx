import React, { useEffect, useRef, useState } from 'react';
import { X, Send, Lock, Tag, ArrowLeft } from 'lucide-react';

const INTER_FONT_FAMILY =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/**
 * Helper to extract 1-2 letter initials from a name
 */
function getInitials(name = '') {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar used on both sides of the conversation (same size, mirrored position)
 * Same as ConversationMessage in My Reports.
 */
function Avatar({ name, imageUrl, isCurrentUser }) {
  const base =
    'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 overflow-hidden';
  if (imageUrl) {
    return (
      <div className={base}>
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${base} ${isCurrentUser ? 'bg-[#5170ff] text-white' : 'bg-[#EFF4FF] text-[#5170ff]'}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

/**
 * ConversationMessage
 * Chat bubble, identical to the one used in My Reports:
 * - your messages on the right (blue bubble), theirs on the left (light gray)
 * - round avatars on both sides
 */
function ConversationMessage({ message, className = '' }) {
  if (!message) return null;

  const isCurrentUser =
    message.isCurrentUser ||
    message.senderName?.toLowerCase() === 'you' ||
    message.isSender === true;

  const displayName = isCurrentUser ? 'You' : message.senderName || 'User';
  const avatarName = message.senderInitials
    ? message.senderInitials
    : message.senderName || (isCurrentUser ? 'You' : 'User');

  return (
    <div className={`flex items-start gap-2.5 w-full ${isCurrentUser ? 'flex-row-reverse' : ''} ${className}`}>
      <div className="mt-0.5">
        <Avatar name={avatarName} imageUrl={message.senderAvatar} isCurrentUser={isCurrentUser} />
      </div>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-2 text-[11px] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
          <span className="font-semibold text-[#23261F]">{displayName}</span>
          <span className="text-[#6E6858]">{message.timestamp}</span>
        </div>

        <div
          className={`px-3.5 py-2 text-[13px] leading-relaxed rounded-2xl ${
            isCurrentUser
              ? 'bg-[#5170ff] text-white rounded-tr-md'
              : 'bg-[#F3F4F6] text-[#23261F] rounded-tl-md'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  Approved: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
  Pending: { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  Declined: { badge: 'bg-[#FFE4E6] text-[#9F1239]', dot: 'bg-[#E11D48]' },
  Withdrawn: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

/**
 * ClaimMatchMessageModal Component (Claims & Matches → Message)
 *
 * One-to-one chat with the person who posted the item you claimed.
 * Same flow as My Reports: you can chat while the claim is Pending (the poster
 * approves or declines based on the conversation). Once it is Approved, Declined
 * or Withdrawn, the thread is read-only.
 * Same layout as the conversation in My Reports (ClaimMatchVerificationModal):
 * - Header: ← back (to Claim Details), "Message {name}" + claim ID chip, close (X)
 * - Item summary bar
 * - Contact row with status badge
 * - Conversation log (only this part scrolls) + reply box with send icon (Pending only)
 *
 * Props:
 * - isOpen: boolean
 * - claim: Claim object
 * - messages: Array of chat messages
 * - onSendMessage: (claimId: string, text: string) => void
 * - onClose: () => void
 * - onBack: () => void   (optional; back to Claim Details. Falls back to onClose)
 */
export const ClaimMatchMessageModal = ({
  isOpen = true,
  claim,
  messages = [],
  onSendMessage,
  onClose,
  onBack,
}) => {
  const modalCardRef = useRef(null);
  const previousFocusRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [inputText, setInputText] = useState('');

  // Focus and Escape key handling
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

  // Scroll to newest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isOpen]);

  if (!isOpen || !claim) return null;

  const contactName = claim.contactPerson || claim.posterName || 'Ana Reyes';
  const contactFirstName = contactName.split(' ')[0];
  const status = claim.status || 'Approved';
  const s = STATUS_STYLES[status] || STATUS_STYLES.Withdrawn;
  const handoverPlace = claim.handoverLocation || claim.location;
  const isClosed = status !== 'Pending';
  const noun = (claim.type || '').toUpperCase().includes('FOUND') ? 'claim' : 'match';
  const displayMessages = messages;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage?.(claim.id, inputText.trim());
    setInputText('');
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
      aria-labelledby="claim-message-dialog-title"
    >
      <div
        ref={modalCardRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[540px] h-[600px] max-h-[92vh] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border border-[#E8E4D8] animate-in zoom-in-95 duration-200 focus:outline-none text-[#23261F]"
        style={{ fontFamily: INTER_FONT_FAMILY }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#E8E4D8] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack || onClose}
              aria-label={`Back to ${noun} details`}
              title="Back"
              className="-ml-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2
              id="claim-message-dialog-title"
              className="text-[18px] font-bold text-[#23261F] tracking-tight truncate"
            >
              Message {contactFirstName}
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

        {/* Body: only the conversation log scrolls */}
        <div className="p-4 sm:p-5 flex-1 min-h-0 flex flex-col gap-4">
          {/* 1. Item Summary Bar */}
          <div className="bg-[#EFF4FF]/60 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-[#23261F] shrink-0">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Tag className="w-4 h-4 text-[#5170ff] shrink-0" />
              <span className="font-medium truncate">Item: {claim.title}</span>
            </div>
            {claim.category && (
              <span className="text-[#6E6858] font-medium shrink-0">· {claim.category}</span>
            )}
          </div>

          {/* 2. Contact Info & Status Row */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={contactName} />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#23261F] truncate">{contactName}</p>
                {handoverPlace && (
                  <p className="text-xs text-[#6E6858] truncate">Handover at {handoverPlace}</p>
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${s.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {status}
            </span>
          </div>

          {/* 3. Conversation Log */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[11px] font-semibold text-[#6E6858] uppercase tracking-wider">
                Conversation log
              </span>
              <span className="text-xs text-[#6E6858] font-medium">{isClosed ? 'Closed Thread' : 'Active Thread'}</span>
            </div>

            <div className="rounded-lg border border-[#E8E4D8] bg-[#F9FAFB] p-3.5 flex-1 min-h-0 overflow-y-auto space-y-3.5">
              {displayMessages.length === 0 && (
                <div className="py-6 text-center text-xs text-[#6E6858]">
                  {isClosed ? 'No messages in this conversation.' : 'No messages yet. Start the conversation below.'}
                </div>
              )}

              {displayMessages.map((msg) => (
                <ConversationMessage
                  key={msg.id}
                  message={{
                    ...msg,
                    senderName: msg.senderName || (msg.sender === 'user' ? 'You' : contactName),
                    timestamp: msg.timestamp || '10:25 AM',
                    isCurrentUser: msg.sender === 'user',
                  }}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {isClosed ? (
              /* Read-only once decided (same as My Reports) */
              <div className="rounded-lg px-3 py-2 bg-[#F3F4F6] text-xs text-[#4B5563] font-medium flex items-center justify-center gap-2 shrink-0">
                <Lock className="w-4 h-4 shrink-0" />
                <span>This {noun} is {status.toLowerCase()} — messaging is closed.</span>
              </div>
            ) : (
              /* Reply Input (send icon inside, same as My Reports) */
              <form onSubmit={handleSubmit} className="shrink-0">
                <div className="flex items-center gap-2 border border-[#E8E4D8] rounded-lg pl-3.5 pr-1.5 py-1.5 bg-white focus-within:border-[#5170ff] focus-within:ring-2 focus-within:ring-[#5170ff]/20 transition-colors">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Write a reply to ${contactFirstName}...`}
                    aria-label={`Message ${contactFirstName}`}
                    className="flex-1 text-sm text-[#23261F] placeholder:text-[#6E6858]/60 outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
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
        </div>
      </div>
    </div>
  );
};

export default ClaimMatchMessageModal;