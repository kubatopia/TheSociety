/**
 * Date formatting helpers.
 *
 * The CMS writes two shapes of date:
 *
 *   - date only, "2026-09-20"          -> JS parses this as UTC midnight
 *   - naive datetime, "2026-10-08T19:00:00" -> JS parses this as LOCAL time
 *
 * Formatting a date-only value in local time rolls it back a day anywhere west
 * of Greenwich, so "2026-09-20" renders as 19 Sep. Every date-only value must
 * therefore be formatted in UTC, and only genuine timestamps in local time.
 */

const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' });

const local = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', options);

/** For `date` fields, which are always date-only. */
export const formatDate = utc({ dateStyle: 'long' });
export const formatDateShort = utc({ dateStyle: 'medium' });

/** Calendar-chip parts, for date-only and all-day values. */
export const formatDay = utc({ day: 'numeric' });
export const formatMonth = utc({ month: 'short' });

/** The year a date-only value belongs to. */
export const yearOf = (date: Date) => date.getUTCFullYear();

const eventDateOnly = utc({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const eventWithTime = local({
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const eventTimeOnly = local({ hour: 'numeric', minute: '2-digit' });

/** Full date line for an event, respecting its all-day flag. */
export const formatEvent = (event: { data: { start: Date; allDay: boolean } }) =>
  (event.data.allDay ? eventDateOnly : eventWithTime).format(event.data.start);

/** Just the time, or "All day". */
export const formatEventTime = (event: { data: { start: Date; allDay: boolean } }) =>
  event.data.allDay ? 'All day' : eventTimeOnly.format(event.data.start);

/** Calendar-chip day number for an event. */
export const formatEventDay = (event: { data: { start: Date; allDay: boolean } }) =>
  (event.data.allDay ? formatDay : local({ day: 'numeric' })).format(event.data.start);

/** Calendar-chip month for an event. */
export const formatEventMonth = (event: { data: { start: Date; allDay: boolean } }) =>
  (event.data.allDay ? formatMonth : local({ month: 'short' })).format(event.data.start);

/* --- Event detail page -------------------------------------------------- */

const eventDayFull = local({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const eventDayShort = local({ month: 'short', day: 'numeric' });
/** Only ever compared, never shown: is the end on the same local day? */
const localDayKey = local({ year: 'numeric', month: '2-digit', day: '2-digit' });

/** The date on its own, for pages that show the time on a second line. */
export const formatEventDate = (event: { data: { start: Date; allDay: boolean } }) =>
  (event.data.allDay ? eventDateOnly : eventDayFull).format(event.data.start);

/**
 * The time span: "7:00 PM – 10:00 PM".
 *
 * An event that runs past midnight -- the Ghost Walk models both of its nights
 * as one span -- carries the date on each side, or the range reads backwards.
 */
export const formatEventRange = (event: {
  data: { start: Date; end?: Date; allDay: boolean };
}) => {
  const { start, end, allDay } = event.data;
  if (allDay) return 'All day';
  if (!end) return eventTimeOnly.format(start);
  if (localDayKey.format(start) === localDayKey.format(end)) {
    return `${eventTimeOnly.format(start)} – ${eventTimeOnly.format(end)}`;
  }
  return (
    `${eventDayShort.format(start)}, ${eventTimeOnly.format(start)} – ` +
    `${eventDayShort.format(end)}, ${eventTimeOnly.format(end)}`
  );
};
