import React, { useState } from 'react';

/**
 * Reusable Admin Account Modals for ClaimIt
 *
 * Supports 4 popup variants matching the UI specifications:
 * 1. 'manage'   - Account review with Approve and Decline triggers
 * 2. 'decline'  - Reason selection and note textarea for rejection
 * 3. 'approved' - Success summary card with link to Activity Logs
 * 4. 'declined' - Declined summary card with cited reason and link to Activity Logs
 *
 * Styling aligned with the rest of ClaimIt (admin tables + ReportDetailsModal):
 * text #23261F / #6E6858, borders #E8E4D8, rounded-xl cards, rounded-lg buttons,
 * same badge colors as the tables, Material Symbols icons.
 */

export const DECLINE_REASONS = [
  'Unverified campus affiliation / Not found in faculty directory',
  'Incorrect department or role selected',
  'Duplicate registration',
  'Other reason',
];

/* Shared styles */
const overlayClass =
  'fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200';
const panelClass =
  'relative w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-[#E8E4D8] animate-in zoom-in-95 duration-150';
const closeBtnClass =
  'w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors cursor-pointer';
const tileLabelClass = 'block text-[11px] font-semibold text-[#6E6858] uppercase tracking-wider';
const tileValueClass = 'text-sm font-medium text-[#23261F] mt-0.5 block truncate';
const primaryBtnClass =
  'py-1.5 px-4 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors';
const summaryCardClass = 'bg-[#eff4ff]/60 rounded-xl px-3.5 py-3 text-left space-y-2 text-sm';
const summaryLabelClass = 'font-semibold text-[#6E6858] uppercase tracking-wider text-[11px]';
const summaryRowClass = 'flex items-center justify-between border-t border-[#E8E4D8] pt-2';

// Same badge colors as the admin tables
function StatusBadge({ status }) {
  const styles = {
    'Pending approval': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
    Active: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
    Suspended: { badge: 'bg-[#FEF2F2] text-[#B91C1C]', dot: 'bg-[#EF4444]' },
    Declined: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
  };
  const s = styles[status] || styles.Declined;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function CloseButton({ onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`${closeBtnClass} ${className}`} aria-label="Close">
      <span className="material-symbols-outlined text-[20px]">close</span>
    </button>
  );
}

/**
 * 1. Manage Modal ('manage')
 */
