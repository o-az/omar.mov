import { Bash, defineCommand } from 'just-bash'
import { For, Show, createEffect, createSignal, onMount } from 'solid-js'

const createProxiedCurl = () =>
  defineCommand('curl', async (args: string[]) => {
    let url = ''
    let method = 'GET'
    const headers: Record<string, string> = {}
    let body: string | undefined
    let includeHeaders = false
    let followRedirects = true
    let verbose = false
    let silent = false

    for (let index = 0; index < args.length; index++) {
      const argument = args[index]
      if (!argument) continue

      if (argument === '-X' || argument === '--request') {
        method = args[++index] ?? 'GET'
      } else if (argument === '-H' || argument === '--header') {
        const header = args[++index]
        if (header) {
          const colonIndex = header.indexOf(':')
          if (colonIndex > 0) {
            const name = header.slice(0, colonIndex).trim()
            const value = header.slice(colonIndex + 1).trim()
            headers[name] = value
          }
        }
      } else if (argument === '-d' || argument === '--data' || argument === '--data-raw') {
        body = args[++index]
        if (method === 'GET') method = 'POST'
      } else if (argument === '-i' || argument === '--include') {
        includeHeaders = true
      } else if (argument === '-L' || argument === '--location') {
        followRedirects = true
      } else if (argument === '-v' || argument === '--verbose') {
        verbose = true
      } else if (argument === '-s' || argument === '--silent') {
        silent = true
      } else if (argument === '-I' || argument === '--head') {
        method = 'HEAD'
        includeHeaders = true
      } else if (!argument.startsWith('-')) {
        url = argument
      }
    }

    if (!url) {
      return { stdout: '', stderr: 'curl: no URL specified\n', exitCode: 2 }
    }

    if (!url.match(/^https?:\/\//)) {
      url = `https://${url}`
    }

    try {
      const response = await fetch('/api/cli-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          body,
          followRedirects
        })
      })

      const result = (await response.json()) as
        | {
            ok: true
            status: number
            statusText: string
            headers: Record<string, string>
            body: string
            url: string
          }
        | { ok: false; error: string }

      if (!result.ok) {
        return { stdout: '', stderr: `curl: (7) ${result.error}\n`, exitCode: 7 }
      }

      let output = ''

      if (verbose) {
        output += `> ${method} ${url}\n`
        for (const [name, value] of Object.entries(headers)) {
          output += `> ${name}: ${value}\n`
        }
        output += '>\n'
        output += `< HTTP/1.1 ${result.status} ${result.statusText}\n`
        for (const [name, value] of Object.entries(result.headers)) {
          output += `< ${name}: ${value}\n`
        }
        output += '<\n'
      }

      if (includeHeaders && !verbose) {
        output += `HTTP/1.1 ${result.status} ${result.statusText}\r\n`
        for (const [name, value] of Object.entries(result.headers)) {
          output += `${name}: ${value}\r\n`
        }
        output += '\r\n'
      }

      if (method !== 'HEAD') {
        output += result.body
      }

      return { stdout: output, stderr: '', exitCode: 0 }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (silent) return { stdout: '', stderr: '', exitCode: 7 }
      return { stdout: '', stderr: `curl: (7) ${message}\n`, exitCode: 7 }
    }
  })

interface HistoryEntry {
  id: number
  command: string
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
}

