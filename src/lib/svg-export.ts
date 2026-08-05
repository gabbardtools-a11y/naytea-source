/**
 * SVG export utility for trademark search results.
 * Generates a standalone .svg file with all results as a grid of cards.
 * Opens in any browser, Inkscape, Illustrator — vector, infinitely scalable.
 *
 * Each card contains:
 *   - Trademark image (embedded as base64 JPEG from tm-api URL)
 *   - Name (as SVG <text> — crisp at any zoom)
 *   - Certificate number
 *   - Status badge
 *   - Owner
 *   - MKTU classes
 *
 * For VERBAL marks (text-only), renders the name as styled <text>
 * instead of embedding the JPEG — gives infinite resolution.
 */

export interface SvgExportItem {
  certificate?: string
  name?: string
  statusText?: string
  status?: string
  markType?: string
  owner?: { fullName?: string; country?: string } | string
  mktu?: (number | string)[]
  priorityDate?: string
  registrationDate?: string
  expirationDate?: string
  similarity?: number
  source?: string
  imageUrl?: string
}

const CARD_W = 240
const CARD_H = 280
const CARD_GAP = 16
const COLS = 4
const MARGIN = 40

function escapeXml(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function simPct(sim: number | undefined): string {
  if (typeof sim !== 'number' || sim <= 0) return ''
  return Math.round(sim * 100) + '%'
}

function wrapText(text: string, maxChars: number): string[] {
  if (!text) return []
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxChars) {
      if (current) lines.push(current.trim())
      current = w
    } else {
      current = (current + ' ' + w).trim()
    }
  }
  if (current) lines.push(current.trim())
  return lines.slice(0, 3) // max 3 lines
}

