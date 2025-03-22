import type * as ts from 'typescript/lib/tsserverlibrary.js'
import { type Language } from '@volar/language-core'
import type { TypeScriptServiceScript } from '@volar/typescript'
import { proxyCreateProgram } from '@volar/typescript'
import type { VueCompilerOptions } from '@vue/language-core'
import {
  createParsedCommandLine,
  createVueLanguagePlugin,
  resolveVueCompilerOptions,
} from '@vue/language-core'
import type { __ts } from '../server/context.js'
import { logger } from '../logger.js'

const windowsPathReg = /\\/g

type VueProgram = ts.Program & {
  // https://github.com/vuejs/language-tools/blob/v2.0.16/packages/typescript-plugin/index.ts#L75
  __vue__?: { language: Language }
}

let tsProgram: VueProgram | undefined

function getMappingOffset(
  language: Language,
  serviceScript: TypeScriptServiceScript,
): number {
  if (serviceScript.preventLeadingOffset) {
    return 0
  }
  const sourceScript = language.scripts.fromVirtualCode(serviceScript.code)
  return sourceScript.snapshot.getLength()
}

export function getPositionOfLineAndCharacterForVue(
  ctx: {
    program: ts.Program
    ts: __ts | undefined
  },
  fileName: string,
  startPos = -1,
) {
  if (!ctx.ts) {
    return startPos
  }

  const compilerOptions = {
    ...ctx.program.getCompilerOptions(),
    rootDir: ctx.program.getCurrentDirectory(),
    declaration: true,
    emitDeclarationOnly: true,
    allowNonTsExtensions: true,
  }

  const options: ts.CreateProgramOptions = {
    host: ctx.ts.createCompilerHost(compilerOptions),
    rootNames: ctx.program.getRootFileNames(),
    options: compilerOptions,
    oldProgram: ctx.program,
  }

  let vueOptions: VueCompilerOptions
  const createProgram = proxyCreateProgram(
    ctx.ts,
    ctx.ts.createProgram,
    (ts, options) => {
      const { configFilePath } = options.options
      vueOptions =
        typeof configFilePath === 'string'
          ? createParsedCommandLine(
              ts,
              ts.sys,
              configFilePath.replace(windowsPathReg, '/'),
            ).vueOptions
          : resolveVueCompilerOptions({
              extensions: ['.vue', '.cext'],
            })
      const vueLanguagePlugin = createVueLanguagePlugin<string>(
        ts,
        options.options,
        vueOptions,
        (id) => id,
      )
      return [vueLanguagePlugin]
    },
  )

  tsProgram = ctx.program

  if (!tsProgram.__vue__) {
    logger.info('CREATE_VUE_PROGRAM', {})
    tsProgram = createProgram(options) as VueProgram
  }

  const language = tsProgram.__vue__?.language
  if (language?.scripts) {
    const vFile = language.scripts.get(fileName)
    const serviceScript =
      vFile?.generated?.languagePlugin.typescript?.getServiceScript(
        vFile.generated.root,
      )
    if (vFile?.generated?.root.languageId === 'vue' && serviceScript) {
      const sourceMap = language.maps.get(serviceScript.code, vFile)

      const snapshotLength = getMappingOffset(language, serviceScript)

      for (const [generatedLocation] of sourceMap.toGeneratedLocation(
        startPos,
      )) {
        if (generatedLocation) {
          startPos = generatedLocation + snapshotLength
        }
      }
    }
  }

  return startPos
}
