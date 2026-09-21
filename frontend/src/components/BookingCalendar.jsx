// frontend/src/components/BookingCalendar.jsx
// A small self-contained month calendar (no external dependency) that grays
// out days which are already booked (or in the past) and lets the user pick
// a start/end range by clicking two days. It's a visual helper alongside the
// plain date inputs — clicking a day fills those inputs in for you.
import { useState } from "react";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isBefore(a, b) {
  return a.getTime() < b.getTime();
}

export default function BookingCalendar({
  unavailableDays = new Set(),
  startDate,
  endDate,
  onSelectRange,
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const selectedEnd = endDate ? new Date(`${endDate}T00:00:00`) : null;

  const monthStart = startOfMonth(visibleMonth);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), d));
  }

  function isUnavailable(date) {
    return unavailableDays.has(toDateKey(date));
  }

  function isPast(date) {
    return isBefore(date, today);
  }

  function isInSelectedRange(date) {
    if (!selectedStart) return false;
    const end = selectedEnd || selectedStart;
    return date >= selectedStart && date <= end;
  }

  function handleDayClick(date) {
    if (isPast(date) || isUnavailable(date)) return;
    const key = toDateKey(date);

    // No range yet, or both ends already picked -> start a fresh range.
    if (!selectedStart || (selectedStart && selectedEnd)) {
      onSelectRange(key, "");
      return;
    }

    // One end picked already -> this click sets the other end.
    if (isBefore(date, selectedStart)) {
      onSelectRange(key, toDateKey(selectedStart));
    } else {
      onSelectRange(toDateKey(selectedStart), key);
    }
  }

  function changeMonth(offset) {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1));
  }

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium">
          {visibleMonth.toLocaleDateString("en-NZ", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="px-2 py-1 text-sm rounded hover:bg-gray-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const disabled = isPast(date) || isUnavailable(date);
          const selected = isInSelectedRange(date);

          return (
            <button
              key={toDateKey(date)}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(date)}
              title={isUnavailable(date) ? "Not available" : undefined}
              className={[
                "text-xs rounded py-1.5",
                disabled
                  ? "text-gray-300 bg-gray-50 cursor-not-allowed line-through"
                  : selected
                  ? "bg-black text-white"
                  : "hover:bg-gray-100",
              ].join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-50 border inline-block" /> Unavailable
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-black inline-block" /> Selected
        </span>
      </div>
    </div>
  );
}
