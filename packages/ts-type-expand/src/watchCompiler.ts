import type ts from "typescript"
import {
  sys,
  createWatchProgram,
  createWatchCompilerHost,
  createEmitAndSemanticDiagnosticsBuilderProgram,
} from "typescript"

export function watchCompiler(
  tsConfigPath: string,
  reportDiagnostic?: ts.DiagnosticReporter,
  reportWatchStatus?: ts.WatchStatusReporter
): ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> {
  const createProgram = createEmitAndSemanticDiagnosticsBuilderProgram
  const host = createWatchCompilerHost(
    tsConfigPath,
    {
      noEmit: true,
    },
    sys,
    createProgram,
    reportDiagnostic,
    reportWatchStatus
  )
  console.log("Start watch!")
  return createWatchProgram(host)
}
