import { describe, it, expect } from 'vitest'
import { docWithId, docsWithId } from '@/utils/docWithId'

// Bug raporu (11 Eylül 2026): "4-5 Yaş Grup" için "başarıyla silindi" bildirimi
// çıkıyor ama grup listede kalıyordu. Neden: groups/6lJKrupcPRe2cw4Dzqgh
// dokümanı ALAN olarak eski bir `id` (yZbPbDwwuZYkorVsRAv6) taşıyor ve
// `{ id: snap.id, ...snap.data() }` yazımında spread gerçek doküman id'sini
// eziyordu. deleteDoc var olmayan dokümanda hata vermediği için (idempotent)
// işlem "başarılı" görünüyordu.

const snap = (id: string, data: Record<string, any>) => ({ id, data: () => data })

describe('docWithId — doküman id alanı EZEMEZ', () => {
  it('alanlar arasındaki eski id yok sayılır, gerçek doküman id kazanır', () => {
    const g = docWithId(snap('6lJKrupcPRe2cw4Dzqgh', {
      id: 'yZbPbDwwuZYkorVsRAv6',
      name: '4-5 Yaş Grup',
    }))
    expect(g.id).toBe('6lJKrupcPRe2cw4Dzqgh')
    expect(g.name).toBe('4-5 Yaş Grup')
  })

  it('regresyonun kendisi: ters sıralama yanlış id üretir (test anlamlı)', () => {
    const s = snap('6lJKrupcPRe2cw4Dzqgh', { id: 'yZbPbDwwuZYkorVsRAv6' })
    const wrong = { id: s.id, ...s.data() } as any
    expect(wrong.id).toBe('yZbPbDwwuZYkorVsRAv6') // eski hatalı davranış
    expect(docWithId(s).id).not.toBe(wrong.id)
  })

  it('id alanı yoksa davranış değişmez', () => {
    const g = docWithId(snap('abc', { name: 'Yetişkin Grup F', maxCapacity: 8 }))
    expect(g).toEqual({ name: 'Yetişkin Grup F', maxCapacity: 8, id: 'abc' })
  })

  it('data() undefined dönerse yalnız id kalır', () => {
    const g = docWithId({ id: 'abc', data: () => undefined } as any)
    expect(g).toEqual({ id: 'abc' })
  })

  it('diğer alanlar korunur (referans kopyası, kaynak mutasyona uğramaz)', () => {
    const data = { id: 'eski', schedule: [{ day: 'Pazartesi' }] }
    const g = docWithId(snap('yeni', data))
    expect(g.schedule).toBe(data.schedule)
    expect(data.id).toBe('eski')
  })

  it('docsWithId listeyi aynı kuralla çevirir', () => {
    const out = docsWithId([
      snap('d1', { id: 'stale-1', name: 'A' }),
      snap('d2', { name: 'B' }),
    ])
    expect(out.map(o => o.id)).toEqual(['d1', 'd2'])
    expect(out.map((o: any) => o.name)).toEqual(['A', 'B'])
  })
})
