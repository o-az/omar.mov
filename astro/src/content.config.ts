import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/index.mdx' }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    description: z.string(),
    draft: z.boolean().default(false),
    slug: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z
      .object({
        url: z.string(),
        alt: z.string()
      })
      .optional()
  })
})

export const collections = { posts }
