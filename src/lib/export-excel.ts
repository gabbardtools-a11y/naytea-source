import * as XLSX from 'xlsx'
import type { SearchResult } from '@/app/page'

/**
 * Exports an array of unified SearchResult items to an .xlsx file and
 * triggers a browser download.
 *
 * Columns:
 *  - № (порядковый номер)
 *  - Название (mark_name)
 *  - Номер свидетельства
 *  - Номер заявки (если есть)
 *  - Статус
 *  - Тип знака (если есть)
 *  - Сходство % (если есть — для image search)
 *  - МКТУ
 *  - Правообладатель
 *  - ИНН (если есть)
 *  - Страна (если есть)
 *  - Дата приоритета
 *  - Дата регистрации
 *  - Дата подачи заявки (если есть)
 *  - Действует до (если есть)
 *  - Неохраняемые элементы
 *  - Каталог (если есть)
 *  - Изображение (URL)
 *  - Источник (FIPS / Роспатент)
 */
export function exportResultsToExcel(
  results: SearchResult[],
  fileName: string = 'trademarks.xlsx',
  meta?: { query?: string; source?: string; exportedAt?: Date }
): void {
  // Build worksheet rows
  const rows = results.map((r, idx) => ({
    '№': idx + 1,
    'Название': r.name || '',
    'Номер свидетельства': r.certificate || '',
    'Номер заявки': r.applicationNumber || '',
    'Статус': r.statusText || '',
    'Тип знака': r.markType || '',
    'Сходство %': r.similarity !== undefined ? Math.round(r.similarity * 100) : '',
    'МКТУ': r.mktu.join(', '),
    'Правообладатель': r.owner || '',
    'ИНН': r.ownerTin || '',
    'Страна': r.ownerCountry || '',
    'Дата приоритета': r.priorityDate || '',
    'Дата регистрации': r.registrationDate || '',
    'Дата подачи заявки': r.applicationDate || '',
    'Действует до': r.expirationDate || '',
    'Неохраняемые элементы': r.unprotectedElements || '',
    'Каталог': r.catalog || '',
    'Изображение': r.imageUrl || '',
    'Источник FIPS': r.sourceUrl || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // №
    { wch: 32 },  // Название
    { wch: 14 },  // Номер свидетельства
    { wch: 16 },  // Номер заявки
    { wch: 22 },  // Статус
    { wch: 12 },  // Тип знака
    { wch: 10 },  // Сходство %
    { wch: 16 },  // МКТУ
    { wch: 50 },  // Правообладатель
    { wch: 14 },  // ИНН
    { wch: 12 },  // Страна
    { wch: 18 },  // Дата приоритета
    { wch: 18 },  // Дата регистрации
    { wch: 18 },  // Дата подачи заявки
    { wch: 18 },  // Действует до
    { wch: 40 },  // Неохраняемые элементы
    { wch: 10 },  // Каталог
    { wch: 60 },  // Изображение
    { wch: 60 },  // Источник FIPS
  ]

  // Freeze the header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add an info sheet with search metadata
  const infoRows: Array<{ Параметр: string; Значение: string }> = [
    { Параметр: 'Источник', Значение: meta?.source || '' },
    { Параметр: 'Запрос', Значение: meta?.query || '' },
    { Параметр: 'Экспортировано', Значение: (meta?.exportedAt || new Date()).toLocaleString('ru-RU') },
    { Параметр: 'Всего записей', Значение: String(results.length) },
  ]
  const infoWs = XLSX.utils.json_to_sheet(infoRows)
  infoWs['!cols'] = [{ wch: 20 }, { wch: 80 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, infoWs, 'Информация')
  XLSX.utils.book_append_sheet(wb, ws, 'Товарные знаки')

  // Trigger download — XLSX.write with type 'array' returns ArrayBuffer
  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke after a short delay — some browsers need the URL to stay alive
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
