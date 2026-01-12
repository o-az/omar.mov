import { For } from 'solid-js'
import { fetchAllPosts } from '#lib/posts.ts'
import { createFileRoute, Link } from '@tanstack/solid-router'

type Frontmatter = { title: string; slug: string; date: string }

export const Route = createFileRoute('/posts/')({
  loader: async () => {
    const posts = fetchAllPosts() as {
      [key: string]: () => Promise<{ frontmatter: Frontmatter }>
    }

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
