// src/store/modules/membershipTypes.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MembershipType } from '@/types/membershipType'
import {
  getAllMembershipTypes,
  getActiveMembershipTypes,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
  toggleMembershipTypeActive,
  reorderMembershipTypes,
  subscribeMembershipTypes,
  seedMembershipTypes,
  getMembershipDisplayInfo,
  isGroupMembershipType,
  getGroupMaxCapacity,
  toSelectOptions,
  toLookupMap
} from '@/services/membershipTypes'
import type { Unsubscribe } from 'firebase/firestore'

export const useMembershipTypesStore = defineStore('membershipTypes', () => {
  // State
  const membershipTypes = ref<MembershipType[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  
  // Subscription handle
  let unsubscribe: Unsubscribe | null = null

  // Getters
  const allTypes = computed(() => membershipTypes.value)
  
  const activeTypes = computed(() => 
    membershipTypes.value.filter(t => t.isActive)
  )
  
  const groupTypes = computed(() =>
    membershipTypes.value.filter(t => t.isGroupType && t.isActive)
  )
  
  const nonGroupTypes = computed(() =>
    membershipTypes.value.filter(t => !t.isGroupType && t.isActive)
  )
  
  // Select options for dropdowns
  const selectOptions = computed(() => toSelectOptions(membershipTypes.value))
  
  // Lookup map by key
  const typesMap = computed(() => toLookupMap(membershipTypes.value))
  
  // Actions
  
  /**
   * Initialize the store - fetch membership types and start real-time subscription
   */
  async function initialize() {
    if (initialized.value) return
    
    loading.value = true
    error.value = null
    
    try {
      // First, try to seed if empty
      await seedMembershipTypes()
      
      // Then fetch initial data
      membershipTypes.value = await getAllMembershipTypes()
      
      // Start real-time subscription
      startRealtimeSubscription()
      
      initialized.value = true
      console.log('✅ Üyelik türleri store başlatıldı')
    } catch (e) {
      error.value = (e as Error).message
      console.error('❌ Üyelik türleri yüklenemedi:', e)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Start real-time subscription to membership types
   */
  function startRealtimeSubscription() {
    if (unsubscribe) {
      unsubscribe()
    }
    
    unsubscribe = subscribeMembershipTypes((types) => {
      membershipTypes.value = types
    })
  }
  
  /**
   * Stop real-time subscription
   */
  function stopRealtimeSubscription() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }
  
  /**
   * Refresh membership types from Firestore
   */
  async function refresh() {
    loading.value = true
    error.value = null
    
    try {
      membershipTypes.value = await getAllMembershipTypes()
    } catch (e) {
      error.value = (e as Error).message
      console.error('❌ Üyelik türleri yenilenemedi:', e)
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Create a new membership type
   */
  async function create(data: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    loading.value = true
    error.value = null
    
    try {
      const id = await createMembershipType(data)
      await refresh() // Refresh to get updated list
      return id
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Update an existing membership type
   */
  async function update(
    id: string,
    data: Partial<Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      await updateMembershipType(id, data)
      await refresh()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Delete a membership type
   */
  async function remove(id: string): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      await deleteMembershipType(id)
      await refresh()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Toggle active status
   */
  async function toggleActive(id: string, isActive: boolean): Promise<void> {
    try {
      await toggleMembershipTypeActive(id, isActive)
      // Real-time subscription will update the state
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }
  
  /**
   * Reorder membership types
   */
  async function reorder(orderedIds: string[]): Promise<void> {
    try {
      await reorderMembershipTypes(orderedIds)
      await refresh()
    } catch (e) {
      error.value = (e as Error).message
      throw e
    }
  }
  
  // Helper methods
  
  /**
   * Get display info (name and color) for a membership type key
   */
  function getDisplayInfo(key: string): { name: string; color: string } {
    return getMembershipDisplayInfo(membershipTypes.value, key)
  }
  
  /**
   * Check if a membership type key is a group type
   */
  function isGroupType(key: string): boolean {
    return isGroupMembershipType(membershipTypes.value, key)
  }
  
  /**
   * Get max capacity for a group membership type
   */
  function getMaxCapacity(key: string): number {
    return getGroupMaxCapacity(membershipTypes.value, key)
  }
  
  /**
   * Get membership type by key
   */
  function getByKey(key: string): MembershipType | undefined {
    return membershipTypes.value.find(t => t.key === key)
  }
  
  /**
   * Get membership type by ID
   */
  function getById(id: string): MembershipType | undefined {
    return membershipTypes.value.find(t => t.id === id)
  }
  
  return {
    // State
    membershipTypes,
    loading,
    error,
    initialized,
    
    // Getters
    allTypes,
    activeTypes,
    groupTypes,
    nonGroupTypes,
    selectOptions,
    typesMap,
    
    // Actions
    initialize,
    startRealtimeSubscription,
    stopRealtimeSubscription,
    refresh,
    create,
    update,
    remove,
    toggleActive,
    reorder,
    
    // Helpers
    getDisplayInfo,
    isGroupType,
    getMaxCapacity,
    getByKey,
    getById
  }
})
