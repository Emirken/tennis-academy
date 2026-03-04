// src/types/membershipType.ts

export interface MembershipType {
  id?: string
  key: string              // Unique identifier (e.g., 'private_1_45', 'adult_group')
  name: string             // Display name (e.g., 'Özel Ders 1 Kişi (45dk)')
  description?: string     // Optional description
  color: string            // Vuetify color for chips (e.g., 'purple', 'success')
  isGroupType: boolean     // Whether this membership requires group assignment
  maxCapacity?: number     // Max capacity for group types
  order: number            // Display order
  isActive: boolean        // Whether this type is currently active
  monthlyPrice?: number    // Price per month/package
  monthlyLessons?: number  // Number of lessons per month/package
  icon?: string            // MDI icon for display
  createdAt?: Date
  updatedAt?: Date
}

// Default membership types for initial seeding
export const DEFAULT_MEMBERSHIP_TYPES: Omit<MembershipType, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    key: 'private_1_45',
    name: 'Özel Ders 1 Kişi (45dk)',
    description: '45 dakikalık bireysel özel ders',
    color: 'purple',
    isGroupType: false,
    order: 1,
    isActive: true,
    monthlyPrice: 12000,
    monthlyLessons: 8,
    icon: 'mdi-human'
  },
  {
    key: 'private_2_60',
    name: 'Özel Ders 2 Kişi (60dk)',
    description: '60 dakikalık 2 kişilik özel ders',
    color: 'deep-purple',
    isGroupType: false,
    order: 2,
    isActive: true,
    monthlyPrice: 16000,
    monthlyLessons: 8,
    icon: 'mdi-human-greeting'
  },
  {
    key: 'private_group_3_8',
    name: 'Özel Grup 3 Kişi (8ders)',
    description: '3 kişilik özel grup, 8 ders paketi',
    color: 'indigo',
    isGroupType: true,
    maxCapacity: 3,
    order: 3,
    isActive: true,
    monthlyPrice: 15000,
    monthlyLessons: 8,
    icon: 'mdi-account-group'
  },
  {
    key: 'private_group_4_8',
    name: 'Özel Grup 4 Kişi (8ders)',
    description: '4 kişilik özel grup, 8 ders paketi',
    color: 'blue',
    isGroupType: true,
    maxCapacity: 4,
    order: 4,
    isActive: true,
    monthlyPrice: 20000,
    monthlyLessons: 8,
    icon: 'mdi-account-group'
  },
  {
    key: 'private_package_1_8',
    name: 'Özel Paket 1 Kişi (8ders)',
    description: '1 kişilik özel paket, 8 ders',
    color: 'teal',
    isGroupType: false,
    order: 5,
    isActive: true,
    monthlyPrice: 12000,
    monthlyLessons: 8,
    icon: 'mdi-package-variant-closed'
  },
  {
    key: 'private_package_2_8',
    name: 'Özel Paket 2 Kişi (8ders)',
    description: '2 kişilik özel paket, 8 ders',
    color: 'cyan',
    isGroupType: false,
    order: 6,
    isActive: true,
    monthlyPrice: 16000,
    monthlyLessons: 8,
    icon: 'mdi-package-variant-closed'
  },
  {
    key: 'adult_group',
    name: 'Yetişkin Grup',
    description: 'Yetişkinler için grup dersi',
    color: 'green',
    isGroupType: true,
    maxCapacity: 8,
    order: 7,
    isActive: true,
    monthlyPrice: 6000,
    monthlyLessons: 8,
    icon: 'mdi-human-male-female'
  },
  {
    key: 'tennis_school_age',
    name: 'Tenis Okulu Yaş Grubu',
    description: 'Yaşa göre tenis okulu grubu',
    color: 'orange',
    isGroupType: true,
    maxCapacity: 6,
    order: 8,
    isActive: true,
    monthlyPrice: 6000,
    monthlyLessons: 8,
    icon: 'mdi-school'
  },
  {
    key: 'tennis_school_performance',
    name: 'Tenis Okulu Performans',
    description: 'Performans odaklı tenis okulu',
    color: 'red',
    isGroupType: true,
    maxCapacity: 8,
    order: 9,
    isActive: true,
    monthlyPrice: 10000,
    monthlyLessons: 8,
    icon: 'mdi-trophy'
  },
  {
    key: 'basic',
    name: 'Temel Üyelik',
    description: 'Temel üyelik paketi',
    color: 'grey',
    isGroupType: false,
    order: 10,
    isActive: true,
    monthlyPrice: 6000,
    monthlyLessons: 8,
    icon: 'mdi-star'
  },
  {
    key: 'premium',
    name: 'Premium Üyelik',
    description: 'Premium üyelik paketi',
    color: 'amber',
    isGroupType: false,
    order: 11,
    isActive: true,
    monthlyPrice: 10000,
    monthlyLessons: 8,
    icon: 'mdi-star-circle'
  },
  {
    key: 'vip',
    name: 'VIP Üyelik',
    description: 'VIP üyelik paketi',
    color: 'error',
    isGroupType: false,
    order: 12,
    isActive: true,
    monthlyPrice: 15000,
    monthlyLessons: 8,
    icon: 'mdi-crown'
  },
  {
    key: 'court_rental_1h',
    name: 'Kort Kiralama (1 Saat)',
    description: 'Saatlik kort kiralama',
    color: 'blue',
    isGroupType: false,
    order: 13,
    isActive: true,
    monthlyPrice: 1000,
    monthlyLessons: 1,
    icon: 'mdi-tennis-ball'
  },
  {
    key: 'court_rental_10h',
    name: 'Kort Kiralama (10 Saat Paket)',
    description: '10 saatlik kort kiralama paketi',
    color: 'indigo',
    isGroupType: false,
    order: 14,
    isActive: true,
    monthlyPrice: 7500,
    monthlyLessons: 10,
    icon: 'mdi-package'
  },
  {
    key: 'court_rental_equipment',
    name: 'Raket & Top (1 Saat)',
    description: 'Raket ve top kiralama (1 saat)',
    color: 'green',
    isGroupType: false,
    order: 15,
    isActive: true,
    monthlyPrice: 500,
    monthlyLessons: 1,
    icon: 'mdi-tennis'
  }
]

// Available Vuetify colors for membership types
export const AVAILABLE_COLORS = [
  { title: 'Mor', value: 'purple' },
  { title: 'Koyu Mor', value: 'deep-purple' },
  { title: 'Çivit', value: 'indigo' },
  { title: 'Mavi', value: 'blue' },
  { title: 'Açık Mavi', value: 'light-blue' },
  { title: 'Camgöbeği', value: 'cyan' },
  { title: 'Deniz Mavisi', value: 'teal' },
  { title: 'Yeşil', value: 'green' },
  { title: 'Açık Yeşil', value: 'light-green' },
  { title: 'Lime', value: 'lime' },
  { title: 'Sarı', value: 'yellow' },
  { title: 'Amber', value: 'amber' },
  { title: 'Turuncu', value: 'orange' },
  { title: 'Koyu Turuncu', value: 'deep-orange' },
  { title: 'Kırmızı', value: 'red' },
  { title: 'Pembe', value: 'pink' },
  { title: 'Gri', value: 'grey' },
  { title: 'Mavi-Gri', value: 'blue-grey' }
]
