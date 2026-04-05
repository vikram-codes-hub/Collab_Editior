import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

/* ============================================================
   Redis Service
   Two clients needed:
   - redis    → normal commands (get, set, publish, del)
   - redisSub → subscribe only (ioredis rule: a client in
                subscribe mode can't run other commands)
   ============================================================ */

const REDIS_URL = process.env.REDIS_URL!

if (!REDIS_URL) {
  throw new Error('REDIS_URL is not defined in .env')
}

const redisOptions = {
  // RedisLabs cloud requires TLS
  tls: {
    rejectUnauthorized: false,
  },

  // Retry up to 10 times with exponential backoff
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error('❌ Redis max retries reached, giving up')
      return null
    }
    const delay = Math.min(times * 200, 2000)
    console.log(`⏳ Redis retry attempt ${times}, waiting ${delay}ms`)
    return delay
  },

  keepAlive:      30_000,
  connectTimeout: 10_000,
  lazyConnect:    false,
}

// ── Main client — commands + publish ──────────────────────
export const redis = new Redis(REDIS_URL, redisOptions)

// ── Sub client — subscribe only ───────────────────────────
export const redisSub = new Redis(REDIS_URL, redisOptions)

// ── Event listeners ───────────────────────────────────────
redis.on('connect',           () => console.log('✅ Redis connected'))
redis.on('ready',             () => console.log('✅ Redis ready'))
redis.on('error',     (err)  => console.error('❌ Redis error:', err.message))
redis.on('close',             () => console.log('⚠️  Redis connection closed'))
redis.on('reconnecting',      () => console.log('⏳ Redis reconnecting...'))

redisSub.on('connect',        () => console.log('✅ Redis sub connected'))
redisSub.on('ready',          () => console.log('✅ Redis sub ready'))
redisSub.on('error',  (err)  => console.error('❌ Redis sub error:', err.message))

// ── Helpers ───────────────────────────────────────────────

// Publish a message to a channel
export const publish = async (
  channel: string,
  data:    object
): Promise<void> => {
  try {
    await redis.publish(channel, JSON.stringify(data))
  } catch (err) {
    console.error(`❌ Redis publish failed on channel ${channel}:`, err)
  }
}

// Subscribe to a channel and handle messages
export const subscribe = (
  channel: string,
  handler: (data: object) => void
): void => {
  redisSub.subscribe(channel, (err) => {
    if (err) console.error(`❌ Redis subscribe failed on ${channel}:`, err)
  })

  redisSub.on('message', (ch, message) => {
    if (ch !== channel) return
    try {
      handler(JSON.parse(message))
    } catch (err) {
      console.error(`❌ Redis message parse error on ${channel}:`, err)
    }
  })
}

// Set a key with optional TTL in seconds
export const setKey = async (
  key:   string,
  value: object | string,
  ttl?:  number
): Promise<void> => {
  const val = typeof value === 'string' ? value : JSON.stringify(value)
  if (ttl) {
    await redis.setex(key, ttl, val)
  } else {
    await redis.set(key, val)
  }
}

// Get a key and parse JSON
export const getKey = async <T>(key: string): Promise<T | null> => {
  const val = await redis.get(key)
  if (!val) return null
  try {
    return JSON.parse(val) as T
  } catch {
    return val as unknown as T
  }
}

// Delete a key
export const delKey = async (key: string): Promise<void> => {
  await redis.del(key)
}

// Store online presence for a user in a room
// TTL of 60s — frontend pings every 30s to keep alive
export const setPresence = async (
  roomId:   string,
  userId:   string,
  userData: object
): Promise<void> => {
  await setKey(`presence:${roomId}:${userId}`, userData, 60)
}

// Get all online users in a room
export const getRoomPresence = async (roomId: string): Promise<object[]> => {
  const keys = await redis.keys(`presence:${roomId}:*`)
  if (keys.length === 0) return []

  const values = await redis.mget(...keys)
  return values
    .filter(Boolean)
    .map(v => {
      try { return JSON.parse(v!) } catch { return null }
    })
    .filter(Boolean)
}

// Remove presence when user leaves
export const removePresence = async (
  roomId: string,
  userId: string
): Promise<void> => {
  await delKey(`presence:${roomId}:${userId}`)
}