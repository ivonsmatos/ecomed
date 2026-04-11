import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Lazy init: Redis só é instanciado na 1ª chamada (não no import/build time)
let _redis: Redis | null = null
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

// Cada ratelimit é criado lazy também
let _ratelimits: {
  auth: Ratelimit
  chat: Ratelimit
  map: Ratelimit
} | null = null

function getRatelimits() {
  if (!_ratelimits) {
    const redis = getRedis()
    _ratelimits = {
      auth: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"),  prefix: "ecomed:auth" }),
      chat: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "1 m"),  prefix: "ecomed:chat" }),
      map:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "1 m"), prefix: "ecomed:map" }),
    }
  }
  return _ratelimits
}

export async function checkRateLimit(
  limiter: "auth" | "chat" | "map",
  identifier: string
) {
  return getRatelimits()[limiter].limit(identifier)
}
