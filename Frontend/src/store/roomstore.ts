import { create } from 'zustand'
import type { Room, RoomMember, OnlineUser } from '../types'
import api from '../lib/axios'

/*
   Room Store — Zustand
   Manages room list + current active room
   */

interface RoomState {
  // Room list
  rooms:         Room[]
  loadingRooms:  boolean
  roomsError:    string | null

  // Current room
  currentRoom:   Room | null
  members:       RoomMember[]
  onlineUsers:   OnlineUser[]
  loadingRoom:   boolean
  roomError:     string | null

  // Actions
  fetchRooms:      () => Promise<void>
  fetchMyRooms:    () => Promise<void>
  fetchRoom:       (id: string) => Promise<void>
  createRoom:      (name: string, language: string) => Promise<Room>
  updateRoom:      (id: string, data: Partial<{ name: string; language: string }>) => Promise<void>
  deleteRoom:      (id: string) => Promise<void>
  joinRoom:        (id: string) => Promise<void>
  leaveRoom:       (id: string) => Promise<void>
  setOnlineUsers:  (users: OnlineUser[]) => void
  addOnlineUser:   (user: OnlineUser) => void
  removeOnlineUser:(socketId: string) => void
  setCurrentRoom:  (room: Room | null) => void
  clearRoomError:  () => void
}

const useRoomStore = create<RoomState>((set, get) => ({
  rooms:        [],
  loadingRooms: false,
  roomsError:   null,

  currentRoom:  null,
  members:      [],
  onlineUsers:  [],
  loadingRoom:  false,
  roomError:    null,

  /*Fetch all rooms*/
  fetchRooms: async () => {
    set({ loadingRooms: true, roomsError: null })
    try {
      const { data } = await api.get('/rooms')
      set({ rooms: data, loadingRooms: false })
    } catch (err: any) {
      set({
        loadingRooms: false,
        roomsError:   err.message || 'Failed to fetch rooms',
      })
    }
  },

  /*Fetch my rooms*/
  fetchMyRooms: async () => {
    set({ loadingRooms: true, roomsError: null })
    try {
      const { data } = await api.get('/rooms/mine')
      set({ rooms: data, loadingRooms: false })
    } catch (err: any) {
      set({
        loadingRooms: false,
        roomsError:   err.message || 'Failed to fetch your rooms',
      })
    }
  },

  /*Fetch single room*/
  fetchRoom: async (id) => {
    set({ loadingRoom: true, roomError: null })
    try {
      const { data } = await api.get(`/rooms/${id}`)
      set({
        currentRoom:  data,
        members:      data.members      ?? [],
        onlineUsers:  data.online_users ?? [],
        loadingRoom:  false,
      })
    } catch (err: any) {
      set({
        loadingRoom: false,
        roomError:   err.message || 'Failed to fetch room',
      })
    }
  },

  /*Create room*/
  createRoom: async (name, language) => {
    try {
      const { data } = await api.post('/rooms', { name, language })

      // Add to rooms list
      set(state => ({
        rooms: [data, ...state.rooms],
      }))

      return data
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create room')
    }
  },

  /*Update room*/
  updateRoom: async (id, updates) => {
    try {
      const { data } = await api.patch(`/rooms/${id}`, updates)

      set(state => ({
        rooms: state.rooms.map(r => r.id === id ? data : r),
        currentRoom: state.currentRoom?.id === id ? data : state.currentRoom,
      }))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update room')
    }
  },

  /*Delete room*/
  deleteRoom: async (id) => {
    try {
      await api.delete(`/rooms/${id}`)

      set(state => ({
        rooms:       state.rooms.filter(r => r.id !== id),
        currentRoom: state.currentRoom?.id === id ? null : state.currentRoom,
      }))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete room')
    }
  },

  /*Join room*/
  joinRoom: async (id) => {
    try {
      await api.post(`/rooms/${id}/join`)

      // Refresh room data
      await get().fetchRoom(id)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to join room')
    }
  },

  /*Leave room*/
  leaveRoom: async (id) => {
    try {
      await api.post(`/rooms/${id}/leave`)

      set(state => ({
        currentRoom: state.currentRoom?.id === id
          ? null
          : state.currentRoom,
      }))
    } catch (err: any) {
      throw new Error(err.message || 'Failed to leave room')
    }
  },

  /*Online users (from Socket.io)*/
  setOnlineUsers: (users) => {
    set({ onlineUsers: users })
  },

  addOnlineUser: (user) => {
    set(state => ({
      onlineUsers: [
        ...state.onlineUsers.filter(u => u.socketId !== user.socketId),
        user,
      ],
    }))
  },

  removeOnlineUser: (socketId) => {
    set(state => ({
      onlineUsers: state.onlineUsers.filter(
        u => u.socketId !== socketId
      ),
    }))
  },

  /*Set current room*/
  setCurrentRoom: (room) => {
    set({ currentRoom: room })
  },

  /*Clear error*/
  clearRoomError: () => set({ roomError: null }),
}))

export default useRoomStore