import { Bash } from 'just-bash'
import { ulid } from '@std/ulid'
import { createBashTool } from 'bash-tool'
import { stepCountIs, streamText } from 'ai'
import { DurableObject } from 'cloudflare:workers'
import { createWorkersAI } from 'workers-ai-provider'
import { AgentFS, type CloudflareStorage } from 'agentfs-sdk/cloudflare'

import { AgentFsBashFileSystem } from '#lib/agent/bash-filesystem.ts'

const bashToolkitPrompt = /* md */ `You are a helpful AI agent with access to a persistent filesystem.
You can have normal conversations and also interact with the filesystem when needed.
Files you create will persist across sessions.

When the user asks for filesystem operations, use bash commands:
- ls to list files
- cat <file> to read files
- echo "content" > file.txt to write files
- mkdir <dir> to create directories
- rm <file> to remove files

For general questions or greetings, respond naturally without using tools.`

export class AgentDO extends DurableObject<Cloudflare.Env> {
  #fs = AgentFS.create(this.ctx.storage as CloudflareStorage)

  constructor(context: DurableObjectState, env: Cloudflare.Env) {
    super(context, env)
  }

  #createBash() {
    const fileSystem = new AgentFsBashFileSystem({ agentFileSystem: this.#fs })
    return new Bash({ fs: fileSystem, cwd: '/' })
  }

  async exec(command: string) {
    const bash = this.#createBash()
    return bash.exec(command)
  }

  async chat(message: string): Promise<ReadableStream<Uint8Array>> {
    const bash = this.#createBash()

    // Create the bash tool with the just-bash sandbox
    const bashToolkit = await createBashTool({
      sandbox: bash,
      extraInstructions: bashToolkitPrompt
    })

    const workersAI = createWorkersAI({ binding: this.env.AI })

    const result = streamText({
      headers: { 'X-Request-Id': ulid() },
      tools: bashToolkit.tools,
      stopWhen: stepCountIs(10),
      messages: [{ role: 'user', content: message }],
      model: workersAI('@cf/meta/llama-3.3-70b-instruct-fp8-fast' as '@cf/meta/llama-3-8b-instruct')
    })

    const { body } = result.toTextStreamResponse()
    if (!body) throw new Error('No body')
    return body
  }
}
