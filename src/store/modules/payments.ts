import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Enhanced Payment interfaces
export interface Payment {
    id: string
    studentId: string
    studentName: string
    amount: number
    type: 'membership' | 'lesson' | 'court_rental' | 'equipment' | 'late_fee' | 'refund' | 'other'
    status: 'completed' | 'pending' | 'failed' | 'refunded' | 'disputed' | 'cancelled'
    method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'check' | 'digital_wallet'
    description: string
    dueDate?: Date
    paidDate?: Date
    createdDate: Date
    updatedDate: Date
    transactionId?: string
    invoiceNumber?: string
    notes?: string
    currency: string
    originalAmount?: number
    exchangeRate?: number
    fees?: PaymentFee[]
    breakdown?: PaymentBreakdown[]
    recurringPaymentId?: string
    installmentInfo?: InstallmentInfo
    refundInfo?: RefundInfo
    disputeInfo?: DisputeInfo
}

export interface PaymentFee {
    type: 'processing' | 'late' | 'service' | 'tax'
    amount: number
    description: string
}

export interface PaymentBreakdown {
    description: string
    amount: number
    type: 'item' | 'discount' | 'tax' | 'fee'
}

export interface InstallmentInfo {
    totalInstallments: number
    currentInstallment: number
    installmentAmount: number
    nextDueDate?: Date
    remainingAmount: number
}

export interface RefundInfo {
    refundAmount: number
    refundDate: Date
    refundReason: string
    refundMethod: string
    refundTransactionId: string
}

export interface DisputeInfo {
    disputeDate: Date
    disputeReason: string
    disputeStatus: 'open' | 'in_review' | 'resolved' | 'closed'
    resolution?: string
    resolutionDate?: Date
}

export interface PaymentPlan {
    id: string
    studentId: string
    totalAmount: number
    installments: number
    installmentAmount: number
    frequency: 'weekly' | 'monthly' | 'quarterly'
    startDate: Date
    endDate: Date
    status: 'active' | 'completed' | 'cancelled' | 'paused'
    nextPaymentDate: Date
    remainingPayments: number
    remainingAmount: number
    description: string
    createdAt: Date
    updatedAt: Date
}

export interface Invoice {
    id: string
    invoiceNumber: string
    studentId: string
    studentName: string
    issueDate: Date
    dueDate: Date
    amount: number
    paidAmount: number
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    items: InvoiceItem[]
    taxes: InvoiceTax[]
    discounts: InvoiceDiscount[]
    notes?: string
    paymentTerms: string
    createdAt: Date
    updatedAt: Date
}

export interface InvoiceItem {
    id: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    type: 'membership' | 'lesson' | 'court_rental' | 'equipment' | 'other'
}

export interface InvoiceTax {
    name: string
    rate: number
    amount: number
}

export interface InvoiceDiscount {
    name: string
    type: 'percentage' | 'fixed'
    value: number
    amount: number
}

export interface PaymentReport {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    startDate: Date
    endDate: Date
    totalRevenue: number
    totalPayments: number
    averagePayment: number
    paymentsByType: Record<string, number>
    paymentsByMethod: Record<string, number>
    paymentsByStatus: Record<string, number>
    overduePayments: number
    overdueAmount: number
    refundedAmount: number
    disputedAmount: number
    growthRate: number
    topPayingStudents: Array<{
        studentId: string
        studentName: string
        totalPaid: number
        paymentCount: number
    }>
}

