import { describe, it, expect } from 'vitest'

// GroupManagement.vue'deki reconcileMembersWithGroups mantığının saf versiyonu:
// her grup üyesi için users/{id} dokümanındaki membershipType ve groupAssignment
// değerleri grupla eşleşmiyorsa onarım adayı olarak işaretlenir.

interface StudentDoc {
  id: string
  firstName: string
  lastName: string
  membershipType?: string
  groupAssignment?: string
}

interface GroupMember {
  id: string
  name: string
}

interface GroupScheduleSlot {
  day: string
  time: string
  court: string
}

interface Group {
  id: string
  membershipType: string
  members: GroupMember[]
  schedule?: GroupScheduleSlot[]
}

interface ReconcileFix {
  studentId: string
  newMembershipType: string
  newGroupAssignment: string
}

function planReconciliation(groups: Group[], students: StudentDoc[]): ReconcileFix[] {
  const studentById = new Map(students.map(s => [s.id, s]))
  const fixes: ReconcileFix[] = []

  for (const group of groups) {
    if (!group.id || !group.membershipType || !group.members) continue

    for (const member of group.members) {
      const student = studentById.get(member.id)
      if (!student) continue

      const mismatch =
        student.membershipType !== group.membershipType ||
        student.groupAssignment !== group.id

      if (mismatch) {
        fixes.push({
          studentId: member.id,
          newMembershipType: group.membershipType,
          newGroupAssignment: group.id,
        })
      }
    }
  }

  return fixes
}

// Rezervasyon kontrolü mantığı: grup schedule'ı varsa ve üyenin bu grup için
// aktif (gelecek) rezervasyonu yoksa ekleme adayı olarak işaretlenir.
interface ReservationDoc {
  groupId: string
  studentId: string
  date: Date
}

function planReservationCreation(
  groups: Group[],
  students: StudentDoc[],
  existingReservations: ReservationDoc[],
  now: Date
): Array<{ groupId: string; memberId: string }> {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const toCreate: Array<{ groupId: string; memberId: string }> = []
  const studentById = new Map(students.map(s => [s.id, s]))

  for (const group of groups) {
    // Schedule'ı olmayan grup rezervasyon üretmez
    if (!(group as any).schedule || (group as any).schedule.length === 0) continue

    for (const member of group.members) {
      if (!studentById.has(member.id)) continue

      const hasFuture = existingReservations.some(r =>
        r.groupId === group.id &&
        r.studentId === member.id &&
        r.date.getTime() >= today.getTime()
      )

      if (!hasFuture) {
        toCreate.push({ groupId: group.id, memberId: member.id })
      }
    }
  }

  return toCreate
}

