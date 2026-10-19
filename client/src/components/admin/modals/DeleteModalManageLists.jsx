import React, { useEffect } from 'react';

const TAB_CONFIGS = {
  report_categories: {
    title: 'Delete this category?',
    subtitle: "This category will be permanently deleted. This can't be undone.",
  },
  programs: {
    title: 'Delete this program?',
    subtitle:
      "Students already registered under this program keep their record, but it will no longer appear as an option for new registrations. This can't be undone.",
  },
  departments: {
    title: 'Delete this department?',
    subtitle: "This department will be permanently deleted. This can't be undone.",
  },
};

export default function DeleteModalManageLists({
  isOpen,
  onClose,
  onConfirm,
  category,
  item,
  activeTab = 'report_categories',
  tabType,
}) {
  const currentItem = item || category;
  const currentTab = tabType || activeTab || 'report_categories';
  const config = TAB_CONFIGS[currentTab] || TAB_CONFIGS.report_categories;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentItem) return null;

  const handleConfirm = () => {
    onConfirm(currentItem.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-[480px] bg-white rounded-xl shadow-xl border border-[#E8E4D8] overflow-hidden animate-in zoom-in-95 duration-200 font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Body Content */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            {/* Red Trash Badge Icon */}
            <div className="w-11 h-11 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a]">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="14" y2="15" />
                <line x1="14" y1="11" x2="10" y2="15" />
              </svg>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-[20px] block leading-none">
                close
              </span>
            </button>
          </div>

          {/* Delete Prompt */}
          <div className="mt-4">
            <h2 className="text-[20px] font-bold text-[#23261F] tracking-tight">
              {config.title}
            </h2>
            <p className="text-sm text-[#6E6858] mt-1.5 leading-relaxed">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-[#E8E4D8] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#ba1a1a] hover:opacity-90 rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <span>Yes, delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { DeleteModalManageLists };