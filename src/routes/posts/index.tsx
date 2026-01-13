import { For } from 'solid-js'
import { createFileRoute, Link } from '@tanstack/solid-router'

import { fetchAllPosts } from '#lib/posts.ts'
import type { Frontmatter } from '#lib/frontmatter.ts'

export const Route = createFileRoute('/posts/')({
  loader: async () => {
    const posts = fetchAllPosts()

    const frontmatters: Array<Frontmatter> = []
    for (const [_slug, loader] of Object.entries(posts)) {
      const { frontmatter } = await loader()

      frontmatters.push({
        ...frontmatter,
        slug: _slug.replaceAll('/posts', '').replaceAll('/index.mdx', '').replaceAll('../', '')
      })
    }

    return frontmatters
  },
  component: RouteComponent
})

function RouteComponent() {
  const frontmatters = Route.useLoaderData()

  return (
    <For each={frontmatters()}>
      {item => (
        <div>
          <Link
            to={'/posts/$post'}
            params={{ post: item.slug }}>
            {item.title}
          </Link>
        </div>
      )}
    </For>
  )
}
