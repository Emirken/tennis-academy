// Firestore Database Service for Tennis Academy
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    endBefore,
    onSnapshot,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    writeBatch,
    runTransaction,
    enableNetwork,
    disableNetwork,
    DocumentData,
    DocumentSnapshot,
    QuerySnapshot,
    QueryConstraint,
    Timestamp,
    FieldValue,
    WhereFilterOp,
    OrderByDirection
} from 'firebase/firestore'
import { db } from './firebase'
import type { User } from '@/types/user'

// Collection names
export const COLLECTIONS = {
    USERS: 'users',
    COURTS: 'courts',
    RESERVATIONS: 'reservations',
    STUDENTS: 'students',
    PAYMENTS: 'payments',
    ATTENDANCE: 'attendance',
    LESSONS: 'lessons',
    INSTRUCTORS: 'instructors',
    PRICING: 'pricing',
    NOTIFICATIONS: 'notifications',
    SETTINGS: 'settings',
    REPORTS: 'reports'
} as const

// Generic query options interface
export interface QueryOptions {
    orderBy?: Array<{
        field: string
        direction?: OrderByDirection
    }>
    where?: Array<{
        field: string
        operator: WhereFilterOp
        value: any
    }>
    limit?: number
    startAfter?: DocumentSnapshot
    endBefore?: DocumentSnapshot
}

// Pagination interface
export interface PaginationOptions {
    limit: number
    startAfter?: DocumentSnapshot
    orderBy?: Array<{
        field: string
        direction?: OrderByDirection
    }>
}

// Query result interface
export interface QueryResult<T> {
    docs: T[]
    total: number
    hasNext: boolean
    hasPrev: boolean
    firstDoc?: DocumentSnapshot
    lastDoc?: DocumentSnapshot
}

// Firestore service class
export class FirestoreService {

