import type PartySocketType from 'partysocket'
import { usePageVisibility } from '@solid-primitives/page-visibility'
import { createConnectivitySignal } from '@solid-primitives/connectivity'
import { createEffect, createSignal, on, onCleanup, onMount, Show } from 'solid-js'

export function LiveViewers() {
  const isVisible = usePageVisibility()
  const isOnline = createConnectivitySignal()

  const [mounted, setMounted] = createSignal(false)
  const [socket, setSocket] = createSignal<PartySocketType | null>(null)
  const [viewerCount, setViewerCount] = createSignal<number | null>(null)

  onMount(() => {
    setMounted(true)
    import('partysocket').then(({ PartySocket }) => {
      const partySocket = new PartySocket({
        room: 'global',
        party: 'live-viewers-do',
        host: window.location.host
      })

      function listener(event: MessageEvent) {
        try {
          const data = JSON.parse(event.data) as { type?: string; count?: number }
          if (data.type === 'viewer-count' && typeof data.count === 'number') {
            setViewerCount(data.count)
          }
        } catch {
          // ignore parse errors
        }
      }

      partySocket.addEventListener('message', listener)
      setSocket(partySocket)
    })
  })

  onCleanup(() => {
    const currentSocket = socket()
    if (currentSocket) currentSocket.close()
  })

  createEffect(
    on(
      [isOnline, isVisible],
      ([online, visible]) => {
        const currentSocket = socket()
        if (!currentSocket) return

        if (online && visible) currentSocket.reconnect()
        else {
          currentSocket.close()
          setViewerCount(null)
        }
      },
      { defer: true }
    )
  )

  const showLive = () => mounted() && isOnline()

  return (
    <Show when={mounted()}>
      <div
        title={`${Number(viewerCount() ?? 0) > 1 ? `${viewerCount()} users` : `${viewerCount()} user`} currently on this page`}
        class='max-w-min flex items-center justify-end gap-1 text-sm text-white opacity-65 hover:opacity-100 py-py cursor-default'>
        <p class='relative flex size-2 shrink-0'>
          <span
            class={`absolute inline-flex size-full rounded-full ${showLive() ? 'animate-ping bg-emerald-300 animation-duration-[1.75s]' : 'bg-transparent'}`}
          />
          <span
            class={`relative inline-flex size-2 rounded-full ${showLive() ? 'bg-emerald-400' : 'bg-neutral-400'}`}
          />
        </p>
        <span class='min-w-[3ch] tabular-nums text-[11px]'>{viewerCount() ?? '0'}</span>
      </div>
    </Show>
  )
}
