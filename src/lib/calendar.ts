/**
 * Google Calendar links and .ics files for events.
 *
 * Event front matter carries an offset ("2026-09-19T19:00:00-0400"), so start
 * and end are genuine instants -- unlike the date-only values that src/lib/
 * dates.ts has to format in UTC. Both formats below are therefore written in
 * UTC, which every calendar client converts back to the reader's own zone.
 *
 * All-day events are the exception: they have no instant to convert, so they
 * are written as VALUE=DATE with an exclusive end date, per RFC 5545.
 */

export interface CalendarEvent {
  title: string;
  start: Date;
  end?: Date;
  allDay: boolean;
  location?: string;
  summary?: string;
}

/** An event with no stated end is treated as running two hours. */
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

/** YYYYMMDD, in UTC. */
const dateStamp = (date: Date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;

/** YYYYMMDDTHHMMSSZ. */
const utcStamp = (date: Date) =>
  `${dateStamp(date)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds(),
  )}Z`;

/** Start and end as a calendar wants them. DTEND is exclusive for whole days. */
const span = (event: CalendarEvent) => {
  if (event.allDay) {
    const last = event.end ?? event.start;
    return {
      start: dateStamp(event.start),
      end: dateStamp(new Date(last.getTime() + DAY_MS)),
      dateOnly: true,
    };
  }
  const end = event.end ?? new Date(event.start.getTime() + DEFAULT_DURATION_MS);
  return { start: utcStamp(event.start), end: utcStamp(end), dateOnly: false };
};

/**
 * A "save this to Google Calendar" link, prefilled.
 *
 * Google's TEMPLATE URL accepts text, dates, details and location and nothing
 * else -- there is no parameter for a picture, so the poster cannot travel
 * this way. Only the .ics file can carry one.
 */
export const googleCalendarUrl = (event: CalendarEvent, pageUrl: string) => {
  const { start, end } = span(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
  });
  const details = [event.summary, pageUrl].filter(Boolean).join('\n\n');
  if (details) params.set('details', details);
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params}`;
};

/** Escape a value for a property line: backslash, semicolon, comma, newline. */
const escapeText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/[;,]/g, (char) => `\\${char}`)
    .replace(/\r?\n/g, '\\n');

/**
 * RFC 5545 caps a content line at 75 octets, continuing it on a line that
 * begins with one space. Measured in octets, not characters, so a curly
 * apostrophe in a title counts for three -- but never split mid-character.
 */
const fold = (line: string) => {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = '';
  let used = 0;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (used + size > 75) {
      parts.push(current);
      current = '';
      used = 1; // the leading space that continues the line
    }
    current += char;
    used += size;
  }
  parts.push(current);

  return parts.join('\r\n ');
};

interface IcsOptions {
  /** Globally unique and stable across rebuilds, so re-imports update. */
  uid: string;
  pageUrl: string;
  /**
   * Absolute URL of the event's poster. Written as an RFC 7986 IMAGE property,
   * which Apple Calendar reads and Google Calendar ignores outright; our
   * posters are also .webp, which few calendar clients decode. Harmless and
   * correct, so it is included, but nobody should expect to see it.
   */
  imageUrl?: string;
  /** Overridable so tests are not tied to the build clock. */
  stamp?: Date;
}

/** A single-event calendar file, CRLF-terminated as the spec requires. */
export const icsFor = (event: CalendarEvent, options: IcsOptions) => {
  const { start, end, dateOnly } = span(event);
  const valueType = dateOnly ? ';VALUE=DATE' : '';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MHC Historical Society//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeText(options.uid)}`,
    `DTSTAMP:${utcStamp(options.stamp ?? new Date())}`,
    `DTSTART${valueType}:${start}`,
    `DTEND${valueType}:${end}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (options.imageUrl) {
    lines.push(`IMAGE;VALUE=URI;DISPLAY=BADGE:${escapeText(options.imageUrl)}`);
  }

  const description = [event.summary, options.pageUrl].filter(Boolean).join('\n\n');
  if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
  if (options.pageUrl) lines.push(`URL:${escapeText(options.pageUrl)}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return `${lines.map(fold).join('\r\n')}\r\n`;
};
