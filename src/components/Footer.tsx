'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function Footer() {
  const [selectedCountry, setSelectedCountry] = useState('US')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [email, setEmail] = useState('')
  const [isNewsletterSubmitted, setIsNewsletterSubmitted] = useState(false)

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Newsletter signup logic would go here
    setIsNewsletterSubmitted(true)
    setEmail('')
    setTimeout(() => setIsNewsletterSubmitted(false), 3000)
  }

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Our Story', href: '/story' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press Room', href: '/press' },
    { name: 'Investor Relations', href: '/investors' },
    { name: 'Franchise Opportunities', href: '/franchise' },
  ]

  const customerServiceLinks = [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Order Status', href: '/order-status' },
    { name: 'Shipping & Delivery', href: '/shipping' },
    { name: 'Returns & Exchanges', href: '/returns' },
    { name: 'Product Care', href: '/care' },
  ]

  const productLinks = [
    { name: 'Fresh Fruit Arrangements', href: '/products?category=arrangements' },
    { name: 'Chocolate Covered Berries', href: '/products?category=chocolate' },
    { name: 'Gift Baskets', href: '/products?category=baskets' },
    { name: 'Occasions', href: '/products?category=occasions' },
    { name: 'Corporate Gifts', href: '/corporate' },
    { name: 'Seasonal Specials', href: '/seasonal' },
  ]

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'California Privacy Rights', href: '/ccpa' },
    { name: 'Do Not Sell My Info', href: '/do-not-sell' },
  ]

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  ]

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ]

  const socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com/ediblearrangements', icon: 'facebook' },
    { name: 'Instagram', href: 'https://instagram.com/ediblearrangements', icon: 'instagram' },
    { name: 'Twitter', href: 'https://twitter.com/ediblearrangements', icon: 'twitter' },
    { name: 'Pinterest', href: 'https://pinterest.com/ediblearrangements', icon: 'pinterest' },
    { name: 'YouTube', href: 'https://youtube.com/ediblearrangements', icon: 'youtube' },
  ]

  const paymentMethods = [
    'Visa', 'Mastercard', 'American Express', 'Discover', 'PayPal', 'Apple Pay', 'Google Pay'
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-primary-600">
        <div className="container-width responsive-padding py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Stay Fresh with Our Newsletter</h3>
              <p className="text-sm sm:text-base text-primary-100">Get exclusive offers, seasonal recipes, and gifting inspiration.</p>
            </div>
            <div className="w-full md:w-auto">
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 max-w-md mx-auto md:mx-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white text-sm sm:text-base"
                  required
                />
                <button
                  type="submit"
                  className="bg-white text-primary-600 px-4 sm:px-6 py-2 sm:py-3 font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <span>Subscribe</span>
                  <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </form>
              {isNewsletterSubmitted && (
                <p className="text-primary-100 text-xs sm:text-sm mt-2 text-center md:text-left">Thank you for subscribing!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-width section-padding py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">Edible Arrangements</h2>
                <p className="text-xs text-gray-400">Premium Gifts & Fresh Fruit</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Creating smiles and memorable moments with fresh fruit arrangements, chocolate treats, and gourmet gifts since 1999.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <PhoneIcon className="h-4 w-4 text-primary-500" />
                <span>1-800-EDIBLES (1-800-334-2537)</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <EnvelopeIcon className="h-4 w-4 text-primary-500" />
                <span>support@ediblearrangements.com</span>
              </div>
              <div className="flex items-start space-x-3 text-sm text-gray-300">
                <MapPinIcon className="h-4 w-4 text-primary-500 mt-0.5" />
                <span>95 Barnes Road<br />Wallingford, CT 06492</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-white mb-4">Our Products</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold text-white mb-4">Customer Service</h3>
            <ul className="space-y-2">
              {customerServiceLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Business Hours */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg">
              <h4 className="font-medium text-white mb-2 text-sm">Customer Support Hours</h4>
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Mon - Fri:</span>
                  <span>7AM - 12AM ET</span>
                </div>
                <div className="flex justify-between">
                  <span>Sat - Sun:</span>
                  <span>9AM - 9PM ET</span>
                </div>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-300 hover:text-white text-sm transition-colors duration-200">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Awards & Certifications */}
            <div className="mt-6">
              <h4 className="font-medium text-white mb-3 text-sm">Quality & Safety</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>HACCP Certified</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>FDA Registered</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-300">
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>100% Fresh Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* International & Social */}
          <div>
            <h3 className="font-semibold text-white mb-4">Connect With Us</h3>
            
            {/* Social Links */}
            <div className="flex space-x-3 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
                  aria-label={social.name}
                >
                  <span className="text-sm">
                    {social.icon === 'facebook' && '📘'}
                    {social.icon === 'instagram' && '📷'}
                    {social.icon === 'twitter' && '🐦'}
                    {social.icon === 'pinterest' && '📌'}
                    {social.icon === 'youtube' && '📺'}
                  </span>
                </a>
              ))}
            </div>

            {/* Country/Region Selector */}
            <div className="mb-4">
              <label htmlFor="country-select" className="block text-sm font-medium text-white mb-2">Country/Region</label>
              <div className="relative">
                <select
                  id="country-select"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Currency Selector */}
            <div className="mb-6">
              <label htmlFor="currency-select" className="block text-sm font-medium text-white mb-2">Currency</label>
              <div className="relative">
                <select
                  id="currency-select"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Mobile App */}
            <div>
              <h4 className="font-medium text-white mb-3 text-sm">Download Our App</h4>
              <div className="space-y-2">
                <a 
                  href="#" 
                  className="block w-full bg-gray-800 hover:bg-gray-700 transition-colors duration-200 rounded-lg p-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">📱</div>
                    <div>
                      <div className="text-xs text-gray-300">Download on the</div>
                      <div className="text-sm font-medium text-white">App Store</div>
                    </div>
                  </div>
                </a>
                <a 
                  href="#" 
                  className="block w-full bg-gray-800 hover:bg-gray-700 transition-colors duration-200 rounded-lg p-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">🤖</div>
                    <div>
                      <div className="text-xs text-gray-300">Get it on</div>
                      <div className="text-sm font-medium text-white">Google Play</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods & Security */}
      <div className="border-t border-gray-800">
        <div className="container-width section-padding py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div>
              <h4 className="text-sm font-medium text-white mb-2">We Accept</h4>
              <div className="flex items-center space-x-2 flex-wrap">
                {paymentMethods.map((method) => (
                  <div 
                    key={method}
                    className="bg-white rounded px-2 py-1 text-xs font-medium text-gray-900"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🔒</span>
                  </div>
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>PCI Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container-width section-padding py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              <p>&copy; 2024 Edible Arrangements, LLC. All rights reserved.</p>
              <p className="mt-1">Prices and availability subject to change without notice.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end space-x-6 text-sm">
              {legalLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 