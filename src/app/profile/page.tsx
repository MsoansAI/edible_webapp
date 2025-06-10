'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  UserIcon, 
  ShoppingBagIcon, 
  MapPinIcon, 
  ExclamationTriangleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  CreditCardIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  BellIcon,
  CogIcon,
  GiftIcon,
  StarIcon,
  LanguageIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CustomerProfile {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  phone: string
  allergies: string[]
  dietaryRestrictions: string[]
  preferences: any
  stats: {
    totalOrders: number
    totalSpent: string
    memberSince: string
    lastOrderDate: string
  }
  tier: string
}

interface Order {
  orderNumber: string
  status: string
  total: string
  date: string
  scheduledDate: string
  fulfillmentType: string
  itemsSummary: string
  itemCount: number
}

interface Address {
  id: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    allergies: [] as string[],
    dietaryRestrictions: [] as string[]
  })
  const [originalForm, setOriginalForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    allergies: [] as string[],
    dietaryRestrictions: [] as string[]
  })
  const [newAllergy, setNewAllergy] = useState('')
  const [newDietary, setNewDietary] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    orderUpdates: true,
    language: 'en',
    currency: 'USD'
  })
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadProfile()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Immediately redirect if user signs out or session expires
        router.replace('/auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Immediately redirect without showing any content
        router.replace('/auth')
        return
      }

      setIsAuthenticated(true)
      await loadProfile(session.user.id)
    } catch (error) {
      console.error('Error checking auth:', error)
      // Redirect on any auth error
      router.replace('/auth')
    }
  }

  const loadProfile = async (authUserId: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authUserId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProfile(data.profile)
          setOrders(data.orderHistory || [])
          setAddresses(data.addresses || [])
          const formData = {
            firstName: data.profile.firstName || '',
            lastName: data.profile.lastName || '',
            phone: data.profile.phone || '',
            allergies: data.profile.allergies || [],
            dietaryRestrictions: data.profile.dietaryRestrictions || []
          }
          setEditForm(formData)
          setOriginalForm(formData)
          // Set preferences from profile or defaults
          setPreferences({
            emailNotifications: data.profile.preferences?.emailNotifications ?? true,
            smsNotifications: data.profile.preferences?.smsNotifications ?? false,
            marketingEmails: data.profile.preferences?.marketingEmails ?? true,
            orderUpdates: data.profile.preferences?.orderUpdates ?? true,
            language: data.profile.preferences?.language ?? 'en',
            currency: data.profile.preferences?.currency ?? 'USD'
          })
        } else {
          toast.error('Could not load profile data')
        }
      } else {
        toast.error('Failed to load profile')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Error loading profile data')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      // Get current session to get authUserId
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Please sign in again to update your profile')
        return
      }

      // Build update object with only changed fields
      const updates: any = {}
      
      if (editForm.firstName !== originalForm.firstName) {
        updates.firstName = editForm.firstName
      }
      if (editForm.lastName !== originalForm.lastName) {
        updates.lastName = editForm.lastName
      }
      if (editForm.phone !== originalForm.phone) {
        updates.phone = editForm.phone
      }
      if (JSON.stringify(editForm.allergies) !== JSON.stringify(originalForm.allergies)) {
        updates.allergies = editForm.allergies
      }
      if (JSON.stringify(editForm.dietaryRestrictions) !== JSON.stringify(originalForm.dietaryRestrictions)) {
        updates.dietaryRestrictions = editForm.dietaryRestrictions
      }

      // Only make API call if there are changes
      if (Object.keys(updates).length === 0) {
        toast.success('No changes to save')
        setIsEditing(false)
        return
      }

      // Call the enhanced API that updates both customers and auth tables
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authUserId: session.user.id,
          ...updates
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update local state with the returned profile
        setProfile({
          ...profile,
          ...data.profile,
          name: data.profile.name
        })

        // Update the original form state to match current
        setOriginalForm(editForm)
        setIsEditing(false)
        
        const changedFields = Object.keys(updates)
        toast.success(`Updated ${changedFields.join(', ')} successfully!`)
      } else {
        throw new Error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const cancelEditing = () => {
    setEditForm(originalForm)
    setIsEditing(false)
    setNewAllergy('')
    setNewDietary('')
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !editForm.allergies.includes(newAllergy.trim())) {
      setEditForm({
        ...editForm,
        allergies: [...editForm.allergies, newAllergy.trim()]
      })
      setNewAllergy('')
    }
  }

  const addDietary = () => {
    if (newDietary.trim() && !editForm.dietaryRestrictions.includes(newDietary.trim())) {
      setEditForm({
        ...editForm,
        dietaryRestrictions: [...editForm.dietaryRestrictions, newDietary.trim()]
      })
      setNewDietary('')
    }
  }

  const removeAllergy = (allergy: string) => {
    setEditForm({
      ...editForm,
      allergies: editForm.allergies.filter(a => a !== allergy)
    })
  }

  const removeDietary = (restriction: string) => {
    setEditForm({
      ...editForm,
      dietaryRestrictions: editForm.dietaryRestrictions.filter(d => d !== restriction)
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />
      case 'shipped':
      case 'out_for_delivery':
        return <TruckIcon className="h-5 w-5 text-blue-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'vip': return 'bg-yellow-100 text-yellow-800'
      case 'returning': return 'bg-blue-100 text-blue-800'
      case 'new': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

  // Don't show anything if not authenticated
  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find your profile information.</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-width section-padding py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">My Account</h1>
              <p className="text-gray-600 mt-1">Manage your profile and view order history</p>
            </div>
            <button
              onClick={handleSignOut}
              className="btn-secondary text-sm px-4 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="container-width section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-10 w-10 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.name || profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`.trim()
                    : profile.email.split('@')[0]
                  }
                </h2>
                <p className="text-gray-600">{profile.email}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getTierColor(profile.tier || 'new')}`}>
                  {profile.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'New'} Customer
                </span>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'overview' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon className="h-5 w-5 inline mr-3" />
                  Profile Overview
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'orders' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBagIcon className="h-5 w-5 inline mr-3" />
                  Order History
                </button>
                <button
                  onClick={() => setActiveTab('allergies')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'allergies' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ExclamationTriangleIcon className="h-5 w-5 inline mr-3" />
                  Allergies & Dietary
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'addresses' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPinIcon className="h-5 w-5 inline mr-3" />
                  Addresses
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'preferences' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BellIcon className="h-5 w-5 inline mr-3" />
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'security' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheckIcon className="h-5 w-5 inline mr-3" />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'rewards' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <GiftIcon className="h-5 w-5 inline mr-3" />
                  Rewards & Points
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="card p-6 text-center">
                    <ShoppingBagIcon className="h-8 w-8 text-primary-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900">{profile.stats?.totalOrders || 0}</div>
                    <div className="text-gray-600">Total Orders</div>
                  </div>
                  <div className="card p-6 text-center">
                    <CreditCardIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900">${profile.stats?.totalSpent || '0.00'}</div>
                    <div className="text-gray-600">Total Spent</div>
                  </div>
                  <div className="card p-6 text-center">
                    <StarIcon className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-gray-600">Reward Points</div>
                  </div>
                  <div className="card p-6 text-center">
                    <CalendarIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <div className="text-sm font-bold text-gray-900">
                      {profile.stats?.lastOrderDate ? formatDate(profile.stats.lastOrderDate) : 'Welcome!'}
                    </div>
                    <div className="text-gray-600">
                      {profile.stats?.lastOrderDate ? 'Last Order' : 'New Customer'}
                    </div>
                  </div>
                </div>

                {/* Welcome Banner for New Customers */}
                {(!profile.stats?.totalOrders || profile.stats.totalOrders === 0) && (
                  <div className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                          <GiftIcon className="h-8 w-8 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome to Edible Arrangements!</h3>
                        <p className="text-gray-700 mb-3">
                          Complete your profile to get personalized recommendations and a better shopping experience.
                        </p>
                        <div className="flex space-x-3">
                          <button 
                            onClick={() => router.push('/products')}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            Start Shopping
                          </button>
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="btn-secondary text-sm px-4 py-2"
                          >
                            Complete Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Information */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Profile Information</h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary text-sm px-4 py-2 flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Modify
                      </button>
                    ) : (
                      <button
                        onClick={cancelEditing}
                        className="btn-secondary text-sm px-4 py-2 flex items-center"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            placeholder="Enter your first name"
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            placeholder="Enter your last name"
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="Enter your phone number (e.g., +1234567890)"
                          className="input-field"
                        />
                      </div>
                      
                      {/* Save/Cancel buttons */}
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button 
                          onClick={updateProfile} 
                          disabled={isSaving}
                          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button 
                          onClick={cancelEditing} 
                          disabled={isSaving}
                          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Check if profile is incomplete */}
                      {(!profile.firstName || !profile.lastName || !profile.phone) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
                            <div>
                              <h4 className="text-sm font-medium text-yellow-800">Complete Your Profile</h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                Add missing information to get personalized recommendations and better support.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          {profile.firstName ? (
                            <p className="mt-1 text-gray-900 font-medium">{profile.firstName}</p>
                          ) : (
                            <p className="mt-1 text-gray-500 italic flex items-center">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Click modify to add
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          {profile.lastName ? (
                            <p className="mt-1 text-gray-900 font-medium">{profile.lastName}</p>
                          ) : (
                            <p className="mt-1 text-gray-500 italic flex items-center">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Click modify to add
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-gray-900 font-medium">{profile.email}</p>
                          <p className="text-xs text-gray-500 mt-1">This is your login email</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                          {profile.phone ? (
                            <p className="mt-1 text-gray-900 font-medium">{profile.phone}</p>
                          ) : (
                            <p className="mt-1 text-gray-500 italic flex items-center">
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Click modify to add
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Member Since</label>
                          <p className="mt-1 text-gray-900">
                            {profile.stats?.memberSince ? formatDate(profile.stats.memberSince) : 'Recently joined'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Customer Tier</label>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getTierColor(profile.tier || 'new')}`}>
                            {profile.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : 'New'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order History</h3>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
                    <p className="text-gray-600 mb-6">You haven't placed any orders with us yet.</p>
                    <button 
                      onClick={() => router.push('/products')}
                      className="btn-primary"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(order.status)}
                            <div>
                              <h4 className="font-medium text-gray-900">Order #{order.orderNumber}</h4>
                              <p className="text-sm text-gray-600">{formatDate(order.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">${order.total}</div>
                            <div className="text-sm text-gray-600 capitalize">{order.status.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{order.itemsSummary}</p>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                          {order.scheduledDate && (
                            <span>Scheduled: {formatDate(order.scheduledDate)}</span>
                          )}
                          <span className="capitalize">{order.fulfillmentType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Allergies & Dietary Tab */}
            {activeTab === 'allergies' && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Allergies & Dietary Restrictions</h3>
                
                {!isEditing ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Manage your allergies and dietary restrictions to ensure safe product recommendations.</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        <PencilIcon className="h-4 w-4 inline mr-2" />
                        Edit
                      </button>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Allergies</h4>
                      {profile.allergies.length === 0 ? (
                        <p className="text-gray-500 italic">No allergies recorded</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile.allergies.map((allergy, index) => (
                            <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Dietary Restrictions</h4>
                      {profile.dietaryRestrictions.length === 0 ? (
                        <p className="text-gray-500 italic">No dietary restrictions recorded</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {profile.dietaryRestrictions.map((restriction, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {restriction}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Edit Allergies */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Allergies</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editForm.allergies.map((allergy, index) => (
                          <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                            {allergy}
                            <button
                              onClick={() => removeAllergy(allergy)}
                              className="ml-2 hover:text-red-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          placeholder="Add allergy (e.g., nuts, dairy)"
                          className="input-field flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                        />
                        <button onClick={addAllergy} className="btn-primary px-4">
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Edit Dietary Restrictions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Dietary Restrictions</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editForm.dietaryRestrictions.map((restriction, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                            {restriction}
                            <button
                              onClick={() => removeDietary(restriction)}
                              className="ml-2 hover:text-blue-600"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newDietary}
                          onChange={(e) => setNewDietary(e.target.value)}
                          placeholder="Add dietary restriction (e.g., vegetarian, gluten-free)"
                          className="input-field flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && addDietary()}
                        />
                        <button onClick={addDietary} className="btn-primary px-4">
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button onClick={updateProfile} className="btn-primary">
                        Save Changes
                      </button>
                      <button onClick={() => setIsEditing(false)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="card p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Saved Addresses</h3>
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h4>
                    <p className="text-gray-600 mb-6">Add addresses to make checkout faster.</p>
                    <button className="btn-primary">
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPinIcon className="h-4 w-4 text-gray-500" />
                            {address.is_default && (
                              <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900">
                            {address.address_line_1}
                            {address.address_line_2 && `, ${address.address_line_2}`}
                          </p>
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.zip_code}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-primary-600 hover:text-primary-700">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                {/* Notification Preferences */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive updates about your orders and account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-600">Get delivery updates via text message</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.smsNotifications}
                          onChange={(e) => setPreferences({...preferences, smsNotifications: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Marketing Emails</h4>
                        <p className="text-sm text-gray-600">Special offers, new products, and promotions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketingEmails}
                          onChange={(e) => setPreferences({...preferences, marketingEmails: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Language & Regional Settings */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Language & Region</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                        className="input-field"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
                        className="input-field"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Section */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Password & Security</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Change Password</h4>
                      <p className="text-sm text-gray-600 mb-4">Ensure your account is secure with a strong password</p>
                      <button className="btn-secondary text-sm px-4 py-2">
                        Change Password
                      </button>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                      <button className="btn-secondary text-sm px-4 py-2">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Privacy Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Data Usage</h4>
                      <p className="text-sm text-gray-600 mb-4">Control how we use your data to improve your experience</p>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                          <span className="ml-2 text-sm text-gray-700">Allow analytics to improve our service</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                          <span className="ml-2 text-sm text-gray-700">Personalized product recommendations</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                {/* Rewards Overview */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Rewards & Loyalty</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">0</div>
                      <div className="text-sm text-gray-600">Points Available</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <StarIcon className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Start Earning Rewards!</h4>
                        <p className="text-gray-700 mb-3">
                          Earn 1 point for every $1 spent. Get 100 points and receive $5 off your next order!
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-primary-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">0 / 100 points to next reward</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <GiftIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Birthday Rewards</div>
                      <div className="text-sm text-gray-600">Special discounts on your birthday</div>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <TruckIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Free Shipping</div>
                      <div className="text-sm text-gray-600">On orders over $65</div>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <StarIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <div className="font-medium text-gray-900">Early Access</div>
                      <div className="text-sm text-gray-600">To new products and sales</div>
                    </div>
                  </div>
                </div>

                {/* Rewards History */}
                <div className="card p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Rewards History</h3>
                  <div className="text-center py-12">
                    <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No rewards history yet</h4>
                    <p className="text-gray-600 mb-6">Start shopping to earn your first rewards!</p>
                    <button 
                      onClick={() => router.push('/products')}
                      className="btn-primary"
                    >
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 