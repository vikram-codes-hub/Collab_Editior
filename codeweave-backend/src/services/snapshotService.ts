import * as Y from 'yjs'
import {
  saveSnapshot   as dbSave,
  getSnapshot    as dbGet,
  deleteSnapshot as dbDelete,
} from '../models/snapshot'

/*Snapshot Service
   Bridge between Yjs docs and the snapshot model
   Called by yjsServer.ts
*/

/*Save Yjs doc state to PostgreSQL*/
export const saveSnapshot = async (
  roomId: string,
  doc:    Y.Doc
): Promise<void> => {
  const content = Buffer.from(Y.encodeStateAsUpdate(doc))
  await dbSave(roomId, content)
}

/*Load snapshot and apply to Yjs doc*/
export const loadSnapshot = async (
  roomId: string,
  doc:    Y.Doc
): Promise<boolean> => {
  const snapshot = await dbGet(roomId)
  if (!snapshot) return false

  Y.applyUpdate(doc, snapshot.content)
  return true
}

/*Delete snapshot*/
export const deleteRoomSnapshot = async (
  roomId: string
): Promise<void> => {
  await dbDelete(roomId)
}