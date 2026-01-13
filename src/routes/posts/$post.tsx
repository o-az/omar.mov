import * as z from 'zod/mini'
import { createFileRoute, notFound } from '@tanstack/solid-router'

import { allPosts } from '#content-collections'
import markdownCss from '#style/markdown.css?url'
import { CommentsSection } from '#components/comments.tsx'
import { cx } from '#lib/style.ts'

export const Route = createFileRoute('/posts/$post')({
  component: RouteComponent,
  params: z.object({ post: z.string() }),
  loader: async ({ params }) => {
    const post = allPosts.find(post => post.slug === params.post)

    if (!post) throw notFound()

    return post
  },
  head: ({ loaderData: frontmatter, params }) => {
    return {
      meta: [
        { title: frontmatter?.title ?? params.post },
        { name: 'description', content: frontmatter?.description ?? '' },
        { name: 'article:published_time', content: frontmatter?.date ?? '' }
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
            headline: frontmatter?.title,
            description: frontmatter?.description,
            publisher: {
              '@type': 'Organization',
              name: 'omar.mov',
              logo: { '@type': 'ImageObject', url: 'https://omar.mov/logo.png' }
            },
            datePublished: frontmatter?.date
          })
        }
      ]
    }
  }
})

function RouteComponent() {
  const params = Route.useParams()
  const loaderData = Route.useLoaderData()
  const post = loaderData()

  return (
    <main class='min-h-full'>
      <article
        class={cx(
          'max-w-170 mx-auto prose dark:prose-invert',
          'prose-img:rounded-xl prose-img:my-3 prose-img:py-4 prose-img:mb-6'
        )}
        innerHTML={post.html}
      />
      <CommentsSection slug={params().post} />
    </main>
  )
}
