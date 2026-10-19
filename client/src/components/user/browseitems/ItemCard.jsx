import React from 'react';
import { Clock, MapPin } from 'lucide-react';

// Same badge colors as My Reports (these are the posted reports)
const STATUS_STYLES = {
  Active: { badge: 'bg-[#EEF2FF] text-[#4F46E5]', dot: 'bg-[#4F46E5]' },
  'Pending Match': { badge: 'bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' },
  'Pending Claim': { badge: 'bg-[#FFEDD5] text-[#9A3412]', dot: 'bg-[#EA580C]' },
  Resolved: { badge: 'bg-[#EFF6FF] text-[#1D4ED8]', dot: 'bg-[#1D4ED8]' },
  Closed: { badge: 'bg-[#F3F4F6] text-[#4B5563]', dot: 'bg-[#6B7280]' },
};

export const ItemCard = ({ item, onClick, className = '' }) => {
  const isLost = item.type === 'LOST';
  const status = item.status || 'Active';
  const s = STATUS_STYLES[status] || STATUS_STYLES.Closed;

  return (
    <article
      onClick={() => onClick?.(item)}
      className={`group flex flex-col bg-white rounded-xl border border-[#E8E4D8] shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden text-left ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Card Image and Floating Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F3F4F6]">
        <img
          src={item.imageUrl}
          alt={item.imageAlt || item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-Left: Type Badge (LOST / FOUND) — same as My Reports */}
        <div className="absolute top-3 left-3 flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold text-white tracking-wider shadow-xs ${
              isLost ? 'bg-[#881337]' : 'bg-[#0D6E6E]'
            }`}
          >
            {isLost ? 'LOST' : 'FOUND'}
          </span>
        </div>

        {/* Top-Right: Status Badge — same as My Reports */}
        <div className="absolute top-3 right-3 flex items-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium shadow-xs ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
            {status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Category */}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5170ff] mb-1">
          {item.category}
        </span>

        {/* Title */}
        <h3
          className="text-[17px] font-bold text-[#23261F] tracking-tight leading-snug truncate"
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Bottom Metadata: Date & Location on separate lines */}
        <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#6E6858]">
          {item.date && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{item.date}</span>
            </div>
          )}
          {item.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5170ff] shrink-0" aria-hidden="true" />
              <span className="truncate" title={item.location}>
                {item.location}
              </span>
            </div>
          )}
          {!item.location && item.resolvedInfo && (
            <div className="flex items-center gap-1.5">
              <span className="truncate" title={item.resolvedInfo}>
                {item.resolvedInfo}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ItemCard;