// Excel (tr-TR) uyumlu CSV: UTF-8 BOM + ';' ayraç + CRLF. Hücreler formül
// enjeksiyonuna karşı korunur (=, +, -, @ ile başlayan metin tek tırnakla başlar).

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[";\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function buildCsv(headers: readonly string[], rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  return '﻿' + [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
}

/** Tarayıcıda CSV indirir. */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
