import { describe, it, expect } from 'vitest'
import {
  buildOccupiedSlots,
  getScheduleConflicts,
  normalizeCourtToK,
  normalizeCourtToCourt,
  getSelectableTimeOptions,
  getSelectableCourtOptions,
  type GroupLike,
  type StudentLike,
} from '@/services/courtAvailability'

// Bug raporu: "4-5 Yaş Grup" düzenlenirken kendi satırı için
// "Seçilen programda çakışma var: monday 18:00" hatası alınıyordu ve Kort
// select'i ham "K2" değerini gösteriyordu.

const ALL_COURTS_K = [
  { title: 'Kort 1', value: 'K1' },
  { title: 'Kort 2', value: 'K2' },
  { title: 'Kort 3', value: 'K3' },
]
const ALL_TIMES = ['17:00', '18:00', '19:00', '20:00']

describe('normalizeCourtToK — kort yazımlarının tek kimliğe indirgenmesi', () => {
  it('court-N / KN / "Kort N" / kort_N / N aynı korta çözülür', () => {
    expect(normalizeCourtToK('court-2')).toBe('K2')
    expect(normalizeCourtToK('K2')).toBe('K2')
    expect(normalizeCourtToK('k2')).toBe('K2')
    expect(normalizeCourtToK('Kort 2')).toBe('K2')
    expect(normalizeCourtToK('kort_2')).toBe('K2')
    expect(normalizeCourtToK('2')).toBe('K2')
  })

  it('serbest metin kort adı bozulmadan korunur', () => {
    expect(normalizeCourtToK('Merkez Kort')).toBe('Merkez Kort')
    expect(normalizeCourtToK('')).toBe('')
  })

  it('normalizeCourtToCourt tüm yazımlardan court-N üretir', () => {
    expect(normalizeCourtToCourt('Kort 2')).toBe('court-2')
    expect(normalizeCourtToCourt('K2')).toBe('court-2')
    expect(normalizeCourtToCourt('court-2')).toBe('court-2')
  })

  it('ekran görüntüsündeki karışık yazım tek slot sayılır ("Kort 2" == "K2")', () => {
    const groups: GroupLike[] = [
      {
        id: 'g-other',
        name: 'Başka Grup',
        schedule: [{ day: 'Çarşamba', time: '19:00', court: 'Kort 2' }],
        members: [],
      },
    ]
    const occupied = buildOccupiedSlots({ groups })
    // 'K2' ile sorgulanınca da bulunmalı — aksi halde iki ayrı kort gibi davranır
    const conflicts = getScheduleConflicts(occupied, [
      { day: 'Çarşamba', time: '19:00', court: 'K2' },
    ])
    expect(conflicts).toHaveLength(1)
  })
})

