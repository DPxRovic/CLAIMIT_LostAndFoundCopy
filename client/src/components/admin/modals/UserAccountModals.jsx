import React, { useEffect, useState } from 'react';

/**
 * User Account Modals (User Management → All Users)
 *
 * Popups (from the prototype):
 * 1. 'details'      - User details (Active or Suspended view)
 * 2. 'edit'         - Edit details form
 * 3. 'reset'        - Reset password confirmation
 * 4. 'tempPassword' - Temporary password shown once
 * 5. 'suspend'      - Suspend account (optional reason)
 * 6. 'deactivate'   - Deactivate account (sets Inactive; records are kept, nothing is deleted)
 *
 * Styled the same as AdminAccountModals.jsx: text #23261F / #6E6858, borders #E8E4D8,
 * rounded-xl cards, rounded-lg buttons, table badge colors, Material Symbols, Inter.
 */

/* ---------- Shared styles (same as AdminAccountModals) ---------- */
const overlayClass =
  'fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200';
const panelClass =
  'relative w-full max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white rounded-xl shadow-xl border border-[#E8E4D8] animate-in zoom-in-95 duration-150';
const closeBtnClass =
  'w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors cursor-pointer shrink-0';
const tileLabelClass = 'block text-[11px] font-semibold text-[#6E6858] uppercase tracking-wider';
const tileValueClass = 'text-sm font-medium text-[#23261F] mt-0.5 block truncate';
const titleClass = 'text-[18px] font-bold text-[#23261F] tracking-tight';
const bodyTextClass = 'text-sm text-[#6E6858] leading-relaxed';
const labelClass = 'block text-xs font-semibold text-[#23261F] mb-1';
const inputClass =
  'w-full px-3 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20';

const btnBase = 'inline-flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer';
const btnPrimary = `${btnBase} bg-[#5170ff] hover:bg-[#4767f6] text-white shadow-sm`;
const btnOutline = `${btnBase} border border-[#E8E4D8] bg-white hover:bg-[#e5eeff] text-[#23261F]`;
const btnDangerSolid = `${btnBase} bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm`;
const btnNeutralSolid = `${btnBase} bg-[#4B5563] hover:bg-[#374151] text-white shadow-sm`;
const btnRow = 'inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border border-[#E8E4D8] bg-white hover:bg-[#e5eeff] text-[#23261F]';
const btnDangerOutline = `${btnBase} border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#DC2626]`;

const PROGRAMS = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Business Administration',
  'BS Accountancy',
  'BS Nursing',
  'BS Education',
  'BS Psychology',
  'BS Criminology',
  'BA Communication',
];
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const ROLES = ['Student', 'Faculty', 'Staff'];

/* ---------- Helpers ---------- */

export function getInitials(name = '') {
  const parts = name.replace(/Dr\.|Prof\.|Engr\./g, '').trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
}

const firstName = (name = '') => name.replace(/Dr\.|Prof\.|Engr\./g, '').trim().split(' ')[0] || name;

/** "1st Year, Section 1C" -> { schoolYear: '1st Year', section: '1C' } */
export function splitSection(value = '') {
  const [first, ...rest] = value.split(',').map((p) => p.trim());
  if (!rest.length) return { schoolYear: '', section: first.replace(/^Section\s*/i, '') };
  return { schoolYear: first, section: rest.join(', ').replace(/^Section\s*/i, '') };
}

