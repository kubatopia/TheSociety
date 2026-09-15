// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// TODO: replace with the real domain once DNS is pointed from Squarespace.
const FALLBACK_SITE = 'https://the-society.vercel.app';

/**
 * Hosts commonly define an env var with an empty value as a placeholder, so
 * `??` is not enough here -- an empty string would sail through and fail
 * Astro's URL validation at config time. Only take the override when it is
 * actually a URL.
 */
const override = process.env.PUBLIC_SITE_URL?.trim();
const SITE = override && URL.canParse(override) ? override : FALLBACK_SITE;

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],

  // The section was called News before it became Articles.
  redirects: {
    '/news': '/articles',
    '/news/[id]': '/articles/[id]',
  },

  // Fonts are downloaded at build time and served from our own domain:
  // no request to Google from a visitor's browser.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Instrument Serif',
      cssVariable: '--font-display',
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Hanken Grotesk',
      cssVariable: '--font-body',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
