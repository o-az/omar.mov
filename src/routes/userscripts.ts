import { createFileRoute, redirect } from '@tanstack/solid-router'

export const Route = createFileRoute('/userscripts')({
  beforeLoad: () => {
    throw redirect({ href: 'https://greasyfork.org/en/users/1302478-o-az' })
  }
})
