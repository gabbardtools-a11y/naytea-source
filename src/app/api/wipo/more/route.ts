import { NextRequest, NextResponse } from 'next/server'
import { loadMoreTrademarks, type WipoMoreResponse } from '@/lib/wipo-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const search = (body.search || '').toString().trim()
    const mktu: number[] = Array.isArray(body.mktu)
      ? body.mktu.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 45)
      : []
    const start = parseInt(body.start, 10)
    const rows = body.rows ? parseInt(body.rows, 10) : 30

    if (!search) {
      return NextResponse.json({ ok: false, error: 'search обязателен' }, { status: 400 })
    }
    if (isNaN(start) || start < 30) {
      return NextResponse.json(
        { ok: false, error: 'start должен быть >= 30' },
        { status: 400 }
      )
    }

    const result = await loadMoreTrademarks({ search, mktu, start, rows })
    const response: WipoMoreResponse = result
    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { ok: false, error: message, results: [], total: 0, hasMore: false },
      { status: 500 }
    )
  }
}
