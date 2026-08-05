import { NextResponse } from 'next/server'
import { getStats } from '@/lib/rospatent-d1'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/rospatent/stats
 *
 * Returns total/active/expired counts + date range of Rospatent DB.
 * Useful for UI badge "1.15M records from Rospatent" and for health check.
 */
export async function GET() {
  try {
    const stats = await getStats()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
