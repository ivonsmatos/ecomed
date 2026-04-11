import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

let _redis: Redis | null = null
function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return _redis
}

function makeRatelimit(limiter: Ratelimit["limiter"], prefix: string) {
  return new Ratelimit({ get redis() { return getRedis() }, limiter, prefix })
}

export const ratelimits = {
  auth: makeRatelimit(Ratelimit.slidingWindow(10, "1 m"),  "ecomed:auth"),
  chat: makeRatelimit(Ratelimit.slidingWindow(20, "1 m"),  "ecomed:chat"),
  map:  makeRatelimit(Ratelimit.slidingWindow(100, "1 m"), "ecomed:map"),
}

export async function checkRateLimit(
  limiter: keyof typeof ratelimits,
  identifier: string
) {
  return ratelimits[limiter].limit(identifier)
}
