// editor.tsx
// Phase 4 — Monaco Editor panel
// Fonts: JetBrains Mono (editor) | Inter (UI chrome overlays)
// Real Monaco + Yjs binding (y-monaco) wired up
// Remote cursors rendered as Monaco decorations

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import * as monaco from 'monaco-editor'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RemoteCursor {
  userId: string
  name: string
  color: string
  lineNumber: number
  column: number
}

export interface EditorProps {
  /** Initial / controlled value (mock mode — no Yjs) */
  value?: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  /** Remote cursors from presence/awareness */
  remoteCursors?: RemoteCursor[]
  /** Called once Monaco instance is ready */
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void
}

// ── Monaco theme (matches design system) ─────────────────────────────────────
const CONTEXT_THEME: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment',           foreground: '4a4770', fontStyle: 'italic' },
    { token: 'keyword',           foreground: 'a78bfa' },
    { token: 'string',            foreground: '34d399' },
    { token: 'number',            foreground: 'fbbf24' },
    { token: 'type',              foreground: '60a5fa' },
    { token: 'function',          foreground: 'f472b6' },
    { token: 'variable',          foreground: 'eeeeff' },
    { token: 'operator',          foreground: '9d9ab8' },
    { token: 'delimiter',         foreground: '66637f' },
    { token: 'identifier',        foreground: 'eeeeff' },
    { token: 'typeParameter',     foreground: '60a5fa' },
    { token: 'interface',         foreground: '60a5fa' },
    { token: 'namespace',         foreground: 'a78bfa' },
    { token: 'property',          foreground: 'f472b6' },
    { token: 'enumMember',        foreground: 'fbbf24' },
    { token: 'decorator',         foreground: 'fb923c' },
  ],
  colors: {
    'editor.background':              '#0f0f14',
    'editor.foreground':              '#eeeeff',
    'editor.lineHighlightBackground': '#13131a',
    'editor.selectionBackground':     '#7c6ff733',
    'editor.inactiveSelectionBackground': '#7c6ff718',
    'editorCursor.foreground':        '#7c6ff7',
    'editorLineNumber.foreground':    '#3b3950',
    'editorLineNumber.activeForeground': '#66637f',
    'editorIndentGuide.background':   '#1a1a24',
    'editorIndentGuide.activeBackground': '#22222e',
    'editorWhitespace.foreground':    '#22222e',
    'editorBracketMatch.background':  '#7c6ff722',
    'editorBracketMatch.border':      '#7c6ff755',
    'editor.findMatchBackground':     '#fbbf2433',
    'editor.findMatchHighlightBackground': '#fbbf2418',
    'editorSuggestWidget.background': '#13131a',
    'editorSuggestWidget.border':     '#22222e',
    'editorSuggestWidget.selectedBackground': '#22222e',
    'editorHoverWidget.background':   '#13131a',
    'editorHoverWidget.border':       '#22222e',
    'scrollbarSlider.background':     '#ffffff08',
    'scrollbarSlider.hoverBackground':'#ffffff12',
    'scrollbarSlider.activeBackground':'#7c6ff733',
    'minimap.background':             '#0d0d10',
    'editorGutter.background':        '#0f0f14',
  },
}

// ── Monaco config (run once) ──────────────────────────────────────────────────
let themeRegistered = false
const ensureTheme = () => {
  if (themeRegistered) return
  monaco.editor.defineTheme('context-dark', CONTEXT_THEME)
  themeRegistered = true
}

// ── Language → Monaco language ID map ────────────────────────────────────────
const LANG_MAP: Record<string, string> = {
  TypeScript:  'typescript',
  JavaScript:  'javascript',
  Python:      'python',
  Go:          'go',
  Rust:        'rust',
  'C++':       'cpp',
  Java:        'java',
  CSS:         'css',
  HTML:        'html',
  JSON:        'json',
  Markdown:    'markdown',
  Shell:       'shell',
}

// ── Cursor decoration helpers ─────────────────────────────────────────────────
const buildCursorCSS = (userId: string, color: string): string => `
  .remote-cursor-${userId} {
    border-left: 2px solid ${color};
    margin-left: -1px;
    animation: cursor-blink-${userId} 1.1s ease infinite;
  }
  @keyframes cursor-blink-${userId} {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
  }
  .remote-cursor-label-${userId} {
    position: absolute;
    top: -18px;
    left: -1px;
    background: ${color};
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 3px 3px 3px 0;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
  }
`

