import { createTRPCProxyClient, httpLink } from "@trpc/client"
import fetch from "node-fetch"
import type { AppRouter } from "ts-type-expand-plugin/src/server/controller"

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createClient = (port: number) =>
  createTRPCProxyClient<AppRouter>({
    links: [
      httpLink({
        url: `http://localhost:${port}/trpc`,
        fetch,
      }),
    ],
  })

export type ApiClient = ReturnType<typeof createClient>

type ApiClientClosure = {
  updatePortNumber: (nextPort: number) => void
  client: () => ApiClient
}

export const { updatePortNumber, client } = ((): ApiClientClosure => {
  let port: number
  let clientCache: ApiClient | undefined

  return {
    updatePortNumber: (nextPort) => {
      if (port !== nextPort) {
        clientCache = createClient(nextPort)
      }

      port = nextPort
    },
    client: () => {
      if (clientCache === undefined) {
        throw new Error("port number must initialized by updatePortNumber")
      }

      return clientCache
    },
  }
})()
