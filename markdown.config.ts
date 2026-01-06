import type { Plugin } from 'vite'

import rehypeAutolinkHeadings, {
  type Options as RehypeAutolinkHeadingsOptions
} from 'rehype-autolink-headings'
import mdx from '@mdx-js/rollup'
import stringWidth from 'string-width'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { transformerTwoslash, rendererRich } from '@shikijs/twoslash'
import rehypeShiki, { type RehypeShikiOptions } from '@shikijs/rehype'
import remarkGfm, { type Options as RemarkGfmOptions } from 'remark-gfm'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'
import rehypeSlug, { type Options as RehypeSlugOptions } from 'rehype-slug'
import rehypeMeta, { type Options as RehypeMetaOptions } from 'rehype-meta'
import remarkParse, { type Options as RemarkParseOptions } from 'remark-parse'
import remarkRehype, { type Options as RemarkRehypeOptions } from 'remark-rehype'
import rehypeStringify, { type Options as RehypeStringifyOptions } from 'rehype-stringify'
import remarkMdxFrontmatter, { type RemarkMdxFrontmatterOptions } from 'remark-mdx-frontmatter'
import remarkFrontmatter, { type Options as RemarkFrontmatterOptions } from 'remark-frontmatter'

export const rollupPluginMdx = (): Plugin =>
  mdx({
    jsxImportSource: 'solid-jsx',
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
          langs: ['ts', 'tsx', 'html'],
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
    ],
    remarkPlugins: [
      [remarkParse, {} satisfies RemarkParseOptions],
      [remarkFrontmatter, { type: 'yaml', marker: '-' } satisfies RemarkFrontmatterOptions],
      [remarkMdxFrontmatter, { conflict: 'throw' } satisfies RemarkMdxFrontmatterOptions],
      [remarkGfm, { stringLength: stringWidth } satisfies RemarkGfmOptions],
      [remarkRehype, {} satisfies RemarkRehypeOptions]
    ]
  })
