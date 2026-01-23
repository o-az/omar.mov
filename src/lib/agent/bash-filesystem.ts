import type { AgentFS } from 'agentfs-sdk/cloudflare'

type Encoding = 'utf8' | 'utf-8' | 'base64' | 'hex' | 'binary' | 'latin1'

type EncodingOptions = Encoding | { encoding?: Encoding }

const [textEncoder, textDecoder] = [new TextEncoder(), new TextDecoder()]

const defaultMountPoint = '/'

function toBuffer(content: string | Uint8Array, encoding?: Encoding) {
  if (content instanceof Uint8Array) return content
  if (encoding === 'base64') {
    return Uint8Array.from(atob(content), character => character.charCodeAt(0))
  }
  if (encoding === 'hex') {
    const bytes = new Uint8Array(content.length / 2)
    for (let index = 0; index < content.length; index += 2) {
      bytes[index / 2] = Number.parseInt(content.slice(index, index + 2), 16)
    }
    return bytes
  }
  if (encoding === 'binary' || encoding === 'latin1') {
    return Uint8Array.from(content, character => character.charCodeAt(0))
  }
  return textEncoder.encode(content)
}

function fromBuffer(buffer: Uint8Array, encoding?: Encoding) {
  if (encoding === 'base64') return btoa(String.fromCharCode(...buffer))

  if (encoding === 'hex')
    return Array.from(buffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')

  if (encoding === 'binary' || encoding === 'latin1') return String.fromCharCode(...buffer)

  return textDecoder.decode(buffer)
}

function getEncoding(options?: EncodingOptions) {
  if (!options) return undefined
  if (typeof options === 'string') return options
  return options.encoding
}

export class AgentFsBashFileSystem {
  #mountPoint: string
  #agentFileSystem: AgentFS

  constructor(options: { agentFileSystem: AgentFS; mountPoint?: string }) {
    this.#agentFileSystem = options.agentFileSystem
    const mountPoint = options.mountPoint ?? defaultMountPoint
    this.#mountPoint = mountPoint === '/' ? '/' : mountPoint.replace(/\/+$/, '')

    if (!this.#mountPoint.startsWith('/'))
      throw new Error(`Mount point must be an absolute path: ${mountPoint}`)
  }

  getMountPoint() {
    return this.#mountPoint
  }

  // empty on purpose
  getAllPaths = () => []

  normalizePath(pathName: string) {
    if (!pathName || pathName === '/') return '/'

    let normalized = pathName.endsWith('/') && pathName !== '/' ? pathName.slice(0, -1) : pathName
    if (!normalized.startsWith('/')) normalized = `/${normalized}`

    const parts = normalized.split('/').filter(part => part && part !== '.')
    const resolved: Array<string> = []

    for (const part of parts) {
      if (part === '..') resolved.pop()
      else resolved.push(part)
    }
    return `/${resolved.join('/')}` || '/'
  }

  resolvePath(currentWorkingDirectory: string, pathName: string) {
    if (pathName.startsWith('/')) return this.normalizePath(pathName)
    const base =
      currentWorkingDirectory === '/' ? `/${pathName}` : `${currentWorkingDirectory}/${pathName}`
    return this.normalizePath(base)
  }

  #toAgentPath(virtualPath: string) {
    const normalized = this.normalizePath(virtualPath)
    if (this.#mountPoint === '/') return normalized
    if (normalized === this.#mountPoint) return '/'
    if (normalized.startsWith(`${this.#mountPoint}/`))
      return normalized.slice(this.#mountPoint.length)

    return normalized
  }

  async readFile(pathName: string, options?: EncodingOptions) {
    const buffer = await this.readFileBuffer(pathName)
    const encoding = getEncoding(options) ?? 'utf8'
    return fromBuffer(buffer, encoding)
  }

  async readFileBuffer(pathName: string) {
    const normalized = this.normalizePath(pathName)
    const agentPath = this.#toAgentPath(normalized)
    try {
      const data = await this.#agentFileSystem.readFile(agentPath)
      if (typeof data === 'string') return textEncoder.encode(data)
      return new Uint8Array(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('not found') || message.includes('ENOENT'))
        throw new Error(`ENOENT: no such file or directory, open '${pathName}'`)
      throw error
    }
  }

  async writeFile(pathName: string, content: string | Uint8Array, options?: EncodingOptions) {
    const encoding = getEncoding(options)
    const buffer = toBuffer(content, encoding)
    const agentPath = this.#toAgentPath(pathName)
    await this.#agentFileSystem.writeFile(agentPath, Buffer.from(buffer))
  }

  async appendFile(pathName: string, content: string | Uint8Array, options?: EncodingOptions) {
    const encoding = getEncoding(options)
    const newBuffer = toBuffer(content, encoding)
    let existingBuffer: Uint8Array

    try {
      existingBuffer = await this.readFileBuffer(pathName)
    } catch {
      existingBuffer = new Uint8Array(0)
    }
    const combined = new Uint8Array(existingBuffer.length + newBuffer.length)
    combined.set(existingBuffer)
    combined.set(newBuffer, existingBuffer.length)
    await this.writeFile(pathName, combined)
  }

  async exists(pathName: string) {
    const agentPath = this.#toAgentPath(pathName)
    try {
      await this.#agentFileSystem.access(agentPath)
      return true
    } catch {
      return false
    }
  }

  async stat(pathName: string) {
    const agentPath = this.#toAgentPath(pathName)
    const stats = await this.#agentFileSystem.stat(agentPath)
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink?.() ?? false,
      mode: stats.mode,
      size: stats.size,
      mtime: new Date(stats.mtime)
    }
  }

  async lstat(pathName: string) {
    const agentPath = this.#toAgentPath(pathName)
    const stats = await this.#agentFileSystem.lstat(agentPath)
    return {
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      isSymbolicLink: stats.isSymbolicLink?.() ?? false,
      mode: stats.mode,
      size: stats.size,
      mtime: new Date(stats.mtime)
    }
  }

  async mkdir(pathName: string, options?: { recursive?: boolean }) {
    const agentPath = this.#toAgentPath(pathName)

    // AgentFS does not support `mkdir` options, so we manually handle recursive if passed
    if (!options?.recursive) return await this.#agentFileSystem.mkdir(agentPath)

    const parts = agentPath.split('/')
    for (let index = 1; index < parts.length; index++) {
      const dir = parts.slice(0, index).join('/')
      await this.#agentFileSystem.mkdir(dir)
    }
  }

  async readdir(pathName: string) {
    const agentPath = this.#toAgentPath(pathName)
    return this.#agentFileSystem.readdir(agentPath)
  }

  async rm(pathName: string, options?: { force?: boolean; recursive?: boolean }) {
    const agentPath = this.#toAgentPath(pathName)
    await this.#agentFileSystem.rm(agentPath, options)
  }

  async cp(sourcePath: string, destinationPath: string) {
    const sourceAgentPath = this.#toAgentPath(sourcePath)
    const destinationAgentPath = this.#toAgentPath(destinationPath)
    await this.#agentFileSystem.copyFile(sourceAgentPath, destinationAgentPath)
  }

  async mv(sourcePath: string, destinationPath: string) {
    const sourceAgentPath = this.#toAgentPath(sourcePath)
    const destinationAgentPath = this.#toAgentPath(destinationPath)
    await this.#agentFileSystem.rename(sourceAgentPath, destinationAgentPath)
  }

  async chmod() {
    // AgentFS does not support chmod. Ignore to match just-bash expectations.
  }

  async symlink(target: string, linkPath: string) {
    const linkAgentPath = this.#toAgentPath(linkPath)
    await this.#agentFileSystem.symlink(target, linkAgentPath)
  }

  async link(existingPath: string, newPath: string) {
    const sourceAgentPath = this.#toAgentPath(existingPath)
    const destinationAgentPath = this.#toAgentPath(newPath)
    await this.#agentFileSystem.copyFile(sourceAgentPath, destinationAgentPath)
  }

  async readlink(pathName: string) {
    const agentPath = this.#toAgentPath(pathName)
    return this.#agentFileSystem.readlink(agentPath)
  }
}
