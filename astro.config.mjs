// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// TODO: replace with the real domain once DNS is pointed from Squarespace.
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://the-society.vercel.app';

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],

  // Fonts are downloaded at build time and served from our own domain:
  // no request to Google from a visitor's browser.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--font-display',
      weights: [400, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-body',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
