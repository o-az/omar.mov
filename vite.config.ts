import NodePath from 'node:path'
import NodeProcess from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import VitePluginInfo from 'unplugin-info/vite'
import { default as VitePluginSolid } from 'vite-plugin-solid'
import { default as VitePluginTailwindCSS } from '@tailwindcss/vite'
import { cloudflare as VitePluginCloudflare } from '@cloudflare/vite-plugin'
import { devtools as VitePluginTanstackDevtools } from '@tanstack/devtools-vite'
import { tanstackStart as VitePluginTanstackStart } from '@tanstack/solid-start/plugin/vite'

import rehypeAutolinkHeadings, {
  type Options as RehypeAutolinkHeadingsOptions
} from 'rehype-autolink-headings'
import mdx from '@mdx-js/rollup'
import rehypeSlug from 'rehype-slug'
import rehypeMeta from 'rehype-meta'
import stringWidth from 'string-width'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { transformerTwoslash, rendererRich } from '@shikijs/twoslash'
import rehypeShiki, { type RehypeShikiOptions } from '@shikijs/rehype'
import remarkGfm, { type Options as RemarkGfmOptions } from 'remark-gfm'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'
import remarkFrontmatter, { type Options as RemarkFrontmatterOptions } from 'remark-frontmatter'
import remarkMdxFrontmatter, { type RemarkMdxFrontmatterOptions } from 'remark-mdx-frontmatter'

const rollupPluginMdx = () =>
  mdx({
    jsxImportSource: 'solid-jsx',
    rehypePlugins: [
      rehypeSlug,
      rehypeMeta,
      rehypeStringify,
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
      remarkParse,
      remarkRehype,
      [remarkGfm, { stringLength: stringWidth } satisfies RemarkGfmOptions],
      [remarkMdxFrontmatter, { conflict: 'throw' } satisfies RemarkMdxFrontmatterOptions],
      [remarkFrontmatter, { type: 'yaml', marker: '-' } satisfies RemarkFrontmatterOptions]
    ]
  })

export default defineConfig(config => {
  const env = loadEnv(config.mode, NodeProcess.cwd(), '')

  return {
    resolve: {
      alias: {
        '#': NodePath.resolve(import.meta.dirname, 'src')
      }
    },
    plugins: [
      VitePluginTanstackDevtools({
        removeDevtoolsOnBuild: true,
        eventBusConfig: {
          port: randomIntInclusive(3_110, 8_110)
        }
      }),
      VitePluginInfo({
        cloudflare: true,
        github: 'https://github.com/o-az/omar.mov'
      }),
      VitePluginCloudflare({
        viteEnvironment: { name: 'ssr' }
      }),
      VitePluginTailwindCSS(),
      VitePluginTanstackStart({
        start: { entry: './src/start.ts' },
        server: { entry: './src/server.ts' },
        client: { entry: './src/client.ts' }
      }),
      rollupPluginMdx(),
      VitePluginSolid({ ssr: true })
    ],
    server: {
      port: Number(env.PORT || randomIntInclusive(3_100, 8_100))
    },
    build: {
      minify: 'oxc',
      target: 'esnext',
      emptyOutDir: true,
      rolldownOptions: {
        output: {
          cleanDir: true,
          minify: {
            compress:
              config.mode === 'production' ? { dropConsole: true, dropDebugger: true } : undefined
          }
        }
      }
    }
  }
})

function randomIntInclusive(min: number, max: number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
