import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mainCss = readFileSync(
  resolve(__dirname, '../../src/assets/styles/main.css'),
  'utf-8',
)

const adminCalendar = readFileSync(
  resolve(__dirname, '../../src/components/admin/AdminCalendar.vue'),
  'utf-8',
)

describe('Takvim sayfası tam genişlik CSS kuralları', () => {
  it('main.css içinde .admin-calendar override\'ı tanımlı', () => {
    expect(mainCss).toMatch(
      /\.page-info\s+\.admin-calendar[\s\S]*?max-width:\s*100%/,
    )
    expect(mainCss).toMatch(
      /\.page-info\s+\.admin-calendar\s+\.v-container[\s\S]*?padding-left:\s*0/,
    )
    expect(mainCss).toMatch(
      /\.page-info\s+\.admin-calendar\s+\.v-container[\s\S]*?padding-right:\s*0/,
    )
  })

  it('AdminCalendar scoped style\'ında v-container padding sıfırlama mevcut', () => {
    expect(adminCalendar).toContain(':deep(.v-container)')
    expect(adminCalendar).toMatch(/max-width:\s*100%/)
  })

  it('1100px global kuralı korunuyor (diğer sayfalar etkilenmesin)', () => {
    expect(mainCss).toMatch(/\.page-info\s+\.v-container\s*\{[\s\S]*?max-width:\s*1100px/)
  })
})
