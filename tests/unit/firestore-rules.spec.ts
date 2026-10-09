import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'

let testEnv: RulesTestEnvironment

const RULES = readFileSync('firestore.rules', 'utf8')

// Emülatör request.time'ı gerçek saatten alır; rezervasyon penceresi kuralı
// testleri haftanın gününe bağımlı kılmasın diye sunucu saati bu ortamda
// SABİT: Çarşamba 23 Eyl 2026 12:00 TR → açık pencere 21–27 Eyl.
const FROZEN_NOW = Date.parse('2026-09-23T09:00:00Z')
const WINDOW_CALL = 'isInOpenReservationWindow(d.date, request.time)'

const withFrozenNow = (rules: string, ms: number) => {
    if (rules.split(WINDOW_CALL).length !== 2) {
        throw new Error(`firestore.rules içinde tam bir kez "${WINDOW_CALL}" bekleniyordu`)
    }
    return rules.replace(WINDOW_CALL, `isInOpenReservationWindow(d.date, timestamp.value(${ms}))`)
}

beforeAll(async () => {
    // We load the existing firestore.rules
    testEnv = await initializeTestEnvironment({
        projectId: 'tennis-academy-test',
        firestore: {
            rules: withFrozenNow(RULES, FROZEN_NOW)
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

        // Regex biçimi geçen ama takvimde olmayan anahtar (31 Ağu+21 gün = 21 Eyl):
        // timestamp.date taşırsa aynı güne FARKLI kilit kimliğiyle ikinci kayıt açılırdı.
        it('takvimde olmayan tarih anahtarı (2026-08-52 ≡ 21 Eyl) ile ikinci kayıt → reddedilir', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertFails(book(STUDENT, '2026-08-52', 'r2', {
                data: rental(STUDENT, DAY, { dateKey: '2026-08-52' })
            }))
        })

        it('açık pencere (21–27 Eyl) dışındaki güne → reddedilir, kayıt YAZILMAZ', async () => {
            await assertSucceeds(book(STUDENT, '2026-09-27', 'r1'))     // pencerenin son günü
            await assertFails(book(STUDENT, '2026-09-28', 'r2'))        // gelecek hafta
            await assertFails(book(STUDENT, '2026-09-20', 'r3'))        // geçen hafta
            expect(await readAsAdmin('reservations/r2')).toBeUndefined()
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

        // 2026-10-08 canlı olayı: öğrenci 08:00'ı iptal edip 09:00'ı aldı; iptal
        // edilenin "Yeni Rezervasyon Talebi" bildirimi admin kuyruğunda kaldı ve
        // admin "Onayla"ya basınca iptal edilmiş kayıt confirmed oldu → aynı güne 2 kayıt.
        it('admin iptal edilmiş kort kiralamasını yeniden aktifleştiremez (bayat bildirimden onay)', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await dbAs(STUDENT).doc('reservations/r1').update({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'student' })
            await assertSucceeds(book(STUDENT, DAY, 'r2'))
            await assertFails(dbAs(ADMIN).doc('reservations/r1').update({ status: 'confirmed' }))
            await assertFails(dbAs(ADMIN).doc('reservations/r1').update({ status: 'pending' }))
            expect(await readAsAdmin('reservations/r1')).toMatchObject({ status: 'cancelled' })
        })

        it('admin, admin açtığı (court_rental) iptal/tamamlanmış kiralamayı da aktifleştiremez', async () => {
            await seed(async (db) => {
                await db.doc('reservations/a1').set({ ...rental(STUDENT, DAY, { status: 'cancelled', type: 'court_rental' }), reservationType: 'court-rental' })
                await db.doc('reservations/a2').set({ ...rental(STUDENT, DAY, { status: 'completed', type: 'court_rental' }), reservationType: 'court-rental' })
            })
            await assertFails(dbAs(ADMIN).doc('reservations/a1').update({ status: 'confirmed' }))
            await assertFails(dbAs(ADMIN).doc('reservations/a2').update({ status: 'confirmed' }))
        })

        it('admin bekleyen talebi onaylayabilir / reddedebilir; iptal edileni yeniden iptal edebilir', async () => {
            await assertSucceeds(book(STUDENT, DAY, 'r1'))
            await assertSucceeds(dbAs(ADMIN).doc('reservations/r1').update({ status: 'confirmed' }))
            await assertSucceeds(book(OTHER, DAY, 'r2'))
            await assertSucceeds(dbAs(ADMIN).doc('reservations/r2').update({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'admin' }))
            await assertSucceeds(dbAs(ADMIN).doc('reservations/r2').update({ cancelledBy: 'admin' }))
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

        it('aktifleştirme yasağı yalnız kiralamalar için: admin iptal edilmiş DERSİ geri alabilir', async () => {
            await seed(async (db) => {
                await db.doc('reservations/l1').set({
                    studentId: STUDENT, date: utcMidnight(DAY), startTime: '10:00', courtId: 'court-1',
                    type: 'lesson', reservationType: 'group-lesson', groupId: 'group_A',
                    groupAssignment: 'group_A', groupSchedule: true, status: 'cancelled'
                })
            })
            await assertSucceeds(dbAs(ADMIN).doc('reservations/l1').update({ status: 'confirmed' }))
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

// Rezervasyon penceresi (sunucu saati). Canlı olay 5 Eki 2026: öğrenci Pazartesi
// 08:00:04 TR'de o akşama kayıt açabildi — kural pencereyi hiç denetlemiyordu.
// firestore.rules'taki isInOpenReservationWindow BİREBİR çekilip `instant`
// belge alanından verilerek zamanda gezilir (request.time sahtelenemez).
describe('Firestore Rules - Rezervasyon penceresi (isInOpenReservationWindow)', () => {
    let probeEnv: RulesTestEnvironment

    beforeAll(async () => {
        const fn = RULES.match(/function isInOpenReservationWindow\([\s\S]*?\n {4}\}/)
        if (!fn) throw new Error('isInOpenReservationWindow firestore.rules içinde bulunamadı')
        probeEnv = await initializeTestEnvironment({
            projectId: 'tennis-academy-window-probe',
            firestore: {
                rules: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    ${fn[0]}
    match /probe/{id} {
      allow create: if isInOpenReservationWindow(request.resource.data.day, request.resource.data.at);
    }
  }
}`
            }
        })
    })

    afterAll(async () => {
        await probeEnv.cleanup()
    })

    // [an (UTC), rezervasyon günü, izin?]
    const cases: Array<[string, string, boolean, string]> = [
        ['2026-10-05T05:00:04Z', '2026-10-05', false, 'olay: Pzt 08:00 TR, aynı gün'],
        ['2026-10-05T05:00:04Z', '2026-10-04', false, 'olay: Pzt 08:00 TR, eski hafta da kapandı'],
        ['2026-10-05T09:59:59Z', '2026-10-05', false, 'Pzt 12:59:59 TR'],
        ['2026-10-05T10:00:00Z', '2026-10-05', true, 'Pzt 13:00 TR açılış günü'],
        ['2026-10-05T10:00:00Z', '2026-10-11', true, 'Pzt 13:00 TR haftanın Pazar\'ı'],
        ['2026-10-05T10:00:00Z', '2026-10-12', false, 'Pzt 13:00 TR gelecek hafta'],
        ['2026-10-05T10:00:00Z', '2026-10-04', false, 'Pzt 13:00 TR geçen hafta'],
        ['2026-10-07T12:00:00Z', '2026-10-05', true, 'Çarşamba: pencere Pazartesi\'den başlar'],
        ['2026-10-07T12:00:00Z', '2026-10-12', false, 'Çarşamba: gelecek hafta'],
        ['2026-10-10T22:00:00Z', '2026-10-11', true, 'Paz 01:00 TR (UTC\'de hâlâ Cumartesi)'],
        ['2026-10-10T22:00:00Z', '2026-10-12', false, 'Paz 01:00 TR gelecek hafta'],
        ['2026-10-04T20:59:00Z', '2026-09-28', true, 'Paz 23:59 TR pencere başı'],
        ['2026-10-04T20:59:00Z', '2026-10-05', false, 'Paz 23:59 TR yarın açılmadı'],
        ['2026-10-04T21:30:00Z', '2026-10-04', false, 'Pzt 00:30 TR (UTC\'de hâlâ Pazar) kapalı'],
        ['2026-12-28T10:00:00Z', '2027-01-03', true, 'yıl geçişi: Pazar 3 Oca'],
        ['2026-12-28T10:00:00Z', '2027-01-04', false, 'yıl geçişi: gelecek hafta'],
    ]

    it.each(cases)('%s → %s izin=%s (%s)', async (at, day, allowed) => {
        const db = probeEnv.unauthenticatedContext().firestore()
        const write = db.collection('probe').doc().set({
            at: new Date(at),
            day: new Date(`${day}T00:00:00.000Z`)
        })
        await (allowed ? assertSucceeds(write) : assertFails(write))
    })
})

// users/{uid}: kullanıcı kendi belgesinde yalnız profil alanlarını yazabilir.
// Eskiden serbest yazım vardı → öğrenci `role: 'admin'` yazıp isAdminOrBoss()'u
// (ve rolü Firestore'dan doğrulayan Cloud Function'ları) kendine açabiliyordu.
describe('Firestore Rules - users yetki alanları', () => {
    const STUDENT = 'student_1'
    const OTHER = 'student_2'
    const DELETED = 'student_deleted'
    const ADMIN = 'admin_1'
    const BOSS = 'boss_1'
    const NEW_USER = 'new_user_1'

    const dbAs = (uid: string) => testEnv.authenticatedContext(uid).firestore()
    const me = () => dbAs(STUDENT).doc(`users/${STUDENT}`)

    const seed = (fn: (db: any) => Promise<unknown>) =>
        testEnv.withSecurityRulesDisabled(async (ctx) => { await fn(ctx.firestore()) })

    const readAsAdmin = async (path: string) => {
        let data: any
        await seed(async (db) => { data = (await db.doc(path).get()).data() })
        return data
    }

    // Auth store register() ile yazılan belge.
    const storeRegistration = (uid: string, overrides: Record<string, unknown> = {}) => ({
        id: uid,
        phone_number: '05551112233',
        firstName: 'Yeni',
        lastName: 'Öğrenci',
        role: 'student',
        status: 'pending',
        email: 'yeni@example.com',
        birthDate: '2010-05-10',
        level: 'başlangıç',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    })

    // AuthService.createUserDocument ile yazılan belge.
    const serviceRegistration = (uid: string) => ({
        id: uid,
        phone_number: '05551112244',
        firstName: 'Servis',
        lastName: 'Kaydı',
        role: 'student',
        status: 'pending',
        phone: '',
        address: '',
        emergencyContact: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date()
    })

    beforeEach(async () => {
        await seed(async (db) => {
            await db.doc(`users/${STUDENT}`).set({
                id: STUDENT,
                role: 'student',
                status: 'active',
                deleted: false,
                firstName: 'Didem',
                lastName: 'Birgi',
                phone_number: '05550000001',
                membershipType: 'basic',
                groupAssignment: 'group_A',
                level: 'orta',
                balance: 0,
                mustResetPassword: true
            })
            await db.doc(`users/${OTHER}`).set({ role: 'student', status: 'active', firstName: 'Ayşe' })
            await db.doc(`users/${DELETED}`).set({ role: 'student', status: 'deleted', deleted: true })
            await db.doc(`users/${ADMIN}`).set({ role: 'admin', status: 'approved' })
            await db.doc(`users/${BOSS}`).set({ role: 'boss', status: 'approved' })
        })
    })

    describe('rol yükseltme', () => {
        it('öğrenci kendi rolünü admin ya da boss yapamaz (update, merge, üzerine yazma)', async () => {
            await assertFails(me().update({ role: 'admin' }))
            await assertFails(me().update({ role: 'boss' }))
            await assertFails(me().set({ role: 'admin' }, { merge: true }))
            await assertFails(me().set({ id: STUDENT, role: 'admin', status: 'active', firstName: 'Didem' }))
            expect(await readAsAdmin(`users/${STUDENT}`)).toMatchObject({ role: 'student' })
        })

        it('profil alanıyla birlikte rol gönderilirse güncellemenin tamamı reddedilir', async () => {
            await assertFails(me().update({ firstName: 'Değişti', role: 'admin', updatedAt: new Date() }))
            expect(await readAsAdmin(`users/${STUDENT}`)).toMatchObject({ firstName: 'Didem', role: 'student' })
        })

        it('reddedilen yükseltmeden sonra admin yetkisi kullanılamaz', async () => {
            await assertFails(me().update({ role: 'admin' }))
            // Başka kullanıcının belgesi
            await assertFails(dbAs(STUDENT).doc(`users/${OTHER}`).update({ status: 'deleted' }))
            await assertFails(dbAs(STUDENT).doc(`users/${OTHER}`).get())
            // Başka öğrenci adına onaylı rezervasyon (admin yolu)
            await assertFails(dbAs(STUDENT).doc('reservations/x1').set({
                studentId: OTHER, status: 'confirmed', type: 'court_rental', courtId: 'court-1'
            }))
        })

        it('öğrenci onay/silinme/üyelik/grup/telefon/seviye/bakiye alanlarını değiştiremez', async () => {
            await assertFails(me().update({ status: 'approved' }))
            await assertFails(me().update({ deleted: true }))
            await assertFails(me().update({ membershipType: 'premium' }))
            await assertFails(me().update({ groupAssignment: 'group_B' }))
            await assertFails(me().update({ groupSchedule: { weeklyPlan: [] } }))
            await assertFails(me().update({ phone_number: '05559999999' }))
            await assertFails(me().update({ level: 'ileri' }))
            await assertFails(me().update({ balance: 1000 }))
            await assertFails(me().update({ id: 'baska-id' }))
            await assertFails(me().update({ yeniAlan: 'x' }))
        })

        it('silinmiş kullanıcı kendini geri açamaz', async () => {
            await assertFails(dbAs(DELETED).doc(`users/${DELETED}`).update({ deleted: false, status: 'active' }))
        })
    })

    describe('izin verilen kendi yazımları', () => {
        it('profil formu (AuthService.updateProfile) alanları güncellenir', async () => {
            await assertSucceeds(me().update({
                firstName: 'Didem',
                lastName: 'Birgi Yılmaz',
                phone: '05551234567',
                email: 'didem@example.com',
                birthDate: '2011-03-04',
                address: 'Urla',
                emergencyContact: 'Anne 0555',
                updatedAt: new Date()
            }))
        })

        it('son giriş zamanı (AuthService.updateLastLogin) güncellenir', async () => {
            await assertSucceeds(me().update({ lastLoginAt: new Date(), updatedAt: new Date() }))
        })

        it('zorunlu şifre bayrağı kaldırılabilir (clearMustResetPassword) ama geri açılamaz', async () => {
            await assertSucceeds(me().update({ mustResetPassword: false, updatedAt: new Date() }))
            await assertFails(me().update({ mustResetPassword: true }))
        })

        it('kendi belgesini okuyabilir, başkasınınkini okuyamaz', async () => {
            await assertSucceeds(me().get())
            await assertFails(dbAs(STUDENT).doc(`users/${OTHER}`).get())
        })

        it('kendi belgesini silemez', async () => {
            await assertFails(me().delete())
        })
    })

    describe('kayıt', () => {
        it('onay bekleyen öğrenci belgesi oluşturulur (store register)', async () => {
            await assertSucceeds(dbAs(NEW_USER).doc(`users/${NEW_USER}`).set(storeRegistration(NEW_USER)))
        })

        it('opsiyonel alanlar olmadan da kayıt olur', async () => {
            const minimal: Record<string, unknown> = storeRegistration(NEW_USER)
            delete minimal.email
            delete minimal.birthDate
            delete minimal.level
            await assertSucceeds(dbAs(NEW_USER).doc(`users/${NEW_USER}`).set(minimal))
        })

        it('AuthService.createUserDocument biçimi kabul edilir', async () => {
            await assertSucceeds(dbAs(NEW_USER).doc(`users/${NEW_USER}`).set(serviceRegistration(NEW_USER)))
        })

        // Üye kayıt formu (src/utils/registrationForm.ts buildRegistrationProfile) alanları.
        const formFields = {
            heightCm: 150, weightKg: 40, occupation: 'Öğrenci', address: 'Urla',
            isMinor: true, parentFirstName: 'Ayşe', parentLastName: 'Yılmaz',
            parentPhone: '05559876543', parentEmail: 'ayse@example.com', parentRelation: 'mother',
            trainingTypes: ['tennis_school', 'other'], trainingTypeOther: 'Kondisyon',
            hasHealthCondition: true, healthConditionNote: 'Astım', specialCareNote: 'Sprey yanında',
            coachNote: 'Utangaç', referralSource: 'friend', referralDetail: 'Mehmet Kaya',
            waiverAcceptedAt: new Date(), dataConsentAcceptedAt: new Date(),
            marketingConsent: true, marketingConsentAt: new Date()
        }

        it('üye kayıt formunun tüm alanlarıyla kayıt olur', async () => {
            await assertSucceeds(dbAs(NEW_USER).doc(`users/${NEW_USER}`).set(storeRegistration(NEW_USER, formFields)))
        })

        it('kayıt formu alanlarında tip/seçenek/uzunluk ihlali reddedilir', async () => {
            const ref = dbAs(NEW_USER).doc(`users/${NEW_USER}`)
            const bad: Record<string, unknown>[] = [
                { heightCm: '150' }, { heightCm: 20 }, { heightCm: 150.5 }, { weightKg: 400 },
                { isMinor: 'evet' }, { parentPhone: '5559876543' }, { parentRelation: 'dayi' },
                { trainingTypes: ['yoga'] }, { trainingTypes: 'tennis_school' },
                { hasHealthCondition: 'hayir' }, { healthConditionNote: 'x'.repeat(1001) },
                { referralSource: 'tiktok' }, { referralDetail: 'x'.repeat(201) },
                { waiverAcceptedAt: 'dün' }, { marketingConsent: 'evet' }
            ]
            for (const override of bad) {
                await assertFails(ref.set(storeRegistration(NEW_USER, { ...formFields, ...override })))
            }
        })

        it('girişsiz kullanıcı users koleksiyonunu sorgulayamaz (eski kayıt ön kontrolü bu yüzden düşüyordu)', async () => {
            const anon = testEnv.unauthenticatedContext().firestore()
            await assertFails(anon.collection('users')
                .where('phone_number', '==', '05551112233')
                .where('deleted', '==', true).get())
        })

        it('admin/boss rolüyle, onaylı durumla ya da yetki alanıyla kayıt reddedilir', async () => {
            const ref = dbAs(NEW_USER).doc(`users/${NEW_USER}`)
            await assertFails(ref.set(storeRegistration(NEW_USER, { role: 'admin', status: 'approved' })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { role: 'admin' })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { role: 'boss' })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { status: 'approved' })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { status: 'active' })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { membershipType: 'premium' })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { groupAssignment: 'group_A' })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { mustResetPassword: false })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { deleted: false })))
            await assertFails(ref.set(storeRegistration(NEW_USER, { id: 'baska-id' })))
        })

        it('başkası adına belge oluşturulamaz; girişsiz kullanıcı hiç oluşturamaz', async () => {
            await assertFails(dbAs(STUDENT).doc('users/yeni_kurban').set(storeRegistration('yeni_kurban')))
            const anon = testEnv.unauthenticatedContext().firestore()
            await assertFails(anon.doc(`users/${NEW_USER}`).set(storeRegistration(NEW_USER)))
            await assertFails(anon.doc(`users/${STUDENT}`).get())
        })
    })

    describe('admin ve boss', () => {
        it('admin öğrenciyi onaylar, rol/grup/üyelik değiştirir (Notifications, GroupManagement)', async () => {
            const ref = dbAs(ADMIN).doc(`users/${STUDENT}`)
            await assertSucceeds(ref.update({ status: 'active' }))
            await assertSucceeds(ref.update({ membershipType: 'premium', groupAssignment: 'group_B' }))
            await assertSucceeds(ref.update({ role: 'admin' }))
        })

        it('admin öğrenci belgesi oluşturur (StudentManagement) ve siler (kayıt reddi)', async () => {
            await assertSucceeds(dbAs(ADMIN).doc('users/admin_created').set({
                firstName: 'Admin',
                lastName: 'Ekledi',
                phone_number: '05553334455',
                email: '',
                birthDate: '',
                level: 'başlangıç',
                address: '',
                emergencyContact: '',
                membershipType: 'basic',
                role: 'student',
                status: 'active',
                balance: 0,
                deleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }))
            await assertSucceeds(dbAs(ADMIN).doc(`users/${OTHER}`).delete())
        })

        it('admin ve boss tüm kullanıcıları okur ve sorgular', async () => {
            await assertSucceeds(dbAs(ADMIN).doc(`users/${STUDENT}`).get())
            await assertSucceeds(dbAs(BOSS).doc(`users/${STUDENT}`).get())
            await assertSucceeds(dbAs(ADMIN).collection('users').where('role', '==', 'student').get())
        })

        it('boss admin-eşidir: öğrenci belgesine yazabilir', async () => {
            await assertSucceeds(dbAs(BOSS).doc(`users/${STUDENT}`).update({ membershipType: 'vip' }))
        })

        it('öğrenci kullanıcı listesini sorgulayamaz', async () => {
            await assertFails(dbAs(STUDENT).collection('users').where('role', '==', 'student').get())
        })
    })
})