describe('Grup üye - kullanıcı dokümanı uyumsuzluğu onarımı', () => {
  it('membershipType "basic" olan grup üyesi için düzeltme önerir', () => {
    const groups: Group[] = [
      {
        id: 'group-adult',
        membershipType: 'adult_group',
        members: [{ id: 'berke', name: 'Berke Katıksız' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'berke', firstName: 'Berke', lastName: 'Katıksız', membershipType: 'basic', groupAssignment: '' },
    ]

    const fixes = planReconciliation(groups, students)
    expect(fixes).toHaveLength(1)
    expect(fixes[0]).toEqual({
      studentId: 'berke',
      newMembershipType: 'adult_group',
      newGroupAssignment: 'group-adult',
    })
  })

  it('membershipType ve groupAssignment zaten doğru olan üyeyi değiştirmez', () => {
    const groups: Group[] = [
      {
        id: 'group-adult',
        membershipType: 'adult_group',
        members: [{ id: 'ayse', name: 'Ayşe' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'ayse', firstName: 'Ayşe', lastName: '', membershipType: 'adult_group', groupAssignment: 'group-adult' },
    ]

    expect(planReconciliation(groups, students)).toHaveLength(0)
  })

  it('yanlış gruba atanmış üyeyi düzeltir', () => {
    const groups: Group[] = [
      {
        id: 'group-new',
        membershipType: 'adult_group',
        members: [{ id: 'can', name: 'Can' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'can', firstName: 'Can', lastName: '', membershipType: 'adult_group', groupAssignment: 'group-eski' },
    ]

    const fixes = planReconciliation(groups, students)
    expect(fixes).toHaveLength(1)
    expect(fixes[0].newGroupAssignment).toBe('group-new')
  })

  it('silinmiş/var olmayan öğrenci için fix üretmez', () => {
    const groups: Group[] = [
      {
        id: 'group-x',
        membershipType: 'adult_group',
        members: [{ id: 'hayalet', name: 'Hayalet Üye' }],
      },
    ]
    const students: StudentDoc[] = []

    expect(planReconciliation(groups, students)).toHaveLength(0)
  })

  it('birden çok gruptaki birden çok üyeyi tek geçişte düzeltir', () => {
    const groups: Group[] = [
      {
        id: 'g1',
        membershipType: 'adult_group',
        members: [
          { id: 's1', name: 'S1' },
          { id: 's2', name: 'S2' },
        ],
      },
      {
        id: 'g2',
        membershipType: 'tennis_school_age',
        members: [{ id: 's3', name: 'S3' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 's1', firstName: '', lastName: '', membershipType: 'basic' },
      { id: 's2', firstName: '', lastName: '', membershipType: 'adult_group', groupAssignment: 'g1' }, // doğru
      { id: 's3', firstName: '', lastName: '', membershipType: 'tennis_school_age', groupAssignment: 'g1' }, // yanlış grup
    ]

    const fixes = planReconciliation(groups, students)
    const ids = fixes.map(f => f.studentId).sort()
    expect(ids).toEqual(['s1', 's3'])
  })
})

describe('Eksik gelecek rezervasyonlar için onarım planı', () => {
  const now = new Date('2026-04-22T10:00:00')

  it('schedule ı olan grup üyesinin hiç rezervasyonu yoksa ekleme adayı işaretler', () => {
    const groups: Group[] = [
      {
        id: 'g-adult',
        membershipType: 'adult_group',
        members: [{ id: 'berke', name: 'Berke' }],
        schedule: [{ day: 'Pazartesi', time: '18:00', court: 'K1' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'berke', firstName: 'Berke', lastName: 'Katıksız', membershipType: 'adult_group', groupAssignment: 'g-adult' },
    ]

    const plan = planReservationCreation(groups, students, [], now)
    expect(plan).toEqual([{ groupId: 'g-adult', memberId: 'berke' }])
  })

  it('gelecek rezervasyonu zaten olan üyeyi tekrar oluşturmaz', () => {
    const groups: Group[] = [
      {
        id: 'g-adult',
        membershipType: 'adult_group',
        members: [{ id: 'berke', name: 'Berke' }],
        schedule: [{ day: 'Pazartesi', time: '18:00', court: 'K1' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'berke', firstName: 'Berke', lastName: 'Katıksız', membershipType: 'adult_group', groupAssignment: 'g-adult' },
    ]
    const reservations: ReservationDoc[] = [
      { groupId: 'g-adult', studentId: 'berke', date: new Date('2026-04-27T18:00:00') },
    ]

    expect(planReservationCreation(groups, students, reservations, now)).toEqual([])
  })

  it('sadece geçmiş tarihli rezervasyonu olan üye için yine de ekleme planlar', () => {
    const groups: Group[] = [
      {
        id: 'g-adult',
        membershipType: 'adult_group',
        members: [{ id: 'berke', name: 'Berke' }],
        schedule: [{ day: 'Pazartesi', time: '18:00', court: 'K1' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'berke', firstName: 'Berke', lastName: 'Katıksız', membershipType: 'adult_group', groupAssignment: 'g-adult' },
    ]
    const reservations: ReservationDoc[] = [
      { groupId: 'g-adult', studentId: 'berke', date: new Date('2026-03-15T18:00:00') },
    ]

    expect(planReservationCreation(groups, students, reservations, now)).toEqual([
      { groupId: 'g-adult', memberId: 'berke' },
    ])
  })

  it('schedule boş olan grup için rezervasyon planlamaz', () => {
    const groups: Group[] = [
      {
        id: 'g-adult',
        membershipType: 'adult_group',
        members: [{ id: 'berke', name: 'Berke' }],
        schedule: [],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'berke', firstName: 'Berke', lastName: 'Katıksız', membershipType: 'adult_group', groupAssignment: 'g-adult' },
    ]

    expect(planReservationCreation(groups, students, [], now)).toEqual([])
  })

  it('başka grubun rezervasyonu olan üyeyi bu grup için atlar değil, yine planlar', () => {
    const groups: Group[] = [
      {
        id: 'g-new',
        membershipType: 'adult_group',
        members: [{ id: 'ali', name: 'Ali' }],
        schedule: [{ day: 'Salı', time: '19:00', court: 'K2' }],
      },
    ]
    const students: StudentDoc[] = [
      { id: 'ali', firstName: 'Ali', lastName: '', membershipType: 'adult_group', groupAssignment: 'g-new' },
    ]
    const reservations: ReservationDoc[] = [
      // Eski grubun rezervasyonu — yeni grup için geçerli değil
      { groupId: 'g-old', studentId: 'ali', date: new Date('2026-05-01T18:00:00') },
    ]

    expect(planReservationCreation(groups, students, reservations, now)).toEqual([
      { groupId: 'g-new', memberId: 'ali' },
    ])
  })
})
