interface Env {
  readonly PORT: string
  readonly ENVIRONMENT: 'development' | 'production'

  readonly LOGGING?: 'verbose' | 'normal' | 'silent' | undefined

  readonly APP_VERSION: string

  readonly VITE_UTTERANCES_REPO?: string
  readonly VITE_UTTERANCES_LABEL?: string
  readonly VITE_UTTERANCES_THEME?: string
}

// Node.js `process.env` auto-completion
declare namespace NodeJS {
  interface ProcessEnv extends Env {
    readonly NODE_ENV: 'development' | 'production'
  }
}

// Bun/vite `import.meta.env` auto-completion
interface ImportMetaEnv extends Env {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.wasm' {
  const content: string
  export default content
}

declare module '*.mdx' {
  const content: string
  export default content
  export const components: any
}
