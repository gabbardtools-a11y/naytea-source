import { NextRequest, NextResponse } from 'next/server'
import { searchTrademarks } from '@/lib/brand-search-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const search = (body.search || '').toString().trim()
    const mktu: number[] = Array.isArray(body.mktu) ? body.mktu.filter((n: unknown) => typeof n === 'number' && n >= 1 && n <= 45) : []
    const pageSize = body.pageSize ? parseInt(body.pageSize, 10) : 100
    if (!search) return NextResponse.json({ ok: false, error: 'Поисковый запрос обязателен' }, { status: 400 })

    const result = await searchTrademarks({ search, mktu, pageSize })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message, results: [], total: 0, hasMore: false }, { status: 500 })
  }
}
