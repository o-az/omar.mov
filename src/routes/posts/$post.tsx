import * as z from 'zod/mini'
import { createFileRoute } from '@tanstack/solid-router'
import { useMDXComponents } from 'solid-jsx/jsx-runtime'

import MDXContent from '#posts/bunny/index.mdx'
import { MDXProvider } from '#components/mdx.tsx'
import markdownCss from '#style/markdown.css?url'

export const Route = createFileRoute('/posts/$post')({
  component: RouteComponent,
  params: z.object({
    post: z.string()
  }),
  ssr: true,
  head: () => ({
    links: [
      { rel: 'stylesheet', href: markdownCss },
      { rel: 'stylesheet', href: 'http://esm.sh/katex/dist/katex.min.css' }
    ]
  })
})

function RouteComponent() {
  const _ = useMDXComponents({
    Log: (data: any) => <pre>{JSON.stringify(data, null, 2)}</pre>
  })
  return (
    <main class='min-h-full'>
      <MDXProvider>
        <MDXContent
          components={{
            /**
             * `useMDXComponents` type is broken: https://github.com/high1/solid-jsx/issues/110
             */
            components: _ as never
          }}
        />
      </MDXProvider>
    </main>
  )
}
