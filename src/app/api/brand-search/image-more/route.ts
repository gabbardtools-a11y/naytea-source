import { NextRequest, NextResponse } from 'next/server'
import { loadMoreByImage } from '@/lib/brand-search-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const mktuRaw = formData.get('mktu')?.toString() || ''
    const mktu: number[] = mktuRaw
      ? mktuRaw.split(',').map(s => parseInt(s, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 45)
      : []
    const page = parseInt(formData.get('page')?.toString() || '2', 10) || 2
    const pageSize = parseInt(formData.get('pageSize')?.toString() || '100', 10) || 100
    const rectRaw = formData.get('rectangle')?.toString() || ''

    let rectangle: { x1: number; y1: number; x2: number; y2: number } | undefined
    if (rectRaw) {
      const m = rectRaw.match(/\[?([\d.]+),([\d.]+),([\d.]+),([\d.]+)\]?/)
      if (m) {
        rectangle = {
          x1: parseFloat(m[1]), y1: parseFloat(m[2]),
          x2: parseFloat(m[3]), y2: parseFloat(m[4]),
        }
      }
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: 'File "file" обязателен' }, { status: 400 })
    }

    const fileName = (file as File).name || 'image.png'
    const result = await loadMoreByImage({
      file: file as Blob,
      fileName,
      mktu,
      page,
      pageSize,
      rectangle,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message, results: [], hasMore: false }, { status: 500 })
  }
}
