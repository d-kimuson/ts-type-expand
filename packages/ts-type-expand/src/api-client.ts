import { createTRPCProxyClient, httpLink } from "@trpc/client";
import type { AppRouter } from "ts-type-expand-plugin/server";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createClient = async (port: number) =>
  createTRPCProxyClient<AppRouter>({
    links: [
      httpLink({
        url: `http://localhost:${port}/trpc`,
        fetch: await import("node-fetch").then((mod) => mod.default),
      }),
    ],
  });

export type ApiClient = Awaited<ReturnType<typeof createClient>>;

type ApiClientClosure = {
  updatePortNumber: (nextPort: number) => void;
  client: () => ApiClient;
};

export const { updatePortNumber, client } = ((): ApiClientClosure => {
  let port: number;
  let clientCache: ApiClient | undefined;

  return {
    updatePortNumber: async (nextPort) => {
      if (port !== nextPort) {
        clientCache = await createClient(nextPort);
      }

      port = nextPort;
    },
    client: () => {
      if (clientCache === undefined) {
        throw new Error("port number must initialized by updatePortNumber");
      }

      return clientCache;
    },
  };
})();
