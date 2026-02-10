/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime: {
      env: Record<string, unknown>
      cf: unknown
      ctx: {
        waitUntil(promise: Promise<unknown>): void
        passThroughOnException(): void
      }
    }
  }
}
