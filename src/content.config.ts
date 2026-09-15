import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Free-text pages (About, Visit, Membership...) editable in the CMS. */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    order: z.number().default(99),
    showInNav: z.boolean().default(true),
  }),
});

/** Announcements and newsletter-style posts. */
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    // Public path written by the CMS, e.g. /media/spring-tour.jpg
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

/** Upcoming and past meetings, lectures, tours. */
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    // Set when only the date is known, or the event spans whole days.
    allDay: z.boolean().default(false),
    location: z.string().optional(),
    summary: z.string().optional(),
    rsvpUrl: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

/** Permanent and temporary exhibits, shown as a grid on the museum page. */
const exhibits = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/exhibits' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    location: z.enum(['Courthouse', 'Annex', 'Upstairs courtroom']).default('Courthouse'),
    temporary: z.boolean().default(false),
    // Public path written by the CMS, e.g. /media/nascar-case.jpg
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    order: z.number().default(99),
  }),
});

/** Board and committee roster. */
const board = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/board' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    committee: z.string().optional(),
    termEnds: z.string().optional(),
    email: z.email().optional(),
    // Public path written by the CMS, e.g. /media/jane-doe.jpg
    photo: z.string().optional(),
    order: z.number().default(99),
  }),
});

/** Meeting minutes and public documents. Each entry points at a PDF. */
const minutes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/minutes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    body_type: z.enum(['Board', 'Committee', 'Annual Meeting']).default('Board'),
    file: z.string(),
    summary: z.string().optional(),
  }),
});

export const collections = { pages, news, events, exhibits, board, minutes };
