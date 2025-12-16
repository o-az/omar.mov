import * as z from 'zod/mini'
import { createFileRoute, useLoaderData, useParams } from '@tanstack/solid-router'

import MDXContent from '#posts/bunny/index.mdx'
import type { JSX } from 'solid-js/jsx-runtime'
import { MDXProvider } from '#components/mdx.tsx'
import markdownCss from '#style/markdown.css?url'
import { useMDXComponents } from '#lib/solid-jsx/jsx-runtime.ts'

export const Route = createFileRoute('/posts/$post')({
  component: RouteComponent,
  params: z.object({
    post: z.string()
  }),
  head: () => ({
    links: [
      { rel: 'stylesheet', href: markdownCss },
      { rel: 'stylesheet', href: 'http://esm.sh/katex/dist/katex.min.css' }
    ]
  })
})

function RouteComponent() {
  const params = useParams({ from: '/posts/$post' })
  const posts = useLoaderData({ from: '/posts' })

  const currentPost = () => posts().find(post => post.path.includes(params().post))

  const components = useMDXComponents({
    h1: (props: JSX.HTMLAttributes<HTMLHeadingElement>) => (
      <h1
        {...props}
        class='text-2xl! text-red-400 font-bold'>
        {currentPost()?.frontmatter.title}
      </h1>
    ),
    Log: data => <pre>{JSON.stringify(data, null, 2)}</pre>
  })

  return (
    <main class='min-h-full'>
      <MDXProvider>
        <MDXContent
          // biome-ignore lint/suspicious/noTsIgnore: biome is dumb
          // @ts-ignore - biome is dumb
          components={components}
        />
      </MDXProvider>
    </main>
  )
}
