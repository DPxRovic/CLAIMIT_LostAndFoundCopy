import React from 'react';

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
 */
function Avatar({ name, imageUrl, isCurrentUser }) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 overflow-hidden';
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
 * ConversationMessage Component
 * Reusable chat message bubble for verification threads.
 *
 * @param {Object} props
 * @param {Object} props.message
 * @param {string} props.message.id
 * @param {string} props.message.senderName - Name of the sender (e.g. "Crystal Florano" or "You")
 * @param {string} [props.message.senderInitials] - Initials (computed if omitted)
 * @param {string} [props.message.senderAvatar] - Optional avatar image URL
 * @param {string} props.message.timestamp - Formatted timestamp (e.g. "Aug 22, 5:10 PM")
 * @param {string} props.message.text - Content of the message
 * @param {boolean} [props.message.isCurrentUser=false] - Whether this message was sent by the viewer
 * @param {string} [props.className]
 */
export default function ConversationMessage({ message, className = '' }) {
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
      {/* Avatar (left for others, right for you) */}
      <div className="mt-0.5">
        <Avatar name={avatarName} imageUrl={message.senderAvatar} isCurrentUser={isCurrentUser} />
      </div>

      {/* Name, time and bubble */}
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

export { ConversationMessage };