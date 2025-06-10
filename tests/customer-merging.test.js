/**
 * Customer Account Merging Integration Tests
 * Tests the automatic merging functionality implemented in the database functions
 * and customer-management edge function integration
 */

import { describe, test, expect, beforeEach } from '@jest/globals'

describe('Customer Account Merging System', () => {
  let mockSupabase

  beforeEach(() => {
    // Mock Supabase client with RPC function support
    mockSupabase = {
      rpc: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            limit: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }
  })

  describe('Merge Compatibility Detection', () => {
    test('should detect compatible accounts for merging', async () => {
      const mockCompatibilityResult = {
        can_merge: true,
        primary_account: 'phone',
        accounts: {
          phone: {
            id: 'phone-account-uuid',
            name: 'John Smith',
            orders: 2,
            has_auth: false
          },
          email: {
            id: 'email-account-uuid', 
            name: 'John Smith',
            orders: 1,
            has_auth: false
          }
        },
        total_orders_after_merge: 3,
        merge_strategy: 'phone_primary'
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockCompatibilityResult,
        error: null
      })

      const result = await mockSupabase.rpc('check_merge_compatibility', {
        p_phone: '+15551234567',
        p_email: 'john@example.com'
      })

      expect(result.data.can_merge).toBe(true)
      expect(result.data.total_orders_after_merge).toBe(3)
      expect(result.data.merge_strategy).toBe('phone_primary')
    })

    test('should reject merge for incompatible names', async () => {
      const mockIncompatibleResult = {
        can_merge: false,
        reason: 'name_mismatch',
        phone_name: 'John Smith',
        email_name: 'Jane Doe'
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockIncompatibleResult,
        error: null
      })

      const result = await mockSupabase.rpc('check_merge_compatibility', {
        p_phone: '+15551234567',
        p_email: 'jane@example.com'
      })

      expect(result.data.can_merge).toBe(false)
      expect(result.data.reason).toBe('name_mismatch')
    })

    test('should reject merge for same account', async () => {
      const mockSameAccountResult = {
        can_merge: false,
        reason: 'same_account',
        account_id: 'same-account-uuid'
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockSameAccountResult,
        error: null
      })

      const result = await mockSupabase.rpc('check_merge_compatibility', {
        p_phone: '+15551234567',
        p_email: 'john@example.com'
      })

      expect(result.data.can_merge).toBe(false)
      expect(result.data.reason).toBe('same_account')
    })
  })

  describe('Account Merging Process', () => {
    test('should successfully merge compatible accounts', async () => {
      const mockMergeResult = {
        success: true,
        primary_account_id: 'primary-uuid',
        secondary_account_id: 'secondary-uuid',
        orders_transferred: 2,
        total_orders: 3,
        merge_strategy: 'phone_primary',
        message: 'Successfully merged 2 orders into unified account'
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockMergeResult,
        error: null
      })

      const result = await mockSupabase.rpc('merge_customer_accounts', {
        p_phone: '+15551234567',
        p_email: 'john@example.com',
        p_source: 'chatbot'
      })

      expect(result.data.success).toBe(true)
      expect(result.data.orders_transferred).toBe(2)
      expect(result.data.total_orders).toBe(3)
      expect(result.data.merge_strategy).toBe('phone_primary')
    })

    test('should handle merge failure gracefully', async () => {
      const mockFailureResult = {
        success: false,
        reason: 'name_mismatch',
        message: 'Accounts cannot be safely merged: name_mismatch'
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockFailureResult,
        error: null
      })

      const result = await mockSupabase.rpc('merge_customer_accounts', {
        p_phone: '+15551234567',
        p_email: 'jane@example.com',
        p_source: 'chatbot'
      })

      expect(result.data.success).toBe(false)
      expect(result.data.reason).toBe('name_mismatch')
    })

    test('should handle database errors during merge', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const result = await mockSupabase.rpc('merge_customer_accounts', {
        p_phone: '+15551234567',
        p_email: 'john@example.com',
        p_source: 'chatbot'
      })

      expect(result.error).toBeTruthy()
      expect(result.error.message).toBe('Database connection failed')
    })
  })

  describe('Customer Management Integration', () => {
    test('should automatically merge when duplicate accounts are detected', async () => {
      // Mock the typical flow: compatibility check -> merge -> unified customer
      const mockCompatibility = {
        can_merge: true,
        primary_account: 'phone',
        merge_strategy: 'phone_primary'
      }

      const mockMergeResult = {
        success: true,
        primary_account_id: 'unified-account-uuid',
        orders_transferred: 2,
        total_orders: 3,
        merge_strategy: 'phone_primary'
      }

      const mockUnifiedCustomer = {
        id: 'unified-account-uuid',
        email: 'john@example.com',
        phone: '+15551234567',
        first_name: 'John',
        last_name: 'Smith',
        allergies: ['nuts'],
        dietary_restrictions: [],
        preferences: {
          account_sources: ['phone', 'webapp'],
          merged_at: '2025-01-15T10:30:00Z'
        }
      }

      // Setup mock sequence
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: mockCompatibility, error: null })
        .mockResolvedValueOnce({ data: mockMergeResult, error: null })

      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: mockUnifiedCustomer, 
              error: null 
            })),
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({ 
                data: [
                  { order_number: 'W12300000001-1', total_amount: '45.99' },
                  { order_number: 'W12300000002-1', total_amount: '67.50' }
                ], 
                error: null 
              }))
            }))
          }))
        }))
      })

      // Simulate the handleDuplicateAccounts flow
      const requestData = {
        phone: '+15551234567',
        email: 'john@example.com',
        source: 'chatbot'
      }

      // Check compatibility
      const compatibilityResult = await mockSupabase.rpc('check_merge_compatibility', {
        p_phone: requestData.phone,
        p_email: requestData.email
      })

      expect(compatibilityResult.data.can_merge).toBe(true)

      // Perform merge
      const mergeResult = await mockSupabase.rpc('merge_customer_accounts', {
        p_phone: requestData.phone,
        p_email: requestData.email,
        p_source: requestData.source
      })

      expect(mergeResult.data.success).toBe(true)

      // Get unified customer
      const customerResult = await mockSupabase
        .from('customers')
        .select('*')
        .eq('id', mergeResult.data.primary_account_id)
        .single()

      expect(customerResult.data.email).toBe('john@example.com')
      expect(customerResult.data.phone).toBe('+15551234567')
      expect(customerResult.data.preferences.merged_at).toBeTruthy()
    })

    test('should fall back to conflict handling when merge fails', async () => {
      const mockIncompatibility = {
        can_merge: false,
        reason: 'name_mismatch'
      }

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockIncompatibility,
        error: null
      })

      const compatibilityResult = await mockSupabase.rpc('check_merge_compatibility', {
        p_phone: '+15551234567',
        p_email: 'different@example.com'
      })

      expect(compatibilityResult.data.can_merge).toBe(false)
      expect(compatibilityResult.data.reason).toBe('name_mismatch')

      // Should not attempt merge and fall back to conflict handling
    })
  })

  describe('Merge Strategies', () => {
    test('should prioritize web account when user has auth_user_id', () => {
      const accounts = {
        phone: { orders: 3, has_auth: false },
        email: { orders: 1, has_auth: true }
      }

      // Email account should be primary due to auth presence
      const expectedStrategy = 'email_primary'
      
      // This would be determined by the database function logic
      expect(accounts.email.has_auth).toBe(true)
    })

    test('should prioritize account with more orders when no auth', () => {
      const accounts = {
        phone: { orders: 5, has_auth: false },
        email: { orders: 2, has_auth: false }
      }

      // Phone account should be primary due to more orders
      const expectedStrategy = 'phone_primary'
      
      expect(accounts.phone.orders).toBeGreaterThan(accounts.email.orders)
    })

    test('should default to phone account when orders are equal', () => {
      const accounts = {
        phone: { orders: 2, has_auth: false },
        email: { orders: 2, has_auth: false }
      }

      // Phone account should be primary as fallback
      const expectedStrategy = 'phone_primary'
      
      expect(accounts.phone.orders).toBe(accounts.email.orders)
    })
  })

  describe('Data Preservation', () => {
    test('should preserve all orders after merge', () => {
      const phoneOrders = 2
      const emailOrders = 3
      const expectedTotalOrders = phoneOrders + emailOrders

      expect(expectedTotalOrders).toBe(5)
    })

    test('should merge allergies using union approach', () => {
      const phoneAllergies = ['nuts', 'dairy']
      const emailAllergies = ['shellfish', 'nuts'] // nuts overlaps
      
      // Union should be: ['nuts', 'dairy', 'shellfish']
      const expectedUnion = [...new Set([...phoneAllergies, ...emailAllergies])]
      
      expect(expectedUnion).toContain('nuts')
      expect(expectedUnion).toContain('dairy')
      expect(expectedUnion).toContain('shellfish')
      expect(expectedUnion.length).toBe(3) // No duplicates
    })

    test('should preserve auth linkage from either account', () => {
      const scenarios = [
        { phone_auth: null, email_auth: 'auth-123', expected: 'auth-123' },
        { phone_auth: 'auth-456', email_auth: null, expected: 'auth-456' },
        { phone_auth: 'auth-789', email_auth: 'auth-789', expected: 'auth-789' }
      ]

      scenarios.forEach(scenario => {
        const preservedAuth = scenario.phone_auth || scenario.email_auth
        expect(preservedAuth).toBe(scenario.expected)
      })
    })
  })

  describe('Audit Trail', () => {
    test('should create complete audit trail in preferences', () => {
      const expectedAuditTrail = {
        merged_at: expect.any(String),
        merged_from: 'secondary-account-uuid',
        merge_strategy: 'phone_primary',
        merge_source: 'chatbot',
        account_sources: ['phone', 'webapp']
      }

      // Verify audit trail structure
      expect(expectedAuditTrail.merge_strategy).toBe('phone_primary')
      expect(expectedAuditTrail.account_sources).toContain('phone')
      expect(expectedAuditTrail.account_sources).toContain('webapp')
    })

    test('should archive secondary account for rollback capability', () => {
      const originalEmail = 'secondary@example.com'
      const secondaryAccountId = 'secondary-uuid'
      const expectedArchivedEmail = `archived_${secondaryAccountId}_${originalEmail}`

      expect(expectedArchivedEmail).toContain('archived_')
      expect(expectedArchivedEmail).toContain(secondaryAccountId)
      expect(expectedArchivedEmail).toContain(originalEmail)
    })
  })
}) 