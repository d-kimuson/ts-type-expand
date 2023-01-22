import { loggingMiddleware, requiredProgramMiddleware } from "./middleware"
import { t } from "./trpc"

const commonProcedure = t.procedure.use(loggingMiddleware)

export const procedure = commonProcedure
export const requiredProgramProcedure = commonProcedure.use(
  requiredProgramMiddleware
)
