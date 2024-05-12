import * as trpcExpress from "@trpc/server/adapters/express";
import type { Express } from "express";
import { createContext } from "./context";
import { router } from "./controller";

export const registerApp = (app: Express): void => {
  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router,
      createContext,
    })
  );
};
