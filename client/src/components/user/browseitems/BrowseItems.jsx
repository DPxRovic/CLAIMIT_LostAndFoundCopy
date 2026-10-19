import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import ItemCard from './ItemCard.jsx';
import { BrowseItemDetailsModal } from './BrowseItemDetailsModal.jsx';
import { BrowseItemActionModal } from './BrowseItemActionModal.jsx';
import { BrowseItemSuccessModal } from './BrowseItemSuccessModal.jsx';

// ---------------------------------------------------------------------------
// Shared UI (identical in Browse Items, Claims & Matches and My Reports)
// ---------------------------------------------------------------------------
const INTER_FONT_FAMILY =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

// Loads Inter and applies it app-wide (including modals rendered outside this page)
const INTER_FONT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
html, body, button, input, select, textarea { font-family: ${INTER_FONT_FAMILY}; }
.font-headline, .font-sans { font-family: ${INTER_FONT_FAMILY} !important; }
`;

const normalizeOption = (opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt);

/**
 * Shared search bar
 * @param {{ value: string, onChange: (v: string) => void, placeholder?: string, className?: string }} props
 */
const SearchBar = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative w-full ${className}`}>
    <Search
      className="w-4 h-4 text-[#6E6858] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
      aria-hidden="true"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full h-10 pl-10 pr-9 bg-white border border-[#E8E4D8] rounded-xl text-sm text-[#23261F] placeholder:text-[#9A957F] focus:outline-none focus:border-[#5B6CF0] focus:ring-2 focus:ring-[#5B6CF0]/20 transition-colors"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6858] hover:text-[#23261F] cursor-pointer"
        aria-label="Clear search"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

/**
 * Shared popover-style filter dropdown
 * @param {{
 *   title: string,
 *   value: string,
 *   options: Array<string | { value: string, label: string }>,
 *   onChange: (v: string) => void,
 *   resetValue?: string,
 *   align?: 'left' | 'right',
 *   className?: string
 * }} props
 */
const FilterDropdown = ({
  title,
  value,
  options,
  onChange,
  resetValue,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const items = useMemo(() => options.map(normalizeOption), [options]);
  const selected = items.find((i) => i.value === value) || items[0];
  const defaultValue = resetValue !== undefined ? resetValue : items[0]?.value;
  const isDefault = value === defaultValue;

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={wrapperRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={title}
        className={`inline-flex items-center justify-between gap-2.5 h-10 px-3.5 bg-white border rounded-xl text-sm text-[#23261F] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CF0]/30 ${
          isOpen ? 'border-[#5B6CF0]' : 'border-[#E8E4D8] hover:bg-gray-50'
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#6E6858] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          className={`absolute z-30 mt-2 w-max min-w-[200px] max-w-[17rem] bg-white border border-[#E8E4D8] rounded-2xl shadow-xl ${
            align === 'right' ? 'left-0 sm:left-auto sm:right-0' : 'left-0'
          }`}
        >
          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]">
            {title}
          </div>

          <div role="listbox" aria-label={title} className="px-2 py-1 flex flex-col gap-0.5">
            {items.map((item) => {
              const isActive = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onChange(item.value)}
                  className={`w-full flex items-center justify-between gap-6 px-3 py-2 rounded-xl text-sm text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CF0]/30 ${
                    isActive
                      ? 'bg-[#E3E7FF] text-[#23261F] font-semibold'
                      : 'text-[#3F4238] font-medium hover:bg-[#EEF0FF]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <Check className="w-4 h-4 text-[#4F5BD5] shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E8E4D8]">
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              disabled={isDefault}
              className={`text-xs font-medium transition-colors ${
                isDefault
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-[#6E6858] hover:text-[#23261F] cursor-pointer'
              }`}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#5B6CF0] hover:bg-[#4A5BDF] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// ---------------------------------------------------------------------------


export const DEFAULT_BROWSE_ITEMS = [
  {
    id: 'airpods-pro-2',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Sep 09, 2026',
    location: 'Congress Campus - Library',
    reportedTime: 'Reported 2 days ago',
    postedBy: 'Hannah Puerta (BS Computer Science)',
    description: 'White apple AirPods Pro with scratches.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC_O6MmcQqb46ZGcyzeTfXUwjVOrcA7pt-7KkZ4WHcZdRPV7BZmYaaYd6mtsib7Sc6PZVjQGxu46ep5UehnPK10IavovbjmraJxe04mEOIPuQmCE6uPsEjssyArCGewkghdRPgbVII2ykI6a_n-9lkrEE458d3HGJAYOwGIOtU_Stv4dDE5uLL3YiKWreMnUdg1N5-VsDRVQPLfWys_sSuTWOJE7hyn7CaBvbVjRoC1oS9ZdKzcIJSUQ',
    imageAlt: 'Apple AirPods Pro second generation with charging case',
  },
  {
    id: 'black-leather-wallet',
    title: 'Black Leather Bifold Wallet',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Aug 29, 2026',
    location: 'Bagong Silang Campus – Canteen',
    reportedTime: 'Reported 1 week ago',
    postedBy: 'Paolo Dizon (BS Accountancy)',
    description: 'LV wallet. Please describe the items inside if you think this is yours.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCERDryOxxsewZHFZ_peWEfmLuoB7SbV9hy38LnUH474HsCCoEuZ9ZDjve1FiMPevRhRTK7ahcTnnv4IsidvjPNcYBUZZZo5dM8E7mdJow1mWJELVDrnJqf1ZT4Dv_xxlFWGYZlN18DOyhSS0JHxgONQcm4R2auBx8PCf5GiSthmZbISrgkx3SRnbv4S6mMRexNIX4pAINlXOODJRmeIiOOJB1TXfjZ8NCRe2Escodacliycd7CDSlLNQ',
    imageAlt: 'Black grain leather bifold wallet',
  },
  {
    id: 'hydro-flask-32oz',
    title: 'Hydro Flask 32oz Navy',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Science Hall 104',
    reportedTime: 'Reported 3 days ago',
    postedBy: 'Marcus Vance (BS Biology)',
    description: 'Navy blue 32oz Hydro Flask with stainless steel loop cap. Minimal scuffs along bottom rim.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6tWbpguWrLQHmnQ5US7mPJsyaDaf1i1EtLNKM3N4SjSDL3GLeAwfJpAysAbXwT298AAVjM2m92xTZLqKMma1MaheYWENk6gglSc7ijOOAUY-CpIzLOk8NTedsZf2NX86uhT8oxy3k-Ar1RGkKAm53vMmMzRFNogKRF36lolbxkc8r4yKOkyHKeBvsvI0F73tb1EZTitfZPqBU57cGYthS87ANF3LRCHEsYKW2HZFk6zd_PQiX1-8g8w',
    imageAlt: 'Navy Hydro Flask bottle outdoors with climbing gear',
  },
  {
    id: 'keys-campus-lanyard',
    title: 'Keys with Red Campus Lanyard',
    category: 'KEYS & ACCESSORIES',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Rec Center Lockers',
    reportedTime: 'Reported 3 days ago',
    postedBy: 'Coach Ramirez (Athletics Dept)',
    description: 'Ring with 3 brass door keys and campus red strap. Has a small metallic whistle attached.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2pQgqAU8FBvHs78Vmf5dmzkB1BAGM-MYGXLH2Hgt_DbzhwdKIzHbTr6f7BYypkR0gI56j_BNeU6LD74vor4EwrCWRhCGz3H9ZgQaJJ-2AciSYE1zJhQSGezfdvwEPfPfuJO8ps7hCtTp7aBVZRDF0hECAP1gV9m1ix5yg76FBcegCvp84ANyJmitk0vtyakOAnvCmaGJHGFZzq1CIANoTkyl-0NPjmOeoPEGzMXV0uZnXX9osJDFnNw',
    imageAlt: 'Keys with red campus strap and fob',
  },
  {
    id: 'calculus-textbook-9th',
    title: 'Calculus: Early Transcendentals 9th Ed',
    category: 'BOOKS & STUDY MATERIAL',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 23, 2025',
    location: 'Math & Science Bldg',
    reportedTime: 'Reported 4 days ago',
    postedBy: 'Chloe Chen (BS Mathematics)',
    description: 'Hardcover Stewart Calculus 9th edition. Several sticky notes inside chapters 4 through 6.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd-Q3IfZLJhrRk6SOdTvaKWt6ivPBXqkdK-2Ta6b2L0nuRL4JklkwR8Lu391niFdb2tAv4M7qemA5EiICfGNJ0bDgxqhpoYZ8QcLQNLsoiD862lol907_uXvKMQwz5o4FptAd01exC7K2j8wJj2ocJVYgvGDtQftNHARCy3MzR4fNQtnQbbeXNYet6UpxdBv_4i9bZ6jOwEPBL3rEo9cMZzawOwoUsJZCzqAxRHmDfAXaqN4gLux79_g',
    imageAlt: 'Calculus Early Transcendentals textbook',
  },
  {
    id: 'sony-wh1000xm5',
    title: 'Sony WH-1000XM5 Headphones',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 23, 2025',
    location: 'Library 3rd Floor',
    reportedTime: 'Reported 4 days ago',
    postedBy: 'David Kim (BS Mechanical Engineering)',
    description: 'Matte black Sony wireless noise cancelling headphones in matching zippered case with USB-C cable.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCAULVMR8fNlyLIUxx6WBrHNN37i0AAoEgfKDzyZ4HzdND1KTUJQLMYemtvoTxX_D_AwQirC6i782wPmpEbP23267Tmy2QNS6eBkt6iu8algEnZ7DFuod_5fMMdWkBDMpkKiImiaKgmW0pJmr7WyHb9Rq_1aW0Q9bYrON4oqYm5j-U8Oq7XBGSEDV-GhjLBdIKE9NSmdaq2wUU5JuHWdKzYcZNP5qccx39s42-2tuw9i8nRHOchGui4bA',
    imageAlt: 'Matte black Sony wireless headphones',
  },
  {
    id: 'north-face-jacket',
    title: 'North Face Resolve Rain Jacket',
    category: 'APPAREL & BAGS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 21, 2025',
    location: 'Student Union Info Desk',
    reportedTime: 'Reported 6 days ago',
    postedBy: 'Samantha Lee (BA Communications)',
    description: 'Black waterproof North Face hooded jacket, medium size, left on dining booth seat.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRW-pbjHLqbjbsOXuj2JlZ34t2e5cnXaNiUSjMOV7BWQQ2i7zX3WNyd_LpVsstX0_UDd0nRzbSX1nXEPqSW4LeiV0TDpCKDaLdSUhdPdP6bmCG2MoVCuEulSSVPhjllFvMiK6s97F9lGz4nkZHvd8GdLuttc_e8IW1bataFbBGA-8VchgG9jnmRZiXsjzo9tMnjF3WKEbR1odgkWhhIIWpKb7CdsTvu2rTGWHNFtgfQJtcH3xNv_EvwA',
    imageAlt: 'North Face hooded rain jacket',
  },
  {
    id: 'hp-laptop-charger',
    title: 'HP 65W USB-C Laptop Charger',
    category: 'ELECTRONICS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 20, 2025',
    location: 'Engineering Hall 204',
    reportedTime: 'Reported 1 week ago',
    postedBy: 'Prof. Santos (College of Engineering)',
    description: 'Black HP 65W USB-C power block charger left plugged in near lecture lectern.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeousHM6qo8qNrC8f44Uo50n7WOJKJsBqKrMGzOJ_n4abz4dUg5knGGDNKCgM7FiT38jekNjbYF62J1XfOmRCw1FkJbHnFu7-J5P6pIJndaXR_GoFpAODhfWAVVUCwqBN0oReOS9hrQ7g3Zsq2Hv4qRbIzJCIu7EkliaKGSy_loIq1acZppOEr8F3qXQrxnshh32Zk2aKrtUoOlkISpm3WfqzoxX0sx7gJ-QMJmohAiwGs6Fcs4Yj9Fg',
    imageAlt: 'Black HP laptop power adapter charger',
  },
  {
    id: 'campus-onecard-sarah',
    title: 'Campus OneCard ID (Sarah M.)',
    category: 'IDS & CARDS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 19, 2025',
    location: 'Dining Commons Register 2',
    reportedTime: 'Reported Oct 19',
    postedBy: 'Dining Commons Staff',
    description: 'Student campus identification card in transparent lanyard sleeve.',
    imageUrl:
      'https://images.unsplash.com/photo-1578357078586-491adf1aa5ba?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'University student identification OneCard held in lanyard',
  },
  {
    id: 'ti-84-calculator',
    title: 'TI-84 Plus CE Graphing Calculator',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 19, 2025',
    location: 'Engineering Hall 110',
    reportedTime: 'Reported Oct 19',
    postedBy: 'Alex Rivera (BS Civil Engineering)',
    description: 'Black TI-84 Plus CE graphing calculator with initials AR etched on back slide case.',
    imageUrl:
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Black TI-84 Plus CE graphing calculator on grid notebook paper',
  },
  {
    id: 'tortoise-sunglasses',
    title: 'Tortoise Shell Sunglasses',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 18, 2025',
    location: 'North Quad Courtyard',
    reportedTime: 'Reported Oct 18',
    postedBy: 'Campus Grounds Crew',
    description: 'Round tortoise shell sunglasses found on concrete bench near courtyard oak tree.',
    imageUrl:
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Tortoise shell sunglasses resting on boulder stone',
  },
  {
    id: 'fjallraven-backpack',
    title: 'Fjallraven Kanken Ochre Backpack',
    category: 'APPAREL & BAGS',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 18, 2025',
    location: 'Rec Center Gym Area',
    reportedTime: 'Reported Oct 18',
    postedBy: 'Mia Torres (BS Nursing)',
    description: 'Ochre yellow Fjallraven daypack backpack with two campus enamel pins on front pocket.',
    imageUrl:
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Ochre yellow Fjallraven Kanken square daypack backpack',
  },
];

// Pagination arrow buttons: same design as the admin tables, My Reports and Claims & Matches
const pagerArrowClass =
  'h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-[#E8E4D8] bg-white text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  { value: 'LOST', label: 'Lost Only' },
  { value: 'FOUND', label: 'Found Only' },
];

const SORT_OPTIONS = [
  { value: 'NEWEST', label: 'Newest First' },
  { value: 'OLDEST', label: 'Oldest First' },
  { value: 'TITLE_ASC', label: 'Alphabetical (A-Z)' },
];

// "KEYS & ACCESSORIES" -> "Keys & Accessories", "IDS & CARDS" -> "IDs & Cards"
const formatCategory = (raw) =>
  raw
    .split(' ')
    .map((word) => {
      if (word === 'IDS') return 'IDs';
      if (word === '&') return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

/**
 * @param {Object} [props]
 * @param {Array} [props.items]
 * @param {((item: any) => void)} [props.onItemClick]
 * @param {(() => void)} [props.onNavigateToClaims]
 * @param {string} [props.className]
 */
export const BrowseItems = ({
  items = DEFAULT_BROWSE_ITEMS,
  onItemClick,
  onNavigateToClaims,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [activeItemDetails, setActiveItemDetails] = useState(null);
  const [actionModalConfig, setActionModalConfig] = useState(null); // { item, mode: 'claim' | 'found_report' }
  const [successData, setSuccessData] = useState(null); // { item, mode, ticketId, ... } after submitting

  // Category options built dynamically from the items
  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.category)));
    return [
      { value: 'ALL', label: 'All Categories' },
      ...unique.map((cat) => ({ value: cat, label: formatCategory(cat) })),
    ];
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(
        (item) => item.category.toUpperCase() === selectedCategory.toUpperCase()
      );
    }

    // Type filter (LOST / FOUND)
    if (selectedType !== 'ALL') {
      result = result.filter((item) => item.type === selectedType);
    }

    // Sort order
    if (sortBy === 'NEWEST') {
      // Items are listed newest first by default in dataset
    } else if (sortBy === 'OLDEST') {
      result.reverse();
    } else if (sortBy === 'TITLE_ASC') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [items, searchQuery, selectedCategory, selectedType, sortBy]);

  const totalItemsCount = 48; // Preserved nominal total from original campus directory design

  // Handle card click
  const handleCardClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
    setActiveItemDetails(item);
  };

  // Switch from details modal to action modal (Claim or Found Report)
  const handleOpenAction = (item, actionType) => {
    setActiveItemDetails(null);
    setActionModalConfig({ item, mode: actionType });
  };

  // ← in the action form: back to the item details
  const handleBackToDetails = () => {
    const item = actionModalConfig?.item;
    setActionModalConfig(null);
    if (item) setActiveItemDetails(item);
  };

  // Submit action modal -> show the success popup
  const handleActionSuccess = (submissionData) => {
    setActionModalConfig(null);
    setSuccessData(submissionData);
  };

  return (
    <div
      className={`flex flex-col gap-6 w-full ${className}`}
      style={{ fontFamily: INTER_FONT_FAMILY }}
    >
      <style>{INTER_FONT_CSS}</style>

      {/* Page Header (same as My Reports) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">
            Browse Items
          </h1>
          <p className="text-sm text-[#6E6858] mt-1">
            Find lost belongings or report items found across campus. Filter by type, category,
            building, and date to reconnect with your valuables.
          </p>
        </div>
      </div>

      {/* Search and Filters: one row, same bar as My Reports / Claims & Matches */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchBar
            className="flex-1"
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
            placeholder="Search listings by keywords"
          />

          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              title="Filter by category"
              value={selectedCategory}
              options={categoryOptions}
              onChange={(v) => {
                setSelectedCategory(v);
                setCurrentPage(1);
              }}
            />
            <FilterDropdown
              title="Filter by type"
              value={selectedType}
              options={TYPE_OPTIONS}
              align="right"
              onChange={(v) => {
                setSelectedType(v);
                setCurrentPage(1);
              }}
            />
            <FilterDropdown
              title="Sort by"
              value={sortBy}
              options={SORT_OPTIONS}
              align="right"
              onChange={setSortBy}
            />
          </div>
        </div>
      </div>

      {/* Item count (above the cards) + grid of Item Cards */}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#6E6858]">
          Showing <span className="font-semibold text-[#23261F]">{filteredItems.length}</span> of{' '}
          <span className="font-semibold text-[#23261F]">{totalItemsCount}</span> items
        </p>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-slate-700 font-medium text-sm">No items match your filter criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedType('ALL');
            }}
            className="text-xs text-[#2563eb] hover:underline font-semibold mt-1 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      </div>

      {/* Bottom Pagination (original layout; buttons use the same design as the other pages) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 pb-2 text-xs text-slate-500">
        <div>
          Showing listings 1–{filteredItems.length} of {totalItemsCount} items across 4 campuses
        </div>

        <nav className="flex items-center gap-1.5 self-center sm:self-auto" aria-label="Pagination">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={pagerArrowClass}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            <span>Previous</span>
          </button>

          {[1, 2, 3, 4].map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={
                currentPage === page
                  ? 'h-8 min-w-8 px-2 rounded-lg border border-[#5170ff] bg-[#5170ff] text-xs font-semibold text-white'
                  : 'h-8 min-w-8 px-2 rounded-lg border border-[#E8E4D8] bg-white text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer'
              }
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(4, p + 1))}
            disabled={currentPage === 4}
            className={pagerArrowClass}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      </div>

      {/* 1. Item Details Modal (Image 1 & Image 3) */}
      {activeItemDetails && (
        <BrowseItemDetailsModal
          isOpen={Boolean(activeItemDetails)}
          item={activeItemDetails}
          onClose={() => setActiveItemDetails(null)}
          onOpenAction={handleOpenAction}
        />
      )}

      {/* 2. Action Form Modal (Image 2 & Image 4) */}
      {actionModalConfig && (
        <BrowseItemActionModal
          isOpen={Boolean(actionModalConfig)}
          item={actionModalConfig.item}
          mode={actionModalConfig.mode}
          onClose={() => setActionModalConfig(null)}
          onBack={handleBackToDetails}
          onSubmitSuccess={handleActionSuccess}
        />
      )}

      {/* 3. Success popup after submitting (claim or found report) */}
      <BrowseItemSuccessModal
        isOpen={Boolean(successData)}
        data={successData}
        onClose={() => setSuccessData(null)}
        onNavigateToClaims={onNavigateToClaims}
      />
    </div>
  );
};

export default BrowseItems;