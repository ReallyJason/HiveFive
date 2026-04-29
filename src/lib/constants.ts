// ---------------------------------------------------------------------------
// Centralised constants & helpers – import from here instead of duplicating.
// ---------------------------------------------------------------------------

/**
 * Safely parse a "YYYY-MM-DD" date string as **local** midnight.
 *
 * `new Date("2025-03-15")` is parsed as UTC midnight, which shifts back a day
 * for anyone west of UTC when displayed via `.toLocaleDateString()`.
 * Appending `T00:00:00` (no trailing `Z`) forces local-time interpretation.
 *
 * Pass-through for full ISO strings that already contain a time component.
 */
export function parseLocalDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  return new Date(dateStr);
}

/**
 * Parse a UTC timestamp string from the backend into a JS Date.
 *
 * The backend stores all timestamps in UTC (via `SET time_zone = '+00:00'`),
 * but MySQL DATETIME strings arrive without timezone info ("2026-02-20 14:30:00").
 * Without the trailing "Z", `new Date()` parses them as **local** time, causing
 * every user in a different timezone to see a different result.
 *
 * This function appends "Z" so the Date is correctly interpreted as UTC, then
 * `.toLocaleDateString()` / `.toLocaleTimeString()` display it in the viewer's
 * local timezone automatically.
 */
export function parseUTC(ts: string): Date {
  if (!ts) return new Date(NaN);
  let s = ts.trim();
  if (s.includes(' ') && !s.includes('T')) s = s.replace(' ', 'T');
  if (!/[Zz]$/.test(s) && !/[+-]\d{2}:\d{2}$/.test(s)) s += 'Z';
  return new Date(s);
}

/**
 * Master list of service / request categories.
 *
 * Some consumers (e.g. Discover filter bar) prepend an implicit "All" option
 * via the `<CustomSelect label="All Categories" />` placeholder; the array
 * itself does **not** include "All".
 */
export const CATEGORIES: string[] = [
  'Beauty',
  'Career',
  'Coaching',
  'Coding',
  'Consulting',
  'Cooking',
  'Design',
  'Errands',
  'Events',
  'Fitness',
  'Language',
  'Moving',
  'Music',
  'Pet Care',
  'Photography',
  'Rides',
  'Tech Support',
  'Tutoring',
  'Video',
  'Writing',
  'Other',
];

/**
 * Background / text colour pairs keyed by category name.
 * Used by `<CategoryBadge />` and anywhere a category chip is rendered.
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Beauty:         { bg: '#FDF2F8', text: '#BE185D' },
  Career:         { bg: '#F0FDF4', text: '#15803D' },
  Coaching:       { bg: '#EEF2FF', text: '#4338CA' },
  Coding:         { bg: '#EFF6FF', text: '#1D4ED8' },
  Consulting:     { bg: '#F0F9FF', text: '#0369A1' },
  Cooking:        { bg: '#FEF2F2', text: '#B91C1C' },
  Design:         { bg: '#FFF7ED', text: '#C2410C' },
  Errands:        { bg: '#F5F5F4', text: '#57534E' },
  Events:         { bg: '#FEFCE8', text: '#854D0E' },
  Fitness:        { bg: '#FFF1F2', text: '#BE123C' },
  Language:       { bg: '#ECFEFF', text: '#0E7490' },
  Moving:         { bg: '#F7FEE7', text: '#4D7C0F' },
  Music:          { bg: '#FEF3C7', text: '#B45309' },
  'Pet Care':     { bg: '#FFF7ED', text: '#9A3412' },
  Photography:    { bg: '#F5F3FF', text: '#6D28D9' },
  Rides:          { bg: '#F0FDFA', text: '#0F766E' },
  'Tech Support': { bg: '#F1F5F9', text: '#475569' },
  Tutoring:       { bg: '#FFFBEB', text: '#92400E' },
  Video:          { bg: '#FAF5FF', text: '#7E22CE' },
  Writing:        { bg: '#ECFDF5', text: '#047857' },
  Other:          { bg: '#F4F4F5', text: '#52525B' },
};

/**
 * Budget ranges shown when posting a new request (PostRequest form).
 */
export const BUDGET_RANGES = [
  { label: 'Under \u2B2150', value: 'under-50' },
  { label: '\u2B2150-100', value: '50-100' },
  { label: '\u2B21100-200', value: '100-200' },
  { label: '\u2B21200-500', value: '200-500' },
  { label: 'Over \u2B21500', value: 'over-500' },
  { label: 'Flexible', value: 'flexible' },
] as const;

/**
 * Price filter dropdown options on the Discover page.
 */
export const PRICE_FILTER_OPTIONS: string[] = [
  'Under \u2B21 25',
  '\u2B21 25\u201350',
  '\u2B21 50\u2013100',
  '\u2B21 100\u2013500',
  'Over \u2B21 500',
];

/**
 * Sort options used in the Discover page sort dropdown.
 */
export const SORT_OPTIONS = [
  'Most Popular',
  'Rating: High to Low',
  'Newest First',
  'Oldest First',
  'Price: Low to High',
  'Price: High to Low',
] as const;

// ---------------------------------------------------------------------------
// Timezone-aware booking helpers
// ---------------------------------------------------------------------------

/**
 * Combine a date ("YYYY-MM-DD") and 12-hour time ("H:MM AM/PM") into a UTC
 * ISO string suitable for storing in `scheduled_utc`.
 *
 * The Date is constructed in the **browser's** local timezone (which is the
 * booker's timezone), then converted to UTC via `.toISOString()`.
 */
export function toUTCBooking(date: string, time: string): string {
  const [timePart, period] = time.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  let h24 = h;
  if (period === 'PM' && h !== 12) h24 += 12;
  if (period === 'AM' && h === 12) h24 = 0;

  const local = new Date(
    `${date}T${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
  );
  return local.toISOString();
}

/**
 * Format a scheduled booking for display in the **viewer's** local timezone.
 *
 * - If `utc` is available, converts to the browser's timezone and shows a
 *   timezone abbreviation (e.g. "Mar 15, 2025 at 2:30 PM EST").
 * - Falls back to raw `scheduled_date` / `scheduled_time` for legacy orders
 *   that were created before timezone support was added.
 *
 * Returns `null` when no scheduling info exists at all.
 */
export function formatSchedule(
  utc: string | null,
  fallbackDate: string | null,
  fallbackTime: string | null,
): { date: string; time: string; full: string } | null {
  if (utc) {
    const d = new Date(utc);
    const date = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    return { date, time, full: `${date} at ${time}` };
  }

  if (fallbackDate || fallbackTime) {
    const date = fallbackDate
      ? parseLocalDate(fallbackDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'TBD';
    const time = fallbackTime || '';
    const full = time ? `${date} at ${time}` : date;
    return { date, time, full };
  }

  return null;
}