export async function exportToSVG(
  items: SvgExportItem[],
  searchQuery = '',
  filename = `naytea-results-${Date.now()}.svg`,
) {
  const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
  const itemCount = items.length

  // Layout: grid of COLS columns
  const rows = Math.ceil(itemCount / COLS)
  const totalW = MARGIN * 2 + COLS * CARD_W + (COLS - 1) * CARD_GAP
  const headerH = 100
  const totalH = MARGIN + headerH + rows * (CARD_H + CARD_GAP) + MARGIN

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`
  svg += `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" `
  svg += `width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}" `
  svg += `style="background:#0a0e27;font-family:Arial,sans-serif">\n`

  // ---- Header ----
  svg += `<rect x="0" y="0" width="${totalW}" height="${headerH}" fill="#111640"/>\n`
  svg += `<text x="${MARGIN}" y="40" fill="#e2e8f0" font-size="24" font-weight="bold">NayTea.ru — проверка товарного знака</text>\n`
  svg += `<text x="${MARGIN}" y="62" fill="#94a3b8" font-size="13">Поиск: ${escapeXml(searchQuery || '—')} · Дата: ${escapeXml(now)} · Результатов: ${itemCount}</text>\n`
  svg += `<line x1="${MARGIN}" y1="80" x2="${totalW - MARGIN}" y2="80" stroke="#3b82f6" stroke-width="1" opacity="0.3"/>\n`

  // ---- Cards ----
  for (let i = 0; i < itemCount; i++) {
    const item = items[i]
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = MARGIN + col * (CARD_W + CARD_GAP)
    const y = MARGIN + headerH + row * (CARD_H + CARD_GAP)

    // Card background
    svg += `<rect x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="12" fill="#111640" stroke="#3b82f6" stroke-width="0.5" opacity="0.8"/>\n`

    // Image area (or text for VERBAL marks)
    const imgX = x + 8
    const imgY = y + 8
    const imgW = CARD_W - 16
    const imgH = 120

    // Determine if this is a "text-renderable" mark:
    //   - VERBAL marks (case-insensitive: 'VERBAL', 'Verbal', 'словесный', etc.)
    //   - Any mark with a name but no image (fallback to text rendering)
    const markTypeUpper = (item.markType || '').toUpperCase()
    const isVerbal = markTypeUpper === 'VERBAL' || markTypeUpper === 'СЛОВЕСНЫЙ' || markTypeUpper === 'WORD'
    const hasImage = !!item.imageUrl

    if (isVerbal && item.name) {
      // Render text as SVG <text> — infinite resolution
      svg += `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="8" fill="#0a0e27"/>\n`
      const lines = wrapText(item.name, 22)
      const fontSize = lines.length === 1 ? 22 : lines.length === 2 ? 18 : 14
      const startY = imgY + imgH / 2 - (lines.length - 1) * fontSize * 0.6
      lines.forEach((line, li) => {
        svg += `<text x="${imgX + imgW / 2}" y="${startY + li * fontSize * 1.2}" fill="#e2e8f0" font-size="${fontSize}" font-weight="bold" text-anchor="middle">${escapeXml(line)}</text>\n`
      })
    } else if (hasImage) {
      // Embed JPEG as base64 in SVG
      try {
        const resp = await fetch(`/api/tm-image?url=${encodeURIComponent(item.imageUrl!)}`)
        const buf = await resp.arrayBuffer()
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
        svg += `<image x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/jpeg;base64,${b64}"/>\n`
      } catch {
        svg += `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="8" fill="#0a0e27"/>\n`
        svg += `<text x="${imgX + imgW / 2}" y="${imgY + imgH / 2}" fill="#94a3b8" font-size="11" text-anchor="middle">нет изображения</text>\n`
      }
    } else if (item.name) {
      // Fallback: non-VERBAL mark with name but no image — render name as styled text
      svg += `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="8" fill="#0a0e27"/>\n`
      const lines = wrapText(item.name, 22)
      const fontSize = lines.length === 1 ? 20 : lines.length === 2 ? 16 : 13
      const startY = imgY + imgH / 2 - (lines.length - 1) * fontSize * 0.6
      lines.forEach((line, li) => {
        svg += `<text x="${imgX + imgW / 2}" y="${startY + li * fontSize * 1.2}" fill="#cbd5e1" font-size="${fontSize}" font-weight="600" text-anchor="middle" font-style="italic">${escapeXml(line)}</text>\n`
      })
    } else if (item.certificate) {
      // Last resort: no name, no image — show certificate number as styled placeholder
      svg += `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="8" fill="#0a0e27" stroke="#1e293b" stroke-width="1" stroke-dasharray="4 2"/>\n`
      svg += `<text x="${imgX + imgW / 2}" y="${imgY + imgH / 2 - 6}" fill="#64748b" font-size="10" text-anchor="middle">ТЗ №</text>\n`
      svg += `<text x="${imgX + imgW / 2}" y="${imgY + imgH / 2 + 14}" fill="#cbd5e1" font-size="18" font-weight="bold" text-anchor="middle" font-family="monospace">${escapeXml(item.certificate)}</text>\n`
    } else {
      svg += `<rect x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" rx="8" fill="#0a0e27"/>\n`
      svg += `<text x="${imgX + imgW / 2}" y="${imgY + imgH / 2}" fill="#94a3b8" font-size="11" text-anchor="middle">нет изображения</text>\n`
    }

    // Similarity badge (top-right)
    const sim = simPct(item.similarity)
    if (sim) {
      svg += `<rect x="${x + CARD_W - 48}" y="${y + 12}" width="36" height="18" rx="9" fill="#3b82f6"/>\n`
      svg += `<text x="${x + CARD_W - 30}" y="${y + 25}" fill="#fff" font-size="10" font-weight="bold" text-anchor="middle">${sim}</text>\n`
    }

    // Body text
    let textY = y + imgH + 20

    // Name
    if (item.name && item.markType !== 'VERBAL') {
      svg += `<text x="${x + 12}" y="${textY}" fill="#e2e8f0" font-size="12" font-weight="bold">${escapeXml(item.name.slice(0, 28))}</text>\n`
      textY += 18
    }

    // Status
    if (item.statusText || item.status) {
      svg += `<rect x="${x + 12}" y="${textY - 11}" width="${(item.statusText || item.status || '').length * 5.5 + 8}" height="16" rx="3" fill="#1a2050" stroke="#3b82f6" stroke-width="0.5" opacity="0.5"/>\n`
      svg += `<text x="${x + 16}" y="${textY + 1}" fill="#94a3b8" font-size="10">${escapeXml((item.statusText || item.status || '').slice(0, 24))}</text>\n`
      textY += 22
    }

    // Certificate
    if (item.certificate) {
      svg += `<text x="${x + 12}" y="${textY}" fill="#94a3b8" font-size="10" font-family="monospace">Св-во: ${escapeXml(item.certificate)}</text>\n`
      textY += 14
    }

    // Owner
    const owner = typeof item.owner === 'string' ? item.owner : (item.owner?.fullName || '')
    if (owner) {
      svg += `<text x="${x + 12}" y="${textY}" fill="#94a3b8" font-size="10">${escapeXml(owner.slice(0, 30))}</text>\n`
      textY += 14
    }

    // MKTU
    if (item.mktu && item.mktu.length > 0) {
      svg += `<text x="${x + 12}" y="${textY}" fill="#94a3b8" font-size="10">МКТУ: ${escapeXml(item.mktu.join(', ').slice(0, 28))}</text>\n`
      textY += 14
    }

    // Priority date
    if (item.priorityDate) {
      svg += `<text x="${x + 12}" y="${textY}" fill="#64748b" font-size="9">Приоритет: ${escapeXml(item.priorityDate)}</text>\n`
    }
  }

  // ---- Footer ----
  const footerY = totalH - MARGIN + 10
  svg += `<text x="${totalW / 2}" y="${footerY}" fill="#64748b" font-size="11" text-anchor="middle" font-style="italic">Документ сгенерирован NayTea.ru — ${escapeXml(now)}</text>\n`
  svg += `</svg>`

  // Download
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}
