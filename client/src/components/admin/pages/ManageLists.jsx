import React, { useState, useMemo, useEffect } from 'react';
import AddModalManageLists from '../modals/AddModalManageLists.jsx';
import EditModalManageLists from '../modals/EditModalManageLists.jsx';
import DeleteModalManageLists from '../modals/DeleteModalManageLists.jsx';
import { recordActivityLog } from '../../../lib/supabase.js';

const INITIAL_DATA = {
  report_categories: [
    { id: 'rc-1', name: 'Electronics', status: 'active' },
    { id: 'rc-2', name: 'Bags & Wallets', status: 'active' },
    { id: 'rc-3', name: 'Keys & Accessories', status: 'active' },
    { id: 'rc-4', name: 'Books & Study Material', status: 'active' },
    { id: 'rc-5', name: 'Clothing & Apparel', status: 'active' },
    { id: 'rc-6', name: 'IDs & Campus Cards', status: 'active' },
    { id: 'rc-7', name: 'Others', status: 'active' },
  ],
  programs: [
    { id: 'pr-1', name: 'BS Computer Science', status: 'active' },
    { id: 'pr-2', name: 'BS Information Technology', status: 'active' },
    { id: 'pr-3', name: 'BS Business Administration', status: 'active' },
    { id: 'pr-4', name: 'BS Accountancy', status: 'active' },
    { id: 'pr-5', name: 'BA Psychology', status: 'active' },
  ],
  departments: [
    { id: 'dp-1', name: 'College of Information and Computing', status: 'active' },
    { id: 'dp-2', name: 'College of Business & Management', status: 'active' },
    { id: 'dp-3', name: 'College of Arts and Sciences', status: 'active' },
  ],
};

const ITEMS_PER_PAGE = 5;

const TAB_META = {
  report_categories: { column: 'Category Name', addLabel: 'Add Category', itemLabel: 'categories' },
  programs: { column: 'Program Name', addLabel: 'Add Program', itemLabel: 'programs' },
  departments: { column: 'Department Name', addLabel: 'Add Department', itemLabel: 'departments' },
};

function StatusBadge({ status }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
        isActive ? 'bg-[#ECFDF5] text-[#047857]' : 'bg-[#F3F4F6] text-[#4B5563]'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`}
        aria-hidden="true"
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

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

const STORAGE_KEY_LISTS = 'claimit_manage_lists_v1';

export default function ManageLists() {
  const [activeTab, setActiveTab] = useState('report_categories');
  const [listData, setListData] = useState(() => {
    if (typeof window === 'undefined') return INITIAL_DATA;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_LISTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.report_categories && parsed.programs && parsed.departments) {
          return parsed;
        }
      }
    } catch {
      // fallback to initial data
    }
    return INITIAL_DATA;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Save changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY_LISTS, JSON.stringify(listData));
      } catch (err) {
        console.warn('[ClaimIt] Could not save listData to localStorage:', err);
      }
    }
  }, [listData]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const tabs = [
    { id: 'report_categories', label: 'Report Categories', icon: 'category', count: listData.report_categories.length },
    { id: 'programs', label: 'Programs', icon: 'school', count: listData.programs.length },
    { id: 'departments', label: 'Departments', icon: 'corporate_fare', count: listData.departments.length },
  ];

  const meta = TAB_META[activeTab];
  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.label ?? '';

  const filteredItems = useMemo(() => {
    const items = listData[activeTab] || [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [listData, activeTab, searchQuery]);

  // Pagination (page is clamped in case the list shrinks after a delete)
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Modal handlers
  const handleSaveNewItem = (newItemData) => {
    const prefix = activeTab === 'report_categories' ? 'rc' : activeTab === 'programs' ? 'pr' : 'dp';
    const newItem = { id: `${prefix}-${Date.now()}`, name: newItemData.name, status: newItemData.status };
    setListData((prev) => ({ ...prev, [activeTab]: [newItem, ...prev[activeTab]] }));
    setCurrentPage(1);

    recordActivityLog({
      action: 'manage_lists',
      notes: `Added ${meta.column}: ${newItemData.name}`,
      metadata: { tab: activeTab, item: newItem },
    });
  };

  const handleSaveEditItem = (updatedItem) => {
    setListData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    }));

    recordActivityLog({
      action: 'manage_lists',
      notes: `Updated ${meta.column}: ${updatedItem.name}`,
      metadata: { tab: activeTab, item: updatedItem },
    });
  };

  const handleConfirmDelete = (id) => {
    const itemToDelete = (listData[activeTab] || []).find((i) => i.id === id);
    setListData((prev) => ({ ...prev, [activeTab]: prev[activeTab].filter((item) => item.id !== id) }));

    recordActivityLog({
      action: 'manage_lists',
      notes: `Removed ${meta.column}: ${itemToDelete?.name || id}`,
      metadata: { tab: activeTab, id },
    });
  };

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Header — Add button on the right, same position as User Management */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">Manage Lists</h1>
          <p className="text-sm text-[#6E6858]">
            Configure dropdown options available across user report forms, registration, and profile selectors.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer shrink-0"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
          <span>{meta.addLabel}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#E8E4D8] pb-1">
        <div className="flex items-center gap-2 overflow-x-auto" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'font-semibold border-b-2 border-[#5170ff] text-[#5170ff] bg-white'
                    : 'font-medium text-[#6E6858] hover:text-[#23261F] hover:bg-[#F3F4F6]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    isActive
                      ? 'font-semibold bg-[#5170ff] text-white'
                      : 'font-medium bg-[#E8E4D8]/60 text-[#6E6858]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center">
        <div className="relative flex items-center flex-1 max-w-xl">
          <span
            className="material-symbols-outlined absolute left-3 text-[18px] text-[#6E6858] pointer-events-none"
            aria-hidden="true"
          >
            search
          </span>
          <input
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20"
            placeholder={`Search ${activeTabLabel.toLowerCase()}`}
            aria-label={`Search ${activeTabLabel.toLowerCase()}`}
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
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">{meta.column}</th>
                <th className="py-3.5 px-6 whitespace-nowrap" scope="col">Status</th>
                <th className="py-3.5 px-6 text-right" scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 px-6 text-center text-sm text-[#6E6858]">
                    {searchQuery
                      ? `No ${meta.itemLabel} found matching "${searchQuery}".`
                      : `No ${meta.itemLabel} yet.`}
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2.5 px-6 font-medium text-[#23261F]">{item.name}</td>
                    <td className="py-2.5 px-6 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-2.5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          className="inline-flex items-center justify-center p-1 rounded-md text-[#6E6858] hover:text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                          title="Edit"
                          aria-label={`Edit ${item.name}`}
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit</span>
                        </button>
                        <button
                          className="inline-flex items-center justify-center p-1 rounded-md text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                          title="Delete"
                          aria-label={`Delete ${item.name}`}
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
                        </button>
                      </div>
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
          totalItems={filteredItems.length}
          onPageChange={setCurrentPage}
          itemLabel={meta.itemLabel}
        />
      </div>

      <AddModalManageLists
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewItem}
        activeTab={activeTab}
      />

      <EditModalManageLists
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveEditItem}
        item={selectedItem}
        activeTab={activeTab}
      />

      <DeleteModalManageLists
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleConfirmDelete}
        item={selectedItem}
        activeTab={activeTab}
      />
    </div>
  );
}

export { ManageLists };