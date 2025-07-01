'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon, TruckIcon, PhoneIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import { supabase } from '@/lib/supabase'
import SearchBar from './SearchBar'
import Image from 'next/image'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isOccasionsOpen, setIsOccasionsOpen] = useState(false)
  const { getItemCount } = useCartStore()
  const itemCount = getItemCount()
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAuthenticated) {
      router.push('/profile')
    } else {
      router.push('/auth')
    }
  }

  // Updated navigation based on our actual database categories
  const navigation = [
    { name: 'Shop All', href: '/products' },
    { name: 'Fresh Fruit', href: '/products?category=Fresh%20Fruits%20Arrangements' },
    { name: 'Chocolate Berries', href: '/products?category=Chocolate%20Dipped%20Fruit' },
    { 
      name: 'Occasions', 
      href: '/products?type=occasion',
      hasDropdown: true,
      dropdownItems: [
        { name: 'Birthday', href: '/products?category=Birthday', count: 15 },
        { name: 'Congratulations', href: '/products?category=Congratulations', count: 65 },
        { name: 'Get Well', href: '/products?category=Get%20Well', count: 31 },
        { name: 'Graduation', href: '/products?category=Graduation', count: 23 },
        { name: 'New Baby', href: '/products?category=New%20Baby', count: 46 },
        { name: 'Just Because', href: '/products?category=Just%20because', count: 49 },
        { name: 'Sympathy', href: '/products?category=Sympathy', count: 18 },
        { name: 'Mother\'s Day', href: '/products?category=Mother\'s%20Day', count: 9 },
        { name: '4th of July', href: '/products?category=4th%20of%20July', count: 30 },
      ]
    },
    { name: 'Corporate', href: '/corporate' },
  ]

  // Product type categories for secondary navigation
  const productTypes = [
    { name: 'Gift Sets', href: '/products?category=Gift%20Sets', count: 18 },
    { name: 'Platters & Boards', href: '/products?category=Platters%20%26%20Boards', count: 6 },
    { name: 'Edible Bakeshop', href: '/products?category=Edible%20Bakeshop', count: 8 },
  ]

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      {/* Trust Bar */}
      <div className="bg-primary-600 text-white">
        <div className="container-width responsive-padding">
          <div className="flex items-center justify-center py-3 mobile-text font-medium">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="flex items-center">
                <TruckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">Free delivery on orders over $65</span>
                <span className="xs:hidden">Free $65+</span>
              </div>
              <div className="hidden sm:flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span>Order by 2PM for same-day delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-width responsive-padding">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                className="block h-12 w-auto"
                src="https://jfjvqylmjzprnztbfhpa.supabase.co/storage/v1/object/public/assets//Logo.png"
                alt="Edible Arrangements"
                width={180}
                height={48}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.hasDropdown ? (
                  <div className="relative">
                    <button
                      onMouseEnter={() => setIsOccasionsOpen(true)}
                      onMouseLeave={() => setIsOccasionsOpen(false)}
                      className="nav-link font-semibold flex items-center"
                    >
                      {item.name}
                      <ChevronDownIcon className="h-4 w-4 ml-1" />
                    </button>
                    
                    {/* Occasions Dropdown */}
                    {isOccasionsOpen && (
                      <div 
                        className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-neutral-200 py-4 z-50"
                        onMouseEnter={() => setIsOccasionsOpen(true)}
                        onMouseLeave={() => setIsOccasionsOpen(false)}
                      >
                        <div className="px-4 py-2 border-b border-neutral-100">
                          <h3 className="font-semibold text-neutral-900 mb-1">Popular Occasions</h3>
                          <p className="text-sm text-neutral-500">Perfect for every celebration</p>
                        </div>
                        
                        <div className="py-2">
                          {item.dropdownItems && item.dropdownItems.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group"
                            >
                              <div className="flex items-center">
                                <span className="text-lg mr-3">
                                  {dropdownItem.name === 'Birthday' && '🎂'}
                                  {dropdownItem.name === 'Congratulations' && '🎉'}
                                  {dropdownItem.name === 'Get Well' && '🌻'}
                                  {dropdownItem.name === 'Graduation' && '🎓'}
                                  {dropdownItem.name === 'New Baby' && '👶'}
                                  {dropdownItem.name === 'Just Because' && '💕'}
                                  {dropdownItem.name === 'Sympathy' && '🕊️'}
                                  {dropdownItem.name === 'Mother\'s Day' && '🌹'}
                                  {dropdownItem.name === '4th of July' && '🇺🇸'}
                                </span>
                                <span className="font-medium text-neutral-700 group-hover:text-primary-600">
                                  {dropdownItem.name}
                                </span>
                              </div>
                              <span className="text-sm text-neutral-400 group-hover:text-primary-500">
                                {dropdownItem.count} items
                              </span>
                            </Link>
                          ))}
                        </div>
                        
                        <div className="pt-2 border-t border-neutral-100">
                          <Link
                            href="/products?type=occasion"
                            className="flex items-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            View All Occasions →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="nav-link font-semibold"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label="Search products"
            >
              <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Account */}
            <button
              onClick={handleAccountClick}
              className="p-2 sm:p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label={isAuthenticated ? "My Account" : "Sign In"}
            >
              <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 sm:p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              {isMounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center min-w-[20px] sm:min-w-[24px] px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 sm:p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 py-4 animate-fade-in-up">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 font-medium transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  
                  {/* Mobile Occasions Submenu */}
                  {item.hasDropdown && item.dropdownItems && (
                    <div className="ml-4 mt-2 space-y-1 border-l-2 border-neutral-100 pl-4">
                      {item.dropdownItems.slice(0, 6).map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          href={dropdownItem.href}
                          className="block px-2 py-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="text-sm mr-2">
                            {dropdownItem.name === 'Birthday' && '🎂'}
                            {dropdownItem.name === 'Congratulations' && '🎉'}
                            {dropdownItem.name === 'Get Well' && '🌻'}
                            {dropdownItem.name === 'Graduation' && '🎓'}
                            {dropdownItem.name === 'New Baby' && '👶'}
                            {dropdownItem.name === 'Just Because' && '💕'}
                          </span>
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            
            {/* Mobile Product Types */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <h4 className="px-4 font-medium text-neutral-900 mb-3">Product Types</h4>
              <div className="space-y-1">
                {productTypes.map((type) => (
                  <Link
                    key={type.name}
                    href={type.href}
                    className="block px-4 py-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {type.name} ({type.count})
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Mobile Trust Indicators */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              <div className="grid grid-cols-1 gap-3 px-4">
                <div className="flex items-center text-sm text-neutral-600">
                  <TruckIcon className="h-4 w-4 mr-3 text-primary-600" />
                  <span>Free delivery on orders over $65</span>
                </div>
                <div className="flex items-center text-sm text-neutral-600">
                  <PhoneIcon className="h-4 w-4 mr-3 text-primary-600" />
                  <span>Same-day delivery available</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchBar
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </header>
  )
} 