describe('buildOccupiedSlots — düzenlenen grup kendi slotunu dolu görmez', () => {
  // Grubun programı üyelerin users/{id}.groupSchedule.weeklyPlan alanına
  // kopyalanıyor. Üyenin groupAssignment alanı EKSİK olduğunda eski kod bu
  // kopyayı "Öğrenci dolu" diye geri enjekte ediyordu.
  const groups: GroupLike[] = [
    {
      id: 'g1',
      name: '4-5 Yaş Grup',
      schedule: [
        { day: 'Pazartesi', time: '18:00', court: 'K2' },
        { day: 'Çarşamba', time: '19:00', court: 'Kort 2' },
      ],
      members: [{ id: 's1' }, { id: 's2' }],
    },
  ]
  const students: StudentLike[] = [
    {
      id: 's1',
      firstName: 'Ali',
      lastName: 'Veli',
      groupAssignment: 'g1',
      groupSchedule: { weeklyPlan: [{ day: 'monday', time: '18:00', court: 'court-2' }] },
    },
    {
      // KRİTİK: groupAssignment eksik ama groups.members içinde → aynı kural
      id: 's2',
      firstName: 'Ayşe',
      lastName: 'Demir',
      groupAssignment: null,
      groupSchedule: { weeklyPlan: [{ day: 'monday', time: '18:00', court: 'court-2' }] },
    },
  ]

  it('grup düzenlenirken kendi programı çakışma üretmez (bug regresyonu)', () => {
    const occupied = buildOccupiedSlots({ groups, students, excludeGroupId: 'g1' })
    const conflicts = getScheduleConflicts(occupied, [
      { day: 'Pazartesi', time: '18:00', court: 'K2' },
      { day: 'Çarşamba', time: '19:00', court: 'Kort 2' },
    ])
    expect(conflicts).toEqual([])
    expect(occupied).toEqual([])
  })

  it('grup hariç tutulmazsa slot gerçekten dolu görünür (test anlamlı)', () => {
    const occupied = buildOccupiedSlots({ groups, students })
    const conflicts = getScheduleConflicts(occupied, [
      { day: 'Pazartesi', time: '18:00', court: 'K2' },
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].slot.groupName).toBe('4-5 Yaş Grup')
  })

  it('başka grubun slotu hâlâ çakışma sayılır', () => {
    const withOther: GroupLike[] = [
      ...groups,
      {
        id: 'g2',
        name: 'Akşam Grubu',
        schedule: [{ day: 'Pazartesi', time: '20:00', court: 'K1' }],
        members: [{ id: 's3' }],
      },
    ]
    const occupied = buildOccupiedSlots({ groups: withOther, students, excludeGroupId: 'g1' })
    const conflicts = getScheduleConflicts(occupied, [
      { day: 'Pazartesi', time: '20:00', court: 'K1' },
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].slot.groupName).toBe('Akşam Grubu')
  })

  it('gruba üye OLMAYAN bireysel öğrencinin planı dolu sayılır', () => {
    const loner: StudentLike[] = [
      {
        id: 's9',
        firstName: 'Burak',
        lastName: 'Kuduğ',
        groupSchedule: { weeklyPlan: [{ day: 'monday', time: '17:00', court: 'court-3' }] },
      },
    ]
    const occupied = buildOccupiedSlots({ groups, students: loner, excludeGroupId: 'g1' })
    const conflicts = getScheduleConflicts(occupied, [
      { day: 'Pazartesi', time: '17:00', court: 'K3' },
    ])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].slot.studentName).toBe('Burak Kuduğ')
  })

  it('silinmiş öğrenci atlanır', () => {
    const deleted: StudentLike[] = [
      {
        id: 's9',
        firstName: 'Silinmiş',
        lastName: 'Kayıt',
        deleted: true,
        groupSchedule: { weeklyPlan: [{ day: 'monday', time: '17:00', court: 'court-3' }] },
      },
    ]
    expect(buildOccupiedSlots({ students: deleted })).toEqual([])
  })
})

describe('buildOccupiedSlots — öğrenci düzenlenirken kendi grubu hariç tutulur', () => {
  // Öğrenci Düzenle formu grup üyesinin planını GRUPTAN yüklüyor; aynı grubun
  // schedule'ı dolu sayılırsa kayıt her seferinde çakışıyordu.
  const groups: GroupLike[] = [
    {
      id: 'g1',
      name: '4-5 Yaş Grup',
      schedule: [{ day: 'Pazartesi', time: '18:00', court: 'K2' }],
      members: [{ id: 's1' }],
    },
    {
      id: 'g2',
      name: 'Akşam Grubu',
      schedule: [{ day: 'Salı', time: '18:00', court: 'K2' }],
      members: [{ id: 's5' }],
    },
  ]

  it('kendi grubunun slotu çakışma değil, başka grubunki çakışma', () => {
    const occupied = buildOccupiedSlots({ groups, excludeStudentId: 's1' })
    expect(
      getScheduleConflicts(occupied, [{ day: 'monday', time: '18:00', court: 'court-2' }])
    ).toEqual([])
    expect(
      getScheduleConflicts(occupied, [{ day: 'tuesday', time: '18:00', court: 'court-2' }])
    ).toHaveLength(1)
  })
})

