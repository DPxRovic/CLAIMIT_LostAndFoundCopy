import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, CheckCircle, Search, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { WithdrawClaimMatchModal } from './WithdrawClaimMatchModal';
import { ClaimMatchMessageModal } from './ClaimMatchMessageModal';
import { ClaimMatchDetailsModal } from './ClaimMatchDetailsModal';

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


/**
 * Hardcoded claims dataset matching the exact reference layout
 */
export const DEFAULT_CLAIMS = [
  {
    id: '#CLM-8492',
    title: 'Clear umbrella with green trim',
    category: 'Clothing & Apparel',
    type: 'Lost Claim',
    submitted: 'Sep 16, 2026',
    status: 'Withdrawn',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDElfiIkRd79aiY-JhMgovFfs6Z1nwwv4PJvASx_6koqpHyuXTJNc7OYgUux5ekSEE_odOiuJOx8YHvKOFL0auRactt-UVjj9MPMXo5atVoeH6RC9tC4dY8PfnAcIG00VYvyGlk-T3N745lgVlmL6x6K9A4lOlN5VpQRvc1JpJOXo7QOKsMkmwe8DFL3zIZjXBOaBtQxDvzaCWLeP-QORGBZBpXNZiu8-PYu_zp0DoPKouQG8BljJ0Wng',
    iconType: 'umbrella',
    posterName: 'Security Desk Lead',
    location: 'Science Hall 102',
    foundDate: 'September 16, 2026',
    claimedDate: 'Claimed Sep 16, 2026 • Withdrawn',
    description: 'Found left in Science Hall lecture room 102 under row C seats during rainy afternoon.',
    userProof: 'Clear bubble canopy with lime green edge trim and curved handle. Left during Physics lecture.',
    attachmentName: 'receipt_umbrella_store.png',
    attachmentUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDElfiIkRd79aiY-JhMgovFfs6Z1nwwv4PJvASx_6koqpHyuXTJNc7OYgUux5ekSEE_odOiuJOx8YHvKOFL0auRactt-UVjj9MPMXo5atVoeH6RC9tC4dY8PfnAcIG00VYvyGlk-T3N745lgVlmL6x6K9A4lOlN5VpQRvc1JpJOXo7QOKsMkmwe8DFL3zIZjXBOaBtQxDvzaCWLeP-QORGBZBpXNZiu8-PYu_zp0DoPKouQG8BljJ0Wng', // stand-in: replace with the uploaded proof photo URL
    attachmentSize: '840 KB',
    handoverLocation: 'Campus Lost & Found Desk - Student Center Rm 210',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 16, 9:15 AM', completed: true },
      { step: 'Under Verification', date: 'Sep 16, 11:30 AM', completed: true },
      { step: 'Withdrawn by User', date: 'Sep 16, 2:10 PM', completed: true, current: true },
    ],
  },
  {
    id: '#CLM-8401',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'Electronics',
    type: 'Found Claim',
    submitted: 'Sep 15, 2026',
    status: 'Pending',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ-p-PVJuZ3M3F6g6WthSsKMaRgzboUZBXvrHPbuc-LS0798_O7ULhuVYGHl-CqxeedN8ujsiv5vzqBGC5u4-pKpmS08lYj8XwXRUsWyBwI3yMMOsETk7FYRpWecxU43aYckGgwXPyQKKAM7aoKcmGO3QkEMNMAed-Hrl-8iRJD5r_m2sNghhAaJTz_4BOlZpZOnDB2CiVcBG2Hl9irNzxHyslYyGtybqBTWTtjc4qV6OoPGUyiL0oRw',
    iconType: 'airpods',
    posterName: 'Marco Villanueva',
    location: 'Engineering Quad',
    foundDate: 'September 14, 2026',
    claimedDate: 'Claimed Sep 15, 2026',
    unreadUpdates: true,
    description: 'White MagSafe charging case with faint hairline scratch on bottom rim. Bluetooth name verified.',
    userProof: 'AirPods Pro 2 case with scratch on base. Serial ending in 8X9Q and Bluetooth device named Lia Pro.',
    attachmentName: 'bluetooth_settings_screen.png',
    attachmentUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ-p-PVJuZ3M3F6g6WthSsKMaRgzboUZBXvrHPbuc-LS0798_O7ULhuVYGHl-CqxeedN8ujsiv5vzqBGC5u4-pKpmS08lYj8XwXRUsWyBwI3yMMOsETk7FYRpWecxU43aYckGgwXPyQKKAM7aoKcmGO3QkEMNMAed-Hrl-8iRJD5r_m2sNghhAaJTz_4BOlZpZOnDB2CiVcBG2Hl9irNzxHyslYyGtybqBTWTtjc4qV6OoPGUyiL0oRw', // stand-in: replace with the uploaded proof photo URL
    attachmentSize: '1.2 MB',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Engineering Quad Security Post',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 15, 3:45 PM', completed: true },
      { step: 'Awaiting Verification', date: 'Sep 15, 4:00 PM', completed: true, current: true },
      { step: 'Approval & Handover Code', date: 'Pending review', completed: false },
    ],
  },
  {
    id: '#CLM-7923',
    title: 'Ring of three keys, red lanyard',
    category: 'Keys & Accessories',
    type: 'Lost Claim',
    submitted: 'Sep 14, 2026',
    status: 'Approved',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3pzvaVJ-Abi0wPYwzm5YE9siASmc3OfbTQa9BLhGg4vWYj4iSPSZMMIrzZP1rjShNP7qT563qJJtG0WcqnPo8_zXxK-LyUrGtVw8R4YeAvH6BLdokiJ1kPt9JDnpyy45_mszIWq0rf7qlpHd543EZhP1oBk2YY9fGpscB6tsb18QjAF5rqZbCG__brAKAIlQwWbRZ7oedo9o_0h9RCjElcl0w0DQwY2K5EJTV5aELiQEYa0DFHUwzMA',
    iconType: 'keys',
    contactPerson: 'Ana Reyes',
    posterName: 'Ana Reyes (BS Psychology)',
    location: 'Isles',
    foundDate: 'September 14, 2026',
    claimedDate: 'Claimed Sep 14, 2026',
    unreadUpdates: true,
    description: 'Three keys on a red lanyard with a small silver tag.',
    userProof: 'One house key, one padlock key and a tiny silver mailbox key. The lanyard is red with IT 2A written on it. I lost it last Friday around 2 pm.',
    handoverLocation: 'Main Library Service Desk (Floor 1)',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 14, 10:20 AM', completed: true },
      { step: 'Matched with Found Item', date: 'Sep 14, 1:15 PM', completed: true },
      { step: 'Approved for Handover', date: 'Sep 15, 9:00 AM', completed: true, current: true },
      { step: 'Picked Up', date: 'Pending pickup', completed: false },
    ],
  },
  {
    id: '#CLM-6180',
    title: 'Casio scientific calculator fx-991',
    category: 'Books & Study Material',
    type: 'Lost Claim',
    submitted: 'Sep 12, 2026',
    status: 'Declined',
    iconType: 'calculator',
    posterName: 'Marco Villanueva (BS Computer Science)',
    location: 'Guard House',
    foundDate: 'September 12, 2026',
    claimedDate: 'Claimed Sep 12 • Declined',
    description: 'Casio fx-991 scientific calculator with dark gray sliding hard cover.',
    userProof: 'Casio scientific calculator fx-991 with faint silver initials MV on reverse battery plate. Left on table 4.',
    attachmentName: 'calculator_model.png',
    attachmentSize: '420 KB',
    declinedReason: 'Marco Villanueva reviewed your submitted proof and marked it as non-matching with the found item.',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Mathematics Department Reception (Hall 4)',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 12, 8:40 AM', completed: true },
      { step: 'Evidence Evaluated', date: 'Sep 12, 2:00 PM', completed: true },
      { step: 'Claim Declined', date: 'Sep 13, 10:15 AM', completed: true, current: true },
    ],
  },
  {
    id: '#CLM-5902',
    title: 'Silver 14" M2 MacBook Air',
    category: 'Electronics',
    type: 'Found Claim',
    submitted: 'Sep 11, 2026',
    status: 'Approved',
    iconType: 'laptop',
    contactPerson: 'Crystal',
    posterName: 'Crystal (Security HQ)',
    location: 'South Gate Pavilion',
    foundDate: 'September 11, 2026',
    claimedDate: 'Claimed Sep 11, 2026',
    unreadUpdates: true,
    description: 'Silver MacBook Air in transparent snap-on shell. Password lock matched and student ID verified.',
    userProof: 'Silver MacBook Air with clear hard shell. Custom desktop wallpaper is university library at sunset.',
    handoverLocation: 'Main Campus Security HQ (South Gate Pavilion)',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 11, 11:30 AM', completed: true },
      { step: 'Serial & Mac Address Verified', date: 'Sep 11, 3:20 PM', completed: true },
      { step: 'Approved by Crystal', date: 'Sep 12, 9:45 AM', completed: true, current: true },
      { step: 'Handover & Sign-off', date: 'Ready for collection', completed: false },
    ],
  },
  {
    id: '#CLM-5421',
    title: 'Ray-Ban Clubmaster Sunglasses',
    category: 'Keys & Accessories',
    type: 'Lost Claim',
    submitted: 'Sep 10, 2026',
    status: 'Pending',
    iconType: 'glasses',
    posterName: 'Coach Rivera (Recreation Center)',
    location: 'Recreation Center Front Counter',
    foundDate: 'September 10, 2026',
    claimedDate: 'Claimed Sep 10, 2026',
    description: 'Classic tortoiseshell/gold frames in black textured leather Ray-Ban protective case.',
    userProof: 'Ray-Ban Clubmaster with dark green lenses in black case with Ray-Ban microfiber cloth.',
    handoverLocation: 'Recreation Center Lost & Found Front Counter',
    timeline: [
      { step: 'Claim Submitted', date: 'Sep 10, 4:55 PM', completed: true },
      { step: 'Awaiting Match Confirmation', date: 'Sep 11, 10:00 AM', completed: true, current: true },
      { step: 'Handover Scheduled', date: 'Pending', completed: false },
    ],
  },
  {
    id: '#CLM-4890',
    title: 'Hydro Flask 32oz Wide Mouth (Olive)',
    category: 'Others',
    type: 'Found Claim',
    submitted: 'Aug 28, 2026',
    status: 'Approved',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7yA0c_LqpyGUcRUuqYtQmtFcAf-fwdBO2sdwnVJ4M8gTnH1n1sya1yMDnwvpezsPBzNwl9j1EOiAaH7aprtCRylNe_3fZOe4ieFp-DU_kv6JDmkgxzyeP61QX-2aTuIphIsaG7Fb_JNU2hoJIvX2y2VR8p7_koOP0NvIB5bP-ExjLAbpf6UnfFQhFjLYUSuyIqdQmrb-q_1cNie3_vqMOEYvlhi7_cz8Jn4mBSPGcEEaN_FmqQPPTJg',
    iconType: 'bottle',
    contactPerson: 'Rachel Vance',
    posterName: 'Rachel Vance (BS Biology)',
    location: 'Student Union Info Desk',
    foundDate: 'August 28, 2026',
    claimedDate: 'Claimed Aug 28, 2026',
    description: 'Olive green bottle with boot accessory and slight dent on the bottom lip. Left at outdoor pavilion table.',
    userProof: 'Olive green Hydro Flask with black silicone flex boot and small dent on base. National park sticker on lid.',
    handoverLocation: 'Student Union Info Desk (Ground Floor)',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 28, 1:10 PM', completed: true },
      { step: 'Match Confirmed by Rachel', date: 'Aug 29, 10:45 AM', completed: true },
      { step: 'Approved for Handover', date: 'Aug 30, 8:30 AM', completed: true, current: true },
      { step: 'Collected', date: 'Ready for pickup', completed: false },
    ],
  },
  {
    id: '#CLM-8402',
    title: 'Velzo Backpack',
    category: 'Bags & Wallets',
    type: 'Found Claim',
    submitted: 'Aug 25, 2026',
    status: 'Pending',
    posterName: 'Marco Villanueva',
    location: 'Social Hall',
    foundDate: 'August 25, 2026',
    claimedDate: 'Claimed Aug 25, 2026',
    unreadUpdates: true,
    description: 'Dark gray Velzo backpack with dual side water bottle mesh and front zippered pouch left in Social Hall.',
    userProof: 'Dark gray Velzo backpack containing CS 101 notebook and grey earphones. Front pocket has my student ID badge.',
    contactPerson: 'Marco Villanueva',
    handoverLocation: 'Social Hall Security Station',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 25, 3:45 PM', completed: true },
      { step: 'Awaiting Verification', date: 'Aug 25, 4:00 PM', completed: true, current: true },
      { step: 'Approval & Handover Code', date: 'Pending review', completed: false },
    ],
  },
  {
    id: '#CLM-7810',
    title: 'Navy Blue Patagonia Backpack',
    category: 'Bags & Wallets',
    type: 'Found Claim',
    submitted: 'Aug 24, 2026',
    status: 'Pending',
    iconType: 'backpack',
    posterName: 'David Santos (Campus Safety)',
    location: 'Administration West',
    foundDate: 'August 24, 2026',
    claimedDate: 'Claimed Aug 24, 2026',
    unreadUpdates: true,
    description: 'Navy blue daypack with water bottle side pouch, containing spiral notebook and USB-C charger.',
    userProof: 'Patagonia Refugio pack with blue carabiner attached to top haul handle. Inside has CS notebooks.',
    handoverLocation: 'Campus Safety Office - Administration West',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 24, 2:10 PM', completed: true },
      { step: 'Staff Reviewing Evidence', date: 'Aug 24, 11:00 AM', completed: true, current: true },
      { step: 'Final Verification', date: 'In progress', completed: false },
    ],
  },
  {
    id: '#CLM-4311',
    title: 'Black leather wallet with student ID',
    category: 'IDs & Campus Cards',
    type: 'Lost Claim',
    submitted: 'Aug 22, 2026',
    status: 'Declined',
    iconType: 'wallet',
    posterName: 'Campus Card Center Desk',
    location: 'Campus Card & Identification Center',
    foundDate: 'August 22, 2026',
    claimedDate: 'Claimed Aug 22 • Declined',
    description: 'Black bi-fold leather wallet with student ID and transit card in transparent ID slot.',
    userProof: 'Black leather Fossil wallet with student card for Lia Santos and transit pass inside.',
    declinedReason: 'Item was already claimed and successfully verified by the primary student cardholder with state identification.',
    handoverLocation: 'Campus Card & Identification Center',
    timeline: [
      { step: 'Claim Submitted', date: 'Aug 22, 5:00 PM', completed: true },
      { step: 'Verification Cross-Check', date: 'Aug 23, 11:30 AM', completed: true },
      { step: 'Claim Closed (Duplicate Claimed)', date: 'Aug 24, 9:15 AM', completed: true, current: true },
    ],
  },
];

