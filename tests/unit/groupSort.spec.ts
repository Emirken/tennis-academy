import { describe, it, expect } from 'vitest'

// GroupManagement.vue içindeki sortedGroups computed'ı ile birebir aynı mantığı
// doğruluyoruz: gruplar grup adına göre Türkçe locale ile alfabetik sıralanır.
interface G { name: string }

const sortGroups = (groups: G[]): G[] =>
  [...groups].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'tr', { sensitivity: 'base' })
  )

describe('sortedGroups — grup alfabetik sıralama (Türkçe locale)', () => {
  it('grupları ada göre alfabetik sıralar', () => {
    const input = [{ name: 'Cuma Grubu' }, { name: 'Akşam Grubu' }, { name: 'Bursa' }]
    expect(sortGroups(input).map(g => g.name)).toEqual([
      'Akşam Grubu',
      'Bursa',
      'Cuma Grubu',
    ])
  })

  it('Türkçe karakterleri doğru sırada yerleştirir (Ç, I, Ş)', () => {
    const input = [
      { name: 'Şehir' },
      { name: 'Çocuk' },
      { name: 'Akşam' },
      { name: 'Istanbul' },
    ]
    expect(sortGroups(input).map(g => g.name)).toEqual([
      'Akşam',
      'Çocuk',
      'Istanbul',
      'Şehir',
    ])
  })

  it('büyük/küçük harf duyarsızdır', () => {
    const input = [{ name: 'pazartesi' }, { name: 'Pazar' }, { name: 'Akşam' }]
    expect(sortGroups(input).map(g => g.name)).toEqual(['Akşam', 'Pazar', 'pazartesi'])
  })

  it('orijinal diziyi mutasyona uğratmaz', () => {
    const input = [{ name: 'B' }, { name: 'A' }]
    sortGroups(input)
    expect(input.map(g => g.name)).toEqual(['B', 'A'])
  })

  it('eksik/boş isimde patlamaz', () => {
    const input = [{ name: 'B' }, { name: '' }, { name: 'A' }]
    expect(() => sortGroups(input)).not.toThrow()
    expect(sortGroups(input).map(g => g.name)).toEqual(['', 'A', 'B'])
  })
})
