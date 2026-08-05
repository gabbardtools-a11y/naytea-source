import { NextRequest, NextResponse } from 'next/server'
import { loadMoreResults } from '@/lib/linkmark'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const requestId = (body.requestId || '').toString().trim()
    const offset = parseInt(body.offset, 10) || 0
    const num = parseInt(body.num, 10) || 100

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: 'requestId обязателен' },
        { status: 400 },
      )
    }

    const result = await loadMoreResults({ requestId, offset, num })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { ok: false, error: message, results: [], hasMore: false },
      { status: 500 },
    )
  }
}
