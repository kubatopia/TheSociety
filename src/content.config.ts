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

/**
 * The archive: one collection behind one browsable page.
 *
 * Type is the FORMAT (a Looking Back entry, a press clipping, an article, a
 * programme). Topic is the SUBJECT (folk music, the courthouse, schools).
 * Keeping them separate is what makes this a research surface rather than
 * four lists -- one topic can carry an article, a video and a clipping.
 */
const archive = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/archive' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z
      .enum(['Looking Back', 'In the news', 'Article', 'Programme or video'])
      .default('Article'),
    summary: z.string().optional(),
    /** Credit the person who wrote it. */
    author: z.string().optional(),
    /** Pinned to the top of the archive's default view. */
    featured: z.boolean().default(false),
    /** Where it was first published, when migrated from the old site. */
    sourceUrl: z.string().optional(),
    /** Subjects, free text so the list can grow without a code change. */
    topics: z.array(z.string()).default([]),
    /** Press coverage lives on someone else's site. */
    externalUrl: z.string().optional(),
    publication: z.string().optional(),
    /** A talk or tour recording. */
    videoUrl: z.string().optional(),
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
    image: z.string().optional(),
    imageAlt: z.string().optional(),
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

export const collections = { pages, archive, events, exhibits, board, minutes };
