import { useCallback, useRef }  from 'react'
import * as monaco               from 'monaco-editor'
import { getSocket }             from '../lib/socket'
import useEditorStore            from '../store/editorStore'
import useAuthStore              from '../store/authstore'
import type { TerminalLine }          from '../types'
import api                       from '../lib/axios'

/* ============================================================
   useEditor — editor state + run code
   Call this in EditorPage
   ============================================================ */

export const useEditor = (roomId: string) => {
  const { user }   = useAuthStore()
  const socket     = getSocket()
  const editorRef  = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const {
    code,
    language,
    fontSize,
    wordWrap,
    minimap,
    isRunning,
    cursorPos,
    setCode,
    setLanguage,
    setCursorPos,
    setIsRunning,
    addTerminalLine,
    clearTerminal,
  } = useEditorStore()

  /* ── On Monaco mount ──────────────────────────────────── */
  const onMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor

      // Track cursor position
      editor.onDidChangeCursorPosition((e) => {
        setCursorPos({
          line: e.position.lineNumber,
          col:  e.position.column,
        })
      })
    },
    []
  )

  /* ── Run code ─────────────────────────────────────────── */
  const runCode = useCallback(async () => {
    if (isRunning || !user) return
    if (!code.trim()) {
      addTerminalLine({
        type:      'warn',
        text:      'Nothing to run — editor is empty',
        timestamp: Date.now(),
      })
      return
    }

    setIsRunning(true)

    // Emit via socket so all room members see it running
    socket.emit('terminal:run', {
      roomId,
      code,
      language,
      userId:   user.id,
      username: user.username,
    })
  }, [isRunning, code, language, roomId, user])

  /* ── Stop execution ───────────────────────────────────── */
  const stopCode = useCallback(() => {
    if (!isRunning) return
    socket.emit('terminal:stop', { roomId })
    setIsRunning(false)
    addTerminalLine({
      type:      'warn',
      text:      '⊘ Stopped by user',
      timestamp: Date.now(),
    })
  }, [isRunning, roomId])

  /* ── Change language ──────────────────────────────────── */
  const changeLanguage = useCallback((lang: string) => {
    setLanguage(lang)

    // Update Monaco model language
    const editor = editorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (!model)  return

    monaco.editor.setModelLanguage(model, lang.toLowerCase())
  }, [])

  /* ── Get editor options ───────────────────────────────── */
  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize,
    wordWrap:        wordWrap ? 'on' : 'off',
    minimap:         { enabled: minimap },
    theme:           'vs-dark',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontFamily:      'JetBrains Mono, monospace',
    fontLigatures:   true,
    tabSize:         2,
    lineNumbers:     'on',
    renderLineHighlight: 'all',
    cursorBlinking:  'smooth',
    smoothScrolling: true,
  }

  return {
    code,
    language,
    cursorPos,
    isRunning,
    editorOptions,
    editorRef,
    onMount,
    runCode,
    stopCode,
    changeLanguage,
    setCode,
    clearTerminal,
    lineCount: code.split('\n').length,
  }
}