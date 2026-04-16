export const PISTON_API = 'http://localhost:2000/api/v2/piston'

export const LANG_RUNTIME: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '*' },
  typescript: { language: 'typescript', version: '*' },
  python:     { language: 'python',     version: '*' },
  go:         { language: 'go',         version: '*' },
  rust:       { language: 'rust',       version: '*' },
  cpp:        { language: 'c++',        version: '*' },
  java:       { language: 'java',       version: '*' },
  shell:      { language: 'bash',       version: '*' },
}

// Auto-save snapshot interval
export const SNAPSHOT_INTERVAL_MS = 30000