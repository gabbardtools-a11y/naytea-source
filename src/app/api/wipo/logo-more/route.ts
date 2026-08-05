import { NextRequest, NextResponse } from 'next/server'
import { loadMoreByLogo, type WipoMoreResponse } from '@/lib/wipo-search'
import { getCachedImage } from '@/lib/image-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const imageId = (body.imageId || '').toString().trim()
    const strategy = body.strategy === 'shape' || body.strategy === 'color' || body.strategy === 'composite'
      ? body.strategy
      : 'concept'
    const start = parseInt(body.start, 10)
    const rows = body.rows ? parseInt(body.rows, 10) : 30

    if (!imageId) {
      return NextResponse.json({ ok: false, error: 'imageId обязателен' }, { status: 400 })
    }
    if (isNaN(start) || start < 30) {
      return NextResponse.json(
        { ok: false, error: 'start должен быть >= 30' },
        { status: 400 }
      )
    }

    const cached = await getCachedImage(imageId)
    if (!cached) {
      return NextResponse.json(
        { ok: false, error: 'Изображение не найдено в кэше (истёк 30-минутный TTL). Загрузите файл заново.' },
        { status: 404 }
      )
    }

    const base64 = cached.buffer.toString('base64')
    const imageData = `data:${cached.contentType};base64,${base64}`

    const result = await loadMoreByLogo({
      imageData,
      strategy: strategy as 'concept' | 'shape' | 'color' | 'composite',
      start,
      rows,
    })

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