export const usePaymentsStore = defineStore('payments', () => {
    // State
    const payments = ref<Payment[]>([])
    const paymentPlans = ref<PaymentPlan[]>([])
    const invoices = ref<Invoice[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const completedPayments = computed(() =>
        payments.value.filter(payment => payment.status === 'completed')
    )

    const pendingPayments = computed(() =>
        payments.value.filter(payment => payment.status === 'pending')
    )

    const overduePayments = computed(() => {
        const today = new Date()
        return payments.value.filter(payment =>
            payment.status === 'pending' &&
            payment.dueDate &&
            payment.dueDate < today
        )
    })

    const failedPayments = computed(() =>
        payments.value.filter(payment => payment.status === 'failed')
    )

    const refundedPayments = computed(() =>
        payments.value.filter(payment => payment.status === 'refunded')
    )

    const totalRevenue = computed(() =>
        completedPayments.value.reduce((sum, payment) => sum + payment.amount, 0)
    )

    const monthlyRevenue = computed(() => {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        return completedPayments.value
            .filter(payment => {
                const paymentDate = payment.paidDate || payment.createdDate
                return paymentDate.getMonth() === currentMonth &&
                    paymentDate.getFullYear() === currentYear
            })
            .reduce((sum, payment) => sum + payment.amount, 0)
    })

    const overdueAmount = computed(() =>
        overduePayments.value.reduce((sum, payment) => sum + payment.amount, 0)
    )

    const activePaymentPlans = computed(() =>
        paymentPlans.value.filter(plan => plan.status === 'active')
    )

    const unpaidInvoices = computed(() =>
        invoices.value.filter(invoice => invoice.status !== 'paid' && invoice.status !== 'cancelled')
    )

    const overdueInvoices = computed(() => {
        const today = new Date()
        return invoices.value.filter(invoice =>
            invoice.status !== 'paid' &&
            invoice.status !== 'cancelled' &&
            invoice.dueDate < today
        )
    })

    // Actions
    const fetchPayments = async (filters?: {
        studentId?: string
        dateFrom?: Date
        dateTo?: Date
        status?: Payment['status']
        type?: Payment['type']
        method?: Payment['method']
    }) => {
        loading.value = true
        error.value = null

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Mock payments data
            const mockPayments: Payment[] = [
                {
                    id: 'pay_001',
                    studentId: 'student_001',
                    studentName: 'Ahmet Yılmaz',
                    amount: 199.00,
                    type: 'membership',
                    status: 'completed',
                    method: 'credit_card',
                    description: 'Monthly Premium Membership Fee',
                    dueDate: new Date('2025-06-01'),
                    paidDate: new Date('2025-06-01T10:30:00'),
                    createdDate: new Date('2025-05-25'),
                    updatedDate: new Date('2025-06-01T10:30:00'),
                    transactionId: 'txn_cc_001234567',
                    invoiceNumber: 'INV-2025-001',
                    currency: 'USD',
                    fees: [
                        { type: 'processing', amount: 2.99, description: 'Credit card processing fee' }
                    ],
                    breakdown: [
                        { description: 'Premium Membership', amount: 199.00, type: 'item' }
                    ]
                },
                {
                    id: 'pay_002',
                    studentId: 'student_002',
                    studentName: 'Ayşe Demir',
                    amount: 75.00,
                    type: 'lesson',
                    status: 'completed',
                    method: 'debit_card',
                    description: 'Private Tennis Lesson',
                    paidDate: new Date('2025-05-28T14:15:00'),
                    createdDate: new Date('2025-05-28'),
                    updatedDate: new Date('2025-05-28T14:15:00'),
                    transactionId: 'txn_dc_002345678',
                    invoiceNumber: 'INV-2025-002',
                    currency: 'USD',
                    notes: 'One-on-one coaching session with Coach Smith'
                },
                {
                    id: 'pay_003',
                    studentId: 'student_003',
                    studentName: 'Mehmet Kaya',
                    amount: 150.00,
                    type: 'membership',
                    status: 'pending',
                    method: 'bank_transfer',
                    description: 'Monthly Basic Membership Fee',
                    dueDate: new Date('2025-06-05'),
                    createdDate: new Date('2025-05-20'),
                    updatedDate: new Date('2025-05-20'),
                    invoiceNumber: 'INV-2025-003',
                    currency: 'USD'
                },
                {
                    id: 'pay_004',
                    studentId: 'student_004',
                    studentName: 'Fatma Özkan',
                    amount: 45.00,
                    type: 'court_rental',
                    status: 'completed',
                    method: 'cash',
                    description: 'Court Rental - 2 hours',
                    paidDate: new Date('2025-05-25T16:00:00'),
                    createdDate: new Date('2025-05-25'),
                    updatedDate: new Date('2025-05-25T16:00:00'),
                    transactionId: 'txn_cash_003456789',
                    currency: 'USD',
                    breakdown: [
                        { description: 'Court rental (2 hours)', amount: 40.00, type: 'item' },
                        { description: 'Equipment rental', amount: 5.00, type: 'item' }
                    ]
                },
                {
                    id: 'pay_005',
                    studentId: 'student_005',
                    studentName: 'Can Aslan',
                    amount: 25.00,
                    type: 'late_fee',
                    status: 'pending',
                    method: 'credit_card',
                    description: 'Late Payment Fee - May Membership',
                    dueDate: new Date('2025-06-10'),
                    createdDate: new Date('2025-06-02'),
                    updatedDate: new Date('2025-06-02'),
                    currency: 'USD',
                    notes: 'Late fee for May membership payment'
                },
                {
                    id: 'pay_006',
                    studentId: 'student_002',
                    studentName: 'Ayşe Demir',
                    amount: -60.00,
                    type: 'refund',
                    status: 'refunded',
                    method: 'credit_card',
                    description: 'Refund - Cancelled Lesson',
                    paidDate: new Date('2025-05-20T11:00:00'),
                    createdDate: new Date('2025-05-18'),
                    updatedDate: new Date('2025-05-20T11:00:00'),
                    transactionId: 'txn_refund_004567890',
                    currency: 'USD',
                    refundInfo: {
                        refundAmount: 60.00,
                        refundDate: new Date('2025-05-20T11:00:00'),
                        refundReason: 'Lesson cancelled due to weather',
                        refundMethod: 'credit_card',
                        refundTransactionId: 'txn_refund_004567890'
                    }
                }
            ]

            // Apply filters if provided
            let filteredPayments = mockPayments

            if (filters) {
                if (filters.studentId) {
                    filteredPayments = filteredPayments.filter(p => p.studentId === filters.studentId)
                }
                if (filters.status) {
                    filteredPayments = filteredPayments.filter(p => p.status === filters.status)
                }
                if (filters.type) {
                    filteredPayments = filteredPayments.filter(p => p.type === filters.type)
                }
                if (filters.method) {
                    filteredPayments = filteredPayments.filter(p => p.method === filters.method)
                }
                if (filters.dateFrom) {
                    filteredPayments = filteredPayments.filter(p =>
                        (p.paidDate || p.createdDate) >= filters.dateFrom!
                    )
                }
                if (filters.dateTo) {
                    filteredPayments = filteredPayments.filter(p =>
                        (p.paidDate || p.createdDate) <= filters.dateTo!
                    )
                }
            }

            payments.value = filteredPayments.sort((a, b) =>
                (b.paidDate || b.createdDate).getTime() - (a.paidDate || a.createdDate).getTime()
            )

        } catch (err: any) {
            error.value = err.message || 'Failed to fetch payments'
        } finally {
            loading.value = false
        }
    }

    const fetchPaymentPlans = async () => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            paymentPlans.value = [
                {
                    id: 'plan_001',
                    studentId: 'student_006',
                    totalAmount: 1200.00,
                    installments: 6,
                    installmentAmount: 200.00,
                    frequency: 'monthly',
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-06-01'),
                    status: 'active',
                    nextPaymentDate: new Date('2025-06-01'),
                    remainingPayments: 2,
                    remainingAmount: 400.00,
                    description: 'Annual Premium Membership - 6 monthly installments',
                    createdAt: new Date('2024-12-15'),
                    updatedAt: new Date('2025-05-01')
                }
            ]
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch payment plans'
        } finally {
            loading.value = false
        }
    }

    const fetchInvoices = async () => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            invoices.value = [
                {
                    id: 'inv_001',
                    invoiceNumber: 'INV-2025-001',
                    studentId: 'student_001',
                    studentName: 'Ahmet Yılmaz',
                    issueDate: new Date('2025-05-25'),
                    dueDate: new Date('2025-06-01'),
                    amount: 199.00,
                    paidAmount: 199.00,
                    status: 'paid',
                    items: [
                        {
                            id: 'item_001',
                            description: 'Premium Membership - June 2025',
                            quantity: 1,
                            unitPrice: 199.00,
                            totalPrice: 199.00,
                            type: 'membership'
                        }
                    ],
                    taxes: [],
                    discounts: [],
                    paymentTerms: 'Net 7 days',
                    createdAt: new Date('2025-05-25'),
                    updatedAt: new Date('2025-06-01')
                },
                {
                    id: 'inv_002',
                    invoiceNumber: 'INV-2025-002',
                    studentId: 'student_003',
                    studentName: 'Mehmet Kaya',
                    issueDate: new Date('2025-05-20'),
                    dueDate: new Date('2025-06-05'),
                    amount: 150.00,
                    paidAmount: 0.00,
                    status: 'sent',
                    items: [
                        {
                            id: 'item_002',
                            description: 'Basic Membership - June 2025',
                            quantity: 1,
                            unitPrice: 150.00,
                            totalPrice: 150.00,
                            type: 'membership'
                        }
                    ],
                    taxes: [],
                    discounts: [],
                    paymentTerms: 'Net 15 days',
                    createdAt: new Date('2025-05-20'),
                    updatedAt: new Date('2025-05-20')
                }
            ]
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch invoices'
        } finally {
            loading.value = false
        }
    }

    const createPayment = async (paymentData: Omit<Payment, 'id' | 'createdDate' | 'updatedDate'>): Promise<Payment> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const newPayment: Payment = {
                ...paymentData,
                id: `pay_${Date.now()}`,
                createdDate: new Date(),
                updatedDate: new Date(),
                transactionId: `txn_${paymentData.method}_${Date.now()}`
            }

            payments.value.unshift(newPayment)
            return newPayment
        } catch (err: any) {
            error.value = err.message || 'Failed to create payment'
            throw err
        } finally {
            loading.value = false
        }
    }

    const updatePayment = async (id: string, updates: Partial<Payment>): Promise<Payment> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const index = payments.value.findIndex(p => p.id === id)
            if (index === -1) {
                throw new Error('Payment not found')
            }

            const updatedPayment = {
                ...payments.value[index],
                ...updates,
                updatedDate: new Date()
            }

            payments.value[index] = updatedPayment
            return updatedPayment
        } catch (err: any) {
            error.value = err.message || 'Failed to update payment'
            throw err
        } finally {
            loading.value = false
        }
    }

    const processPayment = async (paymentId: string, paymentMethod: Payment['method']): Promise<Payment> => {
        loading.value = true
        error.value = null

        try {
            // Simulate payment processing time
            await new Promise(resolve => setTimeout(resolve, 2000))

            const index = payments.value.findIndex(p => p.id === paymentId)
            if (index === -1) {
                throw new Error('Payment not found')
            }

            // Simulate payment success/failure (90% success rate)
            const isSuccess = Math.random() > 0.1

            const updatedPayment = {
                ...payments.value[index],
                status: isSuccess ? 'completed' as const : 'failed' as const,
                method: paymentMethod,
                paidDate: isSuccess ? new Date() : undefined,
                transactionId: `txn_${paymentMethod}_${Date.now()}`,
                updatedDate: new Date()
            }

            payments.value[index] = updatedPayment
            return updatedPayment
        } catch (err: any) {
            error.value = err.message || 'Failed to process payment'
            throw err
        } finally {
            loading.value = false
        }
    }

    const refundPayment = async (paymentId: string, refundAmount: number, reason: string): Promise<Payment> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const originalPayment = payments.value.find(p => p.id === paymentId)
            if (!originalPayment) {
                throw new Error('Payment not found')
            }

            if (originalPayment.status !== 'completed') {
                throw new Error('Can only refund completed payments')
            }

            // Create refund payment record
            const refundPayment: Payment = {
                id: `refund_${Date.now()}`,
                studentId: originalPayment.studentId,
                studentName: originalPayment.studentName,
                amount: -refundAmount,
                type: 'refund',
                status: 'completed',
                method: originalPayment.method,
                description: `Refund - ${originalPayment.description}`,
                paidDate: new Date(),
                createdDate: new Date(),
                updatedDate: new Date(),
                transactionId: `txn_refund_${Date.now()}`,
                currency: originalPayment.currency,
                notes: reason,
                refundInfo: {
                    refundAmount,
                    refundDate: new Date(),
                    refundReason: reason,
                    refundMethod: originalPayment.method,
                    refundTransactionId: `txn_refund_${Date.now()}`
                }
            }

            payments.value.unshift(refundPayment)

            // Update original payment status if fully refunded
            if (refundAmount === originalPayment.amount) {
                const originalIndex = payments.value.findIndex(p => p.id === paymentId)
                if (originalIndex !== -1) {
                    payments.value[originalIndex] = {
                        ...payments.value[originalIndex],
                        status: 'refunded',
                        updatedDate: new Date()
                    }
                }
            }

            return refundPayment
        } catch (err: any) {
            error.value = err.message || 'Failed to process refund'
            throw err
        } finally {
            loading.value = false
        }
    }

    const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
        loading.value = true
        error.value = null

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const newInvoice: Invoice = {
                ...invoiceData,
                id: `inv_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            invoices.value.unshift(newInvoice)
            return newInvoice
        } catch (err: any) {
            error.value = err.message || 'Failed to create invoice'
            throw err
        } finally {
            loading.value = false
        }
    }

    const getPaymentsByStudent = (studentId: string) => {
        return payments.value.filter(payment => payment.studentId === studentId)
    }

    const getPaymentStatistics = () => {
        const today = new Date()
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

        const thisMonthPayments = completedPayments.value.filter(p => {
            const paymentDate = p.paidDate || p.createdDate
            return paymentDate >= thisMonth
        })

        const lastMonthPayments = completedPayments.value.filter(p => {
            const paymentDate = p.paidDate || p.createdDate
            return paymentDate >= lastMonth && paymentDate <= lastMonthEnd
        })

        const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0)
        const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0)
        const growthRate = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

        return {
            totalRevenue: totalRevenue.value,
            monthlyRevenue: monthlyRevenue.value,
            overdueAmount: overdueAmount.value,
            totalPayments: completedPayments.value.length,
            pendingPayments: pendingPayments.value.length,
            overduePayments: overduePayments.value.length,
            failedPayments: failedPayments.value.length,
            averagePayment: completedPayments.value.length > 0 ? totalRevenue.value / completedPayments.value.length : 0,
            growthRate: Math.round(growthRate * 100) / 100,
            paymentsByType: getPaymentsByType(),
            paymentsByMethod: getPaymentsByMethod(),
            paymentsByStatus: getPaymentsByStatus()
        }
    }

    const getPaymentsByType = () => {
        const types = ['membership', 'lesson', 'court_rental', 'equipment', 'late_fee', 'refund', 'other']
        return types.reduce((acc, type) => {
            acc[type] = payments.value.filter(p => p.type === type).length
            return acc
        }, {} as Record<string, number>)
    }

    const getPaymentsByMethod = () => {
        const methods = ['credit_card', 'debit_card', 'bank_transfer', 'cash', 'check', 'digital_wallet']
        return methods.reduce((acc, method) => {
            acc[method] = payments.value.filter(p => p.method === method).length
            return acc
        }, {} as Record<string, number>)
    }

    const getPaymentsByStatus = () => {
        const statuses = ['completed', 'pending', 'failed', 'refunded', 'disputed', 'cancelled']
        return statuses.reduce((acc, status) => {
            acc[status] = payments.value.filter(p => p.status === status).length
            return acc
        }, {} as Record<string, number>)
    }

    const searchPayments = (query: string, filters?: {
        status?: Payment['status']
        type?: Payment['type']
        method?: Payment['method']
        dateFrom?: Date
        dateTo?: Date
        amountMin?: number
        amountMax?: number
    }) => {
        let filtered = payments.value

        // Text search
        if (query) {
            filtered = filtered.filter(payment =>
                payment.studentName.toLowerCase().includes(query.toLowerCase()) ||
                payment.description.toLowerCase().includes(query.toLowerCase()) ||
                payment.transactionId?.toLowerCase().includes(query.toLowerCase()) ||
                payment.invoiceNumber?.toLowerCase().includes(query.toLowerCase())
            )
        }

        // Apply filters
        if (filters) {
            if (filters.status) {
                filtered = filtered.filter(payment => payment.status === filters.status)
            }
            if (filters.type) {
                filtered = filtered.filter(payment => payment.type === filters.type)
            }
            if (filters.method) {
                filtered = filtered.filter(payment => payment.method === filters.method)
            }
            if (filters.dateFrom) {
                filtered = filtered.filter(payment => {
                    const paymentDate = payment.paidDate || payment.createdDate
                    return paymentDate >= filters.dateFrom!
                })
            }
            if (filters.dateTo) {
                filtered = filtered.filter(payment => {
                    const paymentDate = payment.paidDate || payment.createdDate
                    return paymentDate <= filters.dateTo!
                })
            }
            if (filters.amountMin !== undefined) {
                filtered = filtered.filter(payment => Math.abs(payment.amount) >= filters.amountMin!)
            }
            if (filters.amountMax !== undefined) {
                filtered = filtered.filter(payment => Math.abs(payment.amount) <= filters.amountMax!)
            }
        }

        return filtered
    }

    const clearError = () => {
        error.value = null
    }

    const reset = () => {
        payments.value = []
        paymentPlans.value = []
        invoices.value = []
        loading.value = false
        error.value = null
    }

    return {
        // State
        payments,
        paymentPlans,
        invoices,
        loading,
        error,

        // Getters
        completedPayments,
        pendingPayments,
        overduePayments,
        failedPayments,
        refundedPayments,
        totalRevenue,
        monthlyRevenue,
        overdueAmount,
        activePaymentPlans,
        unpaidInvoices,
        overdueInvoices,

        // Actions
        fetchPayments,
        fetchPaymentPlans,
        fetchInvoices,
        createPayment,
        updatePayment,
        processPayment,
        refundPayment,
        createInvoice,
        getPaymentsByStudent,
        getPaymentStatistics,
        searchPayments,
        clearError,
        reset
    }
})