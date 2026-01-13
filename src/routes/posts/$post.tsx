import * as z from 'zod/mini'
import { createServerFn } from '@tanstack/solid-start'
import { createFileRoute } from '@tanstack/solid-router'

import { fetchAllPosts } from '#lib/posts.ts'
import { MDXProvider } from '#components/mdx.tsx'
import markdownCss from '#style/markdown.css?url'
import { CommentsSection } from '#components/comments.tsx'
import { useMDXComponents } from '#lib/solid-jsx/jsx-runtime.ts'

type PostFrontmatter = {
  title?: string
  date?: string
  description?: string
}

type PostContent = {
  content: string
  frontmatter: PostFrontmatter
}

const getPostContent = createServerFn({ method: 'GET' })
  .inputValidator((postSlug: string) => postSlug)
  .handler(async ({ data: postSlug }): Promise<PostContent> => {
    const posts = fetchAllPosts({ eager: true })

    const post = (posts[`../posts/${postSlug}/index.mdx`] || posts[`../posts/${postSlug}.mdx`]) as
      | {
          frontmatter: PostFrontmatter
          default: (props: Record<string, unknown>) => Array<{ t: string }>
        }
      | undefined

    if (!post) {
      throw new Error(`Post not found: ${postSlug}`)
    }

    const { frontmatter, default: renderMdx } = post

    return {
      content: renderMdx({})
        .map(item => item.t)
        .filter(Boolean)
        .join(''),
      frontmatter
    }
  })

export const Route = createFileRoute('/posts/$post')({
  component: RouteComponent,
  params: z.object({ post: z.string() }),
  loader: async ({ params }) => getPostContent({ data: params.post }),
  head: ({ loaderData, params }) => {
    const frontmatter = loaderData?.frontmatter
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
