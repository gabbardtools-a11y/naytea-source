import { NextRequest, NextResponse } from 'next/server'
import { loadMoreTrademarks } from '@/lib/brand-search-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const search = (body.search || '').toString().trim()
    const mktu: number[] = Array.isArray(body.mktu)
      ? body.mktu.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 45)
      : []
    const page = parseInt(body.page, 10) || 2
    const pageSize = body.pageSize ? parseInt(body.pageSize, 10) : 100
    const searchMode = body.searchMode ? String(body.searchMode) : 'standard'

    if (!search) {
      return NextResponse.json({ ok: false, error: 'Поисковый запрос обязателен' }, { status: 400 })
    }

    const result = await loadMoreTrademarks({ search, mktu, page, pageSize, searchMode })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message, results: [], hasMore: false }, { status: 500 })
  }
}
