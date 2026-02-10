import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import solidJs from '@astrojs/solid-js'
import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { transformerNotationHighlight } from '@shikijs/transformers'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'

export default defineConfig({
  site: 'https://omar.mov',
  output: 'static',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      configPath: 'wrangler.json',
      persist: { path: './.cache/wrangler/v3' }
    },
    workerEntryPoint: {
      path: 'src/worker.ts',
      namedExports: ['LiveViewersDO']
    }
  }),
  integrations: [mdx(), solidJs()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'node:zlib': new URL('./src/lib/zlib-shim.ts', import.meta.url).pathname
      }
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        shimMissingExports: true
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext'
      }
    }
  },
  scopedStyleStrategy: 'where',
  markdown: {
    shikiConfig: {
      theme: 'houston',
      langs: ['ts', 'tsx', 'html', 'bash', 'json'],
      transformers: [transformerNotationHighlight(), transformerColorizedBrackets()]
    },
    remarkPlugins: [],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
          properties: { dataElement: 'post-heading' }
        }
      ]
    ]
  }
})
