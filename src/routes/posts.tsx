import { createFileRoute, Outlet } from '@tanstack/solid-router'

export const Route = createFileRoute('/posts')({
  component: () => <Outlet />
})
