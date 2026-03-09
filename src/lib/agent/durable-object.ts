import * as z from 'zod/mini'
import { ulid } from '@std/ulid'
import { stepCountIs, streamText, tool } from 'ai'
import { DurableObject } from 'cloudflare:workers'
import { createWorkersAI } from 'workers-ai-provider'
import { AgentFS, type CloudflareStorage } from 'agentfs-sdk/cloudflare'

import { AgentFsBashFileSystem } from '#lib/agent/bash-filesystem.ts'

const bashToolDescription = /* md */ `Execute bash commands in the persistent sandbox filesystem.

When the user asks for filesystem operations, use bash commands like:
- ls
- cat <file>
- echo "content" > file.txt
- mkdir <dir>
- rm <file>

For general questions or greetings, respond naturally without using tools.`

let bashModulePromise: Promise<typeof import('just-bash')> | undefined

const getBashModule = () => {
  bashModulePromise ??= import('just-bash')
  return bashModulePromise
}

export class AgentDO extends DurableObject<Cloudflare.Env> {
  #fs = AgentFS.create(this.ctx.storage as CloudflareStorage)

  constructor(context: DurableObjectState, env: Cloudflare.Env) {
    super(context, env)
  }

  async #createBash() {
    const { Bash } = await getBashModule()
    const fileSystem = new AgentFsBashFileSystem({ agentFileSystem: this.#fs })
    return new Bash({ fs: fileSystem, cwd: '/' })
  }

  async exec(command: string) {
    const bash = await this.#createBash()
    return bash.exec(command)
  }

  async chat(message: string): Promise<ReadableStream<Uint8Array>> {
    const bash = await this.#createBash()

    const executeBash = tool({
      description: bashToolDescription,
      inputSchema: z.object({
        command: z.string()
      }),
      execute: async ({ command }) => bash.exec(command)
    })

    const workersAI = createWorkersAI({ binding: this.env.AI })

    const result = streamText({
      headers: { 'X-Request-Id': ulid() },
      tools: { execute_bash: executeBash },
      stopWhen: stepCountIs(10),
      messages: [{ role: 'user', content: message }],
      model: workersAI('@cf/meta/llama-3.3-70b-instruct-fp8-fast' as '@cf/meta/llama-3-8b-instruct')
    })

    const { body } = result.toTextStreamResponse()
    if (!body) throw new Error('No body')
    return body
  }
}
