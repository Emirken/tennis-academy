import { describe, it, expect } from 'vitest'

// AdminCalendar.vue içindeki grup ders başlık üretiminin saf kopyası.
const buildGroupLessonTitle = (
  actualGroupName: string,
  membershipLabel: string,
): string => {
  if (actualGroupName) return actualGroupName
  if (membershipLabel) return membershipLabel
  return 'Grup Dersi'
}

describe('AdminCalendar grup dersi başlığı', () => {
  it('grup adı varsa sadece grup adını döner (membership label dahil edilmez)', () => {
    expect(buildGroupLessonTitle('Yetişkin Grup B', 'Yetişkin Grup')).toBe('Yetişkin Grup B')
  })

  it('grup adı yoksa membership label fallback kullanılır', () => {
    expect(buildGroupLessonTitle('', 'Yetişkin Grup')).toBe('Yetişkin Grup')
  })

  it('hiçbiri yoksa generic Grup Dersi döner', () => {
    expect(buildGroupLessonTitle('', '')).toBe('Grup Dersi')
  })
})
