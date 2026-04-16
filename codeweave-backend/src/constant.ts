export const PISTON_API = 'http://localhost:2000/api/v2/piston'
export const MAX_CODE_SIZE = 50_000  // 50KB

export const SNAPSHOT_INTERVAL_MS = 30_000  // 30s

// Language → Piston runtime ('*' matches any installed version)
export const LANG_RUNTIME: Record<string, { language: string; version: string }> = {
  javascript: { language: 'node',       version: '*' },
  typescript: { language: 'typescript', version: '*' },
  python:     { language: 'python',     version: '*' },
  go:         { language: 'go',         version: '*' },
  rust:       { language: 'rust',       version: '*' },
  cpp:        { language: 'c++',        version: '*' },
  java:       { language: 'java',       version: '*' },
  shell:      { language: 'bash',       version: '*' },
}