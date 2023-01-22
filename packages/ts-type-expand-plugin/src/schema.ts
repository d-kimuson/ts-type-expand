import { z } from "zod"

export const pluginConfigurationSchema = z.object({
  port: z.number(),
})

export type PluginConfiguration = z.infer<typeof pluginConfigurationSchema>
