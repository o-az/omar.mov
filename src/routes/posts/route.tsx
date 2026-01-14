import { createFileRoute, Outlet } from '@tanstack/solid-router'

export const Route = createFileRoute('/posts')({
  ssr: true,
  component: Outlet
})
