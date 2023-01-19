import * as trpcExpress from "@trpc/server/adapters/express"
import { Express } from "express"
import { router } from "./controller"
import { createContext } from "./context"

export const registerApp = (app: Express) => {
  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router,
      createContext,
    })
  )
}
