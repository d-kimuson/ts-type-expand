import type * as ts from 'typescript/lib/tsserverlibrary.js'
import type {
  CodeInformation,
  SourceMap,
  SourceScript,
} from '@volar/language-core'
import { type Language } from '@volar/language-core'
import { proxyCreateProgram } from '@volar/typescript'
import type { VueCompilerOptions } from '@vue/language-core'
import {
  createParsedCommandLine,
  createVueLanguagePlugin,
  resolveVueCompilerOptions,
} from '@vue/language-core'
import * as SourceMaps from '@volar/source-map'
import type { __ts } from '../server/context.js'

const windowsPathReg = /\\/g

type VueProgram = ts.Program & {
  // https://github.com/volarjs/volar.js/blob/v2.2.0/packages/typescript/lib/node/proxyCreateProgram.ts#L209
  __volar__?: { language: Language }
  // https://github.com/vuejs/language-tools/blob/v2.0.16/packages/typescript-plugin/index.ts#L75
  __vue__?: { language: Language }
}

let oldProgram: VueProgram | undefined

export function getPositionOfLineAndCharacterForVue(
  ctx: {
    program: ts.Program
    ts: __ts | undefined
  },
  fileName: string,
  startPos = -1,
) {
  const compilerOptions = {
    ...ctx.program.getCompilerOptions(),
    rootDir: ctx.program.getCurrentDirectory(),
    declaration: true,
    emitDeclarationOnly: true,
    allowNonTsExtensions: true,
  }

  oldProgram = oldProgram ?? ctx.program

  if (!oldProgram.__vue__ && !oldProgram.__volar__) {
    if (!ctx.ts) {
      return startPos
    }

    const options: ts.CreateProgramOptions = {
      host: ctx.ts.createCompilerHost(compilerOptions),
      rootNames: ctx.program.getRootFileNames(),
      options: compilerOptions,
      oldProgram: oldProgram,
    }

    let vueOptions: VueCompilerOptions
    const createProgram = proxyCreateProgram(
      ctx.ts,
      ctx.ts.createProgram,
      (ts, _options) => {
        const { configFilePath } = _options.options
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
        return [
          createVueLanguagePlugin(
            ts,
            (id) => id,
            _options.host?.useCaseSensitiveFileNames() ?? false,
            () => '',
            () =>
              _options.rootNames.map((rootName) =>
                rootName.replace(windowsPathReg, '/'),
              ),
            _options.options,
            vueOptions,
          ),
        ]
      },
    )

    console.log('create vue program')
    oldProgram = createProgram(options) as VueProgram
  }

  const language = (oldProgram.__volar__ ?? oldProgram.__vue__)?.language
  if (language?.scripts) {
    const vFile = language.scripts.get(fileName)
    if (vFile?.generated?.root && vFile.generated.root.languageId === 'vue') {
      const code = vFile.generated.root.embeddedCodes?.[0]
      if (code) {
        const sourceMap = new SourceMaps.SourceMap(code.mappings)

        const serviceScript =
          vFile.generated.languagePlugin.typescript?.getServiceScript(
            vFile.generated.root,
          )
        if (serviceScript) {
          const map = language.maps.get(serviceScript.code, vFile.id)
          if (map) {
            for (const [generatedOffset, mapping] of toGeneratedOffsets(
              vFile,
              map,
              startPos,
            )) {
              console.log(JSON.stringify({ generatedOffset, mapping }))
            }

            startPos =
              (sourceMap.getGeneratedOffset(startPos)?.[0] ?? -1) +
              // https://github.com/volarjs/volar.js/blob/v2.2.0-alpha.12/packages/typescript/lib/node/proxyCreateProgram.ts#L143
              (vFile.generated.root.snapshot.getLength() || 0)
          }
        }
      }
    }
  }

  return startPos
}

function* toGeneratedOffsets(
  sourceScript: SourceScript,
  map: SourceMap<CodeInformation>,
  position: number,
) {
  for (const [generateOffset, mapping] of map.getGeneratedOffsets(position)) {
    yield [generateOffset + sourceScript.snapshot.getLength(), mapping] as const
  }
}
