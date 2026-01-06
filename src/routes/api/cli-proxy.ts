import * as z from 'zod/mini'
import { createFileRoute } from '@tanstack/solid-router'

const methodSchema = z.enum(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])

const requestSchema = z.object({
  url: z.url(),
  method: z.optional(z.string()),
  headers: z.optional(z.record(z.string(), z.string())),
  body: z.optional(z.string()),
  followRedirects: z.optional(z.boolean()),
  timeoutMs: z.optional(z.number())
})

const blockedHosts = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0'])

const isPrivateIp = (ip: string): boolean => {
  const normalized = ip.toLowerCase()
  if (blockedHosts.has(normalized)) return true

  if (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd'))
    return true

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4Match) return false

  const octets = ipv4Match.slice(1).map(Number)
  if (octets.length !== 4) return true
  if (octets.some(octet => octet < 0 || octet > 255)) return true

  const [a, b] = octets
  if (a === undefined || b === undefined) return true
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true

  return false
}

const isPrivateHostname = (host: string): boolean => {
  const normalized = host.toLowerCase()
  if (blockedHosts.has(normalized)) return true
  if (normalized.endsWith('.localhost') || normalized.endsWith('.local')) return true
  return false
}

const resolveHostnameIps = async (hostname: string): Promise<string[]> => {
  const ips: string[] = []

  const [a, aaaa] = await Promise.allSettled([
    fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: { Accept: 'application/dns-json' }
    }).then(r => r.json()),
    fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=AAAA`, {
      headers: { Accept: 'application/dns-json' }
    }).then(r => r.json())
  ])

  type DnsResponse = { Answer?: Array<{ type: number; data: string }> }

  if (a.status === 'fulfilled') {
    const response = a.value as DnsResponse
    for (const answer of response.Answer ?? []) {
      if (answer.type === 1) ips.push(answer.data)
    }
  }

  if (aaaa.status === 'fulfilled') {
    const response = aaaa.value as DnsResponse
    for (const answer of response.Answer ?? []) {
      if (answer.type === 28) ips.push(answer.data)
    }
  }

  return ips
}

const isPrivateHost = async (host: string): Promise<boolean> => {
  if (isPrivateHostname(host)) return true
  if (isPrivateIp(host)) return true

  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) return isPrivateIp(host)

  const resolvedIps = await resolveHostnameIps(host)
  if (resolvedIps.length === 0) return true

  return resolvedIps.some(isPrivateIp)
}

const allowedRequestHeaders = new Set([
  'accept',
  'accept-language',
  'authorization',
  'cache-control',
  'content-type',
  'if-match',
  'if-modified-since',
  'if-none-match',
  'range',
  'user-agent'
])

const buildRequestHeaders = (headers?: Record<string, string>) => {
  const requestHeaders = new Headers()
  if (!headers) return requestHeaders

  for (const [key, value] of Object.entries(headers)) {
    const normalized = key.toLowerCase()
    if (!allowedRequestHeaders.has(normalized)) continue
    requestHeaders.set(normalized, value)
  }

  return requestHeaders
}

export const Route = createFileRoute('/api/cli-proxy')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payloadRequest = await requestSchema.safeParseAsync(await request.json())
        if (!payloadRequest.success)
          return Response.json({ ok: false, error: z.prettifyError(payloadRequest.error) })

        const payload = payloadRequest.data
        const targetUrl = new URL(payload.url.trim())

        if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:')
          return Response.json({ ok: false, error: 'Unsupported protocol' }, { status: 400 })

        if (await isPrivateHost(targetUrl.hostname))
          return Response.json({ ok: false, error: 'Blocked host' }, { status: 400 })

        const fallbackMethod = payload.body ? 'POST' : 'GET'
        const methodInput = payload.method?.trim().toUpperCase()
        const methodResult = methodInput ? methodSchema.parse(methodInput) : fallbackMethod

        const requestHeaders = buildRequestHeaders(payload.headers)
        const bodyAllowed = methodResult !== 'GET' && methodResult !== 'HEAD'

        if (payload.body && bodyAllowed && !requestHeaders.has('content-type'))
          requestHeaders.set('content-type', 'application/x-www-form-urlencoded')

        const controller = new AbortController()
        const timeoutMs = payload.timeoutMs ?? 30_000
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

        try {
          const response = await fetch(targetUrl.toString(), {
            method: methodResult,
            headers: requestHeaders,
            signal: controller.signal,
            body: bodyAllowed ? payload.body : undefined,
            redirect: payload.followRedirects ? 'follow' : 'manual'
          })

          const headers: Record<string, string> = {}
          response.headers.forEach((v, k) => {
            headers[k] = v
          })

          return Response.json({
            ok: true,
            headers,
            url: response.url,
            status: response.status,
            body: await response.text(),
            statusText: response.statusText
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Fetch failed'
          return Response.json({ ok: false, error: message }, { status: 502 })
        } finally {
          clearTimeout(timeoutId)
        }
      }
    }
  }
})
