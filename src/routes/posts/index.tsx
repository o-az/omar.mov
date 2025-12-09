import { createFileRoute, useLoaderData } from '@tanstack/solid-router'

export const Route = createFileRoute('/posts/')({
  component: RouteComponent
})

function RouteComponent() {
  const posts = useLoaderData({ from: '/posts' })
  return <div>{JSON.stringify(posts())}</div>
}
