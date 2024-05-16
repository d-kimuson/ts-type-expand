import type { Program } from 'typescript'
import type { server } from 'typescript/lib/tsserverlibrary.js'

export type __ts = Parameters<server.PluginModuleFactory>[0]['typescript']

export type Context = {
  program: Program | undefined
  createInfo: server.PluginCreateInfo | undefined
  ts: __ts | undefined
}

export const { setTypeScript, getTypeScript } = (() => {
  let ts: __ts | undefined = undefined

  return {
    setTypeScript: (_ts: __ts) => {
      ts = _ts
    },
    getTypeScript: (): __ts | undefined => ts,
  }
})()

export const { setCreateInfo, getCreateInfo } = (() => {
  let createInfo: server.PluginCreateInfo | undefined = undefined

  return {
    setCreateInfo: (info: server.PluginCreateInfo) => {
      createInfo = info
    },
    getCreateInfo: (): server.PluginCreateInfo | undefined => createInfo,
  }
})()

export const createContext = async (): Promise<Context> => {
  const createInfo = getCreateInfo()
  const ts = getTypeScript()
  const program = createInfo?.languageService.getProgram()

  return {
    createInfo,
    program,
    ts,
  }
}
