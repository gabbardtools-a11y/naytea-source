/**
 * RTF export utility for trademark search results.
 * Generates Rich Text Format (.rtf) document with formatted table.
 */

export interface RtfExportItem {
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
  sourceUrl?: string
}

const RTF_HEADER = `{\\rtf1\\ansi\\ansicpg1251\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset204 Arial;}{\\f1\\fnil\\fcharset204 Courier New;}}
{\\colortbl;\\red217\\green37\\blue37;\\red217\\green119\\blue6;\\red30\\green64\\blue175;\\red0\\green0\\blue0;\\red89\\gray89;}
\\f0\\fs22
`

function rtfEscape(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r\n|\n|\r/g, '\\line ')
    .split('')
    .map(ch => {
      const code = ch.charCodeAt(0)
      if (code > 127) {
        const signed = code > 32767 ? code - 65536 : code
        return `\\u${signed}?`
      }
      return ch
    })
    .join('')
}

function simPct(sim: number | undefined): string {
  if (typeof sim !== 'number' || sim <= 0) return ''
  return Math.round(sim * 100) + '%'
}

export function exportToRTF(
  items: RtfExportItem[],
  searchQuery = '',
  filename = `naytea-results-${Date.now()}.rtf`,
) {
  const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
  let rtf = RTF_HEADER
  rtf += `{\\pard\\qc\\fs32\\b NayTea.ru — проверка товарного знака\\par}\n`
  rtf += `{\\pard\\qc\\fs20 ${rtfEscape('Поиск: ' + (searchQuery || '—'))}\\par}\n`
  rtf += `{\\pard\\qc\\fs20 ${rtfEscape('Дата: ' + now)}\\par}\n`
  rtf += `{\\pard\\qc\\fs20 ${rtfEscape('Найдено результатов: ' + items.length)}\\par}\n`
  rtf += `\\par\n`

  if (items.length === 0) {
    rtf += `{\\pard\\fs22 ${rtfEscape('Нет данных для экспорта.')}\\par}\n}`
    downloadRtf(rtf, filename)
    return
  }

  const cols = [
    { name: '#', w: 600 },
    { name: 'Свидетельство', w: 1500 },
    { name: 'Название', w: 3000 },
    { name: 'Статус', w: 1800 },
    { name: 'Тип', w: 1200 },
    { name: 'Правообладатель', w: 3000 },
    { name: 'Страна', w: 1000 },
    { name: 'МКТУ', w: 1800 },
    { name: 'Приоритет', w: 1500 },
    { name: 'Регистрация', w: 1500 },
    { name: 'Истекает', w: 1500 },
    { name: 'Сходство', w: 1000 },
    { name: 'Источник', w: 1500 },
  ]
  const cellXs: number[] = []
  let cumX = 200
  for (const c of cols) { cumX += c.w; cellXs.push(cumX) }

  rtf += `{\\trowd\\trgaph100\\trhdr\n`
  for (let i = 0; i < cols.length; i++) {
    rtf += `\\clbrdrt\\brdrs\\clbrdrl\\brdrs\\clbrdrb\\brdrs\\clbrdrr\\brdrs\\cellx${cellXs[i]}`
  }
  rtf += `\n`
  for (const c of cols) {
    rtf += `{\\pard\\intbl\\b\\fs18 ${rtfEscape(c.name)}\\cell}`
  }
  rtf += `\\row\n}\n`

  items.forEach((item, idx) => {
    const owner = typeof item.owner === 'string' ? item.owner : (item.owner?.fullName || '')
    const country = typeof item.owner === 'object' ? (item.owner?.country || '') : ''
    const mktuStr = Array.isArray(item.mktu) ? item.mktu.join(', ') : (item.mktu || '')
    const sim = simPct(item.similarity)
    const cells = [
      String(idx + 1), item.certificate || '', item.name || '',
      item.statusText || item.status || '', item.markType || '',
      owner, country, mktuStr,
      item.priorityDate || '', item.registrationDate || '',
      item.expirationDate || '', sim, item.source || '',
    ]
    rtf += `{\\trowd\\trgaph100\n`
    for (let i = 0; i < cols.length; i++) {
      rtf += `\\clbrdrt\\brdrs\\clbrdrl\\brdrs\\clbrdrb\\brdrs\\clbrdrr\\brdrs\\cellx${cellXs[i]}`
    }
    rtf += `\n`
    for (const cell of cells) {
      rtf += `{\\pard\\intbl\\fs18 ${rtfEscape(cell)}\\cell}`
    }
    rtf += `\\row\n}\n`
  })

  rtf += `\\par\n`
  rtf += `{\\pard\\qc\\fs16\\i ${rtfEscape('Документ сгенерирован NayTea.ru — ' + now)}\\par}\n`
  rtf += `{\\pard\\qc\\fs16\\i ${rtfEscape('Источники: brand-search.ru · linkmark.ru · WIPO GBD')}\\par}\n`
  rtf += `}`
  downloadRtf(rtf, filename)
}

function downloadRtf(rtfContent: string, filename: string) {
  const blob = new Blob([rtfContent], { type: 'application/rtf;charset=utf-8' })
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
