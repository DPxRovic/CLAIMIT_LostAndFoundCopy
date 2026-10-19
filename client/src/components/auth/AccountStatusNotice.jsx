import React from 'react';

/**
 * AccountStatusNotice
 * Renders structured notices for pending approval, suspended, inactive, or declined account states.
 */
export default function AccountStatusNotice({ status, reason, onAction, actionLabel = 'Back to Log in' }) {
  if (!status || status === 'Active') return null;

  const config = {
    'Pending approval': {
      title: 'Registration Pending Approval',
      description: 'Your faculty registration is currently awaiting administrator review. You will be granted access once an administrator approves your account.',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    'Suspended': {
      title: 'Account Suspended',
      description: reason ? `This account has been suspended: "${reason}". Please contact campus administration.` : 'This account has been suspended. Please contact campus administration.',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
    },
    'Inactive': {
      title: 'Account Deactivated',
      description: reason ? `This account has been deactivated: "${reason}". Please contact campus administration.` : 'This account has been deactivated. Please contact campus administration.',
      badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    'Declined': {
      title: 'Registration Declined',
      description: reason ? `Your registration request was declined: "${reason}". Please contact campus administration for assistance.` : 'Your registration request was declined. Please contact campus administration for assistance.',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
    },
  }[status] || {
    title: 'Account Status Notice',
    description: reason || 'Please contact campus administration regarding your account status.',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="p-4 rounded-xl border bg-white shadow-sm space-y-3 font-['Inter',sans-serif]">
      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass}`}>
          {status}
        </span>
        <h3 className="text-sm font-bold text-[#23261F]">{config.title}</h3>
      </div>
      <p className="text-xs text-[#6E6858] leading-relaxed">{config.description}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs text-[#5170ff] font-semibold hover:underline cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export { AccountStatusNotice };
