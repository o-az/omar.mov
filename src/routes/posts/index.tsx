import { fetchAllPosts } from '#lib/posts.ts'
import { createFileRoute } from '@tanstack/solid-router'
import { For } from 'solid-js'

type Frontmatter = { title: string; slug: string }

export const Route = createFileRoute('/posts/')({
  loader: async () => {
    const posts = fetchAllPosts() as {
      [key: string]: () => Promise<{ frontmatter: Frontmatter }>
    }

    const frontmatters: Array<Frontmatter> = []
    for (const [, loader] of Object.entries(posts)) {
      const { frontmatter } = await loader()
      frontmatters.push(frontmatter)
    }

    return frontmatters
  },
  component: RouteComponent
})

function RouteComponent() {
  const frontmatters = Route.useLoaderData()

  return <For each={frontmatters()}>{item => <div>{item.title}</div>}</For>
}
