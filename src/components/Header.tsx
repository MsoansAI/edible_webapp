'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCartIcon, UserIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '@/store/cartStore'
import { supabase } from '@/lib/supabase'
import SearchBar from './SearchBar'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { getItemCount } = useCartStore()
  const itemCount = getItemCount()
  const router = useRouter()

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    checkAuth()

    // Listen for auth state changes
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top banner */}
      <div className="bg-primary-600 text-white text-xs sm:text-sm py-2">
        <div className="container-width section-padding text-center">
          <p>Free delivery on orders over $65 | Order by 2PM for same-day delivery</p>
        </div>
      </div>

      {/* Main header */}
      <div className="container-width section-padding">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 [.chat-is-open-and-squeezing_&]:md:w-8 [.chat-is-open-and-squeezing_&]:md:h-8 [.chat-is-open-and-squeezing_&]:md:mr-2 [.chat-is-open-and-squeezing_&]:lg:w-10 [.chat-is-open-and-squeezing_&]:lg:h-10 [.chat-is-open-and-squeezing_&]:lg:mr-3">
                <span className="text-white font-bold text-lg sm:text-xl [.chat-is-open-and-squeezing_&]:md:text-lg [.chat-is-open-and-squeezing_&]:lg:text-xl">E</span>
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 font-display [.chat-is-open-and-squeezing_&]:md:text-base [.chat-is-open-and-squeezing_&]:lg:text-xl">Edible Arrangements</h1>
                <p className="hidden sm:block [.chat-is-open-and-squeezing_&]:md:hidden [.chat-is-open-and-squeezing_&]:lg:block text-xs text-gray-500">Premium Gifts & Fresh Fruit</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation: Shows at lg+, hidden below. If chat squeezes, hidden on md. Stays visible on lg+ with squeeze. */}
          <nav className="hidden lg:flex space-x-3 xl:space-x-4 [.chat-is-open-and-squeezing_&]:md:hidden [.chat-is-open-and-squeezing_&]:lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 text-sm whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side icons: Compacted if chat is squeezing content (md+) */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 [.chat-is-open-and-squeezing_&]:md:space-x-1 [.chat-is-open-and-squeezing_&]:lg:space-x-3">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 [.chat-is-open-and-squeezing_&]:md:p-1.5 [.chat-is-open-and-squeezing_&]:lg:p-2"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6 [.chat-is-open-and-squeezing_&]:md:h-5 [.chat-is-open-and-squeezing_&]:md:w-5 [.chat-is-open-and-squeezing_&]:lg:h-6 [.chat-is-open-and-squeezing_&]:lg:w-6" />
            </button>

            {/* Account */}
            <button
              onClick={handleAccountClick}
              className="p-1.5 sm:p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 [.chat-is-open-and-squeezing_&]:md:p-1.5 [.chat-is-open-and-squeezing_&]:lg:p-2"
              aria-label={isAuthenticated ? "View Profile" : "Sign In"}
              title={isAuthenticated ? "View Profile" : "Sign In"}
            >
              <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 [.chat-is-open-and-squeezing_&]:md:h-5 [.chat-is-open-and-squeezing_&]:md:w-5 [.chat-is-open-and-squeezing_&]:lg:h-6 [.chat-is-open-and-squeezing_&]:lg:w-6" />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-1.5 sm:p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 [.chat-is-open-and-squeezing_&]:md:p-1.5 [.chat-is-open-and-squeezing_&]:lg:p-2"
              aria-label="Shopping cart"
            >
              <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 [.chat-is-open-and-squeezing_&]:md:h-5 [.chat-is-open-and-squeezing_&]:md:w-5 [.chat-is-open-and-squeezing_&]:lg:h-6 [.chat-is-open-and-squeezing_&]:lg:w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium [.chat-is-open-and-squeezing_&]:md:h-4 [.chat-is-open-and-squeezing_&]:md:w-4 [.chat-is-open-and-squeezing_&]:lg:h-5 [.chat-is-open-and-squeezing_&]:lg:w-5">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu button: Hidden at lg+, shown below. If chat squeezes, shown on md. */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden [.chat-is-open-and-squeezing_&]:md:block [.chat-is-open-and-squeezing_&]:lg:hidden p-1.5 sm:p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 [.chat-is-open-and-squeezing_&]:md:p-1.5 [.chat-is-open-and-squeezing_&]:lg:p-2"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 [.chat-is-open-and-squeezing_&]:md:h-5 [.chat-is-open-and-squeezing_&]:md:w-5 [.chat-is-open-and-squeezing_&]:lg:h-6 [.chat-is-open-and-squeezing_&]:lg:w-6" />
              ) : (
                <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6 [.chat-is-open-and-squeezing_&]:md:h-5 [.chat-is-open-and-squeezing_&]:md:w-5 [.chat-is-open-and-squeezing_&]:lg:h-6 [.chat-is-open-and-squeezing_&]:lg:w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation: Shown if menu open. Hidden at lg+, unless chat squeezes on md and menu is open. */}
        {isMobileMenuOpen && (
          <div className="lg:hidden [.chat-is-open-and-squeezing_&]:md:block [.chat-is-open-and-squeezing_&]:lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 mt-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
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