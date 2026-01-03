import * as z from 'zod/mini'
import { createFileRoute } from '@tanstack/solid-router'

import { fetchAllPosts } from '#lib/posts.ts'
import type { JSX } from 'solid-js/jsx-runtime'
import { MDXProvider } from '#components/mdx.tsx'
import markdownCss from '#style/markdown.css?url'
import { CommentsSection } from '#components/comments.tsx'
import { useMDXComponents } from '#lib/solid-jsx/jsx-runtime.ts'

type MDXModule = {
  default: (props: Record<string, unknown>) => JSX.Element
  frontmatter?: Record<string, unknown>
}

export const Route = createFileRoute('/posts/$post')({
  component: RouteComponent,
  params: z.object({ post: z.string() }),
  loader: async ({ params }) => {
    const posts = fetchAllPosts<MDXModule>({ eager: true })

    const { frontmatter, default: _ } = (posts[`../posts/${params.post}/index.mdx`] ||
      posts[`../posts/${params.post}.mdx`]) as unknown as {
      frontmatter: Record<string, unknown>
      default: (props: Record<string, unknown>) => Array<{ t: string }>
    }

    return {
      content: _({})
        .map(_ => _.t)
        .filter(Boolean)
        .join(''),
      frontmatter
    }
  },
  head: ({ loaderData, params }) => {
    const fm = loaderData?.frontmatter as
      | { title?: string; date?: string; description?: string }
      | undefined
    return {
      meta: [
        { title: fm?.title ?? params.post },
        { name: 'description', content: fm?.description ?? '' },
        { name: 'article:published_time', content: fm?.date ?? '' }
      ],
      links: [
        { rel: 'stylesheet', href: markdownCss },
        { rel: 'canonical', href: `https://omar.mov/posts/${params.post}` },
        { rel: 'stylesheet', href: 'https://esm.sh/katex/dist/katex.min.css' }
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: fm?.title,
            description: fm?.description,
            publisher: {
              '@type': 'Organization',
              name: 'omar.mov',
              logo: { '@type': 'ImageObject', url: 'https://omar.mov/logo.png' }
            },
            datePublished: fm?.date
          })
        }
      ]
    }
  }
})

function RouteComponent() {
  const params = Route.useParams()
  const loaderData = Route.useLoaderData()
  const { frontmatter: _, content } = loaderData()

  useMDXComponents({})

  return (
    <main class='min-h-full'>
      <MDXProvider>
        <div innerHTML={content} />
      </MDXProvider>
      <CommentsSection slug={params().post} />
    </main>
  )
}
