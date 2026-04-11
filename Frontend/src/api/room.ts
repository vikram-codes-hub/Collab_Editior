import api from '../lib/axios'
import type {
  Room,
  CreateRoomInput,
  RoomMember,
  OnlineUser,
} from '../types'

/* ============================================================
   Room API calls
   ============================================================ */

export const getRoomsApi = async (): Promise<Room[]> => {
  const { data } = await api.get('/rooms')
  return data
}

export const getMyRoomsApi = async (): Promise<Room[]> => {
  const { data } = await api.get('/rooms/mine')
  return data
}

export const getRoomApi = async (id: string): Promise<Room> => {
  const { data } = await api.get(`/rooms/${id}`)
  return data
}

export const createRoomApi = async (
  input: CreateRoomInput
): Promise<Room> => {
  const { data } = await api.post('/rooms', input)
  return data
}

export const updateRoomApi = async (
  id:    string,
  input: Partial<{ name: string; language: string }>
): Promise<Room> => {
  const { data } = await api.patch(`/rooms/${id}`, input)
  return data
}

export const deleteRoomApi = async (id: string): Promise<void> => {
  await api.delete(`/rooms/${id}`)
}

export const joinRoomApi = async (id: string): Promise<void> => {
  await api.post(`/rooms/${id}/join`)
}

export const leaveRoomApi = async (id: string): Promise<void> => {
  await api.post(`/rooms/${id}/leave`)
}

export const getRoomMembersApi = async (
  id: string
): Promise<RoomMember[]> => {
  const { data } = await api.get(`/rooms/${id}/members`)
  return data
}

export const getOnlineUsersApi = async (
  id: string
): Promise<{ online_count: number; users: OnlineUser[] }> => {
  const { data } = await api.get(`/rooms/${id}/online`)
  return data
}

export const checkMemberApi = async (
  id: string
): Promise<{ isMember: boolean }> => {
  const { data } = await api.get(`/rooms/${id}/check-member`)
  return data
}