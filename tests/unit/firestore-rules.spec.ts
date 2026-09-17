import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
    // We load the existing firestore.rules
    testEnv = await initializeTestEnvironment({
        projectId: 'tennis-academy-test',
        firestore: {
            rules: readFileSync('firestore.rules', 'utf8')
        }
    })
})

beforeEach(async () => {
    await testEnv.clearFirestore()
})

afterAll(async () => {
    await testEnv.cleanup()
})

describe('Firestore Rules - Reservation Unique Control', () => {
    it('Test 5 - Veritabanı Unique Kontrolü: Aynı saat, tarih, kort (Document ID ile) 2. kez yazılamaz', async () => {
        // Create an authenticated user context
        const authDb = testEnv.authenticatedContext('student_1').firestore()

        // Define a unique composite ID manually (courtId_date_startTime)
        // This simulates how frontend should construct IDs for unique constraint.
        const compositeId = 'court_001_2026-03-20_18:00'

        const reservationRef = authDb.collection('reservations').doc(compositeId)

        // Setup initial existing document directly as if it was written by system
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().collection('reservations').doc(compositeId).set({
                studentId: 'student_999',
                courtId: 'court_001',
                startTime: '18:00',
                date: '2026-03-20'
            })
        })

        // Now try to write the same document ID as an authenticated user
        // By rules logic, or since we are relying on ID uniqueness,
        // a create operation (if we use 'create' instead of 'set') fails.
        // We simulate a collision by trying to create.

        // Wait, standard matching rules allow write if owner. Let's see if we can overwrite it:
        // By rules, `write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid)`
        // Overwrite by another user should fail

        await assertFails(reservationRef.set({
            studentId: 'student_1', // Trying to claim it
            courtId: 'court_001',
            startTime: '18:00',
            date: '2026-03-20'
        }))
    })
})

