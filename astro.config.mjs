// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// TODO: replace with the real domain once DNS is pointed from Squarespace.
const SITE = process.env.PUBLIC_SITE_URL ?? 'https://thesociety.vercel.app';

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
