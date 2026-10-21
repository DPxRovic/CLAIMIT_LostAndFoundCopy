import React, { useState, useEffect, useMemo } from 'react';

/**
 * LivePhilippineClock
 * Displays live Philippine Standard Time (PHT, Asia/Manila) updating every second.
 * Uses Intl.DateTimeFormat without manual hour offsets.
 * Properly cleans up interval timer on unmount to prevent memory leaks.
 */
export default function LivePhilippineClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const fullDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(now);
    } catch {
      return now.toDateString();
    }
  }, [now]);

  const shortDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(now);
    } catch {
      return now.toLocaleDateString();
    }
  }, [now]);

  const timeString = useMemo(() => {
    try {
      return `${new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now)} PHT`;
    } catch {
      return `${now.toLocaleTimeString()} PHT`;
    }
  }, [now]);

  return (
    <div
      aria-label="Current Philippine Standard Time"
      className="flex min-w-0 items-center gap-2 rounded-lg border border-[#E8E4D8] bg-white px-2.5 py-1.5 text-xs sm:gap-2.5 sm:px-4 sm:text-sm select-none"
    >
      <span
        className="material-symbols-outlined shrink-0 text-[18px] text-[#5170ff] sm:text-[20px]"
        aria-hidden="true"
      >
        calendar_today
      </span>

      <span className="truncate font-bold text-[#23261F]">
        <span className="hidden sm:inline">{fullDate}</span>
        <span className="sm:hidden">{shortDate}</span>
      </span>

      <span className="hidden text-[#6E6858]/60 md:inline" aria-hidden="true">
        •
      </span>

      <span className="hidden whitespace-nowrap font-medium text-[#444655] md:inline">
        {timeString}
      </span>
    </div>
  );
}