function StatusBadge({ status }) {
  const styles = {
    Active: { badge: 'bg-[#ECFDF5] text-[#047857]', dot: 'bg-[#10B981]' },
    Suspended: { badge: 'bg-[#FEF2F2] text-[#B91C1C]', dot: 'bg-[#EF4444]' },
    Inactive: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
    'Pending approval': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  };
  const s = styles[status] || { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function RoleBadge({ role }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF4FF] text-[#5170ff]">
      {role}
    </span>
  );
}

function Avatar({ account, size = 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${sizeClass} rounded-full text-white font-semibold flex items-center justify-center shrink-0 ${
        account.avatarBg || 'bg-[#0d9488]'
      }`}
      aria-hidden="true"
    >
      {getInitials(account.name)}
    </div>
  );
}

function CloseButton({ onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} className={`${closeBtnClass} ${className}`} aria-label="Close">
      <span className="material-symbols-outlined text-[20px]">close</span>
    </button>
  );
}

function Shell({ maxWidth = 'max-w-[500px]', onClose, children, label }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={overlayClass}>
      <div className={`${panelClass} ${maxWidth}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

/** Reason only (the badge already shows the status). Clamped to 2 lines with "Show more". */
function ReasonNote({ label, reason }) {
  const [expanded, setExpanded] = useState(false);
  if (!reason) return null;
  const isLong = reason.length > 110;

  return (
    <div className="min-w-0">
      <span className={tileLabelClass}>{label}</span>
      <p className={`mt-0.5 text-sm text-[#23261F] leading-relaxed break-words ${expanded ? '' : 'line-clamp-2'}`}>
        {reason}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-xs font-medium text-[#5170ff] hover:underline cursor-pointer"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

/* ---------- 1. User details ---------- */

export function UserDetailsModal({ account, onClose, onEdit, onResetPassword, onSuspend, onReactivate, onDeactivate }) {
  const isSuspended = account.status === 'Suspended';
  const isInactive = account.status === 'Inactive';
  const isBlocked = isSuspended || isInactive;
  const isStudent = account.role === 'Student';
  const { schoolYear, section } = splitSection(account.section);
  const stats = account.stats || {};
  const username = account.username ? `@${account.username.replace(/^@/, '')}` : '—';

  const details = isStudent
    ? [
        { label: 'Username', value: username },
        { label: 'Program', value: account.program },
        { label: 'School Year', value: schoolYear },
        { label: 'Section', value: section },
        { label: 'Joined', value: account.joined },
        { label: 'Campus', value: account.campus },
      ]
    : [
        { label: 'Username', value: username },
        { label: 'Department', value: account.program },
        { label: 'Position', value: account.section },
        { label: 'Role', value: account.role },
        { label: 'Joined', value: account.joined },
        { label: 'Campus', value: account.campus },
      ];

  const activity = [
    { value: stats.reports ?? 0, label: 'Reports filed', sub: 'Lost & found items', icon: 'description' },
    { value: stats.claims ?? 0, label: 'Claims submitted', sub: `Resolved ${stats.resolved ?? 0}`, icon: 'sell' },
    { value: stats.chats ?? 0, label: 'Active chats', sub: 'Campus inquiries', icon: 'chat' },
  ];

  return (
    <Shell onClose={onClose} label="User details">
      <div className="p-5 space-y-4">
        {/* Badges + close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RoleBadge role={account.role} />
            <StatusBadge status={account.status} />
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <Avatar account={account} />
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                isSuspended ? 'bg-[#EF4444]' : isInactive ? 'bg-[#9CA3AF]' : 'bg-[#10b981]'
              }`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`${titleClass} truncate`}>{account.name}</h2>
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

        {/* Details: plain label/value grid (no boxes) */}
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-3 pt-4 border-t border-[#E8E4D8]">
          {details.map((d) => (
            <div key={d.label} className="min-w-0">
              <dt className={tileLabelClass}>{d.label}</dt>
              <dd className={tileValueClass}>{d.value || '—'}</dd>
            </div>
          ))}
        </dl>

        {/* Activity cards */}
        <div className="grid grid-cols-3 gap-2">
          {activity.map((a) => (
            <div key={a.label} className="bg-white rounded-lg px-3 py-2 border border-[#E8E4D8]">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#23261F] leading-tight">{a.value}</span>
                <span className="material-symbols-outlined text-[18px] text-[#6E6858]">{a.icon}</span>
              </div>
              <p className="text-xs font-semibold text-[#23261F] mt-0.5">{a.label}</p>
              <p className="text-[11px] text-[#6E6858]">{a.sub}</p>
            </div>
          ))}
        </div>

        {/* Reason (only when one was saved) */}
        {isSuspended && <ReasonNote label="Suspension reason" reason={account.suspendReason} />}
        {isInactive && <ReasonNote label="Deactivation reason" reason={account.inactiveReason} />}
      </div>

      {/* Footer: secondary actions in one even row, main status action full width below */}
      <div className="px-5 py-3 border-t border-[#E8E4D8] space-y-2">
        <div className={`grid gap-2 ${isInactive ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <button type="button" onClick={onEdit} className={btnRow}>
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit details
          </button>
          <button type="button" onClick={onResetPassword} className={btnRow}>
            <span className="material-symbols-outlined text-[16px]">key</span>
            Reset password
          </button>
          {!isInactive && (
            <button type="button" onClick={onDeactivate} className={btnRow} title="Records are kept">
              <span className="material-symbols-outlined text-[16px]">person_off</span>
              Deactivate
            </button>
          )}
        </div>

        {isBlocked ? (
          <button type="button" onClick={onReactivate} className={`${btnPrimary} w-full`}>
            <span className="material-symbols-outlined text-[16px]">check</span>
            Reactivate account
          </button>
        ) : (
          <button type="button" onClick={onSuspend} className={`${btnDangerOutline} w-full`}>
            <span className="material-symbols-outlined text-[16px]">block</span>
            Suspend account
          </button>
        )}
      </div>
    </Shell>
  );
}

/* ---------- 2. Edit details ---------- */

export function EditDetailsModal({ account, onClose, onCancel, onSave }) {
  const initial = splitSection(account.section);
  const [fullName, setFullName] = useState(account.name || '');
  const [username, setUsername] = useState((account.username || '').replace(/^@/, ''));
  const [role, setRole] = useState(account.role || 'Student');
  const [email, setEmail] = useState(account.email || '');
  const [program, setProgram] = useState(account.program || '');
  const [schoolYear, setSchoolYear] = useState(initial.schoolYear);
  const [section, setSection] = useState(initial.section);

  const isStudent = role === 'Student';
  const programOptions = PROGRAMS.includes(program) || !program ? PROGRAMS : [program, ...PROGRAMS];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    onSave?.({
      name: fullName.trim(),
      username: username.trim().replace(/^@/, ''),
      role,
      email: email.trim(),
      program: program.trim(),
      section: isStudent
        ? [schoolYear, section.trim() && `Section ${section.trim()}`].filter(Boolean).join(', ')
        : section.trim(),
    });
  };

  return (
    <Shell onClose={onClose} label="Edit details" maxWidth="max-w-[440px]">
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={titleClass}>Edit details</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div>
          <label htmlFor="edit-name" className={labelClass}>Full Name</label>
          <input id="edit-name" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-username" className={labelClass}>Username</label>
            <input id="edit-username" className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label htmlFor="edit-role" className={labelClass}>Role</label>
            <div className="relative">
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6858] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="edit-email" className={labelClass}>Email</label>
          <input id="edit-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="edit-program" className={labelClass}>{isStudent ? 'Program' : 'Department'}</label>
          {isStudent ? (
            <div className="relative">
              <select
                id="edit-program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className={`${inputClass} appearance-none pr-9 cursor-pointer`}
              >
                <option value="" disabled>Select Program</option>
                {programOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6858] pointer-events-none">
                expand_more
              </span>
            </div>
          ) : (
            <input id="edit-program" className={inputClass} value={program} onChange={(e) => setProgram(e.target.value)} />
          )}
        </div>

        {isStudent ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-year" className={labelClass}>School Year</label>
              <div className="relative">
                <select
                  id="edit-year"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className={`${inputClass} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="" disabled>Select</option>
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6858] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="edit-section" className={labelClass}>Section</label>
              <input id="edit-section" className={inputClass} value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="edit-position" className={labelClass}>Position</label>
            <input id="edit-position" className={inputClass} value={section} onChange={(e) => setSection(e.target.value)} />
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className={btnOutline}>Cancel</button>
          <button type="submit" className={btnPrimary}>Save changes</button>
        </div>
      </form>
    </Shell>
  );
}

/* ---------- 3. Reset password ---------- */

export function ResetPasswordModal({ account, onClose, onCancel, onConfirm }) {
  return (
    <Shell onClose={onClose} label="Reset password" maxWidth="max-w-[400px]">
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={titleClass}>Reset password?</h2>
          <CloseButton onClick={onClose} />
        </div>
        <p className={bodyTextClass}>
          A new temporary password is generated for <span className="font-medium text-[#23261F]">{account.name}</span>.
          Their current password stops working.
        </p>
        <div className="pt-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className={btnOutline}>Cancel</button>
          <button type="button" onClick={onConfirm} className={btnPrimary}>Reset password</button>
        </div>
      </div>
    </Shell>
  );
}

/* ---------- 4. Temporary password ---------- */

export function TempPasswordModal({ account, password, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Shell onClose={onClose} label="Password reset" maxWidth="max-w-[400px]">
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={titleClass}>Password reset</h2>
          <CloseButton onClick={onClose} />
        </div>
        <p className={bodyTextClass}>
          Give this temporary password to <span className="font-medium text-[#23261F]">{account.name}</span>. It is shown
          only once.
        </p>
        <div className="relative rounded-lg border-2 border-dashed border-[#E8E4D8] bg-[#eff4ff]/60 py-5 text-center">
          <span className="text-[28px] font-bold text-[#23261F] tracking-wide">{password}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[#6E6858] hover:text-[#23261F] hover:bg-[#e5eeff] transition-colors cursor-pointer text-xs"
            aria-label="Copy password"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            {copied && <span>Copied</span>}
          </button>
        </div>
        <div className="pt-2 flex items-center justify-end">
          <button type="button" onClick={onClose} className={btnPrimary}>Done</button>
        </div>
      </div>
    </Shell>
  );
}

/* ---------- 5. Suspend account ---------- */

export function SuspendAccountModal({ account, onClose, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const hiddenPosts = account.stats?.openReports ?? account.stats?.reports ?? 0;

  return (
    <Shell onClose={onClose} label="Suspend account" maxWidth="max-w-[440px]">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#B91C1C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
              Account action
            </span>
            <h2 className={`${titleClass} mt-1`}>Suspend {firstName(account.name)}?</h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <p className={bodyTextClass}>
          {account.name} will not be able to log in. Their open reports are hidden from Browse Items until you reactivate the
          account. Nothing is deleted.
        </p>

        <div className="flex items-center justify-between gap-3 bg-[#eff4ff]/60 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar account={account} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#23261F] truncate">{account.name}</p>
              <p className="text-xs text-[#6E6858] truncate">{account.email}</p>
            </div>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#FEF2F2] text-[#B91C1C]">
            {hiddenPosts} hidden {hiddenPosts === 1 ? 'post' : 'posts'}
          </span>
        </div>

        <div>
          <label htmlFor="suspend-reason" className={labelClass}>
            Reason <span className="font-normal text-[#6E6858]">(optional)</span>
          </label>
          <textarea
            id="suspend-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Repeated false claims"
            className={`${inputClass} resize-none`}
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-[#6E6858]">
            <span className="material-symbols-outlined text-[14px]">history</span>
            Saved in the activity log.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className={btnOutline}>Cancel</button>
          <button type="button" onClick={() => onConfirm?.(reason.trim())} className={btnDangerSolid}>
            <span className="material-symbols-outlined text-[16px]">block</span>
            Suspend account
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ---------- 6. Deactivate account ---------- */

const DEACTIVATE_REASONS = ['Graduated', 'Transferred to another school', 'No longer employed', 'Duplicate account', 'Other'];

export function DeactivateAccountModal({ account, onClose, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');

  return (
    <Shell onClose={onClose} label="Deactivate account" maxWidth="max-w-[440px]">
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F3F4F6] text-[#4B5563] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">person_off</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]">Account action</span>
              <h2 className={titleClass}>Deactivate {firstName(account.name)}&apos;s account?</h2>
            </div>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <p className={bodyTextClass}>
          {account.name} won&apos;t be able to log in. Their reports, claims and chats are kept in the records. You can
          reactivate the account anytime.
        </p>

        <div className="flex items-center gap-2.5 bg-[#eff4ff]/60 rounded-lg px-3 py-2 min-w-0">
          <Avatar account={account} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#23261F] truncate">{account.name}</p>
            <p className="text-xs text-[#6E6858] truncate">{account.email}</p>
          </div>
        </div>

        <div>
          <label htmlFor="deactivate-reason" className={labelClass}>
            Reason <span className="font-normal text-[#6E6858]">(optional)</span>
          </label>
          <div className="relative">
            <select
              id="deactivate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClass} appearance-none pr-9 cursor-pointer ${reason ? '' : 'text-[#6E6858]/80'}`}
            >
              <option value="">Select a reason</option>
              {DEACTIVATE_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6858] pointer-events-none">
              expand_more
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#6E6858]">
            <span className="material-symbols-outlined text-[14px]">history</span>
            Saved in the activity log.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className={btnOutline}>Cancel</button>
          <button type="button" onClick={() => onConfirm?.(reason)} className={btnNeutralSolid}>
            <span className="material-symbols-outlined text-[16px]">person_off</span>
            Deactivate account
          </button>
        </div>
      </div>
    </Shell>
  );
}

/* ---------- Controller ---------- */

/**
 * modal = { type, account, password? } or null
 * onOpen(type) switches between popups for the same account.
 */
export default function UserAccountModals({
  modal,
  onClose,
  onOpen,
  onSaveEdit,
  onConfirmReset,
  onConfirmSuspend,
  onReactivate,
  onConfirmDeactivate,
}) {
  if (!modal || !modal.account) return null;
  const { type, account } = modal;
  const backToDetails = () => onOpen('details');

  switch (type) {
    case 'details':
      return (
        <UserDetailsModal
          account={account}
          onClose={onClose}
          onEdit={() => onOpen('edit')}
          onResetPassword={() => onOpen('reset')}
          onSuspend={() => onOpen('suspend')}
          onReactivate={() => onReactivate(account)}
          onDeactivate={() => onOpen('deactivate')}
        />
      );
    case 'edit':
      return <EditDetailsModal account={account} onClose={onClose} onCancel={backToDetails} onSave={(updates) => onSaveEdit(account, updates)} />;
    case 'reset':
      return <ResetPasswordModal account={account} onClose={onClose} onCancel={backToDetails} onConfirm={() => onConfirmReset(account)} />;
    case 'tempPassword':
      return <TempPasswordModal account={account} password={modal.password} onClose={onClose} />;
    case 'suspend':
      return <SuspendAccountModal account={account} onClose={onClose} onCancel={backToDetails} onConfirm={(reason) => onConfirmSuspend(account, reason)} />;
    case 'deactivate':
      return (
        <DeactivateAccountModal
          account={account}
          onClose={onClose}
          onCancel={backToDetails}
          onConfirm={(reason) => onConfirmDeactivate(account, reason)}
        />
      );
    default:
      return null;
  }
}