import pako from 'pako'

export const constants = {
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1
} as const

export function gunzipSync(buffer: Uint8Array | Buffer): Buffer {
  const result = pako.ungzip(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))
  return Buffer.from(result)
}

export function gzipSync(
  buffer: Uint8Array | Buffer | string,
  options?: { level?: number }
): Buffer {
  const input =
    typeof buffer === 'string'
      ? new TextEncoder().encode(buffer)
      : buffer instanceof Uint8Array
        ? buffer
        : new Uint8Array(buffer)
  const level = (options?.level ?? -1) as pako.DeflateFunctionOptions['level']
  const result = pako.gzip(input, { level })
  return Buffer.from(result)
}

export default { constants, gunzipSync, gzipSync }
