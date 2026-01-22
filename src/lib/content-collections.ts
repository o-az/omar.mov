import * as z from 'zod/mini'

import rehypeAutolinkHeadings, {
  type Options as RehypeAutolinkHeadingsOptions
} from 'rehype-autolink-headings'
import stringWidth from 'string-width'
import { compileMarkdown } from '@content-collections/markdown'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { transformerTwoslash, rendererRich } from '@shikijs/twoslash'
import rehypeShiki, { type RehypeShikiOptions } from '@shikijs/rehype'
import remarkGfm, { type Options as RemarkGfmOptions } from 'remark-gfm'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'
import { defineCollection, defineConfig } from '@content-collections/core'
import rehypeSlug, { type Options as RehypeSlugOptions } from 'rehype-slug'
import rehypeMeta, { type Options as RehypeMetaOptions } from 'rehype-meta'
import rehypeStringify, { type Options as RehypeStringifyOptions } from 'rehype-stringify'

const posts = defineCollection({
  name: 'posts',
  directory: '../content/posts',
  include: ['**/*.md', '**/*.mdx'],
  schema: z.object({
    slug: z.optional(z.string()),
    draft: z.prefault(z.boolean(), false),
    tags: z.optional(z.array(z.string())),
    date: z.string({ error: 'Date is required' }),
    content: z.string(),
    description: z.string({ error: 'Description is required' }),
    image: z.optional(z.object({ url: z.string(), alt: z.string() })),
    title: z.string({ error: 'Title is required' }).check(z.minLength(1))
  }),
  transform: async (post, context) => {
    const slug = post.slug ?? post._meta.path
    const html = await compileMarkdown(context, post, {
      allowDangerousHtml: true,
      remarkPlugins: [[remarkGfm, { stringLength: stringWidth } satisfies RemarkGfmOptions]],
      rehypePlugins: [
        [rehypeSlug, {} satisfies RehypeSlugOptions],
        [rehypeMeta, {} satisfies RehypeMetaOptions],
        [rehypeStringify, {} satisfies RehypeStringifyOptions],
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'wrap',
            properties: { dataElement: 'post-heading' }
          } satisfies RehypeAutolinkHeadingsOptions
        ],
        [
          rehypeShiki,
          {
            theme: 'houston',
            langs: ['ts', 'tsx', 'html', 'bash', 'json'],
            transformers: [
              transformerTwoslash({
                explicitTrigger: true,
                renderer: rendererRich()
              }),
              transformerNotationHighlight(),
              transformerColorizedBrackets()
            ]
          } satisfies RehypeShikiOptions
        ]
      ]
    })
    return { ...post, slug, html }
  }
})

export default defineConfig({
  collections: [posts]
})
