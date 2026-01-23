import { Server } from 'partyserver'

type OutgoingMessage = { type: 'viewer-count'; count: number }

export class LiveViewersDO extends Server<Cloudflare.Env> implements DurableObject {
  onConnect: Server['onConnect'] = (connection, _context) => {
    console.info(`[${connection.id}] New connection`)
    this.#broadcastViewerCount()
  }

  onClose: Server['onClose'] = (connection, code, reason, wasClean) => {
    console.info(`[${connection.id}] Closing connection`, { code, reason, wasClean })
    this.#broadcastViewerCount()
  }

  onError: Server['onError'] = (connection, error) => {
    console.error(`[${connection.id}] Error in connection`, { error })
    this.#broadcastViewerCount()
  }

  onException: Server['onException'] = async error => {
    console.error(`[Exception]`, { error })
  }

  #broadcastViewerCount() {
    const count = [...this.getConnections()].length
    const message = { type: 'viewer-count', count } as const satisfies OutgoingMessage

    this.broadcast(JSON.stringify(message))
  }
}
