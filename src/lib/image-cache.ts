import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * Server-side image cache for the "search by image" feature.
 *
 * When a user uploads an image to /api/brand-search/image, we save it to
 * disk under /tmp/brand-search-images/ with a random id, and return that
 * id to the client. The client can then call /api/brand-search/image-more
 * with just the id (no need to re-upload) to fetch additional pages.
 *
 * Cache entries are pruned when they're older than 30 minutes — long enough
 * for a user to click "load more" a few times, short enough to keep disk
 * usage bounded.
 */

const CACHE_DIR = path.join('/tmp', 'brand-search-images')
const TTL_MS = 30 * 60 * 1000 // 30 minutes

interface CacheEntry {
  id: string
  buffer: Buffer
  fileName: string
  contentType: string
  createdAt: number
}

// In-memory cache (fast path) — backed by disk for persistence across HMR
const memoryCache = new Map<string, CacheEntry>()

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch {
    // ignore — directory may already exist
  }
}

/**
 * Saves an image to the cache and returns a random id that can be used to
 * retrieve it later via getCachedImage().
 */
export async function cacheImage(
  buffer: ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<string> {
  await ensureCacheDir()
  const id = crypto.randomBytes(16).toString('hex')
  const entry: CacheEntry = {
    id,
    buffer: Buffer.from(buffer),
    fileName,
    contentType,
    createdAt: Date.now(),
  }
  memoryCache.set(id, entry)
  // Also persist to disk in case the dev server restarts
  try {
    const meta = JSON.stringify({ fileName, contentType, createdAt: entry.createdAt })
    await fs.writeFile(path.join(CACHE_DIR, `${id}.bin`), entry.buffer)
    await fs.writeFile(path.join(CACHE_DIR, `${id}.meta`), meta)
  } catch {
    // disk write is best-effort; memory cache is enough
  }
  // Opportunistic cleanup of old entries
  pruneOldEntries().catch(() => {})
  return id
}

/**
 * Retrieves a cached image by id. Returns null if not found or expired.
 */
export async function getCachedImage(id: string): Promise<CacheEntry | null> {
  // Try memory first
  const mem = memoryCache.get(id)
  if (mem) {
    if (Date.now() - mem.createdAt > TTL_MS) {
      memoryCache.delete(id)
      return null
    }
    return mem
  }
  // Try disk
  try {
    const binPath = path.join(CACHE_DIR, `${id}.bin`)
    const metaPath = path.join(CACHE_DIR, `${id}.meta`)
    const buffer = await fs.readFile(binPath)
    const metaRaw = await fs.readFile(metaPath, 'utf8')
    const meta = JSON.parse(metaRaw)
    if (Date.now() - meta.createdAt > TTL_MS) {
      await fs.unlink(binPath).catch(() => {})
      await fs.unlink(metaPath).catch(() => {})
      return null
    }
    const entry: CacheEntry = {
      id,
      buffer,
      fileName: meta.fileName,
      contentType: meta.contentType,
      createdAt: meta.createdAt,
    }
    memoryCache.set(id, entry)
    return entry
  } catch {
    return null
  }
}

/**
 * Removes cache entries older than TTL_MS. Best-effort, never throws.
 */
async function pruneOldEntries(): Promise<void> {
  const now = Date.now()
  // Memory
  for (const [id, entry] of memoryCache) {
    if (now - entry.createdAt > TTL_MS) {
      memoryCache.delete(id)
    }
  }
  // Disk
  try {
    const files = await fs.readdir(CACHE_DIR)
    for (const f of files) {
      if (!f.endsWith('.meta')) continue
      const id = f.slice(0, -5)
      const metaPath = path.join(CACHE_DIR, f)
      try {
        const metaRaw = await fs.readFile(metaPath, 'utf8')
        const meta = JSON.parse(metaRaw)
        if (now - meta.createdAt > TTL_MS) {
          await fs.unlink(path.join(CACHE_DIR, `${id}.bin`)).catch(() => {})
          await fs.unlink(metaPath).catch(() => {})
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}
