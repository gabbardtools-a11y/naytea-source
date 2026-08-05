import { NextRequest, NextResponse } from 'next/server'
import { searchByLogo, type WipoSearchResponse } from '@/lib/wipo-search'
import { cacheImage } from '@/lib/image-cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const strategyRaw = formData.get('strategy')
    const rowsRaw = formData.get('rows')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'Файл изображения обязателен (поле "file")' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/bmp', 'image/gif', 'image/jpeg', 'image/png', 'image/tiff', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Неподдерживаемый тип: ${file.type}. Поддерживаются: BMP, GIF, JPEG, PNG, TIFF, WebP` },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: 'Файл слишком большой. Максимум 10 МБ.' },
        { status: 400 }
      )
    }

    const strategy = (strategyRaw === 'shape' || strategyRaw === 'color' || strategyRaw === 'composite')
      ? strategyRaw
      : 'concept'
    const rows = rowsRaw ? parseInt(String(rowsRaw), 10) : 30

    // Convert file to base64 data URI
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const imageData = `data:${file.type};base64,${base64}`

    // Cache the image for pagination (same mechanism as brand-search image)
    const imageId = await cacheImage(arrayBuffer, file.name, file.type)

    const result = await searchByLogo({
      imageData,
      strategy: strategy as 'concept' | 'shape' | 'color' | 'composite',
      rows,
    })

    const response: WipoSearchResponse & { imageId: string; strategy: string } = {
      ...result,
      imageId,
      strategy,
    }
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
        imageId: '',
        strategy: 'concept',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'WIPO GBD logo search proxy',
    description: 'Search 75M+ trademarks by image similarity via WIPO Global Brand Database',
  })
}