export function ManageAccountModal({
  isOpen,
  account,
  onClose,
  onApprove,
  onDeclineRequest,
}) {
  if (!isOpen || !account) return null;

  const initials =
    account.initials ||
    account.name
      ?.split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ||
    'US';

  // Use the same avatar color as the table row when available
  const avatarStyle = account.avatarColor ? { backgroundColor: account.avatarColor } : undefined;
  const avatarClass = account.avatarColor ? '' : account.avatarBg || 'bg-[#0d9488]';

  return (
    <div className={overlayClass}>
      <div className={`${panelClass} max-w-[500px]`} role="dialog" aria-modal="true">
        <div className="p-5 space-y-4">
          {/* Header Row: Role & Status Tags + Close button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF4FF] text-[#5170ff]">
                {account.role}
              </span>
              <StatusBadge status={account.status} />
            </div>

            <CloseButton onClick={onClose} />
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div
                className={`w-14 h-14 rounded-full text-white flex items-center justify-center font-semibold text-lg ring-2 ring-white ${avatarClass}`}
                style={avatarStyle}
              >
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight truncate">
                  {account.name}
                </h2>
                {account.idNumber && (
                  <span className="text-[11px] font-semibold tracking-wider text-[#444655] bg-[#e5eeff] px-2 py-0.5 rounded shrink-0">
                    {account.idNumber}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6E6858] flex items-center gap-1.5 mt-0.5 truncate">
                <span className="material-symbols-outlined text-[14px] shrink-0">mail</span>
                <span className="truncate">{account.email}</span>
              </p>
            </div>
          </div>

          {/* Info Details: plain label/value grid (no boxes) */}
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3 pt-4 border-t border-[#E8E4D8]">
            {[
              { label: 'USERNAME', value: account.username || 'm.aquino' },
              { label: 'DEPARTMENT', value: account.department || account.details || 'College of Nursing' },
              { label: 'POSITION', value: account.position || 'Professor' },
              { label: 'JOINED', value: account.joined || 'Sep 14, 2026' },
              { label: 'CAMPUS', value: account.campus || 'Congress Campus' },
            ].map((d) => (
              <div key={d.label} className="min-w-0">
                <dt className={tileLabelClass}>{d.label}</dt>
                <dd className={tileValueClass}>{d.value}</dd>
              </div>
            ))}
          </dl>

          {/* 3 Stat Counters */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: account.stats?.reports ?? 0, label: 'Reports filed', sub: 'Lost & found items', icon: 'description' },
              { value: account.stats?.claims ?? 0, label: 'Claims submitted', sub: `Resolved ${account.stats?.resolved ?? 0}`, icon: 'sell' },
              { value: account.stats?.chats ?? 0, label: 'Active chats', sub: 'Campus inquiries', icon: 'chat' },
            ].map((st) => (
              <div key={st.label} className="bg-white rounded-lg px-3 py-2 border border-[#E8E4D8]">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#23261F] leading-tight">{st.value}</span>
                  <span className="material-symbols-outlined text-[18px] text-[#6E6858]">{st.icon}</span>
                </div>
                <p className="text-xs font-semibold text-[#23261F] mt-0.5">{st.label}</p>
                <p className="text-[11px] text-[#6E6858]">{st.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Action Buttons (same footer bar as ReportDetailsModal) */}
        <div className="px-5 py-3 border-t border-[#E8E4D8]">
          {account.status === 'Pending approval' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onDeclineRequest?.(account)}
                className="inline-flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#DC2626] text-sm font-medium cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">do_not_disturb_on</span>
                Decline request
              </button>

              <button type="button" onClick={() => onApprove?.(account)} className={primaryBtnClass}>
                <span className="material-symbols-outlined text-[18px]">check</span>
                Approve account
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[#6E6858]">
                Account status: <strong className="text-[#23261F]">{account.status}</strong>. Review actions are only available for pending applications.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#F3F4F6] text-xs font-semibold text-[#23261F] cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Decline Modal ('decline')
 */
export function DeclineAccountModal({
  isOpen,
  account,
  onClose,
  onCancel,
  onConfirmDecline,
}) {
  const [selectedReason, setSelectedReason] = useState(DECLINE_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  if (!isOpen || !account) return null;

  const handleDecline = () => {
    onConfirmDecline?.({
      account,
      reason: selectedReason,
      note: customNote,
      sendEmail,
    });
  };

  return (
    <div className={overlayClass}>
      <div className={`${panelClass} max-w-[500px]`} role="dialog" aria-modal="true">
        <div className="p-5 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0 border border-[#FECACA]">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">
                Decline {account.role} Registration
              </h2>
            </div>

            <CloseButton onClick={onClose} />
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6E6858] uppercase tracking-wider mb-1.5">
                REASON FOR DECLINING <span className="text-[#DC2626]">*</span>
              </label>

              <div className="space-y-0.5">
                {DECLINE_REASONS.map((reason) => {
                  const isChecked = selectedReason === reason;
                  return (
                    <label
                      key={reason}
                      onClick={() => setSelectedReason(reason)}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#eff4ff]/60 text-[#23261F] font-medium' : 'hover:bg-[#F9FAFB] text-[#23261F]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isChecked ? 'border-[#5170ff] bg-[#5170ff]' : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="leading-snug">{reason}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6E6858] uppercase tracking-wider mb-1">
                ADDITIONAL NOTE TO APPLICANT (OPTIONAL)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Provide additional feedback or instructions for re-applying..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-[#E8E4D8] text-sm placeholder:text-[#6E6858]/60 text-[#23261F] focus:outline-none focus:ring-2 focus:ring-[#5170ff]/20 focus:border-[#5170ff] resize-none"
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] accent-[#5170ff] cursor-pointer"
              />
              <span className="text-sm text-[#6E6858] leading-tight">
                Send email notification explaining the decline decision to{' '}
                <strong className="text-[#23261F] font-medium">{account.email}</strong>
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-between border-t border-[#E8E4D8]">
            <button
              type="button"
              onClick={onCancel}
              className="py-1.5 px-4 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#e5eeff] text-sm font-medium text-[#23261F] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDecline}
              className="py-1.5 px-4 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-medium shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Decline Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Approved Modal ('approved')
 */
export function ApprovedAccountModal({
  isOpen,
  account,
  onClose,
  onViewActivityLog,
}) {
  if (!isOpen || !account) return null;

  return (
    <div className={overlayClass}>
      <div className={`${panelClass} max-w-[440px]`} role="dialog" aria-modal="true">
        <CloseButton onClick={onClose} className="absolute top-4 right-4" />

        <div className="p-5 text-center space-y-3">
          {/* Centered emerald checkmark circle */}
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center mx-auto ring-4 ring-[#ECFDF5]/60">
            <span className="material-symbols-outlined text-[28px]">check_circle</span>
          </div>

          <div>
            <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">{account.role} Account Approved</h2>
          </div>

          {/* Details Card */}
          <div className={summaryCardClass}>
            <div className="flex items-center justify-between">
              <span className={summaryLabelClass}>{account.role.toUpperCase()} MEMBER</span>
              <span className="font-semibold text-[#23261F] text-right truncate max-w-[200px]">{account.name}</span>
            </div>

            <div className={summaryRowClass}>
              <span className={summaryLabelClass}>DEPARTMENT</span>
              <span className="font-medium text-[#23261F] text-right truncate max-w-[200px]">
                {account.department || account.details || 'College of Nursing'}
              </span>
            </div>

            <div className={summaryRowClass}>
              <span className={summaryLabelClass}>GRANTED ROLE</span>
              <span className="font-medium text-[#23261F] text-right">{account.role}</span>
            </div>

            <div className={summaryRowClass}>
              <span className={summaryLabelClass}>STATUS</span>
              <StatusBadge status="Active" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={onViewActivityLog}
              className="text-sm font-medium text-[#5170ff] hover:underline cursor-pointer"
            >
              View Activity Log
            </button>

            <button type="button" onClick={onClose} className={`${primaryBtnClass} px-7`}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Declined Modal ('declined')
 */
export function DeclinedAccountModal({
  isOpen,
  account,
  reason,
  onClose,
  onViewActivityLog,
}) {
  if (!isOpen || !account) return null;

  return (
    <div className={overlayClass}>
      <div className={`${panelClass} max-w-[440px]`} role="dialog" aria-modal="true">
        <CloseButton onClick={onClose} className="absolute top-4 right-4" />

        <div className="p-5 text-center space-y-3">
          {/* Centered red prohibition circle */}
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto ring-4 ring-[#FEF2F2]/60">
            <span className="material-symbols-outlined text-[28px]">block</span>
          </div>

          <div>
            <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">{account.role} Registration Declined</h2>
          </div>

          {/* Details Card */}
          <div className={summaryCardClass}>
            <div className="flex items-center justify-between">
              <span className={summaryLabelClass}>APPLICANT</span>
              <span className="font-semibold text-[#23261F] text-right truncate max-w-[200px]">{account.name}</span>
            </div>

            <div className={summaryRowClass}>
              <span className={summaryLabelClass}>DEPARTMENT</span>
              <span className="font-medium text-[#23261F] text-right truncate max-w-[200px]">
                {account.department || account.details || 'College of Nursing'}
              </span>
            </div>

            <div className="flex items-start justify-between border-t border-[#E8E4D8] pt-2 gap-2">
              <span className={`${summaryLabelClass} shrink-0`}>REASON CITED</span>
              <span className="font-medium text-[#23261F] text-right text-xs max-w-[220px] leading-tight">
                {reason || account.declinedReason || DECLINE_REASONS[0]}
              </span>
            </div>

            <div className={summaryRowClass}>
              <span className={summaryLabelClass}>NOTIFICATION</span>
              <span className="text-[#23261F] text-right text-xs truncate max-w-[200px]">{account.email}</span>
            </div>

            <div className={summaryRowClass}>
              <span className={summaryLabelClass}>STATUS</span>
              <StatusBadge status="Declined" />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={onViewActivityLog}
              className="text-sm font-medium text-[#5170ff] hover:underline cursor-pointer"
            >
              View Activity Log
            </button>

            <button type="button" onClick={onClose} className={`${primaryBtnClass} px-7`}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Combined Admin Account Modals Controller
 */
export default function AdminAccountModals({
  modalState,
  onClose,
  onApprove,
  onDeclineRequest,
  onCancelDecline,
  onConfirmDecline,
  onViewActivityLog,
}) {
  if (!modalState || !modalState.type || !modalState.account) return null;

  const { type, account, reason } = modalState;

  if (type === 'manage') {
    return (
      <ManageAccountModal
        isOpen={true}
        account={account}
        onClose={onClose}
        onApprove={onApprove}
        onDeclineRequest={onDeclineRequest}
      />
    );
  }

  if (type === 'decline') {
    return (
      <DeclineAccountModal
        isOpen={true}
        account={account}
        onClose={onClose}
        onCancel={onCancelDecline}
        onConfirmDecline={onConfirmDecline}
      />
    );
  }

  if (type === 'approved') {
    return (
      <ApprovedAccountModal
        isOpen={true}
        account={account}
        onClose={onClose}
        onViewActivityLog={onViewActivityLog}
      />
    );
  }

  if (type === 'declined') {
    return (
      <DeclinedAccountModal
        isOpen={true}
        account={account}
        reason={reason}
        onClose={onClose}
        onViewActivityLog={onViewActivityLog}
      />
    );
  }

  return null;
}