describe('Gün-öncelikli kaskad — gün seçilince saat ve kort boşluğa düşer', () => {
  const occupied = buildOccupiedSlots({
    groups: [
      {
        id: 'g2',
        name: 'Akşam Grubu',
        // Pazartesi 18:00 üç kortta da dolu → o saat hiç seçilemez
        schedule: [
          { day: 'Pazartesi', time: '18:00', court: 'K1' },
          { day: 'Pazartesi', time: '18:00', court: 'K2' },
          { day: 'Pazartesi', time: '18:00', court: 'K3' },
          // Kort 1 gün boyu dolu
          { day: 'Salı', time: '17:00', court: 'K1' },
          { day: 'Salı', time: '18:00', court: 'K1' },
          { day: 'Salı', time: '19:00', court: 'K1' },
          { day: 'Salı', time: '20:00', court: 'K1' },
        ],
        members: [],
      },
    ],
  })

  it('kort seçilmemişken: tüm kortlarda dolu olan saat listeden düşer', () => {
    const times = getSelectableTimeOptions(occupied, 'Pazartesi', '', ALL_TIMES, {
      allCourts: ALL_COURTS_K.map(c => c.value),
    })
    expect(times.map(t => t.value)).toEqual(['17:00', '19:00', '20:00'])
  })

  it('kort seçilmemişken ve allCourts verilmemişken tüm saatler kalır (geri uyum)', () => {
    const times = getSelectableTimeOptions(occupied, 'Pazartesi', '', ALL_TIMES)
    expect(times.map(t => t.value)).toEqual(ALL_TIMES)
  })

  it('saat seçilmemişken: gün boyu dolu kort listeden düşer', () => {
    const courts = getSelectableCourtOptions(occupied, 'Salı', '', ALL_COURTS_K, 'K', {
      allTimes: ALL_TIMES,
    })
    expect(courts.map(c => c.value)).toEqual(['K2', 'K3'])
  })

  it('gün + kort seçiliyken dolu saatler düşer (mevcut davranış korunur)', () => {
    const times = getSelectableTimeOptions(occupied, 'Salı', 'K1', ALL_TIMES, {
      allCourts: ALL_COURTS_K.map(c => c.value),
    })
    expect(times).toEqual([])
  })
})

describe('Satırın kendi değeri listeden asla düşmez', () => {
  const occupied = buildOccupiedSlots({
    groups: [
      {
        id: 'g2',
        name: 'Akşam Grubu',
        schedule: [{ day: 'Pazartesi', time: '18:00', court: 'K2' }],
        members: [],
      },
    ],
  })

  it('dolu görünen saat, satırın mevcut seçimi ise seçilebilir kalır', () => {
    const times = getSelectableTimeOptions(occupied, 'Pazartesi', 'K2', ALL_TIMES, {
      currentTime: '18:00',
    })
    expect(times.map(t => t.value)).toContain('18:00')
  })

  it('dolu görünen kort, satırın mevcut seçimi ise seçilebilir kalır', () => {
    const courts = getSelectableCourtOptions(occupied, 'Pazartesi', '18:00', ALL_COURTS_K, 'K', {
      currentCourt: 'K2',
    })
    expect(courts.map(c => c.value)).toContain('K2')
  })

  it('mevcut değer farklı yazımdaysa da eşleşir ("Kort 2" seçimi K2 seçeneğini korur)', () => {
    const courts = getSelectableCourtOptions(occupied, 'Pazartesi', '18:00', ALL_COURTS_K, 'K', {
      currentCourt: 'Kort 2',
    })
    expect(courts.map(c => c.value)).toContain('K2')
  })

  it('mevcut seçim yokken dolu kort yine düşer', () => {
    const courts = getSelectableCourtOptions(occupied, 'Pazartesi', '18:00', ALL_COURTS_K, 'K')
    expect(courts.map(c => c.value)).toEqual(['K1', 'K3'])
  })
})
