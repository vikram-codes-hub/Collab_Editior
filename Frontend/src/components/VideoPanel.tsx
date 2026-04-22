// VideoPanel.tsx — right panel: participant video tiles + media controls
// Wires up real browser camera/mic via useWebRTC hook

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tooltip from './tooltip'

/* ── Icons ─────────────────────────────────────────────────── */
const MicOnIcon  = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 7.5a4.5 4.5 0 009 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M7.5 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const MicOffIcon = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 9.3A2.5 2.5 0 016 7V4.5M5 3A2.5 2.5 0 0110 5v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M3 7.5a4.5 4.5 0 008.5 1.5M7.5 12v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const CamOnIcon  = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 5a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V5z" stroke="currentColor" strokeWidth="1.3"/><path d="M11 6.5l3-2v5l-3-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const CamOffIcon = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M5 4H10a1 1 0 011 1v1.5M11 8.5V10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 6.5l3-2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
const HeadphonesIcon = () => <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 8V7a5 5 0 0110 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="1" y="8" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="8" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
const LeaveIcon  = () => <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 4.5L11 7l-2.5 2.5M11 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 2H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
const VideoCallIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="4" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M12 7.5l5-3v8l-5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="6" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.2"/></svg>

const USER_COLORS = ['#a78bfa','#fb923c','#34d399','#f472b6','#fbbf24','#60a5fa']

/* ── MediaBtn ──────────────────────────────────────────────── */
function MediaBtn({ on, onToggle, onIcon, offIcon, label, danger = false }: {
  on: boolean; onToggle: () => void
  onIcon: React.ReactNode; offIcon: React.ReactNode
  label: string; danger?: boolean
}) {
  return (
    <Tooltip content={`${on ? 'Turn off' : 'Turn on'} ${label}`} side="top">
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 3,
          background: 'none', border: 'none',
          cursor: 'pointer', padding: '2px 4px',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: !on ? (danger ? 'var(--color-danger-dim)' : 'rgba(248,113,113,0.12)') : 'var(--color-hover)',
          border: `1px solid ${!on ? (danger ? 'rgba(248,113,113,0.3)' : 'rgba(248,113,113,0.25)') : 'var(--color-border-md)'}`,
          color: !on ? 'var(--color-danger)' : 'var(--color-text-secondary)',
          transition: 'all 150ms ease',
        }}>
          {on ? onIcon : offIcon}
        </div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6rem', color: 'var(--color-text-muted)', userSelect: 'none' }}>
          {label}
        </span>
      </motion.button>
    </Tooltip>
  )
}

