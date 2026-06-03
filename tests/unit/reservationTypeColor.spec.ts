import { describe, it, expect } from 'vitest'
import {
  classifyReservationKind,
  getReservationTypeColor,
  RESERVATION_TYPE_COLORS,
} from '@/utils/reservationTypeColor'

describe('reservationTypeColor — tür bazlı takvim renkleri', () => {
  it('grup dersi turuncu döner', () => {
    expect(getReservationTypeColor({ reservationType: 'group-lesson' })).toBe('#E65100')
    expect(getReservationTypeColor({ groupId: 'g1' })).toBe('#E65100')
    expect(getReservationTypeColor({ groupAssignment: 'g2' })).toBe('#E65100')
    expect(getReservationTypeColor({ groupSchedule: true })).toBe('#E65100')
    expect(getReservationTypeColor({ membershipType: 'adult_group_3' })).toBe('#E65100')
  })

  it('özel ders yeşil döner', () => {
    expect(getReservationTypeColor({ reservationType: 'private-lesson' })).toBe('#388E3C')
    expect(getReservationTypeColor({ type: 'lesson' })).toBe('#388E3C')
  })

  it('kort kiralama / rezervasyon mor döner', () => {
    expect(getReservationTypeColor({ reservationType: 'court-rental' })).toBe('#7B1FA2')
    expect(getReservationTypeColor({ type: 'court_rental' })).toBe('#7B1FA2')
    expect(getReservationTypeColor({})).toBe('#7B1FA2')
  })

  it('classifyReservationKind doğru türü döndürür', () => {
    expect(classifyReservationKind({ groupId: 'g1' })).toBe('group-lesson')
    expect(classifyReservationKind({ reservationType: 'private-lesson' })).toBe('private-lesson')
    expect(classifyReservationKind({ reservationType: 'court-rental' })).toBe('reservation')
  })

  it('grup işareti özel ders işaretini ezer (grup önceliklidir)', () => {
    // Hem ders hem grup → grup dersi (turuncu)
    expect(classifyReservationKind({ type: 'lesson', groupId: 'g1' })).toBe('group-lesson')
  })

  it('palet üç türü de içerir', () => {
    expect(RESERVATION_TYPE_COLORS['group-lesson']).toBe('#E65100')
    expect(RESERVATION_TYPE_COLORS['private-lesson']).toBe('#388E3C')
    expect(RESERVATION_TYPE_COLORS.reservation).toBe('#7B1FA2')
  })

  // Kullanıcı hata raporu: "Özel Ders Paket 1 Kişi (8 ders)" (private_package_1_8)
  // takvimde turuncu (grup) görünüyordu. Kök neden: groupScheduleSync HAFTALIK
  // programdan üreten TÜM dersleri (özel paketler dahil) group-lesson + groupId +
  // groupSchedule ile damgalar. membershipType resolver'ı grup DEĞİL dediğinde bu
  // damgalar EZİLMELİ ve özel ders (yeşil) dönmeli.
  describe('private_package grup damgasına rağmen özel kalır (kullanıcı bug raporu)', () => {
    // membershipTypes store'undaki isGroupType taklidi: yalnızca _group_ içerenler grup.
    const isGroup = (k: string) => k.includes('_group_')

    const stampedPrivatePackage = {
      membershipType: 'private_package_1_8',
      reservationType: 'group-lesson',
      groupId: 'g123',
      groupAssignment: 'g123',
      groupSchedule: true,
    }

    it('resolver ile özel ders (yeşil) döner', () => {
      expect(classifyReservationKind(stampedPrivatePackage, isGroup)).toBe('private-lesson')
      expect(getReservationTypeColor(stampedPrivatePackage, isGroup)).toBe('#388E3C')
    })

    it('resolver olmadan statik fallback ile de özel ders döner', () => {
      // private_package_1_8 statik heuristikte de grup DEĞİL → yeşil.
      expect(classifyReservationKind(stampedPrivatePackage)).toBe('private-lesson')
    })

    it('gerçek grup paketi grup damgasıyla turuncu kalır', () => {
      const groupPackage = {
        membershipType: 'private_group_3_8',
        reservationType: 'group-lesson',
        groupId: 'g999',
      }
      expect(classifyReservationKind(groupPackage, isGroup)).toBe('group-lesson')
      expect(getReservationTypeColor(groupPackage, isGroup)).toBe('#E65100')
    })

    it('store anahtarı tanımayıp false dönse bile gerçek grup statik fallback ile korunur', () => {
      // Resolver her şeye false dese de (boş/eksik tablo), _group_ anahtarı grup kalır.
      const alwaysFalse = () => false
      expect(classifyReservationKind({ membershipType: 'private_group_5_8' }, alwaysFalse)).toBe(
        'group-lesson',
      )
    })
  })
})
