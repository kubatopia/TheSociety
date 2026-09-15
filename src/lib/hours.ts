/**
 * Opening hours.
 *
 * The board edits a list of open days in the CMS; everything shown to a
 * visitor is derived from it, so the footer, the visit strip and the live
 * "open now" line can never disagree with one another.
 */

export type OpeningDay = { day: string; open: string; close: string };

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

/** "17:00" -> "5pm", "10:30" -> "10.30am". Sentence case, not shouty. */
export function formatTime(value: string): string {
  const [h, m] = value.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}.${String(m).padStart(2, '0')}${suffix}`;
}

/**
 * Collapse consecutive days sharing the same hours:
 *   Tue,Wed,Thu,Fri 10-17 + Sat 10-16  ->  ["Tuesday-Friday, 10am to 5pm", "Saturday, 10am to 4pm"]
 */
export function summarise(hours: OpeningDay[]): string[] {
  const ordered = [...hours].sort(
    (a, b) => DAY_NAMES.indexOf(a.day as never) - DAY_NAMES.indexOf(b.day as never),
  );

  const runs: OpeningDay[][] = [];
  for (const entry of ordered) {
    const run = runs.at(-1);
    const previous = run?.at(-1);
    const consecutive =
      previous &&
      DAY_NAMES.indexOf(entry.day as never) === DAY_NAMES.indexOf(previous.day as never) + 1;

    if (run && previous && consecutive && previous.open === entry.open && previous.close === entry.close) {
      run.push(entry);
    } else {
      runs.push([entry]);
    }
  }

  return runs.map((run) => {
    const span =
      run.length === 1 ? run[0].day : `${run[0].day}-${run[run.length - 1].day}`;
    return `${span}, ${formatTime(run[0].open)} to ${formatTime(run[0].close)}`;
  });
}

/** Days with no entry at all. */
export function closedDays(hours: OpeningDay[]): string[] {
  const open = new Set(hours.map((h) => h.day));
  return DAY_NAMES.filter((d) => !open.has(d));
}
