import { describe, it, expect } from 'vitest'
import { DateHelpers } from '@/services/helpers'

describe('Saat aralığı 08:00 - 22:00 (son slot başlangıcı)', () => {
  it('DateHelpers.getTimeSlots() varsayılan parametrelerle 08:00\'dan 22:00\'a kadar 15 slot döner', () => {
    const slots = DateHelpers.getTimeSlots()
    expect(slots[0]).toBe('08:00')
    expect(slots[slots.length - 1]).toBe('22:00')
    expect(slots).toHaveLength(15)
  })

  it('08:00 ve 22:00 yeni aralıkta geçerli slotlar', () => {
    const slots = DateHelpers.getTimeSlots()
    expect(slots).toContain('08:00')
    expect(slots).toContain('22:00')
  })

  it('06:00, 07:00 ve 23:00 listede yer almaz', () => {
    const slots = DateHelpers.getTimeSlots()
    expect(slots).not.toContain('06:00')
    expect(slots).not.toContain('07:00')
    expect(slots).not.toContain('23:00')
  })

  it('explicit parametreler defaults\'tan bağımsız çalışır', () => {
    const slots = DateHelpers.getTimeSlots(8, 22, 60)
    expect(slots[0]).toBe('08:00')
    expect(slots[slots.length - 1]).toBe('21:00')
  })
})

describe('Tüm yerlerde slot listesi tutarlılığı', () => {
  it('Reservations.vue timeSlots — 08:00 ile 22:00 arasında değer içerir', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/views/Reservations.vue'),
      'utf-8',
    )
    expect(content).toMatch(/'08:00'/)
    expect(content).toMatch(/'22:00'/)
  })

  it('Courts.vue timeSlots — 08:00 ile 22:00 arasında değer içerir', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/views/Courts.vue'),
      'utf-8',
    )
    expect(content).toMatch(/'08:00'/)
    expect(content).toMatch(/'22:00'/)
  })

  it('GroupManagement.vue timeOptions — 08:00 ile 22:00 içerir', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/components/admin/GroupManagement.vue'),
      'utf-8',
    )
    expect(content).toMatch(/'08:00'/)
    expect(content).toMatch(/'22:00'/)
  })

  it('StudentManagement.vue timeOptions — 08:00 ve 22:00 içerir', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/components/admin/StudentManagement.vue'),
      'utf-8',
    )
    expect(content).toMatch(/title:\s*'08:00'/)
    expect(content).toMatch(/title:\s*'22:00'/)
  })

  it('AdminCalendar.vue hours — length 15, başlangıç 8', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/components/admin/AdminCalendar.vue'),
      'utf-8',
    )
    expect(content).toMatch(/Array\.from\(\{\s*length:\s*15\s*\},\s*\(_,\s*i\)\s*=>\s*i\s*\+\s*8\)/)
  })

  it('reservations store — startHour=8, endHour=23', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/store/modules/reservations.ts'),
      'utf-8',
    )
    expect(content).toMatch(/const startHour\s*=\s*8/)
    expect(content).toMatch(/const endHour\s*=\s*23/)
  })

  it('courts store — for döngüsü 8\'den 22\'ye (dahil)', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const content = fs.readFileSync(
      path.resolve(__dirname, '../../src/store/modules/courts.ts'),
      'utf-8',
    )
    expect(content).toMatch(/for\s*\(let hour\s*=\s*8;\s*hour\s*<=\s*22;/)
  })
})
