export const PISTON_API = 'https://emkc.org/api/v2/piston'
export const MAX_CODE_SIZE = 50_000  // 50KB

export const SNAPSHOT_INTERVAL_MS = 30_000  // 30s

// Language → Piston runtime
export const LANG_RUNTIME: Record<string, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3'   },
  python:     { language: 'python',     version: '3.10.0'  },
  go:         { language: 'go',         version: '1.16.2'  },
  rust:       { language: 'rust',       version: '1.50.0'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  java:       { language: 'java',       version: '15.0.2'  },
  shell:      { language: 'bash',       version: '5.2.0'   },
}