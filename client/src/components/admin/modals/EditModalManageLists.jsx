import React, { useState, useEffect, useRef } from 'react';

const TAB_CONFIGS = {
  report_categories: {
    title: 'Edit Category',
    subtitle: 'Changes apply immediately to report forms and browse filters.',
    fieldLabel: 'Category Name',
  },
  programs: {
    title: 'Edit Program',
    subtitle: "Update this program's details.",
    fieldLabel: 'Program Name',
  },
  departments: {
    title: 'Edit Department',
    subtitle: "Changes apply to the registration form's department selector.",
    fieldLabel: 'Department Name',
  },
};

export default function EditModalManageLists({
  isOpen,
  onClose,
  onSave,
  category,
  item,
  activeTab = 'report_categories',
  tabType,
}) {
  const currentItem = item || category;
  const currentTab = tabType || activeTab || 'report_categories';
  const config = TAB_CONFIGS[currentTab] || TAB_CONFIGS.report_categories;

  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentItem) {
      setName(currentItem.name || '');
      setStatus(currentItem.status || 'active');
      setError('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, currentItem]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(`Please enter a ${config.fieldLabel.toLowerCase()}`);
      return;
    }
    onSave({
      ...currentItem,
      name: trimmed,
      status: status,
    });
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
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#E8E4D8]">
          <div className="flex flex-col gap-1 pr-4">
            <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">
              {config.title}
            </h2>
            <p className="text-[13px] text-[#6E6858] leading-relaxed">
              {config.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:text-[#0b1c30] hover:bg-[#e5eeff] transition-colors shrink-0 cursor-pointer"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px] block leading-none">
              close
            </span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-5">
            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#23261F]">
                {config.fieldLabel} <span className="text-[#DC2626]">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#23261F] placeholder:text-[#6E6858]/60 transition-colors focus:outline-none ${
                  error
                    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
              {error && <span className="text-xs text-[#DC2626]">{error}</span>}
            </div>

            {/* Status Radio Pills */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-semibold text-[#23261F]">
                Initial Status <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-2 p-1 rounded-lg border border-[#E8E4D8] bg-white gap-1">
                {/* Active Option */}
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    status === 'active'
                      ? 'bg-[#EFF4FF] text-[#5170ff] font-semibold'
                      : 'text-[#6E6858] hover:text-[#23261F]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      status === 'active' ? 'bg-[#5170ff]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>Active</span>
                </button>

                {/* Inactive Option */}
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    status === 'inactive'
                      ? 'bg-[#F3F4F6] text-[#23261F] font-semibold'
                      : 'text-[#6E6858] hover:text-[#23261F]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-colors ${
                      status === 'inactive' ? 'bg-[#6B7280]' : 'bg-[#CBD5E1]'
                    }`}
                  />
                  <span>Inactive</span>
                </button>
              </div>
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
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#5170ff] hover:bg-[#4767f6] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { EditModalManageLists };