    // Generic document operations
    static async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
        try {
            const docRef = doc(db, collectionName, docId)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                    createdAt: docSnap.data().createdAt?.toDate(),
                    updatedAt: docSnap.data().updatedAt?.toDate()
                } as T
            }

            return null
        } catch (error) {
            console.error(`Error getting document from ${collectionName}:`, error)
            throw error
        }
    }

    static async setDocument<T>(collectionName: string, docId: string, data: Partial<T>, merge = true): Promise<void> {
        try {
            const docRef = doc(db, collectionName, docId)
            const docData = {
                ...data,
                updatedAt: serverTimestamp()
            }

            await setDoc(docRef, docData, { merge })
        } catch (error) {
            console.error(`Error setting document in ${collectionName}:`, error)
            throw error
        }
    }

    static async addDocument<T>(collectionName: string, data: Partial<T>): Promise<string> {
        try {
            const colRef = collection(db, collectionName)
            const docData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }

            const docRef = await addDoc(colRef, docData)
            return docRef.id
        } catch (error) {
            console.error(`Error adding document to ${collectionName}:`, error)
            throw error
        }
    }

    static async updateDocument<T>(collectionName: string, docId: string, data: Partial<T>): Promise<void> {
        try {
            const docRef = doc(db, collectionName, docId)
            const updateData = {
                ...data,
                updatedAt: serverTimestamp()
            }

            await updateDoc(docRef, updateData)
        } catch (error) {
            console.error(`Error updating document in ${collectionName}:`, error)
            throw error
        }
    }

    static async deleteDocument(collectionName: string, docId: string): Promise<void> {
        try {
            const docRef = doc(db, collectionName, docId)
            await deleteDoc(docRef)
        } catch (error) {
            console.error(`Error deleting document from ${collectionName}:`, error)
            throw error
        }
    }

    // Generic query operations
    static async queryDocuments<T>(
        collectionName: string,
        options: QueryOptions = {}
    ): Promise<T[]> {
        try {
            const colRef = collection(db, collectionName)
            const constraints: QueryConstraint[] = []

            // Add where constraints
            if (options.where) {
                options.where.forEach(w => {
                    constraints.push(where(w.field, w.operator, w.value))
                })
            }

            // Add orderBy constraints
            if (options.orderBy) {
                options.orderBy.forEach(o => {
                    constraints.push(orderBy(o.field, o.direction || 'asc'))
                })
            }

            // Add pagination constraints
            if (options.startAfter) {
                constraints.push(startAfter(options.startAfter))
            }

            if (options.endBefore) {
                constraints.push(endBefore(options.endBefore))
            }

            // Add limit
            if (options.limit) {
                constraints.push(limit(options.limit))
            }

            const q = query(colRef, ...constraints)
            const querySnapshot = await getDocs(q)

            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as T[]
        } catch (error) {
            console.error(`Error querying documents from ${collectionName}:`, error)
            throw error
        }
    }

    static async queryDocumentsWithPagination<T>(
        collectionName: string,
        options: PaginationOptions,
        whereConstraints: QueryOptions['where'] = []
    ): Promise<QueryResult<T>> {
        try {
            const colRef = collection(db, collectionName)
            const constraints: QueryConstraint[] = []

            // Add where constraints
            if (whereConstraints) {
                whereConstraints.forEach(w => {
                    constraints.push(where(w.field, w.operator, w.value))
                })
            }

            // Add orderBy constraints
            if (options.orderBy) {
                options.orderBy.forEach(o => {
                    constraints.push(orderBy(o.field, o.direction || 'asc'))
                })
            }

            // Add pagination
            if (options.startAfter) {
                constraints.push(startAfter(options.startAfter))
            }

            constraints.push(limit(options.limit + 1)) // Get one extra to check if there's a next page

            const q = query(colRef, ...constraints)
            const querySnapshot = await getDocs(q)
            const docs = querySnapshot.docs

            const hasNext = docs.length > options.limit
            if (hasNext) {
                docs.pop() // Remove the extra document
            }

            const results = docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as T[]

            return {
                docs: results,
                total: results.length,
                hasNext,
                hasPrev: !!options.startAfter,
                firstDoc: docs[0],
                lastDoc: docs[docs.length - 1]
            }
        } catch (error) {
            console.error(`Error querying documents with pagination from ${collectionName}:`, error)
            throw error
        }
    }

    // Real-time listeners
    static subscribeToDocument<T>(
        collectionName: string,
        docId: string,
        callback: (data: T | null) => void
    ): () => void {
        try {
            const docRef = doc(db, collectionName, docId)

            return onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const data = {
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate(),
                        updatedAt: doc.data().updatedAt?.toDate()
                    } as T
                    callback(data)
                } else {
                    callback(null)
                }
            }, (error) => {
                console.error(`Error in document subscription for ${collectionName}/${docId}:`, error)
            })
        } catch (error) {
            console.error(`Error setting up document subscription:`, error)
            return () => {}
        }
    }

    static subscribeToCollection<T>(
        collectionName: string,
        options: QueryOptions,
        callback: (data: T[]) => void
    ): () => void {
        try {
            const colRef = collection(db, collectionName)
            const constraints: QueryConstraint[] = []

            // Add constraints
            if (options.where) {
                options.where.forEach(w => {
                    constraints.push(where(w.field, w.operator, w.value))
                })
            }

            if (options.orderBy) {
                options.orderBy.forEach(o => {
                    constraints.push(orderBy(o.field, o.direction || 'asc'))
                })
            }

            if (options.limit) {
                constraints.push(limit(options.limit))
            }

            const q = query(colRef, ...constraints)

            return onSnapshot(q, (querySnapshot) => {
                const docs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                })) as T[]
                callback(docs)
            }, (error) => {
                console.error(`Error in collection subscription for ${collectionName}:`, error)
            })
        } catch (error) {
            console.error(`Error setting up collection subscription:`, error)
            return () => {}
        }
    }

    // Batch operations
    static async batchWrite(operations: Array<{
        type: 'set' | 'update' | 'delete'
        collection: string
        docId: string
        data?: any
        merge?: boolean
    }>): Promise<void> {
        try {
            const batch = writeBatch(db)

            operations.forEach(op => {
                const docRef = doc(db, op.collection, op.docId)

                switch (op.type) {
                    case 'set':
                        batch.set(docRef, {
                            ...op.data,
                            updatedAt: serverTimestamp()
                        }, { merge: op.merge || true })
                        break
                    case 'update':
                        batch.update(docRef, {
                            ...op.data,
                            updatedAt: serverTimestamp()
                        })
                        break
                    case 'delete':
                        batch.delete(docRef)
                        break
                }
            })

            await batch.commit()
        } catch (error) {
            console.error('Error in batch write:', error)
            throw error
        }
    }

    // Transaction operations
    static async runTransactionOperation<T>(
        operation: (transaction: any) => Promise<T>
    ): Promise<T> {
        try {
            return await runTransaction(db, operation)
        } catch (error) {
            console.error('Error in transaction:', error)
            throw error
        }
    }

    // Utility methods
    static async incrementField(
        collectionName: string,
        docId: string,
        field: string,
        value: number = 1
    ): Promise<void> {
        try {
            const docRef = doc(db, collectionName, docId)
            await updateDoc(docRef, {
                [field]: increment(value),
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error(`Error incrementing field ${field}:`, error)
            throw error
        }
    }

    static async addToArray<T>(
        collectionName: string,
        docId: string,
        field: string,
        value: T
    ): Promise<void> {
        try {
            const docRef = doc(db, collectionName, docId)
            await updateDoc(docRef, {
                [field]: arrayUnion(value),
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error(`Error adding to array ${field}:`, error)
            throw error
        }
    }

    static async removeFromArray<T>(
        collectionName: string,
        docId: string,
        field: string,
        value: T
    ): Promise<void> {
        try {
            const docRef = doc(db, collectionName, docId)
            await updateDoc(docRef, {
                [field]: arrayRemove(value),
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error(`Error removing from array ${field}:`, error)
            throw error
        }
    }

    // Search operations
    static async searchDocuments<T>(
        collectionName: string,
        searchField: string,
        searchTerm: string,
        options: Omit<QueryOptions, 'where'> = {}
    ): Promise<T[]> {
        try {
            // Firestore doesn't support full-text search natively
            // This is a simple prefix search
            const searchTermLower = searchTerm.toLowerCase()
            const searchTermEnd = searchTermLower + '\uf8ff'

            return await this.queryDocuments<T>(collectionName, {
                ...options,
                where: [
                    {
                        field: searchField,
                        operator: '>=',
                        value: searchTermLower
                    },
                    {
                        field: searchField,
                        operator: '<=',
                        value: searchTermEnd
                    }
                ]
            })
        } catch (error) {
            console.error(`Error searching documents in ${collectionName}:`, error)
            throw error
        }
    }

    // Collection statistics
    static async getCollectionCount(
        collectionName: string,
        whereConstraints: QueryOptions['where'] = []
    ): Promise<number> {
        try {
            const docs = await this.queryDocuments(collectionName, {
                where: whereConstraints
            })
            return docs.length
        } catch (error) {
            console.error(`Error getting collection count for ${collectionName}:`, error)
            throw error
        }
    }

    // Bulk operations
    static async bulkCreate<T>(
        collectionName: string,
        documents: Partial<T>[]
    ): Promise<string[]> {
        try {
            const batch = writeBatch(db)
            const docIds: string[] = []

            documents.forEach(docData => {
                const docRef = doc(collection(db, collectionName))
                docIds.push(docRef.id)

                batch.set(docRef, {
                    ...docData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                })
            })

            await batch.commit()
            return docIds
        } catch (error) {
            console.error(`Error in bulk create for ${collectionName}:`, error)
            throw error
        }
    }

    static async bulkUpdate<T>(
        collectionName: string,
        updates: Array<{ id: string; data: Partial<T> }>
    ): Promise<void> {
        try {
            const batch = writeBatch(db)

            updates.forEach(update => {
                const docRef = doc(db, collectionName, update.id)
                batch.update(docRef, {
                    ...update.data,
                    updatedAt: serverTimestamp()
                })
            })

            await batch.commit()
        } catch (error) {
            console.error(`Error in bulk update for ${collectionName}:`, error)
            throw error
        }
    }

    static async bulkDelete(
        collectionName: string,
        docIds: string[]
    ): Promise<void> {
        try {
            const batch = writeBatch(db)

            docIds.forEach(docId => {
                const docRef = doc(db, collectionName, docId)
                batch.delete(docRef)
            })

            await batch.commit()
        } catch (error) {
            console.error(`Error in bulk delete for ${collectionName}:`, error)
            throw error
        }
    }

    // Network management
    static async enableFirestoreNetwork(): Promise<void> {
        try {
            await enableNetwork(db)
        } catch (error) {
            console.error('Error enabling Firestore network:', error)
            throw error
        }
    }

    static async disableFirestoreNetwork(): Promise<void> {
        try {
            await disableNetwork(db)
        } catch (error) {
            console.error('Error disabling Firestore network:', error)
            throw error
        }
    }

    // Utility functions
    static createTimestamp(): FieldValue {
        return serverTimestamp()
    }

    static timestampToDate(timestamp: Timestamp): Date {
        return timestamp.toDate()
    }

    static dateToTimestamp(date: Date): Timestamp {
        return Timestamp.fromDate(date)
    }

    // Collection existence check
    static async collectionExists(collectionName: string): Promise<boolean> {
        try {
            const colRef = collection(db, collectionName)
            const snapshot = await getDocs(query(colRef, limit(1)))
            return !snapshot.empty
        } catch (error) {
            console.error(`Error checking if collection ${collectionName} exists:`, error)
            return false
        }
    }

    // Document existence check
    static async documentExists(collectionName: string, docId: string): Promise<boolean> {
        try {
            const docRef = doc(db, collectionName, docId)
            const docSnap = await getDoc(docRef)
            return docSnap.exists()
        } catch (error) {
            console.error(`Error checking if document exists:`, error)
            return false
        }
    }
}

// Convenience exports for direct use
export const {
    getDocument,
    setDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    queryDocuments,
    queryDocumentsWithPagination,
    subscribeToDocument,
    subscribeToCollection,
    batchWrite,
    runTransactionOperation,
    incrementField,
    addToArray,
    removeFromArray,
    searchDocuments,
    getCollectionCount,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
    enableFirestoreNetwork,
    disableFirestoreNetwork,
    createTimestamp,
    timestampToDate,
    dateToTimestamp,
    collectionExists,
    documentExists
} = FirestoreService

// Default export
export default FirestoreService