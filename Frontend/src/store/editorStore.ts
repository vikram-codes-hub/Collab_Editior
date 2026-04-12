import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_LANGUAGE,
  DEFAULT_THEME,
  DEFAULT_FONT,
} from '../lib/constants'
import type { EditorLanguage, TerminalLine } from '../types'

/* ============================================================
   Editor Store — Zustand
   Manages editor state: language, theme, font, terminal
   ============================================================ */

interface EditorState {
  // Editor settings
  language:  EditorLanguage | string
  theme:     string
  fontSize:  number
  wordWrap:  boolean
  minimap:   boolean

  // Code content
  code:      string

  // Terminal
  terminalLines:  TerminalLine[]
  isRunning:      boolean
  terminalVisible:boolean

  // Cursor position
  cursorPos: { line: number; col: number }

  // Actions
  setLanguage:      (lang: string) => void
  setTheme:         (theme: string) => void
  setFontSize:      (size: number) => void
  setWordWrap:      (wrap: boolean) => void
  setMinimap:       (show: boolean) => void
  setCode:          (code: string) => void
  setCursorPos:     (pos: { line: number; col: number }) => void
  setIsRunning:     (running: boolean) => void
  addTerminalLine:  (line: TerminalLine) => void
  clearTerminal:    () => void
  setTerminalVisible:(visible: boolean) => void
  resetEditor:      () => void
}

const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      // Defaults
      language:        DEFAULT_LANGUAGE,
      theme:           DEFAULT_THEME,
      fontSize:        DEFAULT_FONT,
      wordWrap:        false,
      minimap:         false,
      code:            '',
      terminalLines:   [],
      isRunning:       false,
      terminalVisible: true,
      cursorPos:       { line: 1, col: 1 },

      /* ── Language ─────────────────────────────────────── */
      setLanguage: (lang) => set({ language: lang }),

      /* ── Theme ────────────────────────────────────────── */
      setTheme: (theme) => set({ theme }),

      /* ── Font size ────────────────────────────────────── */
      setFontSize: (size) => set({
        fontSize: Math.min(Math.max(size, 10), 32)
      }),

      /* ── Word wrap ────────────────────────────────────── */
      setWordWrap: (wrap) => set({ wordWrap: wrap }),

      /* ── Minimap ──────────────────────────────────────── */
      setMinimap: (show) => set({ minimap: show }),

      /* ── Code ─────────────────────────────────────────── */
      setCode: (code) => set({ code }),

      /* ── Cursor position ──────────────────────────────── */
      setCursorPos: (pos) => set({ cursorPos: pos }),

      /* ── Running state ────────────────────────────────── */
      setIsRunning: (running) => set({ isRunning: running }),

      /* ── Terminal lines ───────────────────────────────── */
      addTerminalLine: (line) =>
        set((state) => ({
          terminalLines: [...state.terminalLines, line],
        })),

      /* ── Clear terminal ───────────────────────────────── */
      clearTerminal: () => set({ terminalLines: [] }),

      /* ── Terminal visibility ──────────────────────────── */
      setTerminalVisible: (visible) =>
        set({ terminalVisible: visible }),

      /* ── Reset everything on room leave ──────────────── */
      resetEditor: () =>
        set({
          code:            '',
          terminalLines:   [],
          isRunning:       false,
          cursorPos:       { line: 1, col: 1 },
        }),
    }),
    {
      name: 'depot-editor',
      // Only persist settings, not code or terminal
      partialize: (state) => ({
        language: state.language,
        theme:    state.theme,
        fontSize: state.fontSize,
        wordWrap: state.wordWrap,
        minimap:  state.minimap,
      }),
    }
  )
)

export default useEditorStore