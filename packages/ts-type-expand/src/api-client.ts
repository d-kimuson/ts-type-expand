import { createTRPCProxyClient, httpLink } from "@trpc/client"
import type { AppRouter } from "ts-type-expand-plugin/src/server/controller"
import fetch from "node-fetch"

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

export const { updatePortNumber, client } = (() => {
  let port: number
  let clientCache: ApiClient | undefined

  return {
    updatePortNumber: (nextPort: number) => {
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