/* ── VideoTile ─────────────────────────────────────────────── */
export function VideoTile({
  name, colorIdx = 0, stream, localVideoRef,
  speaking = false, muted = false, camOff = false, isLocal = false,
}: {
  name: string; colorIdx?: number
  stream?: MediaStream | null
  localVideoRef?: React.RefObject<HTMLVideoElement>
  speaking?: boolean; muted?: boolean; camOff?: boolean; isLocal?: boolean
}) {
  const color    = USER_COLORS[colorIdx % USER_COLORS.length]
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Attach stream to <video>
  useEffect(() => {
    if (isLocal) return
    if (remoteVideoRef.current && stream) {
      remoteVideoRef.current.srcObject = stream
    }
  }, [stream, isLocal])

  const videoRef = isLocal ? localVideoRef : remoteVideoRef
  const showVideo = !camOff && (isLocal ? !!stream : !!stream)

  return (
    <motion.div
      animate={{
        borderColor: speaking ? color : 'var(--color-border)',
        boxShadow:   speaking ? `0 0 0 1.5px ${color}60` : 'none',
      }}
      transition={{ duration: 0.2 }}
      style={{
        flex: 1, background: '#0a0a12',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        minHeight: 80,
      }}
    >
      {/* Live video */}
      {showVideo && (
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay playsInline muted={isLocal}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Avatar fallback when cam is off */}
      {(!showVideo) && (
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: color + '25', border: `1px solid ${color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-ui)', fontSize: '1.1rem',
          fontWeight: 600, color,
        }}>
          {initials}
        </div>
      )}

      {/* Name tag */}
      <div style={{ position: 'absolute', bottom: 5, left: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {speaking && (
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }}
          />
        )}
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: '0.65rem', fontWeight: 500,
          color: '#e0e0ff', background: 'rgba(0,0,0,0.62)',
          padding: '1px 6px', borderRadius: 'var(--radius-full)',
          backdropFilter: 'blur(4px)',
        }}>
          {isLocal ? 'You' : name}
        </span>
      </div>

      {/* Cam off indicator */}
      {camOff && (
        <div style={{
          position: 'absolute', top: 4, right: 4,
          background: 'rgba(0,0,0,0.5)', borderRadius: 3,
          padding: '1px 3px', display: 'flex',
        }}>
          <CamOffIcon />
        </div>
      )}

      {/* Muted indicator */}
      {muted && (
        <div style={{
          position: 'absolute', top: camOff ? 24 : 4, right: 4,
          background: 'rgba(248,113,113,0.85)',
          borderRadius: 'var(--radius-full)',
          padding: '2px 3px', display: 'flex',
        }}>
          <MicOffIcon />
        </div>
      )}
    </motion.div>
  )
}

/* ── MediaControls ─────────────────────────────────────────── */
export interface MediaControlsProps {
  micOn: boolean; camOn: boolean; audioOn: boolean
  onMicToggle: () => void; onCamToggle: () => void
  onAudioToggle: () => void; onLeave?: () => void
  compact?: boolean
}

export function MediaControls({ micOn, camOn, audioOn, onMicToggle, onCamToggle, onAudioToggle, onLeave, compact = false }: MediaControlsProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: compact ? 'center' : 'space-around',
      gap: compact ? 6 : 0, padding: compact ? '4px 8px' : '6px 4px 4px',
    }}>
      <MediaBtn on={micOn}   onToggle={onMicToggle}   onIcon={<MicOnIcon />}  offIcon={<MicOffIcon />} label="Mic" />
      <MediaBtn on={camOn}   onToggle={onCamToggle}   onIcon={<CamOnIcon />}  offIcon={<CamOffIcon />} label="Cam" />
      <MediaBtn on={audioOn} onToggle={onAudioToggle} onIcon={<HeadphonesIcon />} offIcon={<HeadphonesIcon />} label="Audio" />
      {onLeave && (
        <Tooltip content="Leave room" side="top">
          <motion.button
            onClick={onLeave}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-danger-dim)', border: '1px solid rgba(248,113,113,0.25)',
              color: 'var(--color-danger)', transition: 'all 150ms ease',
            }}>
              <LeaveIcon />
            </div>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6rem', color: 'var(--color-text-muted)', userSelect: 'none' }}>Leave</span>
          </motion.button>
        </Tooltip>
      )}
    </div>
  )
}

/* ── VideoPanel ────────────────────────────────────────────── */
export interface VideoPanelProps {
  // WebRTC hook outputs
  localStream:    MediaStream | null
  localVideoRef:  React.RefObject<HTMLVideoElement>
  remotePeers:    Array<{
    socketId: string; userId: string; username: string
    stream: MediaStream | null
    videoRef: React.RefObject<HTMLVideoElement>
  }>
  micOn:           boolean
  camOn:           boolean
  audioOn:         boolean
  hasJoined:       boolean
  permissionError: string | null
  onMicToggle:     () => void
  onCamToggle:     () => void
  onAudioToggle:   () => void
  onJoin:          () => void
  onLeave?:        () => void
  onLeaveRoom?:    () => void
  // Presence (names of non-video online users)
  onlineUsers?: { id: string; name: string; color: string }[]
}

export function VideoPanel({
  localStream, localVideoRef, remotePeers,
  micOn, camOn, audioOn, hasJoined, permissionError,
  onMicToggle, onCamToggle, onAudioToggle,
  onJoin, onLeave, onLeaveRoom,
  onlineUsers = [],
}: VideoPanelProps) {

  const totalOnline = 1 + (onlineUsers.length)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px 6px', borderBottom: '1px solid var(--color-border)', flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: '0.65rem', fontWeight: 600,
          color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>Room</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hasJoined && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#34d399', display: 'inline-block',
              boxShadow: '0 0 6px #34d39966',
            }} />
          )}
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: '0.65rem',
            color: 'var(--color-text-muted)', background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)',
            padding: '1px 7px',
          }}>
            {totalOnline} online
          </span>
        </div>
      </div>

      {/* Tiles area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '6px 6px 0',
        display: 'flex', flexDirection: 'column', gap: 5,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent',
      }}>
        {!hasJoined ? (
          /* ── Pre-join screen ── */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, padding: '1rem', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--color-accent-dim)',
              border: '1px solid rgba(124,111,247,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-accent)',
            }}>
              <VideoCallIcon />
            </div>
            <div>
              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: '0.75rem',
                fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 4px',
              }}>
                Video &amp; Audio
              </p>
              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: '0.65rem',
                color: 'var(--color-text-hint)', margin: 0, lineHeight: 1.5,
              }}>
                See and hear everyone<br />in this room
              </p>
            </div>

            {permissionError && (
              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: '0.65rem',
                color: 'var(--color-danger)', background: 'var(--color-danger-dim)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 6, padding: '6px 10px', margin: 0,
              }}>
                {permissionError}
              </p>
            )}

            <motion.button
              onClick={onJoin}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600,
                color: '#fff', background: 'var(--color-accent)',
                border: 'none', borderRadius: 'var(--radius-sm)',
                padding: '8px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <VideoCallIcon /> Join Video
            </motion.button>

            {/* Online users who haven't joined video */}
            {onlineUsers.length > 0 && (
              <div style={{ width: '100%', marginTop: 4 }}>
                <p style={{
                  fontFamily: 'var(--font-ui)', fontSize: '0.6rem',
                  color: 'var(--color-text-hint)', margin: '0 0 6px',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>Also in room</p>
                {onlineUsers.map((u, i) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '3px 0',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: u.color + '25', border: `1.5px solid ${u.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-ui)', fontSize: 9,
                      fontWeight: 700, color: u.color, flexShrink: 0,
                    }}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                      {u.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Active video tiles ── */
          <AnimatePresence>
            {/* Local tile */}
            <motion.div
              key="local"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <VideoTile
                name="You"
                colorIdx={0}
                stream={localStream}
                localVideoRef={localVideoRef}
                camOff={!camOn}
                muted={!micOn}
                isLocal
              />
              <span style={{
                fontFamily: 'var(--font-ui)', fontSize: '0.65rem',
                color: 'var(--color-text-muted)', textAlign: 'center',
                padding: '3px 0 1px',
              }}>You</span>
            </motion.div>

            {/* Remote tiles */}
            {remotePeers.map((peer, i) => (
              <motion.div
                key={peer.socketId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <VideoTile
                  name={peer.username}
                  colorIdx={i + 1}
                  stream={peer.stream}
                  camOff={!peer.stream}
                />
                <span style={{
                  fontFamily: 'var(--font-ui)', fontSize: '0.65rem',
                  color: 'var(--color-text-muted)', textAlign: 'center',
                  padding: '3px 0 1px', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {peer.username}
                </span>
              </motion.div>
            ))}

            {/* No remote peers yet */}
            {remotePeers.length === 0 && (
              <div style={{
                padding: '8px 10px',
                background: 'var(--color-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--color-border)',
              }}>
                <p style={{
                  fontFamily: 'var(--font-ui)', fontSize: '0.65rem',
                  color: 'var(--color-text-hint)', margin: 0, textAlign: 'center',
                }}>
                  Waiting for others to join video…
                </p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Controls bar */}
      <div style={{ borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        {hasJoined ? (
          <MediaControls
            micOn={micOn} camOn={camOn} audioOn={audioOn}
            onMicToggle={onMicToggle}
            onCamToggle={onCamToggle}
            onAudioToggle={onAudioToggle}
            onLeave={() => { onLeave?.(); onLeaveRoom?.() }}
          />
        ) : (
          <div style={{
            padding: '6px 10px',
            display: 'flex', justifyContent: 'flex-end',
          }}>
            {onLeaveRoom && (
              <motion.button
                onClick={onLeaveRoom}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  fontFamily: 'var(--font-ui)', fontSize: '0.7rem',
                  fontWeight: 600, color: 'var(--color-danger)',
                  background: 'var(--color-danger-dim)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 12px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <LeaveIcon /> Leave Room
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}