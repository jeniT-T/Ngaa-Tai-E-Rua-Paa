
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 7am - 5pm

// Hour-row height in px, scaled to viewport width so the timeline reads
// well on both small and large screens.
function getRowHeight(width) {
  if (width < 640) return 48; // mobile
  if (width < 1024) return 64; // tablet
  return 84; // desktop
}

function useRowHeight() {
  const [rowHeight, setRowHeight] = useState(() =>
    getRowHeight(typeof window !== 'undefined' ? window.innerWidth : 1024)
  );

  useEffect(() => {
    function handleResize() {
      setRowHeight(getRowHeight(window.innerWidth));
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return rowHeight;
}

const CATEGORY_STYLES = {
  checkin: 'bg-blue-100 border-blue-500 text-blue-900',
  garden: 'bg-green-100 border-green-500 text-green-900',
  break: 'bg-orange-100 border-orange-500 text-orange-900',
  maintenance: 'bg-purple-100 border-purple-500 text-purple-900',
};

// Placeholder tasks, keyed by day offset from today (0 = today). `duration`
// is in hours. Replace with real data once tasks are stored in the database.
const TASKS_BY_DAY = {
  0: [
    { id: 1, time: 8, duration: 1, title: 'Morning check-in', category: 'checkin', completed: true },
    { id: 2, time: 9, duration: 2, title: 'Garden cleaning', category: 'garden', completed: true },
    { id: 3, time: 11, duration: 1, title: 'Lunch break', category: 'break', completed: false },
    { id: 4, time: 14, duration: 1, title: 'Check oven is working', category: 'maintenance', completed: false },
    { id: 5, time: 16, duration: 1, title: 'Evening check-in', category: 'checkin', completed: false },
    { id: 6, time: 17, duration: 1, title: 'Lock up wharenui', category: 'maintenance', completed: false },
  ],
  1: [
    { id: 7, time: 8, duration: 1, title: 'Morning check-in', category: 'checkin', completed: false },
    { id: 8, time: 9, duration: 3, title: 'Mow front lawn', category: 'garden', completed: false },
    { id: 9, time: 12, duration: 1, title: 'Lunch break', category: 'break', completed: false },
  ],
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayOffsetFromToday(date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(date) - startOfDay(new Date())) / msPerDay);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Sunday-start week containing the given date.
function getWeekDates(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// A task is overdue if it's for today, isn't done, and its end time has passed.
function isTaskOverdue(task, completed, isToday) {
  if (completed || !isToday) return false;
  const now = new Date();
  const nowDecimal = now.getHours() + now.getMinutes() / 60;
  return nowDecimal >= task.time + task.duration;
}

const NAV_BUTTON_SIZE_CLASSES = {
  md: 'w-8 h-8 border border-gray-300 text-gray-600',
  sm: 'w-7 h-7 text-gray-500',
};

// Shared chevron button for stepping through days/months.
function NavButton({ direction, onClick, label, size = 'md' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`rounded-md hover:bg-gray-100 ${NAV_BUTTON_SIZE_CLASSES[size]}`}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

// Builds a 6x7 grid of dates for the given month, including leading/trailing
// days from adjacent months so every week row is full.
function getCalendarGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return date;
  });
}

function DatePickerDropdown({ selectedDate, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => startOfMonth(selectedDate));
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function openCalendar() {
    setViewDate(startOfMonth(selectedDate));
    setIsOpen(true);
  }

  const grid = getCalendarGrid(viewDate.getFullYear(), viewDate.getMonth());
  const monthLabel = viewDate.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
        className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        {selectedDate.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <NavButton
              direction="prev"
              label="Previous month"
              size="sm"
              onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            />
            <span className="text-sm font-medium text-gray-900">{monthLabel}</span>
            <NavButton
              direction="next"
              label="Next month"
              size="sm"
              onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            />
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((date) => {
              const inMonth = date.getMonth() === viewDate.getMonth();
              const selected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    onSelect(date);
                    setIsOpen(false);
                  }}
                  className={`relative h-8 w-8 rounded-md text-sm ${
                    selected
                      ? 'bg-[#0081bd] text-white font-semibold'
                      : inMonth
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {date.getDate()}
                  {isToday && !selected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0081bd]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

// Week-at-a-glance: one column per day, tasks shown as small chips.
// Clicking a day header switches the day view to that date.
function WeekView({ weekDates, selectedDate, isCompleted, toggleTask, onSelectDay }) {
  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4">
      {weekDates.map((date) => {
        const offset = dayOffsetFromToday(date);
        const tasks = TASKS_BY_DAY[offset] ?? [];
        const isToday = isSameDay(date, new Date());
        const isSelected = isSameDay(date, selectedDate);
        return (
          <div
            key={date.toISOString()}
            className={`rounded-lg border p-2 sm:p-3 lg:p-4 min-h-[160px] sm:min-h-[200px] lg:min-h-[260px] xl:min-h-[320px] ${isSelected ? 'border-[#0081bd]' : 'border-gray-200'}`}
          >
            <button onClick={() => onSelectDay(date)} className="w-full text-left mb-2 sm:mb-3">
              <p className="text-[11px] sm:text-xs lg:text-sm text-gray-400">{date.toLocaleDateString('en-NZ', { weekday: 'short' })}</p>
              <p className={`text-sm sm:text-base lg:text-xl font-semibold ${isToday ? 'text-[#0081bd]' : 'text-gray-900'}`}>{date.getDate()}</p>
            </button>
            <div className="space-y-1 sm:space-y-1.5 lg:space-y-2">
              {tasks.length === 0 ? (
                <p className="text-[11px] sm:text-xs lg:text-sm text-gray-400">No tasks</p>
              ) : (
                tasks.map((task) => {
                  const completed = isCompleted(task);
                  const overdue = isTaskOverdue(task, completed, isToday);
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task)}
                      className={`w-full text-left text-[11px] sm:text-xs lg:text-sm px-2 py-1 lg:px-3 lg:py-1.5 rounded border-l-2 ${CATEGORY_STYLES[task.category]} ${completed ? 'opacity-50 line-through' : ''} ${overdue ? 'ring-1 ring-red-500' : ''}`}
                    >
                      {task.title}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [completedOverrides, setCompletedOverrides] = useState({});
  const [viewMode, setViewMode] = useState('day');

  const dayOffset = useMemo(() => dayOffsetFromToday(selectedDate), [selectedDate]);
  const dayTasks = useMemo(() => TASKS_BY_DAY[dayOffset] ?? [], [dayOffset]);
  const isToday = dayOffset === 0;
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const rowHeight = useRowHeight();

  const now = new Date();
  const nowDecimal = now.getHours() + now.getMinutes() / 60;
  const nowOffset =
    isToday && nowDecimal >= HOURS[0] && nowDecimal <= HOURS[HOURS.length - 1] + 1
      ? (nowDecimal - HOURS[0]) * rowHeight
      : null;

  function shiftDay(delta) {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }

  function isCompleted(task) {
    return completedOverrides[task.id] ?? task.completed;
  }

  function toggleTask(task) {
    setCompletedOverrides((prev) => ({ ...prev, [task.id]: !isCompleted(task) }));
  }

  const totalTasks = dayTasks.length;
  const completedCount = dayTasks.filter(isCompleted).length;
  const upcomingCount = totalTasks - completedCount;

  const dateLabel = selectedDate.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-14 max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[95rem] mx-auto">
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Kia ora {user?.name}, here's your day.</p>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{dateLabel}</h1>
          <NavButton direction="prev" label="Previous day" onClick={() => shiftDay(-1)} />
          <NavButton direction="next" label="Next day" onClick={() => shiftDay(1)} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-gray-300 overflow-hidden text-sm">
            {['day', 'week'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 capitalize ${
                  viewMode === mode ? 'bg-[#0081bd] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <DatePickerDropdown selectedDate={selectedDate} onSelect={(date) => setSelectedDate(startOfDay(date))} />
          <button
            onClick={() => setSelectedDate(startOfDay(new Date()))}
            className="px-4 py-1.5 rounded-md text-sm font-medium border"
            style={{ color: '#0081bd', borderColor: '#0081bd' }}
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_240px] lg:grid-cols-[1fr_300px]">
        {/* Timeline */}
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden p-2 sm:p-3">
          {viewMode === 'week' ? (
            <WeekView
              weekDates={weekDates}
              selectedDate={selectedDate}
              isCompleted={isCompleted}
              toggleTask={toggleTask}
              onSelectDay={(date) => {
                setSelectedDate(startOfDay(date));
                setViewMode('day');
              }}
            />
          ) : dayTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-500">No tasks scheduled for this day.</p>
          ) : (
            <div className="flex">
              <div className="w-14 sm:w-20 lg:w-24 shrink-0">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: rowHeight }}
                    className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs lg:text-sm text-gray-400 border-b border-gray-100 last:border-b-0"
                  >
                    {formatHour(hour)}
                  </div>
                ))}
              </div>
              <div className="flex-1 relative" style={{ height: HOURS.length * rowHeight }}>
                {HOURS.map((hour, i) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-gray-100"
                    style={{ top: (i + 1) * rowHeight }}
                  />
                ))}

                {nowOffset !== null && (
                  <div className="absolute left-0 right-0 flex items-center z-10" style={{ top: nowOffset }}>
                    <span className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                )}

                {dayTasks.map((task) => {
                  const completed = isCompleted(task);
                  const overdue = isTaskOverdue(task, completed, isToday);
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task)}
                      style={{ top: (task.time - HOURS[0]) * rowHeight, height: task.duration * rowHeight - 4 }}
                      className={`absolute left-2 right-2 flex items-center justify-between text-left border-l-4 rounded-md px-2 sm:px-3 text-sm sm:text-base ${CATEGORY_STYLES[task.category]} ${completed ? 'opacity-50' : ''} ${overdue ? 'ring-2 ring-red-500' : ''}`}
                    >
                      <span className={`font-medium ${completed ? 'line-through' : ''}`}>{task.title}</span>
                      <span className="text-xs sm:text-sm font-medium leading-none">
                        {overdue ? 'Overdue' : completed ? 'Done' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Day summary */}
        <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-5 lg:p-6 h-fit">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Day Summary</h2>
          <dl className="space-y-2 sm:space-y-3 text-sm sm:text-base">
            <div className="flex justify-between">
              <dt className="text-gray-500">Total Tasks</dt>
              <dd className="font-medium text-gray-900">{totalTasks}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">✓ Completed</dt>
              <dd className="font-medium text-green-600">{completedCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">• Upcoming</dt>
              <dd className="font-medium text-blue-600">{upcomingCount}</dd>
            </div>
          </dl>

          {/* Task creation not implemented yet — placeholder only */}
          <button
            disabled
            title="Coming soon"
            className="mt-5 w-full rounded-md py-2.5 text-sm font-medium text-white bg-gray-300 cursor-not-allowed"
          >
            + Add New Task
          </button>
        </div>
      </div>
    </div>
  );
}