export function CliShell() {
  const [history, setHistory] = createSignal<HistoryEntry[]>([])
  const [input, setInput] = createSignal('')
  const [isRunning, setIsRunning] = createSignal(false)
  const [networkEnabled, setNetworkEnabled] = createSignal(false)

  let shell: Bash | undefined
  let outputRef: HTMLDivElement | undefined
  let inputRef: HTMLInputElement | undefined

  const isClearCommand = (command: string) =>
    command === 'clear' || command === '/clear' || command === 'cls'

  const createShell = (withNetwork: boolean) => {
    const customCommands = [
      defineCommand('clear', async () => ({ stdout: '', stderr: '', exitCode: 0 })),
      defineCommand('cls', async () => ({ stdout: '', stderr: '', exitCode: 0 })),
      defineCommand('/clear', async () => ({ stdout: '', stderr: '', exitCode: 0 })),
      ...(withNetwork ? [createProxiedCurl()] : [])
    ]

    return new Bash({
      customCommands,
      files: {
        '/home/user/README.txt': [
          'Welcome to the in-memory shell.',
          'Nothing touches your real disk.',
          'Try commands like:',
          '- ls',
          '- cat README.txt',
          '- echo "hi" > notes.txt && cat notes.txt',
          '',
          'Enable network to allow curl.'
        ].join('\n')
      }
    })
  }

  onMount(() => {
    shell = createShell(networkEnabled())
    queueMicrotask(() => inputRef?.focus())
  })

  createEffect(() => {
    history()
    if (typeof window === 'undefined') return
    requestAnimationFrame(() => {
      if (!outputRef) return
      outputRef.scrollTo({ top: outputRef.scrollHeight, behavior: 'smooth' })
    })
  })

  const toggleNetwork = () => {
    const next = !networkEnabled()
    setNetworkEnabled(next)
    shell = createShell(next)
    setHistory([])
    queueMicrotask(() => inputRef?.focus())
  }

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    const command = input().trim()
    if (!command) return

    if (!shell) return

    setIsRunning(true)
    const started = performance.now()
    try {
      const result = await shell.exec(command)
      const durationMs = Math.round(performance.now() - started)
      if (isClearCommand(command)) {
        setHistory([])
      } else {
        setHistory(list => [
          ...list,
          {
            id: list.length + 1,
            command,
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            durationMs
          }
        ])
      }
    } catch (error) {
      const durationMs = Math.round(performance.now() - started)
      const message = error instanceof Error ? error.message : String(error)
      setHistory(list => [
        ...list,
        {
          id: list.length + 1,
          command,
          stdout: '',
          stderr: `${message}\n`,
          exitCode: 1,
          durationMs
        }
      ])
    } finally {
      setIsRunning(false)
      setInput('')
      queueMicrotask(() => inputRef?.focus())
    }
  }

  return (
    <main class='mx-auto flex max-w-5xl flex-col gap-4 font-[Lilex] px-4 min-h-[70vh] max-h-screen max-[650px]:max-w-none max-[650px]:w-auto max-[650px]:min-h-[calc(100svh-2.25rem)] max-[650px]:-mx-6 max-[650px]:gap-2.5 max-[650px]:px-0 max-[650px]:pb-1'>
      <header class='flex flex-wrap items-baseline justify-between gap-2 max-[650px]:px-3'>
        <div>
          <p class='text-2xl font-bold'>sandboxed shell</p>
          <p class='text-sm text-neutral-400'>
            backed by{' '}
            <a
              class='text-blue-300 underline'
              href='https://github.com/vercel-labs/just-bash'
              target='_blank'
              rel='noreferrer'>
              just-bash
            </a>
            . files live only in memory.
          </p>
        </div>
        <div class='flex flex-wrap gap-2 text-xs text-neutral-400'>
          <span class='rounded border border-white/10 bg-white/5 px-2 py-1'>try: ls</span>
          <span class='rounded border border-white/10 bg-white/5 px-2 py-1'>cat README.txt</span>
          <span class='rounded border border-white/10 bg-white/5 px-2 py-1'>
            echo "hi" &gt; notes.txt
          </span>
        </div>
      </header>

      <section class='flex flex-1 flex-col rounded-2xl border border-white/10 bg-linear-to-br from-[#1a1a1d] to-[#0f1012] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] min-h-[65vh] max-h-[calc(100vh-6rem)] max-[650px]:flex-1 max-[650px]:rounded-none max-[650px]:border-0 max-[650px]:p-0 max-[650px]:shadow-none max-[650px]:pb-1'>
        <div class='flex flex-wrap items-center justify-end gap-2 text-xs text-neutral-400 max-[650px]:px-3'>
          <div class='flex items-center mt-2 gap-3'>
            <button
              type='button'
              class='rounded border border-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-neutral-300 transition hover:border-fuchsia-300 hover:text-fuchsia-300 disabled:opacity-60'
              onClick={toggleNetwork}
              disabled={isRunning()}>
              {networkEnabled() ? 'disable network' : 'enable network'}
            </button>
            <span class='text-[10px] uppercase tracking-wide text-neutral-500'>bash-ish</span>
            <span class='text-[10px] text-neutral-500'>toggle resets shell</span>
          </div>
        </div>

        <div
          ref={outputRef}
          class='mt-3 h-auto flex-1 min-h-[40vh] max-h-[calc(100vh-14rem)] overflow-y-auto rounded-lg border border-white/5 bg-black/40 p-3 font-mono text-sm leading-relaxed shadow-inner max-[650px]:h-auto max-[650px]:min-h-[50vh] max-[650px]:max-h-[calc(100svh-10.5rem)] max-[650px]:flex-1 max-[650px]:rounded-none max-[650px]:border-0 max-[650px]:bg-transparent max-[650px]:shadow-none max-[650px]:px-0'>
          <Show when={history().length === 0}>
            <p class='text-neutral-500'>Ready when you are. Hit enter after typing a command.</p>
          </Show>

          <For each={history()}>
            {entry => (
              <div class='mb-3'>
                <div class='flex items-center gap-2 text-green-300'>
                  <span>$</span>
                  <span class='text-white'>{entry.command}</span>
                </div>
                <Show when={entry.stdout}>
                  <pre class='mt-1 whitespace-pre-wrap wrap-break-word text-slate-100'>
                    {entry.stdout}
                  </pre>
                </Show>
                <Show when={entry.stderr}>
                  <pre class='mt-1 whitespace-pre-wrap wrap-break-word text-red-400'>
                    {entry.stderr}
                  </pre>
                </Show>
                <p class='mt-1 text-[11px] text-neutral-500'>
                  exit {entry.exitCode} · {entry.durationMs}ms
                </p>
              </div>
            )}
          </For>
        </div>

        <form
          class='mt-4 flex items-center gap-2 font-mono text-sm max-[650px]:px-3 max-[650px]:pb-1'
          onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={input()}
            onInput={event => setInput(event.currentTarget.value)}
            placeholder='type a command and hit enter'
            class='w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 text-white outline-none transition focus:border-fuchsia-300 focus:ring-1 focus:ring-fuchsia-300 disabled:opacity-60'
            disabled={isRunning()}
            autocomplete='off'
            autocapitalize='off'
            spellcheck={false}
          />
          <button
            type='submit'
            class='border border-white/10 bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-black transition hover:-translate-y-px hover:shadow-[0_10px_30px_rgba(236,72,153,0.35)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isRunning()}>
            {isRunning() ? 'running…' : 'run'}
          </button>
        </form>
      </section>
    </main>
  )
}
