import React, { useEffect, useRef, useState } from 'react';

const getLocalDateString = () => {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 10);
};

const CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'personal-items', label: 'Personal Items' },
  { value: 'keys', label: 'Keys & Accessories' },
  { value: 'books', label: 'Books & Study Material' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'bags', label: 'Bags & Backpacks' },
  { value: 'ids', label: 'IDs & Cards' },
];

export default function AddReportItem({
  isOpen = false,
  onClose,
  onCancel,
  onSubmit,
  initialType = 'lost',
}) {
  const [reportType, setReportType] = useState(initialType);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(getLocalDateString);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  // Use one close callback to avoid triggering two parent handlers.
  const handleClose = () => {
    (onCancel ?? onClose)?.();
  };

  // Reset the form when it is opened.
  useEffect(() => {
    if (!isOpen) return;

    setReportType(initialType);
    setItemName('');
    setCategory('');
    setDate(getLocalDateString());
    setLocation('');
    setDescription('');
    setSelectedFile(null);
    setSelectedFileName('');
    setImagePreview(null);
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isOpen, initialType]);

  // Allow the user to close the modal with Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a PNG, JPG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('The image must be 10MB or smaller.');
      event.target.value = '';
      return;
    }

    setError('');
    setSelectedFile(file);
    setSelectedFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
    };

    reader.onerror = () => {
      setError('Unable to preview this image. Please try another file.');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setSelectedFileName('');
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (
      !itemName.trim() ||
      !category ||
      !date ||
      !location.trim() ||
      !description.trim()
    ) {
      setError('Please complete all required fields.');
      return;
    }

    const reportData = {
      reportType,
      itemName: itemName.trim(),
      category,
      date,
      location: location.trim(),
      description: description.trim(),
      fileName: selectedFileName,
      imageFile: selectedFile,
      imagePreview,
      createdAt: new Date().toISOString(),
    };

    if (typeof onSubmit !== 'function') {
      setError('The report could not be submitted. Please try again.');
      return;
    }

    // IMPORTANT:
    // The parent component handles closing this modal
    // and opening ReportSubmittedConfirmation.
    onSubmit(reportData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-labelledby="report-item-modal-title"
      aria-modal="true"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-[580px] flex-col overflow-hidden rounded-xl border border-[#E8E4D8] bg-white font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F] shadow-xl">
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E8E4D8] bg-white px-6 py-3.5">
          <div className="flex flex-col gap-1">
            <h2
              id="report-item-modal-title"
              className="text-[18px] font-bold tracking-tight text-[#23261F]"
            >
              Report an Item
            </h2>

            <p className="text-xs text-[#6E6858]">
              Provide details to help reunite this item with its rightful owner.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#23261F]"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4 text-left">
            {/* Report Type */}
            <fieldset className="space-y-2">
              <legend className="block text-xs font-bold uppercase tracking-wider text-[#23261F]">
                Report Type *
              </legend>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReportType('lost')}
                  aria-pressed={reportType === 'lost'}
                  className={`flex min-w-0 flex-1 flex-col rounded-xl p-3 text-left transition-all ${
                    reportType === 'lost'
                      ? 'border-2 border-[#5170FF] bg-[#F0F4FF]'
                      : 'border border-[#E8E4D8] bg-white hover:border-[#5170FF]/40'
                  }`}
                >
                  <span
                    className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${
                      reportType === 'lost'
                        ? 'bg-[#5170FF]/15 text-[#5170FF]'
                        : 'bg-[#F3F4F6] text-[#6E6858]'
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>

                  <span className="text-sm font-semibold text-[#23261F]">
                    Lost Something
                  </span>

                  <span className="mt-0.5 text-[11px] text-[#6E6858]">
                    I'm looking for an item I lost
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('found')}
                  aria-pressed={reportType === 'found'}
                  className={`flex min-w-0 flex-1 flex-col rounded-xl p-3 text-left transition-all ${
                    reportType === 'found'
                      ? 'border-2 border-[#5170FF] bg-[#F0F4FF]'
                      : 'border border-[#E8E4D8] bg-white hover:border-[#5170FF]/40'
                  }`}
                >
                  <span
                    className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${
                      reportType === 'found'
                        ? 'bg-[#5170FF]/15 text-[#5170FF]'
                        : 'bg-[#F3F4F6] text-[#6E6858]'
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6 3V4a1.5 1.5 0 013 0v3.5m0 0V4a1.5 1.5 0 013 0v4.5"
                      />
                    </svg>
                  </span>

                  <span className="text-sm font-semibold text-[#23261F]">
                    Found Something
                  </span>

                  <span className="mt-0.5 text-[11px] text-[#6E6858]">
                    I found an item on campus
                  </span>
                </button>
              </div>
            </fieldset>

            {/* Item Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="report-item-name"
                className="block text-sm font-medium text-[#23261F]"
              >
                Item Name *
              </label>

              <input
                id="report-item-name"
                name="itemName"
                type="text"
                required
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                placeholder="e.g. Matte Black Hydro Flask 32oz"
                className="h-9 w-full rounded-lg border border-[#E8E4D8] bg-white px-3 py-2 text-sm text-[#23261F] transition-all placeholder:text-[#6E6858]/70 focus:border-[#5170FF] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/20"
              />
            </div>

            {/* Category and Date */}
            <div className="flex gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label
                  htmlFor="report-category"
                  className="block text-sm font-medium text-[#23261F]"
                >
                  Category *
                </label>

                <select
                  id="report-category"
                  name="category"
                  required
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-[#E8E4D8] bg-white px-3 text-sm text-[#23261F] focus:border-[#5170FF] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/20"
                >
                  <option value="" disabled>
                    Select a category...
                  </option>

                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <label
                  htmlFor="report-date"
                  className="block text-sm font-medium text-[#23261F]"
                >
                  {reportType === 'lost' ? 'Date Lost *' : 'Date Found *'}
                </label>

                <input
                  id="report-date"
                  name="date"
                  type="date"
                  required
                  max={getLocalDateString()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-9 w-full cursor-pointer rounded-lg border border-[#E8E4D8] bg-white px-3 text-sm text-[#23261F] focus:border-[#5170FF] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/20"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label
                htmlFor="report-location"
                className="block text-sm font-medium text-[#23261F]"
              >
                {reportType === 'lost'
                  ? 'Where did you last have it? *'
                  : 'Where did you find it? *'}
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-[#6E6858]/70">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7z"
                    />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </span>

                <input
                  id="report-location"
                  name="location"
                  type="text"
                  required
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Science Hall 104 or Student Union 2nd floor"
                  className="h-9 w-full rounded-lg border border-[#E8E4D8] bg-white py-2 pl-9 pr-3 text-sm text-[#23261F] transition-all placeholder:text-[#6E6858]/70 focus:border-[#5170FF] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/20"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label
                htmlFor="report-description"
                className="block text-sm font-medium text-[#23261F]"
              >
                Description *
              </label>

              <textarea
                id="report-description"
                name="description"
                required
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Provide identifying marks, stickers, color details, or distinct characteristics..."
                className="h-20 w-full resize-y rounded-lg border border-[#E8E4D8] bg-white px-3 py-2 text-sm text-[#23261F] transition-all placeholder:text-[#6E6858]/70 focus:border-[#5170FF] focus:outline-none focus:ring-2 focus:ring-[#5170FF]/20"
              />
            </div>

            {/* Optional Photo */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#23261F]">
                Photo <span className="font-normal text-[#6E6858]">(Optional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="rounded-xl border-2 border-dashed border-[#E8E4D8] px-3 py-3 text-center transition-all hover:border-[#5170FF]/50 hover:bg-[#F9FAFB]">
                {imagePreview ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <img
                      src={imagePreview}
                      alt="Selected item preview"
                      className="h-10 w-10 rounded-md border border-[#E8E4D8] object-cover"
                    />

                    <span className="max-w-[220px] truncate text-xs font-semibold text-[#23261F]">
                      {selectedFileName}
                    </span>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-medium text-[#5170FF] underline cursor-pointer"
                    >
                      Change
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs font-medium text-[#DC2626] hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center cursor-pointer"
                  >
                    <span className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#5170FF]/10 text-[#5170FF]">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                        />
                      </svg>
                    </span>

                    <span className="text-xs font-semibold text-[#23261F]">
                      Drop an image here or{' '}
                      <span className="text-[#5170FF] underline underline-offset-2">
                        click to browse
                      </span>
                    </span>

                    <span className="mt-1 text-[11px] text-[#6E6858]">
                      PNG, JPG, or WebP up to 10MB
                    </span>
                  </button>
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-[#DC2626]">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#E8E4D8] bg-white px-6 py-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 items-center justify-center rounded-lg border border-[#E8E4D8] bg-white px-5 text-sm font-medium text-[#23261F] transition-colors hover:bg-[#e5eeff] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5170FF] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#4767f6] cursor-pointer"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { AddReportItem };