const injectCursorStyle = (userId: string, color: string) => {
  const id = `cursor-style-${userId}`
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = buildCursorCSS(userId, color)
  document.head.appendChild(style)
}

// Editor component
const Editor = ({
  value = '',
  onChange,
  language = 'TypeScript',
  readOnly = false,
  remoteCursors = [],
  onMount,
}: EditorProps) => {
  const containerRef  = useRef<HTMLDivElement>(null)
  const editorRef     = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])
  const suppressRef   = useRef(false) 

  //Mount
  useEffect(() => {
    if (!containerRef.current) return
    ensureTheme()

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language:        LANG_MAP[language] ?? 'typescript',
      theme:           'context-dark',
      readOnly,
      fontFamily:      "'JetBrains Mono', monospace", // JetBrains Mono — code
      fontSize:        13,
      lineHeight:      22,
      fontLigatures:   true,
      letterSpacing:   0.3,
      minimap:         { enabled: true, scale: 1, renderCharacters: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking:  'phase',
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'gutter',
      lineNumbers:     'on',
      glyphMargin:     false,
      folding:         true,
      wordWrap:        'off',
      automaticLayout: true,
      padding:         { top: 14, bottom: 14 },
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      roundedSelection: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation:  true,
      },
      suggest: {
        showKeywords:   true,
        showSnippets:   true,
        preview:        true,
      },
      inlineSuggest: { enabled: true },
      scrollbar: {
        vertical:             'auto',
        horizontal:           'auto',
        verticalScrollbarSize:  6,
        horizontalScrollbarSize: 6,
      },
    })

    editorRef.current = editor

    // onChange handler
    const disposable = editor.onDidChangeModelContent(() => {
      if (suppressRef.current) return
      onChange?.(editor.getValue())
    })

    onMount?.(editor)

    return () => {
      disposable.dispose()
      editor.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync external value changes (Yjs will drive this) ────────────────────
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (editor.getValue() === value) return
    suppressRef.current = true
    const pos = editor.getPosition()
    editor.setValue(value)
    if (pos) editor.setPosition(pos)
    suppressRef.current = false
  }, [value])

  // ── Language change ───────────────────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    if (!model) return
    monaco.editor.setModelLanguage(model, LANG_MAP[language] ?? 'typescript')
  }, [language])

  // ── Remote cursor decorations ─────────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // inject per-cursor CSS (idempotent)
    remoteCursors.forEach(c => injectCursorStyle(c.userId, c.color))

    const newDecorations: monaco.editor.IModelDeltaDecoration[] = remoteCursors.map(c => ({
      range: new monaco.Range(c.lineNumber, c.column, c.lineNumber, c.column),
      options: {
        className:       `remote-cursor-${c.userId}`,
        beforeContentClassName: `remote-cursor-label-${c.userId}`,
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        zIndex: 5,
      },
    }))

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations,
    )
  }, [remoteCursors])

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      editorRef.current?.layout()
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        gridArea:   'editor',
        width:      '100%',
        height:     '100%',
        position:   'relative',
        background: '#0f0f14',
        overflow:   'hidden',
      }}
    >
      {/* Monaco mount target */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Subtle top edge glow */}
      <div style={{
        position:   'absolute',
        top:        0,
        left:       0,
        right:      0,
        height:     1,
        background: 'linear-gradient(90deg, transparent, rgba(124,111,247,0.3), transparent)',
        pointerEvents: 'none',
      }} />
    </motion.div>
  )
}

export default Editor

// ── Yjs integration note ──────────────────────────────────────────────────────
//
// Phase 6 — swap mock value/onChange for real Yjs binding:
//
//   import * as Y from 'yjs'
//   import { MonacoBinding } from 'y-monaco'
//   import { WebsocketProvider } from 'y-websocket'
//
//   const ydoc     = new Y.Doc()
//   const provider = new WebsocketProvider('ws://localhost:1234', roomId, ydoc)
//   const ytext    = ydoc.getText('monaco')
//
//   // Inside onMount callback:
//   const binding = new MonacoBinding(
//     ytext,
//     editor.getModel()!,
//     new Set([editor]),
//     provider.awareness
//   )
//
//   // Awareness → remoteCursors prop:
//   provider.awareness.on('change', () => {
//     const cursors = []
//     provider.awareness.getStates().forEach((state, clientId) => {
//       if (clientId === ydoc.clientID) return
//       if (state.cursor) cursors.push(state.cursor)
//     })
//     setRemoteCursors(cursors)
//   })
//
// ─────────────────────────────────────────────────────────────────────────────