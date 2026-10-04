/** Counts failures per key in a fixed window; `blocked` once `max` is reached. In memory, per process. */
export function createLimiter({ max = 5, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
  const hits = new Map()

  function current(key) {
    const entry = hits.get(key)
    if (entry && now() - entry.start > windowMs) {
      hits.delete(key)
      return undefined
    }
    return entry
  }

  return {
    blocked: (key) => (current(key)?.count ?? 0) >= max,
    fail(key) {
      const entry = current(key)
      if (entry) entry.count++
      else hits.set(key, { start: now(), count: 1 })
    },
    reset: (key) => hits.delete(key)
  }
}
