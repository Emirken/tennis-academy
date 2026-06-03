import { describe, it, expect } from 'vitest'

// GroupManagement.vue içindeki formatCourtLabel ile birebir aynı mantığı doğruluyoruz.
const courtOptions = [
  { title: 'Kort 1', value: 'K1' },
  { title: 'Kort 2', value: 'K2' },
  { title: 'Kort 3', value: 'K3' },
]

const formatCourtLabel = (court: string): string => {
  if (!court) return ''
  const opt = courtOptions.find(c => c.value === court)
  if (opt) return opt.title
  const m = /^court-(\d+)$/.exec(court)
  if (m) return `Kort ${m[1]}`
  return court
}

describe('formatCourtLabel — grup chip kort etiketi', () => {
  it('K1/K2/K3 değerlerini Kort 1/2/3 olarak gösterir', () => {
    expect(formatCourtLabel('K1')).toBe('Kort 1')
    expect(formatCourtLabel('K2')).toBe('Kort 2')
    expect(formatCourtLabel('K3')).toBe('Kort 3')
  })

  it('eski court-1 formatını da Kort 1 olarak gösterir', () => {
    expect(formatCourtLabel('court-1')).toBe('Kort 1')
    expect(formatCourtLabel('court-3')).toBe('Kort 3')
  })

  it('boş veya tanınmayan değer için sorunsuz fallback yapar', () => {
    expect(formatCourtLabel('')).toBe('')
    expect(formatCourtLabel('K9')).toBe('K9')
  })
})
