import { loggingMiddleware, requiredProgramMiddleware } from './middleware.js'
import { t } from './trpc.js'

const commonProcedure = t.procedure.use(loggingMiddleware)

export const procedure = commonProcedure
export const requiredProgramProcedure = commonProcedure.use(
  requiredProgramMiddleware,
)
