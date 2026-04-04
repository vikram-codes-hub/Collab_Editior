import axios from 'axios'
import { PISTON_API, LANG_RUNTIME, MAX_CODE_SIZE } from '../constant'

export interface RunResult {
  stdout:   string
  stderr:   string
  exitCode: number
  runtime:  number  // ms
}

export const runCode = async (
  code:     string,
  language: string
): Promise<RunResult> => {

  if (code.length > MAX_CODE_SIZE) {
    throw new Error('Code exceeds maximum size (50KB)')
  }

  const runtime = LANG_RUNTIME[language.toLowerCase()]
  if (!runtime) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const start = Date.now()

  const { data } = await axios.post(
    `${PISTON_API}/execute`,
    {
      language: runtime.language,
      version:  runtime.version,
      files:    [{ content: code }],
    },
    { timeout: 15_000 }
  )

  return {
    stdout:   data.run.stdout   ?? '',
    stderr:   data.run.stderr   ?? '',
    exitCode: data.run.code     ?? 0,
    runtime:  Date.now() - start,
  }
}