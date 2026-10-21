import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  adminFetchActivityLogs,
  formatPhilippineTimestamp,
} from '../../../lib/supabase.js';

const ITEMS_PER_PAGE = 10;

const ACTOR_OPTIONS = [
  { value: 'all', label: 'All Actors' },
  { value: 'admin', label: 'Admin Actions' },
  { value: 'system', label: 'System Events' },
];

function getPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) pages.push('…');
  for (let p = from; p <= to; p += 1) pages.push(p);
  if (to < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

function Pagination({ page, totalPages, totalItems, onPageChange, itemLabel }) {
  const start = totalItems === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, totalItems);
  const arrowClass =
    'h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-[#E8E4D8] bg-white text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-[#E8E4D8] text-xs text-[#6E6858]">
      <p>
        Showing{' '}
        <span className="font-semibold text-[#23261F]">{start === end ? start : `${start}–${end}`}</span>{' '}
        of <span className="font-semibold text-[#23261F]">{totalItems}</span> {itemLabel}
      </p>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          type="button"
          className={arrowClass}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
          <span>Previous</span>
        </button>

        {getPageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={
                p === page
                  ? 'h-8 min-w-8 px-2 rounded-lg border border-[#5170ff] bg-[#5170ff] text-xs font-semibold text-white'
                  : 'h-8 min-w-8 px-2 rounded-lg border border-[#E8E4D8] bg-white text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer'
              }
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className={arrowClass}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Next</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
        </button>
      </nav>
    </div>
  );
}

function mapAuditLogToDisplayItem(raw) {
  const actorObj = raw.actor || {};
  const targetObj = raw.target || {};

  const actorRoleName = actorObj.role || raw.actorRole || '';
  const isActorAdmin =
    actorRoleName.toLowerCase().includes('admin') ||
    (raw.actorName && raw.actorName.toLowerCase().includes('admin'));

  const actorName =
    actorObj.full_name || raw.actorName || (isActorAdmin ? 'Sabrina Carpenter' : 'System');
  const actorRole = isActorAdmin
    ? '(Admin)'
    : actorRoleName
    ? `(${actorRoleName})`
    : '';

  const targetName = targetObj.full_name || raw.targetName || '';
  const actionKey = raw.action || '';
  let actionText = '';

  if (actionKey === 'suspend_account') {
    actionText = `Suspended account: ${targetName || 'User'}${raw.reason ? ` (${raw.reason})` : ''}`;
  } else if (actionKey === 'reactivate_account') {
    actionText = `Reactivated account: ${targetName || 'User'}`;
  } else if (actionKey === 'deactivate_account') {
    actionText = `Deactivated account: ${targetName || 'User'}${raw.reason ? ` (${raw.reason})` : ''}`;
  } else if (actionKey === 'approve_faculty') {
    actionText = `Approved faculty registration: ${targetName || 'Faculty Member'}`;
  } else if (actionKey === 'decline_faculty') {
    actionText = `Declined faculty registration: ${targetName || 'Faculty Member'}${raw.reason ? ` (${raw.reason})` : ''}`;
  } else if (actionKey === 'create_account') {
    actionText = raw.notes || `Created account: ${targetName || 'User'}`;
  } else if (actionKey === 'edit_details') {
    actionText = `Updated user details for ${targetName || 'User'}`;
  } else if (actionKey === 'reset_password') {
    actionText = `Generated temporary password for ${targetName || 'User'}`;
  } else if (actionKey === 'manage_lists') {
    actionText = raw.notes || 'Modified list configuration options';
  } else {
    actionText = raw.notes || raw.action || raw.reason || 'System operation recorded';
  }

  return {
    id: raw.id || `log-${Math.random()}`,
    timestamp: formatPhilippineTimestamp(raw.created_at || raw.timestamp),
    actorName,
    actorRole,
    action: actionText,
    raw,
  };
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const res = await adminFetchActivityLogs();
      if (!res.success) {
        setLoadError(res.error || 'Failed to load activity logs from database.');
        setLogs([]);
      } else {
        const mapped = (res.data || []).map(mapAuditLogToDisplayItem);
        setLogs(mapped);
      }
    } catch (err) {
      setLoadError(err?.message || 'Unexpected error loading activity logs.');
      setLogs([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadLogs();
  };

  const filteredLogs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      const matchesSearch =
        !query ||
        log.actorName.toLowerCase().includes(query) ||
        log.actorRole.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.timestamp.toLowerCase().includes(query);

      const matchesActor =
        actorFilter === 'all' ||
        (actorFilter === 'admin' && log.actorRole.includes('Admin')) ||
        (actorFilter === 'system' && (log.actorName === 'System' || !log.actorRole.includes('Admin')));

      return matchesSearch && matchesActor;
    });
  }, [logs, searchQuery, actorFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">Activity Logs</h1>
          <p className="text-sm text-[#6E6858]">
            Track system events, administrative changes, report updates, and user verifications across ClaimIt.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#F3F4F6] text-xs font-semibold text-[#23261F] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Refresh activity logs"
          >
            <span
              className={`material-symbols-outlined text-[18px] text-[#5170ff] ${
                isRefreshing || loading ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            >
              refresh
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {loadError && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-[#fff5f5] border border-[#ba1a1a]/20 text-[#ba1a1a] text-xs sm:text-sm font-medium flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]" aria-hidden="true">
              error
            </span>
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-2.5 py-1 bg-[#ba1a1a] text-white rounded text-xs font-semibold hover:bg-[#991515] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex items-center flex-1 max-w-xl">
          <span
            className="material-symbols-outlined absolute left-3 text-[18px] text-[#6E6858] pointer-events-none"
            aria-hidden="true"
          >
            search
          </span>
          <input
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20"
            placeholder="Search activity logs, admins, or actions"
            aria-label="Search activity logs"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-[#6E6858] hover:text-[#23261F] text-xs font-semibold cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="relative shrink-0">
          <select
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by actor"
            className="appearance-none w-full pl-3.5 pr-9 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] font-medium focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 cursor-pointer"
          >
            {ACTOR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <span
            className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#6E6858] pointer-events-none"
            aria-hidden="true"
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Timestamp (PHT)</th>
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Actor</th>
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 px-6 text-center text-sm text-[#6E6858]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[#5170ff] text-[20px]">
                        sync
                      </span>
                      <span>Loading activity logs from database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 px-6 text-center text-sm text-[#6E6858]">
                    {searchQuery || actorFilter !== 'all'
                      ? 'No activity logs found matching your search or filter.'
                      : 'No activity logs recorded yet.'}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap text-[#6E6858] text-xs sm:text-sm">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="font-medium text-[#23261F]">{log.actorName}</span>
                      {log.actorRole && <span className="text-[#6E6858] text-xs"> {log.actorRole}</span>}
                    </td>
                    <td className="py-3 px-6 leading-relaxed text-[#23261F]">
                      {log.action}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredLogs.length}
          onPageChange={setCurrentPage}
          itemLabel="events"
        />
      </div>
    </div>
  );
}

export { ActivityLogs };