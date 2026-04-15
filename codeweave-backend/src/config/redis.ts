import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

//ioredis client using REDIS_URL from .env
export const redis = new Redis(process.env.REDIS_URL!, {
  // RedisLabs requires TLS on cloud instances
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,

  // Retry strategy — reconnect up to 10 times
  retryStrategy: (times) => {
    if (times > 10) return null   // stop retrying
    return Math.min(times * 200, 2000)  // wait 200ms → 2s
  },

  // Keep alive
  keepAlive: 30_000,
  connectTimeout: 10_000,
})

//Pub/sub needs a separate connection
// (ioredis clients in subscribe mode can't send other commands)
export const redisSub = new Redis(process.env.REDIS_URL!, {
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  retryStrategy: (times) => {
    if (times > 10) return null
    return Math.min(times * 200, 2000)
  },
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error',   (err) => console.error('❌ Redis error:', err))

redisSub.on('connect', () => console.log('✅ Redis sub connected'))
redisSub.on('error',   (err) => console.error('❌ Redis sub error:', err))

//Helper: publish to a channel
export const publish = async (channel: string, data: object) => {
  await redis.publish(channel, JSON.stringify(data))
}

//Helper: subscribe to a channel
export const subscribe = (
  channel: string,
  handler: (data: object) => void
) => {
  redisSub.subscribe(channel)
  redisSub.on('message', (ch, message) => {
    if (ch !== channel) return
    try {
      handler(JSON.parse(message))
    } catch (err) {
      console.error('Redis message parse error:', err)
    }
  })
}