// Günde-bir kort rezervasyonu: reservationDayLocks kilidi + sıkılaştırılmış
// reservations kuralları (canlı olay: aynı öğrenci aynı güne iki rezervasyon).
describe('Firestore Rules - Günde-bir kort rezervasyonu kilidi', () => {
    const STUDENT = 'student_1'
    const OTHER = 'student_2'
    const ADMIN = 'admin_1'
    const DAY = '2026-09-21'
    const NEXT_DAY = '2026-09-22'

    // Formun yazdığı değer: dateKey gününün UTC gece yarısı.
    const utcMidnight = (key: string) => new Date(`${key}T00:00:00.000Z`)

    const rental = (uid: string, key: string, overrides: Record<string, unknown> = {}) => ({
        studentId: uid,
        courtId: 'court-1',
        courtName: 'Kort 1',
        date: utcMidnight(key),
        dateKey: key,
        startTime: '10:00',
        endTime: '11:00',
        duration: 1,
        type: 'court-rental',
        status: 'pending',
        totalCost: 1000,
        createdAt: new Date(),
        ...overrides
    })

    const lock = (uid: string, key: string, reservationId: string) => ({
        studentId: uid,
        dateKey: key,
        reservationId,
        updatedAt: new Date()
    })

    const dbAs = (uid: string) => testEnv.authenticatedContext(uid).firestore()

    // ReservationForm → commitStudentCourtRental ile aynı batch biçimi.
    const book = (
        uid: string,
        key: string,
        reservationId: string,
        opts: { data?: Record<string, unknown>; lockData?: Record<string, unknown>; lockId?: string; withLock?: boolean } = {}
    ) => {
        const db = dbAs(uid)
        const batch = db.batch()
        batch.set(db.collection('reservations').doc(reservationId), opts.data ?? rental(uid, key))
        if (opts.withLock !== false) {
            batch.set(
                db.collection('reservationDayLocks').doc(opts.lockId ?? `${uid}_${key}`),
                opts.lockData ?? lock(uid, key, reservationId)
            )
        }
        return batch.commit()
    }

    const seed = (fn: (db: any) => Promise<unknown>) =>
        testEnv.withSecurityRulesDisabled(async (ctx) => { await fn(ctx.firestore()) })

    const readAsAdmin = async (path: string) => {
        let data: any
        await seed(async (db) => { data = (await db.doc(path).get()).data() })
        return data
    }

    beforeEach(async () => {
        await seed(async (db) => {
            await db.doc(`users/${STUDENT}`).set({ role: 'student', groupAssignment: 'group_A' })
            await db.doc(`users/${OTHER}`).set({ role: 'student' })
            await db.doc(`users/${ADMIN}`).set({ role: 'admin' })
        })
    })

    describe('öğrenci oluşturma', () => {
        it('kendi adına + aynı batch\'te kilit → başarılı', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            expect(await readAsAdmin(`reservationDayLocks/${STUDENT}_${DAY}`)).toMatchObject({ reservationId: 'r1' })
        })

        it('AYNI güne ikinci rezervasyon (farklı kort/saat) → reddedilir, ikinci kayıt YAZILMAZ', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertFails(book(STUDENT, DAY, 'r2', {
                data: rental(STUDENT, DAY, { courtId: 'court-2', startTime: '15:00', endTime: '16:00' })
            }))
            expect(await readAsAdmin('reservations/r2')).toBeUndefined()
        })

        it('eşzamanlı iki gönderim (iki sekme/cihaz) → yalnız BİRİ başarılı', async () => {
            const results = await Promise.allSettled([
                book(STUDENT, DAY, 'r1'),
                book(STUDENT, DAY, 'r2', { data: rental(STUDENT, DAY, { courtId: 'court-2' }) })
            ])
            expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
        })

        it('farklı güne rezervasyon → başarılı (kilit gün başına)', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(book(STUDENT, NEXT_DAY, 'r2'))
        })

        it('başka öğrenci aynı güne → başarılı (kilit öğrenci başına)', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(book(OTHER, DAY, 'r2'))
        })

        it('kilitsiz tek başına rezervasyon (SDK ile doğrudan addDoc) → reddedilir', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', { withLock: false }))
        })

        it('kilit başka bir rezervasyon kimliğini gösteriyorsa → reddedilir', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', { lockData: lock(STUDENT, DAY, 'baska') }))
        })

        it('kilit başka güne alınıp rezervasyon bu güne yazılamaz (date ↔ dateKey bağı)', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', {
                data: rental(STUDENT, DAY, { date: utcMidnight(NEXT_DAY) })
            }))
            await assertFails(book(STUDENT, NEXT_DAY, 'r1', {
                data: rental(STUDENT, DAY, { dateKey: NEXT_DAY })
            }))
        })

        it('yerel gece yarısı gibi saat taşıyan tarih → reddedilir (tarih tam olarak UTC gece yarısı olmalı)', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', {
                data: rental(STUDENT, DAY, { date: new Date(`${DAY}T00:00:00.000+03:00`) })
            }))
        })

        it('başka öğrenci adına rezervasyon → reddedilir', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', {
                data: rental(OTHER, DAY),
                lockId: `${OTHER}_${DAY}`,
                lockData: lock(OTHER, DAY, 'r1')
            }))
        })

        it('kendine onaylı (confirmed) rezervasyon → reddedilir', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', { data: rental(STUDENT, DAY, { status: 'confirmed' }) }))
        })

        it('ders gibi etiketleyip kilidi atlatma (groupId / type) → reddedilir', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', {
                data: rental(STUDENT, DAY, { groupId: 'group_X' }),
                withLock: false
            }))
            await assertFails(book(STUDENT, DAY, 'r1', {
                data: rental(STUDENT, DAY, { type: 'group-lesson' }),
                withLock: false
            }))
        })

        it('biçimsiz tarih anahtarı → reddedilir', async () => {
            await assertFails(book(STUDENT, '21.09.2026', 'r1', {
                data: rental(STUDENT, DAY, { dateKey: '21.09.2026' })
            }))
        })
    })

    describe('iptal ve yeniden rezervasyon', () => {
        it('öğrenci kendi rezervasyonunu iptal edebilir (Reservations.vue alanları)', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(dbAs(STUDENT).doc('reservations/r1').update({
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelledBy: 'student'
            }))
        })

        it('iptalden sonra AYNI güne yeniden rezervasyon → kilit devralınır', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await dbAs(STUDENT).doc('reservations/r1').update({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'student' })
            await assertSucceeds(book(STUDENT, DAY, 'r2'))
            expect(await readAsAdmin(`reservationDayLocks/${STUDENT}_${DAY}`)).toMatchObject({ reservationId: 'r2' })
        })

        it('admin reddi (cancelled) sonrası aynı güne yeniden rezervasyon → başarılı', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(dbAs(ADMIN).doc('reservations/r1').update({
                status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'admin'
            }))
            await assertSucceeds(book(STUDENT, DAY, 'r2'))
        })

        it('admin rezervasyonu silerse aynı güne yeniden rezervasyon → başarılı', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(dbAs(ADMIN).doc('reservations/r1').delete())
            await assertSucceeds(book(STUDENT, DAY, 'r2'))
        })

        it('admin onayı (confirmed) sonrası aynı güne ikinci rezervasyon → reddedilir', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(dbAs(ADMIN).doc('reservations/r1').update({ status: 'confirmed' }))
            await assertFails(book(STUDENT, DAY, 'r2'))
        })

        it('iptal edileni yeniden aktifleştirme (kilit devrinden sonra ikinci aktif kayıt) → reddedilir', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await dbAs(STUDENT).doc('reservations/r1').update({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'student' })
            await assertSucceeds(book(STUDENT, DAY, 'r2'))
            await assertFails(dbAs(STUDENT).doc('reservations/r1').update({ status: 'pending' }))
        })

        it('öğrenci tarih taşıyamaz, kendine onay veremez, başka alan değiştiremez', async () => {
            await assertSucceeds(book(STUDENT, NEXT_DAY, 'r1'))
            const ref = dbAs(STUDENT).doc('reservations/r1')
            await assertFails(ref.update({ date: utcMidnight(DAY), dateKey: DAY }))
            await assertFails(ref.update({ status: 'confirmed' }))
            await assertFails(ref.update({ status: 'cancelled', courtId: 'court-3' }))
        })

        it('öğrenci başkasının rezervasyonunu iptal edemez', async () => {
            await assertSucceeds(book(OTHER, DAY, 'r1'))
            await assertFails(dbAs(STUDENT).doc('reservations/r1').update({
                status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'student'
            }))
        })
    })

    describe('kilit belgesi', () => {
        it('öğrenci aktif rezervasyonu dururken kendi kilidini SİLEMEZ', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertFails(dbAs(STUDENT).doc(`reservationDayLocks/${STUDENT}_${DAY}`).delete())
        })

        it('öğrenci aktif rezervasyonu dururken kilidi başka kayda YÖNLENDİREMEZ', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertFails(dbAs(STUDENT).doc(`reservationDayLocks/${STUDENT}_${DAY}`).set(lock(STUDENT, DAY, 'r1-bogus')))
        })

        it('öğrenci başka öğrenci için kilit oluşturamaz (başkasının gününü kapatamaz)', async () => {
            await seed((db) => db.doc('reservations/x1').set(rental(OTHER, DAY)))
            await assertFails(dbAs(STUDENT).doc(`reservationDayLocks/${OTHER}_${DAY}`).set(lock(OTHER, DAY, 'x1')))
        })

        it('kimlik ile içerik uyuşmayan kilit → reddedilir', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', { lockId: `${STUDENT}_${NEXT_DAY}` }))
        })

        it('kilide beklenmeyen alan eklenemez', async () => {
            await assertFails(book(STUDENT, DAY, 'r1', { lockData: { ...lock(STUDENT, DAY, 'r1'), note: 'x' } }))
        })

        it('öğrenci kendi kilidini okuyabilir, başkasınınkini okuyamaz; admin hepsini okur', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(dbAs(STUDENT).doc(`reservationDayLocks/${STUDENT}_${DAY}`).get())
            await assertFails(dbAs(OTHER).doc(`reservationDayLocks/${STUDENT}_${DAY}`).get())
            await assertSucceeds(dbAs(ADMIN).doc(`reservationDayLocks/${STUDENT}_${DAY}`).get())
            await assertSucceeds(dbAs(ADMIN).doc(`reservationDayLocks/${OTHER}_${DAY}`).get())
        })

        it('girişsiz kullanıcı kilide dokunamaz', async () => {
            const anon = testEnv.unauthenticatedContext().firestore()
            await assertFails(anon.doc(`reservationDayLocks/${STUDENT}_${DAY}`).set(lock(STUDENT, DAY, 'r1')))
        })
    })

    describe('admin ve dersler', () => {
        it('admin öğrenci adına kilitsiz kort kiralaması açabilir (elle kayıt)', async () => {
            await assertSucceeds(dbAs(ADMIN).doc('reservations/a1').set({
                ...rental(STUDENT, DAY, { status: 'confirmed', type: 'court_rental' }),
                reservationType: 'court-rental',
                contactPhone: '05550000000'
            }))
        })

        it('admin öğrencinin kilidini alırsa öğrenci o güne ikinci rezervasyon açamaz', async () => {
            const db = dbAs(ADMIN)
            const batch = db.batch()
            batch.set(db.doc('reservations/a1'), rental(STUDENT, DAY, { status: 'confirmed', type: 'court_rental' }))
            batch.set(db.doc(`reservationDayLocks/${STUDENT}_${DAY}`), lock(STUDENT, DAY, 'a1'))
            await assertSucceeds(batch.commit())

            await assertFails(book(STUDENT, DAY, 'r1'))
        })

        it('admin kilit silebilir (bakım/temizlik)', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(dbAs(ADMIN).doc(`reservationDayLocks/${STUDENT}_${DAY}`).delete())
        })

        it('admin grup dersi kayıtları (kilitsiz) yazabilir; ders günü öğrencinin kiralamasını engellemez', async () => {
            await assertSucceeds(dbAs(ADMIN).doc('reservations/l1').set({
                date: utcMidnight(DAY),
                courtId: 'K1',
                startTime: '09:00',
                endTime: '10:00',
                groupId: 'group_A',
                studentId: STUDENT,
                groupAssignment: 'group_A',
                reservationType: 'group-lesson',
                status: 'confirmed',
                type: 'lesson',
                groupSchedule: true,
                createdBy: 'group-schedule-sync'
            }))
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
        })

        it('öğrenci self-heal: KENDİ grubunun ders kaydını yazabilir (StudentDashboard)', async () => {
            await assertSucceeds(dbAs(STUDENT).doc('reservations/h1').set({
                date: new Date(`${DAY}T09:00:00.000+03:00`),
                courtId: 'K1',
                startTime: '09:00',
                endTime: '10:00',
                groupId: 'group_A',
                studentId: STUDENT,
                studentName: 'Öğrenci Bir',
                groupAssignment: 'group_A',
                groupName: 'Sabah',
                membershipType: 'tennis_school_age',
                reservationType: 'group-lesson',
                status: 'confirmed',
                type: 'lesson',
                groupSchedule: true,
                createdAt: new Date(),
                createdBy: 'group-schedule-sync'
            }))
        })

        it('öğrenci self-heal: BAŞKA grubun ya da başka öğrencinin ders kaydını yazamaz', async () => {
            const lesson = {
                date: new Date(`${DAY}T09:00:00.000+03:00`),
                courtId: 'K1',
                startTime: '09:00',
                endTime: '10:00',
                reservationType: 'group-lesson',
                status: 'confirmed',
                type: 'lesson',
                groupSchedule: true,
                createdBy: 'group-schedule-sync'
            }
            await assertFails(dbAs(STUDENT).doc('reservations/h1').set({
                ...lesson, groupId: 'group_B', groupAssignment: 'group_B', studentId: STUDENT
            }))
            await assertFails(dbAs(STUDENT).doc('reservations/h2').set({
                ...lesson, groupId: 'group_A', groupAssignment: 'group_A', studentId: OTHER
            }))
            // Grubu olmayan öğrenci hiç ders kaydı yazamaz.
            await assertFails(dbAs(OTHER).doc('reservations/h3').set({
                ...lesson, groupId: 'group_A', groupAssignment: 'group_A', studentId: OTHER
            }))
        })

        it('öğrenci ders kaydını onaylı kort kiralamasına çeviremez', async () => {
            await seed((db) => db.doc('reservations/l1').set({
                studentId: STUDENT, groupId: 'group_A', groupAssignment: 'group_A',
                type: 'lesson', reservationType: 'group-lesson', groupSchedule: true, status: 'confirmed'
            }))
            await assertFails(dbAs(STUDENT).doc('reservations/l1').update({
                type: 'court-rental', groupId: null, groupAssignment: null, groupSchedule: false
            }))
        })
    })
})
