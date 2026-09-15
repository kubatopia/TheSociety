import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { icsFor } from '../../lib/calendar';

/**
 * One calendar file per event, built as a static asset next to the event's
 * page: /events/ghost-walk and /events/ghost-walk.ics.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const events = await getCollection('events', ({ data }) => !data.draft);
  return events.map((event) => ({ params: { id: event.id }, props: { event } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const event = props.event as CollectionEntry<'events'>;

  // `site` is set in astro.config.mjs from PUBLIC_SITE_URL, but the type allows
  // it to be missing; no domain is hard-coded here to fall back on.
  const pageUrl = site ? new URL(`/events/${event.id}`, site).href : '';
  const uid = `${event.id}@${site ? site.hostname : 'events'}`;

  const body = icsFor(
    {
      title: event.data.title,
      start: event.data.start,
      end: event.data.end,
      allDay: event.data.allDay,
      location: event.data.location,
      summary: event.data.summary,
    },
    { uid, pageUrl },
  );

  return new Response(body, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="${event.id}.ics"`,
    },
  });
};
