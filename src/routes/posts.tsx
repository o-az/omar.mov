import { createFileRoute, Outlet } from '@tanstack/solid-router'

import type { MDXModule } from '#components/mdx.tsx'

export const Route = createFileRoute('/posts')({
  loader: async () => {
    const modules = import.meta.glob<MDXModule>('../posts/**/*.mdx')
    const entries = await Promise.all(
      Object.entries(modules).map(async ([path, loader]) => {
        const module = await loader()
        return {
          path,
          frontmatter: module.frontmatter
        }
      })
    )
    return entries
  },
  component: PostsLayout
})

function PostsLayout() {
  return <Outlet />
}
