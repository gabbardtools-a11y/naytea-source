import { NextRequest, NextResponse } from 'next/server'
import { searchTrademarks, type WipoSearchResponse } from '@/lib/wipo-search'

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
    const rows = body.rows ? parseInt(body.rows, 10) : 30

    if (!search) {
      return NextResponse.json(
        { ok: false, error: 'Поисковый запрос обязателен' },
        { status: 400 }
      )
    }

    const result = await searchTrademarks({ search, mktu, rows })
    const response: WipoSearchResponse = result
    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      {
        ok: false,
        error: message,
        results: [],
        total: 0,
        start: 0,
        rows: 0,
        hasMore: false,
        query: { search: '', mktu: [] },
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'WIPO GBD proxy',
    description: 'Search 75M+ trademarks from 89 countries via WIPO Global Brand Database',
  })
}
