import { Server, Socket } from 'socket.io'

/* ============================================================
   Notes socket handlers
   Manages real-time public notes for a room.
   Private notes are NOT handled here — they go through REST API.

   Events:
     CLIENT → SERVER:
       notes:join         { roomId }           — subscribe to room notes
       notes:public:update { roomId, content, authorName, authorColor }
                                               — broadcast new content
       notes:public:get   { roomId }           — request current snapshot

     SERVER → CLIENT:
       notes:public:snapshot  { content, authorName, authorColor, updatedAt }
       notes:public:update    { content, authorName, authorColor, updatedAt }
   ============================================================ */

// In-memory store: roomId → latest public note state
const publicNotes = new Map<string, {
  content:     string
  authorName:  string
  authorColor: string
  updatedAt:   string
}>()

export const registerNotesHandlers = (io: Server, socket: Socket) => {

  //Join room notes channel
  socket.on('notes:join', ({ roomId }: { roomId: string }) => {
    socket.join(`notes:${roomId}`)

    // Send current snapshot immediately
    const snap = publicNotes.get(roomId)
    if (snap) {
      socket.emit('notes:public:snapshot', snap)
    } else {
      socket.emit('notes:public:snapshot', {
        content:     '',
        authorName:  '',
        authorColor: '',
        updatedAt:   new Date().toISOString(),
      })
    }
  })

  //User broadcasts a public note update
  socket.on('notes:public:update', (data: {
    roomId:      string
    content:     string
    authorName:  string
    authorColor: string
  }) => {
    const { roomId, content, authorName, authorColor } = data

    const payload = {
      content,
      authorName,
      authorColor,
      updatedAt: new Date().toISOString(),
    }

    // Persist in memory as latest state
    publicNotes.set(roomId, payload)

    // Broadcast to everyone else in the notes channel
    socket.to(`notes:${roomId}`).emit('notes:public:update', payload)
  })

  //Explicit snapshot request
  socket.on('notes:public:get', ({ roomId }: { roomId: string }) => {
    const snap = publicNotes.get(roomId)
    socket.emit('notes:public:snapshot', snap ?? {
      content:     '',
      authorName:  '',
      authorColor: '',
      updatedAt:   new Date().toISOString(),
    })
  })
}
