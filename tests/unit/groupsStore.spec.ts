import { describe, it, expect } from 'vitest'
import {
  buildExistingGroupIds,
  getGroupName,
  findGroup,
} from '../../src/utils/groupCache'
import type { Group } from '../../src/types/group'

// Paylaşılan groups önbelleğinin saf yardımcıları. Bunlar Courts.vue,
// Reservations.vue ve AdminCalendar.vue'daki N+1 getDoc döngülerinin yerini
// alan store'u besler. Etiket fallback'ları (Courts `|| ''`, AdminCalendar
// `|| id`) ÇAĞIRANDA kalmalı; bu yüzden getGroupName ham isim döndürür.

const makeGroup = (id: string, name: string): Group => ({
  id,
  name,
  membershipType: 'adult_group',
  maxCapacity: 8,
  schedule: [],
  members: [{ id: 'm1', name: 'Üye Bir', email: 'm1@x.com' }],
})

const GROUPS: Group[] = [
  makeGroup('GRP_A', 'Sabah Grubu'),
  makeGroup('GRP_B', 'Akşam Grubu'),
  { id: 'GRP_EMPTY', name: '', membershipType: 'adult_group', maxCapacity: 8, schedule: [], members: [] },
]

describe('groups store — saf yardımcılar', () => {
  describe('buildExistingGroupIds', () => {
    it('tüm grup id\'lerini içeren Set döndürür', () => {
      const ids = buildExistingGroupIds(GROUPS)
      expect(ids.has('GRP_A')).toBe(true)
      expect(ids.has('GRP_B')).toBe(true)
      expect(ids.has('GRP_EMPTY')).toBe(true)
      expect(ids.size).toBe(3)
    })

    it('id\'siz grupları atlar', () => {
      const ids = buildExistingGroupIds([
        makeGroup('GRP_A', 'A'),
        { name: 'idsiz', membershipType: 'adult_group', maxCapacity: 8, schedule: [], members: [] },
      ])
      expect(ids.size).toBe(1)
      expect(ids.has('GRP_A')).toBe(true)
    })

    it('boş liste için boş Set döndürür', () => {
      expect(buildExistingGroupIds([]).size).toBe(0)
    })
  })

  describe('getGroupName — ham isim, fallback YOK', () => {
    it('var olan grubun adını döndürür', () => {
      expect(getGroupName(GROUPS, 'GRP_A')).toBe('Sabah Grubu')
    })

    it('bulunamayan id için boş string döndürür (id\'yi DÖNDÜRMEZ)', () => {
      // Çağıran kendi fallback'ını uygular (Courts '' / AdminCalendar id).
      expect(getGroupName(GROUPS, 'YOK')).toBe('')
    })

    it('adı boş olan grup için boş string döndürür', () => {
      expect(getGroupName(GROUPS, 'GRP_EMPTY')).toBe('')
    })
  })

  describe('findGroup — tam doküman', () => {
    it('var olan grubun tam dokümanını (members dahil) döndürür', () => {
      const g = findGroup(GROUPS, 'GRP_A')
      expect(g).toBeDefined()
      expect(g?.name).toBe('Sabah Grubu')
      expect(g?.members.length).toBe(1)
      expect(g?.members[0].name).toBe('Üye Bir')
    })

    it('bulunamayan id için undefined döndürür', () => {
      expect(findGroup(GROUPS, 'YOK')).toBeUndefined()
    })
  })
})
