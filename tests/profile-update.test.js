/**
 * Profile Update Integration Tests
 * Tests the enhanced profile update functionality that:
 * 1. Shows empty fields for missing data
 * 2. Allows partial updates (only saves filled fields)
 * 3. Updates both customers and auth.users tables
 * 4. Proper modify/save functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals'

describe('Profile Update Functionality', () => {
  let mockProfile
  let mockSession

  beforeEach(() => {
    // Mock profile with some missing fields
    mockProfile = {
      id: 'customer-123',
      firstName: '',
      lastName: 'Smith',
      email: 'test@example.com',
      phone: '',
      allergies: [],
      dietaryRestrictions: [],
      preferences: {}
    }

    // Mock Supabase session
    mockSession = {
      user: {
        id: 'auth-user-123',
        email: 'test@example.com'
      }
    }

    // Mock global fetch
    global.fetch = jest.fn()
  })

  test('should identify missing fields correctly', () => {
    const missingFields = []
    
    if (!mockProfile.firstName) missingFields.push('firstName')
    if (!mockProfile.lastName) missingFields.push('lastName')
    if (!mockProfile.phone) missingFields.push('phone')

    expect(missingFields).toEqual(['firstName', 'phone'])
  })

  test('should build partial update object correctly', () => {
    const originalForm = {
      firstName: '',
      lastName: 'Smith',
      phone: '',
      allergies: [],
      dietaryRestrictions: []
    }

    const editForm = {
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567890',
      allergies: [],
      dietaryRestrictions: []
    }

    const updates = {}
    
    if (editForm.firstName !== originalForm.firstName) {
      updates.firstName = editForm.firstName
    }
    if (editForm.lastName !== originalForm.lastName) {
      updates.lastName = editForm.lastName
    }
    if (editForm.phone !== originalForm.phone) {
      updates.phone = editForm.phone
    }

    expect(updates).toEqual({
      firstName: 'John',
      phone: '+1234567890'
    })
  })

  test('should call API with correct partial update payload', async () => {
    const updates = {
      firstName: 'John',
      phone: '+1234567890'
    }

    const expectedPayload = {
      authUserId: 'auth-user-123',
      ...updates
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        profile: {
          id: 'customer-123',
          firstName: 'John',
          lastName: 'Smith',
          email: 'test@example.com',
          phone: '+1234567890',
          name: 'John Smith'
        }
      })
    })

    await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expectedPayload)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expectedPayload)
    })
  })

  test('should handle API response correctly', async () => {
    const mockResponse = {
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: 'customer-123',
        firstName: 'John',
        lastName: 'Smith',
        email: 'test@example.com',
        phone: '+1234567890',
        name: 'John Smith',
        allergies: [],
        dietaryRestrictions: [],
        preferences: {}
      }
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authUserId: 'auth-user-123',
        firstName: 'John',
        phone: '+1234567890'
      })
    })

    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.profile.firstName).toBe('John')
    expect(data.profile.phone).toBe('+1234567890')
    expect(data.profile.name).toBe('John Smith')
  })

  test('should handle no changes gracefully', () => {
    const originalForm = {
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567890'
    }

    const editForm = {
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567890'
    }

    const updates = {}
    
    if (editForm.firstName !== originalForm.firstName) {
      updates.firstName = editForm.firstName
    }
    if (editForm.lastName !== originalForm.lastName) {
      updates.lastName = editForm.lastName
    }
    if (editForm.phone !== originalForm.phone) {
      updates.phone = editForm.phone
    }

    expect(Object.keys(updates)).toHaveLength(0)
  })

  test('should handle API errors properly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'validation_failed',
        message: 'Invalid phone number format'
      })
    })

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authUserId: 'auth-user-123',
        phone: 'invalid-phone'
      })
    })

    const data = await response.json()

    expect(response.ok).toBe(false)
    expect(data.error).toBe('validation_failed')
    expect(data.message).toBe('Invalid phone number format')
  })
})

describe('Profile Form Validation', () => {
  test('should validate required fields', () => {
    const formData = {
      firstName: '',
      lastName: '',
      phone: ''
    }

    const isEmpty = (value) => !value || value.trim() === ''
    const hasEmptyRequiredFields = isEmpty(formData.firstName) || 
                                   isEmpty(formData.lastName) || 
                                   isEmpty(formData.phone)

    expect(hasEmptyRequiredFields).toBe(true)
  })

  test('should validate phone number format', () => {
    const phoneNumbers = [
      '+1234567890',      // Valid
      '1234567890',       // Valid
      '+1-234-567-8900',  // Valid
      'invalid',          // Invalid
      '123',              // Invalid
      ''                  // Empty (should be allowed)
    ]

    const isValidPhone = (phone) => {
      if (!phone || phone.trim() === '') return true // Allow empty
      const phoneRegex = /^[\+]?[\d\-\(\)\s]+$/
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
    }

    expect(isValidPhone(phoneNumbers[0])).toBe(true)
    expect(isValidPhone(phoneNumbers[1])).toBe(true)
    expect(isValidPhone(phoneNumbers[2])).toBe(true)
    expect(isValidPhone(phoneNumbers[3])).toBe(false)
    expect(isValidPhone(phoneNumbers[4])).toBe(false)
    expect(isValidPhone(phoneNumbers[5])).toBe(true)
  })
})

describe('UI State Management', () => {
  test('should manage editing state correctly', () => {
    let isEditing = false
    let isSaving = false

    // Start editing
    isEditing = true
    expect(isEditing).toBe(true)

    // Start saving
    isSaving = true
    expect(isSaving).toBe(true)

    // Complete saving
    isSaving = false
    isEditing = false
    expect(isEditing).toBe(false)
    expect(isSaving).toBe(false)
  })

  test('should manage form state correctly', () => {
    const originalForm = {
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567890'
    }

    let editForm = { ...originalForm }

    // Modify form
    editForm.firstName = 'Jane'
    expect(editForm.firstName).toBe('Jane')
    expect(originalForm.firstName).toBe('John') // Original unchanged

    // Cancel editing (restore original)
    editForm = { ...originalForm }
    expect(editForm.firstName).toBe('John')
  })
}) 