const DEFAULT_MESSAGES = {
  '#CLM-7923': {
    name: 'Ana Reyes',
    role: 'Finder / BS Psychology',
    messages: [
      {
        id: 'msg-1',
        sender: 'contact',
        senderName: 'Ana Reyes',
        text: "Hi Lia! I saw your claim was approved with the exact description of the 'BSCS' red lanyard. I have it with me on campus today!",
        timestamp: '10:24 AM',
      },
      {
        id: 'msg-2',
        sender: 'contact',
        senderName: 'Ana Reyes',
        text: "I'm at the Social Hall until 4:00 PM if you want to meet up there, or I can turn it over to MIS.",
        timestamp: '10:25 AM',
      },
    ],
  },
  '#CLM-5902': {
    name: 'Crystal',
    role: 'Campus Security HQ',
    messages: [
      {
        id: 'msg-4',
        sender: 'contact',
        senderName: 'Crystal',
        text: 'Hello, your Apple serial verification matched our database. Please bring your student ID and be ready to unlock the MacBook at South Gate HQ.',
        timestamp: 'Sep 11, 10:00 AM',
      },
    ],
  },
  '#CLM-4890': {
    name: 'Rachel Vance',
    role: 'Finder (Student Union)',
    messages: [
      {
        id: 'msg-6',
        sender: 'contact',
        senderName: 'Rachel Vance',
        text: 'Hey! I handed the Hydro Flask over to the Student Union Info Desk so you can pick it up anytime today without waiting for me.',
        timestamp: 'Aug 28, 9:00 AM',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Pagination (same design as the admin tables)
// ---------------------------------------------------------------------------
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

function Pagination({ page, totalPages, totalItems, itemsPerPage, onPageChange, itemLabel }) {
  const start = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems);
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
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
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
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

const STATUS_OPTIONS = ['All statuses', 'Approved', 'Pending', 'Declined', 'Withdrawn'];

const CATEGORY_OPTIONS = [
  'All categories',
  'Clothing & Apparel',
  'Electronics',
  'Keys & Accessories',
  'Books & Study Material',
  'Bags & Wallets',
  'IDs & Campus Cards',
  'Others',
];

const SORT_OPTIONS = ['Newest First', 'Oldest First', 'Ticket ID', 'Status'];

/**
 * Single-file ClaimsAndMatches Component
 * @param {Object} [props]
 * @param {Array} [props.claims]
 * @param {((claim: any) => void)} [props.onViewClaim]
 * @param {((claim: any) => void)} [props.onOpenMessage]
 * @param {((claim: any) => void)} [props.onWithdrawClaim]
 * @param {string} [props.className]
 */
export const ClaimsAndMatches = ({
  claims: initialClaims = DEFAULT_CLAIMS,
  onViewClaim,
  onOpenMessage,
  onWithdrawClaim,
  className = '',
}) => {
  // Master claims state initialized with hardcoded items
  const [claimsList, setClaimsList] = useState(initialClaims);

  // Chat messages state
  const [chatThreads, setChatThreads] = useState(DEFAULT_MESSAGES);

  // Single Reusable Modal state: null | { type: 'withdraw' | 'details' | 'message', claim }
  const [modal, setModal] = useState(null);

  const openModal = (type, claim) => {
    setModal({ type, claim });
    if (type === 'details') onViewClaim?.(claim);
    if (type === 'message') onOpenMessage?.(claim);
    if (type === 'withdraw') onWithdrawClaim?.(claim);
  };

  const closeModal = () => {
    setModal(null);
  };

  // ← in Message / "Never mind, keep claim" in Withdraw: go back to Claim Details
  const backToDetails = () => {
    setModal((prev) => (prev ? { type: 'details', claim: prev.claim } : null));
  };

  // Toast feedback
  const [toastText, setToastText] = useState('');

  // Toolbar filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [categoryFilter, setCategoryFilter] = useState('All categories');
  const [sortBy, setSortBy] = useState('Newest First');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const showNotification = (msg) => {
    setToastText(msg);
    setTimeout(() => setToastText(''), 3500);
  };

  // Status badge renderer (same pill structure as MyReports)
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" aria-hidden="true" />
            Pending
          </span>
        );
      case 'Declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFE4E6] text-[#9F1239]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" aria-hidden="true" />
            Declined
          </span>
        );
      case 'Withdrawn':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280]" aria-hidden="true" />
            {status || 'Withdrawn'}
          </span>
        );
    }
  };

  // Type badge renderer (same as MyReports)
  const renderTypeBadge = (isFound) => {
    if (isFound) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#0D6E6E] text-white">
          FOUND
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#881337] text-white">
        LOST
      </span>
    );
  };

  // Filtering & Sorting
  const filteredClaims = useMemo(() => {
    return claimsList
      .filter((claim) => {
        // Status dropdown
        if (statusFilter !== 'All statuses' && claim.status !== statusFilter) {
          return false;
        }

        // Category dropdown
        if (categoryFilter !== 'All categories' && claim.category !== categoryFilter) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesId = claim.id.toLowerCase().includes(q);
          const matchesTitle = claim.title.toLowerCase().includes(q);
          const matchesCategory = claim.category.toLowerCase().includes(q);
          const matchesStatus = claim.status.toLowerCase().includes(q);
          const matchesType = (claim.type || '').toLowerCase().includes(q);
          const matchesDesc = claim.description ? claim.description.toLowerCase().includes(q) : false;

          if (
            !matchesId &&
            !matchesTitle &&
            !matchesCategory &&
            !matchesStatus &&
            !matchesType &&
            !matchesDesc
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'Ticket ID') {
          return b.id.localeCompare(a.id);
        }
        if (sortBy === 'Status') {
          return a.status.localeCompare(b.status);
        }
        if (sortBy === 'Oldest First') {
          return a.id.localeCompare(b.id);
        }
        // Default: Newest First
        return 0;
      });
  }, [claimsList, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalClaimsCount = filteredClaims.length;
  const totalPages = Math.max(1, Math.ceil(totalClaimsCount / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalClaimsCount);
  const currentClaims = filteredClaims.slice(startIndex, endIndex);

  // Withdraw action handler
  const handleWithdrawConfirm = (claimId, reason) => {
    setClaimsList((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status: 'Withdrawn',
              declinedReason: `Withdrawn by user: ${reason}`,
              timeline: [
                ...(c.timeline || []),
                {
                  step: `Withdrawn: ${reason}`,
                  date: 'Just now',
                  completed: true,
                  current: true,
                },
              ],
            }
          : c
      )
    );
    setModal((prev) => (prev ? { ...prev, claim: { ...prev.claim, status: 'Withdrawn' } } : null));
    const withdrawn = claimsList.find((c) => c.id === claimId);
    const withdrawnNoun = (withdrawn?.type || '').toUpperCase().includes('FOUND') ? 'Claim' : 'Match';
    showNotification(`${withdrawnNoun} ${claimId} has been withdrawn.`);
  };

  // Send message action handler
  const handleSendMessage = (claimId, text) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      text,
      timestamp: 'Just now',
    };

    setChatThreads((prev) => {
      const existing = prev[claimId] || {
        name: modal?.claim?.contactPerson || 'Coordinator',
        role: 'Campus Staff',
        messages: [],
      };
      return {
        ...prev,
        [claimId]: {
          ...existing,
          messages: [...existing.messages, newMsg],
        },
      };
    });

    showNotification(`Message sent regarding ${claimId}`);
  };

  return (
    <div
      className={`flex flex-col gap-6 w-full ${className}`}
      style={{ fontFamily: INTER_FONT_FAMILY }}
    >
      <style>{INTER_FONT_CSS}</style>

      {/* Toast alert */}
      {toastText && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#23261F] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastText}</span>
          <button
            onClick={() => setToastText('')}
            className="ml-2 text-gray-400 hover:text-white p-0.5 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">
            Claims &amp; Matches
          </h1>
          <p className="text-sm text-[#6E6858] mt-1">
            Claims and matches you've submitted on other people's posts. Track each decision and handover progress here.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <SearchBar
            className="flex-1"
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setCurrentPage(1);
            }}
            placeholder="Search claims, matches, items, ticket numbers..."
          />

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <FilterDropdown
              title="Filter by category"
              value={categoryFilter}
              options={CATEGORY_OPTIONS}
              onChange={(v) => {
                setCategoryFilter(v);
                setCurrentPage(1);
              }}
            />
            <FilterDropdown
              title="Filter by status"
              value={statusFilter}
              options={STATUS_OPTIONS}
              align="right"
              onChange={(v) => {
                setStatusFilter(v);
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

      {/* Claims Table Container */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-left border-collapse">
            {/* Fixed column widths (percent) so columns don't shift between pages; long item names get … */}
            <colgroup>
              <col style={{ width: '13%' }} />
              <col style={{ width: '35%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8E4D8] text-[11px] font-semibold text-[#6E6858] tracking-wider uppercase">
                <th className="py-3.5 px-6" scope="col">
                  TICKET
                </th>
                <th className="py-3.5 px-6" scope="col">
                  ITEM
                </th>
                <th className="py-3.5 px-6" scope="col">
                  TYPE
                </th>
                <th className="py-3.5 px-6" scope="col">
                  SUBMITTED
                </th>
                <th className="py-3.5 px-6" scope="col">
                  STATUS
                </th>
                <th className="py-3.5 px-6 text-right" scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm">
              {currentClaims.length > 0 ? (
                currentClaims.map((claim) => {
                  const isFound = (claim.type || '').toUpperCase().includes('FOUND');

                  return (
                    <tr key={claim.id} className="hover:bg-[#F9FAFB] transition-colors">
                      {/* Ticket */}
                      <td className="py-4 px-6 text-[#23261F] font-medium text-xs sm:text-sm whitespace-nowrap">
                        {claim.id}
                      </td>

                      {/* Item Title & Category */}
                      <td className="py-4 px-6">
                        <div className="font-medium text-[#23261F] truncate" title={claim.title}>{claim.title}</div>
                        <div className="text-xs text-[#6E6858] mt-0.5 truncate">{claim.category}</div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">{renderTypeBadge(isFound)}</td>

                      {/* Submitted */}
                      <td className="py-4 px-6 text-[#23261F] whitespace-nowrap">
                        {claim.submitted}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {renderStatusBadge(claim.status)}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => openModal('details', claim)}
                          className="inline-flex items-center justify-center px-3.5 py-1.5 border border-[#E8E4D8] rounded-lg text-xs font-medium text-[#23261F] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                          type="button"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-sm text-[#6E6858]">
                    No claims or matches found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={Math.min(currentPage, totalPages)}
          totalPages={totalPages}
          totalItems={totalClaimsCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="claims & matches"
        />
      </div>

      {/* Dedicated Modals in their own separate files */}
      <WithdrawClaimMatchModal
        isOpen={modal?.type === 'withdraw'}
        claim={modal?.claim}
        onClose={closeModal}
        onBack={backToDetails}
        onWithdraw={handleWithdrawConfirm}
      />

      <ClaimMatchMessageModal
        isOpen={modal?.type === 'message'}
        claim={modal?.claim}
        messages={modal?.claim ? chatThreads[modal.claim.id]?.messages || [] : []}
        onSendMessage={handleSendMessage}
        onClose={closeModal}
        onBack={backToDetails}
      />

      <ClaimMatchDetailsModal
        isOpen={modal?.type === 'details'}
        claim={modal?.claim}
        onClose={closeModal}
        onSwitchModal={openModal}
      />
    </div>
  );
};

export default ClaimsAndMatches;