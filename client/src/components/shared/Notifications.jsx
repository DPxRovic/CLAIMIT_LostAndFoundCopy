import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  X,
  MessageSquare,
  Search,
  ChevronRight,
} from 'lucide-react';

/**
 * Status badges: same colors as Claims & Matches and the claim/match popups in My Reports
 * - Pending:   #FEF3C7 / #92400E, dot #D97706
 * - Approved:  #ECFDF5 / #047857, dot #10B981
 * - Declined:  #FFE4E6 / #9F1239, dot #E11D48
 * - Withdrawn: #F3F4F6 / #4B5563, dot #6B7280
 */
const STATUS_STYLES = {
  Approved: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
  Pending: { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  Declined: { badge: 'bg-[#FFE4E6] text-[#9F1239]', dot: 'bg-[#E11D48]' },
  Withdrawn: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

export const renderClaimStatusBadge = (status) => {
  if (!status) return null;
  const s = STATUS_STYLES[status] || { badge: 'bg-[#EFF4FF] text-[#5170ff]', dot: 'bg-[#5170ff]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

/**
 * Notifications dropdown for ClaimIt (same colors, borders and font as the rest of the app)
 * - Width: 380px to 410px
 * - List scrolls (max 360px)
 *
 * @param {{
 *   notifications?: Array<any>;
 *   isOpen?: boolean;
 *   onClose?: () => void;
 *   onMarkAllAsRead?: () => void;
 *   onMarkAsRead?: (id: string) => void;
 *   onSelectClaim?: (claimId: string) => void;
 *   closeOnOutsideClick?: boolean; // set false when the parent already handles outside clicks
 * }} props
 */
export const Notifications = ({
  notifications = [],
  onClose,
  onMarkAllAsRead,
  onMarkAsRead,
  onSelectClaim,
  closeOnOutsideClick = true,
}) => {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'unread') return item.unread;
    return true;
  });

  // Close when clicking outside of the notifications popup
  useEffect(() => {
    if (!closeOnOutsideClick) return undefined;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose, closeOnOutsideClick]);

  // Esc closes the panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Icon per notification (round, tinted with the matching status color)
  const getIcon = (notif) => {
    const base = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0';
    if (notif.status === 'Approved') {
      return (
        <div className={`${base} bg-[#ECFDF5] text-[#047857]`}>
          <Check className="w-4 h-4 stroke-[2.5]" />
        </div>
      );
    }
    if (notif.type === 'match_alert') {
      return (
        <div className={`${base} bg-[#EFF4FF] text-[#5170ff]`}>
          <Search className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (notif.type === 'message' || notif.title?.toLowerCase().includes('message')) {
      return (
        <div className={`${base} bg-[#EFF4FF] text-[#5170ff]`}>
          <MessageSquare className="w-4 h-4 stroke-[2.2]" />
        </div>
      );
    }
    if (notif.status === 'Declined') {
      return (
        <div className={`${base} bg-[#FFE4E6] text-[#E11D48]`}>
          <X className="w-4 h-4 stroke-[2.5]" />
        </div>
      );
    }
    return (
      <div className={`${base} bg-[#FEF3C7] text-[#D97706]`}>
        <Bell className="w-4 h-4 stroke-[2]" />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="absolute right-0 top-full mt-2.5 w-[380px] sm:w-[410px] max-w-[calc(100vw-24px)] bg-white rounded-xl border border-[#E8E4D8] shadow-xl z-50 overflow-hidden text-left font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F] animate-in fade-in duration-150"
      role="dialog"
      aria-label="Notifications panel"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E8E4D8] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-[#23261F] tracking-tight">Notifications</span>

          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF4FF] text-[#5170ff]">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[12px] font-medium text-[#5170ff] hover:bg-[#EFF4FF] px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 stroke-[2]" />
              <span>Mark all read</span>
            </button>
          ) : (
            <span className="text-[12px] text-[#6E6858] px-1">All caught up</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs Filter (All / Unread) */}
      <div className="px-4 py-2 border-b border-[#E8E4D8] bg-[#F8F9FA] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[12px] transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#23261F] font-semibold border border-[#E8E4D8]'
                : 'text-[#6E6858] font-medium border border-transparent hover:text-[#23261F] hover:bg-white/70'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1 rounded-lg text-[12px] transition-colors cursor-pointer flex items-center gap-1 ${
              filter === 'unread'
                ? 'bg-white text-[#5170ff] font-semibold border border-[#E8E4D8]'
                : 'text-[#6E6858] font-medium border border-transparent hover:text-[#23261F] hover:bg-white/70'
            }`}
          >
            Unread
            {unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#5170ff]" />}
          </button>
        </div>

        <span className="text-[11px] text-[#6E6858]">ClaimIt Updates</span>
      </div>

      {/* Notifications List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#E8E4D8] overscroll-contain">
        {filteredNotifications.length === 0 ? (
          <div className="py-10 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6E6858] mb-2.5">
              <Bell className="w-5 h-5 stroke-[1.75]" />
            </div>
            <p className="text-[13px] font-semibold text-[#23261F]">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
            <p className="text-[12px] text-[#6E6858] mt-1 max-w-[240px]">
              {filter === 'unread'
                ? 'You are up to date with all recent claim and item updates.'
                : 'Updates about your claims and matching campus reports will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = notif.unread;

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.claimId) {
                    onSelectClaim?.(notif.claimId);
                    onClose?.();
                  }
                  if (isUnread && onMarkAsRead) {
                    onMarkAsRead(notif.id);
                  }
                }}
                className={`group px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer relative ${
                  isUnread ? 'bg-[#EFF4FF]/50 hover:bg-[#EFF4FF]' : 'bg-white hover:bg-[#F9FAFB]'
                }`}
              >
                {/* Icon */}
                {getIcon(notif)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1.5 mb-0.5">
                    <h4
                      className={`text-[13px] leading-snug line-clamp-1 text-[#23261F] ${
                        isUnread ? 'font-semibold' : 'font-medium'
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <span className="text-[11px] text-[#6E6858] whitespace-nowrap shrink-0">{notif.time}</span>
                  </div>

                  <p className="text-[12px] text-[#6E6858] leading-relaxed line-clamp-2">{notif.message}</p>

                  {/* Status Badge + Claim ID */}
                  {(notif.status || notif.claimId || isUnread) && (
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {notif.status && renderClaimStatusBadge(notif.status)}

                        {notif.claimId && (
                          <span className="text-[11px] font-medium text-[#6E6858] group-hover:text-[#5170ff] flex items-center gap-0.5 transition-colors">
                            <span>{notif.claimId}</span>
                            <ChevronRight className="w-3 h-3 stroke-[2.2]" />
                          </span>
                        )}
                      </div>

                      {/* Quick Mark Read button on hover for unread items */}
                      {isUnread && (
                        <button
                          type="button"
                          title="Mark as read"
                          aria-label="Mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead?.(notif.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-[#6E6858] hover:text-[#5170ff] hover:bg-white rounded-md transition-opacity cursor-pointer shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Unread dot */}
                {isUnread && (
                  <div className="shrink-0 pt-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5170ff] block" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#E8E4D8] bg-[#F8F9FA] flex items-center justify-between text-[11px] text-[#6E6858]">
        <span>
          Showing <span className="font-semibold text-[#23261F]">{filteredNotifications.length}</span> of{' '}
          <span className="font-semibold text-[#23261F]">{notifications.length}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="font-medium text-[#6E6858] hover:text-[#23261F] transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Notifications;