import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// FAQ tabs: one markdown file per category (General / Usage / Technical).
// Each file's body holds that tab's `### question` + answer entries; the
// faqs.astro page splits those sections into native disclosure elements and
// JSON-LD at build time.
const faq = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/faq' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    lastUpdated: z.string().optional(),
  }),
});

export const collections = { faq };
