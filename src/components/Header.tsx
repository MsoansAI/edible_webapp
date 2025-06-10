'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon, TruckIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import { supabase } from '@/lib/supabase'
import SearchBar from './SearchBar'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
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

  const navigation = [
    { name: 'Shop All', href: '/products' },
    { name: 'Arrangements', href: '/products?category=arrangements' },
    { name: 'Chocolate Berries', href: '/products?category=chocolate' },
    { name: 'Occasions', href: '/products?category=occasion' },
    { name: 'Corporate', href: '/corporate' },
  ]

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      {/* Trust Bar */}
      <div className="bg-primary-600 text-white">
        <div className="container-width section-padding">
          <div className="flex items-center justify-center py-3 text-sm font-medium">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <TruckIcon className="h-4 w-4 mr-2" />
                <span>Free delivery on orders over $65</span>
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
      <div className="container-width section-padding">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="w-12 h-12 bg-primary-600 flex items-center justify-center mr-4 transition-colors group-hover:bg-primary-700">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Edible Arrangements</h1>
                <p className="text-sm text-neutral-500 font-medium">Premium Gifts & Fresh Fruit</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="nav-link font-semibold"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label="Search products"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            {/* Account */}
            <button
              onClick={handleAccountClick}
              className="p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label={isAuthenticated ? "My Account" : "Sign In"}
            >
              <UserIcon className="h-6 w-6" />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingCartIcon className="h-6 w-6" />
              {isMounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold h-6 w-6 flex items-center justify-center min-w-[24px] px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 text-neutral-700 hover:text-primary-600 transition-colors duration-200 hover:bg-neutral-50 touch-target"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-neutral-200 py-4 animate-fade-in-up">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            
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