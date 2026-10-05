import { describe, it, expect } from 'vitest'
import { buildCsv, csvCell } from '@/utils/csv'

describe('csv', () => {
  it('BOM + ; ayraç + CRLF', () => {
    expect(buildCsv(['A', 'B'], [['1', '2']])).toBe('﻿A;B\r\n1;2\r\n')
  })

  it('; " ve satır sonu içeren hücre tırnaklanır', () => {
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('çift "tırnak"')).toBe('"çift ""tırnak"""')
    expect(csvCell('iki\nsatır')).toBe('"iki\nsatır"')
  })

  it('formül enjeksiyonuna karşı korunur, boşlar boş yazılır', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell('+90')).toBe("'+90")
    expect(csvCell(null)).toBe('')
    expect(csvCell(undefined)).toBe('')
  })
})
