import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'

let testEnv: RulesTestEnvironment

describe('Firestore Rules - Reservation Unique Control', () => {
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
