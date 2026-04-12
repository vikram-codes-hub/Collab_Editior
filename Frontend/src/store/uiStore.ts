import { create } from 'zustand'

/* ============================================================
   UI Store — Zustand
   Manages panel visibility, modals, responsive state
   Not persisted — resets on every page load
   ============================================================ */

interface UIState {
  // Responsive
  isMobile:  boolean
  isTablet:  boolean

  // Panel visibility
  notesOpen:    boolean
  videoOpen:    boolean
  terminalOpen: boolean

  // Modals
  createRoomOpen:  boolean
  leaveRoomOpen:   boolean
  shareModalOpen:  boolean
  settingsOpen:    boolean

  // Loading states
  pageLoading: boolean

  // Actions
  setIsMobile:       (val: boolean) => void
  setIsTablet:       (val: boolean) => void
  toggleNotes:       () => void
  toggleVideo:       () => void
  toggleTerminal:    () => void
  setNotesOpen:      (val: boolean) => void
  setVideoOpen:      (val: boolean) => void
  setTerminalOpen:   (val: boolean) => void
  openCreateRoom:    () => void
  closeCreateRoom:   () => void
  openLeaveRoom:     () => void
  closeLeaveRoom:    () => void
  openShareModal:    () => void
  closeShareModal:   () => void
  openSettings:      () => void
  closeSettings:     () => void
  setPageLoading:    (val: boolean) => void
}

const useUIStore = create<UIState>((set) => ({
  // Responsive defaults
  isMobile:  false,
  isTablet:  false,

  // Panels — notes + video hidden on mobile by default
  notesOpen:    true,
  videoOpen:    true,
  terminalOpen: true,

  // Modals all closed
  createRoomOpen: false,
  leaveRoomOpen:  false,
  shareModalOpen: false,
  settingsOpen:   false,

  // Loading
  pageLoading: false,

  /* ── Responsive ─────────────────────────────────────── */
  setIsMobile: (val) => set((state) => ({
    isMobile:  val,
    // Auto close panels on mobile
    notesOpen: val ? false : state.notesOpen,
    videoOpen: val ? false : state.videoOpen,
  })),

  setIsTablet: (val) => set((state) => ({
    isTablet:  val,
    // Auto close notes on tablet
    notesOpen: val ? false : state.notesOpen,
  })),

  /* ── Panel toggles ──────────────────────────────────── */
  toggleNotes:    () => set((s) => ({ notesOpen:    !s.notesOpen    })),
  toggleVideo:    () => set((s) => ({ videoOpen:    !s.videoOpen    })),
  toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),

  setNotesOpen:    (val) => set({ notesOpen:    val }),
  setVideoOpen:    (val) => set({ videoOpen:    val }),
  setTerminalOpen: (val) => set({ terminalOpen: val }),

  /* ── Modals ─────────────────────────────────────────── */
  openCreateRoom:  () => set({ createRoomOpen:  true  }),
  closeCreateRoom: () => set({ createRoomOpen:  false }),
  openLeaveRoom:   () => set({ leaveRoomOpen:   true  }),
  closeLeaveRoom:  () => set({ leaveRoomOpen:   false }),
  openShareModal:  () => set({ shareModalOpen:  true  }),
  closeShareModal: () => set({ shareModalOpen:  false }),
  openSettings:    () => set({ settingsOpen:    true  }),
  closeSettings:   () => set({ settingsOpen:    false }),

  /* ── Page loading ───────────────────────────────────── */
  setPageLoading: (val) => set({ pageLoading: val }),
}))

export default useUIStore