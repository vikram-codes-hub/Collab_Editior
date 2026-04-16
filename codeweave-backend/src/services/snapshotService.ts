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

export const loadSnapshot = async (
  roomId: string,
  doc:    Y.Doc
): Promise<boolean> => {
  const snapshot = await dbGet(roomId)
  if (!snapshot) return false

  const update = new Uint8Array(snapshot.content)
  if (update.length === 0) return false

  try {
    Y.applyUpdate(doc, update)
    return true
  } catch (err) {
    console.warn(`⚠️ Corrupt snapshot for ${roomId}, deleting:`, err)
    await dbDelete(roomId)  // ← nuke bad snapshot so getDoc doesn't re-crash
    return false
  }
}