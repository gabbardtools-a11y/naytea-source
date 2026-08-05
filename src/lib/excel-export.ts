/**
 * Excel export utility for trademark search results.
 * Uses xlsx (SheetJS) to generate .xlsx files client-side.
 */
import * as XLSX from 'xlsx'

export interface ExcelRow {
  'Свидетельство': string
  'Название': string
  'Статус': string
  'Тип знака': string
  'Правообладатель': string
  'Страна': string
  'МКТУ': string
  'Приоритет': string
  'Регистрация': string
  'Истекает': string
  'Сходство %': number | string
  'Источник': string
  'Ссылка': string
}

interface ExportItem {
  certificate?: string
  name?: string
  statusText?: string
  status?: string
  markType?: string
  owner?: { fullName?: string; country?: string } | string
  mktu?: number[] | string[]
  priorityDate?: string
  registrationDate?: string
  expirationDate?: string
  similarity?: number
  score?: number
  source?: string
  sourceUrl?: string
  catalog?: string
}

export function exportToExcel(items: ExportItem[], filename = 'naytea-results.xlsx') {
  const rows: ExcelRow[] = items.map((item) => {
    const owner = typeof item.owner === 'string' ? item.owner : (item.owner?.fullName || '')
    const country = typeof item.owner === 'object' ? (item.owner?.country || '') : ''
    const mktuStr = Array.isArray(item.mktu) ? item.mktu.join(', ') : (item.mktu || '')
    const sim = typeof item.similarity === 'number' ? Math.round(item.similarity * 100) / 100 : ''
    const source = item.source || item.catalog || ''
    const link = item.sourceUrl || ''

    return {
      'Свидетельство': item.certificate || '',
      'Название': item.name || '',
      'Статус': item.statusText || item.status || '',
      'Тип знака': item.markType || '',
      'Правообладатель': owner,
      'Страна': country,
      'МКТУ': mktuStr,
      'Приоритет': item.priorityDate || '',
      'Регистрация': item.registrationDate || '',
      'Истекает': item.expirationDate || '',
      'Сходство %': sim,
      'Источник': source,
      'Ссылка': link,
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Свидетельство
    { wch: 32 }, // Название
    { wch: 18 }, // Статус
    { wch: 16 }, // Тип
    { wch: 32 }, // Правообладатель
    { wch: 12 }, // Страна
    { wch: 18 }, // МКТУ
    { wch: 16 }, // Приоритет
    { wch: 16 }, // Регистрация
    { wch: 16 }, // Истекает
    { wch: 10 }, // Сходство
    { wch: 18 }, // Источник
    { wch: 40 }, // Ссылка
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Результаты')

  // Auto-filter on the header row
  ws['!autofilter'] = { ref: `A1:M${rows.length + 1}` }

  XLSX.writeFile(wb, filename, { compression: true })
}
