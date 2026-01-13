import { For } from 'solid-js'
import { createFileRoute, Link } from '@tanstack/solid-router'
// import { MDXContent } from '@content-collections/mdx'

import { allPosts } from '#content-collections'

export const Route = createFileRoute('/posts/')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <For each={allPosts}>
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
