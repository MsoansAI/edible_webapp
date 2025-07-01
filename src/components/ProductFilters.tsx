'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { Category } from '@/types/database'

interface ProductFiltersProps {
  categories: Category[]
  totalCount?: number
}

interface CategoryGroup {
  type: string
  categories: Category[]
  label: string
  icon?: string
}

export default function ProductFilters({ categories, totalCount = 0 }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedSections, setExpandedSections] = useState({
    occasions: true,
    dietary: false,
    seasonal: false,
    price: true,
  })

  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  })

  // Group categories by type
  const categoryGroups: CategoryGroup[] = [
    {
      type: 'occasion',
      label: 'Occasions',
      categories: categories.filter(cat => cat.type === 'occasion'),
      icon: '🎉'
    },
    {
      type: 'dietary',
      label: 'Dietary Options',
      categories: categories.filter(cat => cat.type === 'dietary'),
      icon: '🥗'
    },
    {
      type: 'season',
      label: 'Seasonal',
      categories: categories.filter(cat => cat.type === 'season'),
      icon: '🌸'
    }
  ]

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to first page when filtering
    params.delete('page')
    
    router.push(`/products?${params.toString()}`)
  }

  const handlePriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (priceRange.min) {
      params.set('minPrice', priceRange.min)
    } else {
      params.delete('minPrice')
    }
    
    if (priceRange.max) {
      params.set('maxPrice', priceRange.max)
    } else {
      params.delete('maxPrice')
    }
    
    params.delete('page')
    router.push(`/products?${params.toString()}`)
  }

  const clearAllFilters = () => {
    setPriceRange({ min: '', max: '' })
    router.push('/products')
  }

  const currentCategory = searchParams.get('category')
  const currentMinPrice = searchParams.get('minPrice')
  const currentMaxPrice = searchParams.get('maxPrice')

  const priceRanges = [
    { label: 'Under $30', min: '', max: '30' },
    { label: '$30 - $50', min: '30', max: '50' },
    { label: '$50 - $75', min: '50', max: '75' },
    { label: '$75 - $100', min: '75', max: '100' },
    { label: 'Over $100', min: '100', max: '' },
  ]

  // Count active filters
  const activeFiltersCount = [currentCategory, currentMinPrice, currentMaxPrice].filter(Boolean).length

  return (
    <div className="space-y-6">
      
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-neutral-600" />
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {activeFiltersCount}
            </span>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
        <span className="font-medium text-neutral-900">{totalCount}</span> products found
      </div>

      {/* Category Groups */}
      {categoryGroups.map((group) => {
        const sectionKey = group.type as keyof typeof expandedSections
        const isExpanded = expandedSections[sectionKey]
        
        if (group.categories.length === 0) return null

        return (
          <div key={group.type} className="border-b border-neutral-200 pb-6">
            <button
              onClick={() => toggleSection(sectionKey)}
              className="flex items-center justify-between w-full text-left hover:text-primary-600 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{group.icon}</span>
                <h3 className="text-base font-medium text-neutral-900">{group.label}</h3>
                <span className="text-xs text-neutral-500">({group.categories.length})</span>
              </div>
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4 text-neutral-400" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-neutral-400" />
              )}
            </button>
            
            {isExpanded && (
              <div className="mt-4 space-y-2 pl-8">
                {group.categories
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((category) => (
                  <label key={category.id} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      value={category.name}
                      checked={currentCategory === category.name}
                      onChange={(e) => updateFilters('category', e.target.checked ? category.name : null)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 transition-colors"
                    />
                    <span className="ml-3 text-sm text-neutral-700 group-hover:text-primary-600 transition-colors flex-1">
                      {category.name}
                    </span>
                    {/* You could add product count per category here if needed */}
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Price Range */}
      <div className="border-b border-neutral-200 pb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left hover:text-primary-600 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">💰</span>
            <h3 className="text-base font-medium text-neutral-900">Price Range</h3>
          </div>
          {expandedSections.price ? (
            <ChevronUpIcon className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-neutral-400" />
          )}
        </button>
        
        {expandedSections.price && (
          <div className="mt-4 space-y-4 pl-8">
            {/* Quick Price Ranges */}
            <div className="space-y-2">
              {priceRanges.map((range, index) => (
                <label key={index} className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={currentMinPrice === range.min && currentMaxPrice === range.max}
                    onChange={() => {
                      setPriceRange({ min: range.min, max: range.max })
                      const params = new URLSearchParams(searchParams.toString())
                      if (range.min) params.set('minPrice', range.min)
                      else params.delete('minPrice')
                      if (range.max) params.set('maxPrice', range.max)
                      else params.delete('maxPrice')
                      params.delete('page')
                      router.push(`/products?${params.toString()}`)
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                  />
                  <span className="ml-3 text-sm text-neutral-700 group-hover:text-primary-600 transition-colors">
                    {range.label}
                  </span>
                </label>
              ))}
            </div>
            
            {/* Custom Price Range */}
            <div className="pt-4 border-t border-neutral-100">
              <p className="text-sm font-medium text-neutral-700 mb-3">Custom Range</p>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="input-field text-sm pl-7 w-24"
                  />
                </div>
                <span className="text-neutral-400">-</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="input-field text-sm pl-7 w-24"
                  />
                </div>
                <button
                  onClick={handlePriceFilter}
                  className="btn-secondary btn-small"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popular Searches - could be dynamic based on search analytics */}
      <div className="pt-4">
        <h4 className="text-sm font-medium text-neutral-700 mb-3">Popular Searches</h4>
        <div className="flex flex-wrap gap-2">
          {['Birthday', 'Chocolate Dipped Fruit', 'Mother\'s Day', 'Gift Sets', 'Fresh Fruits Arrangements'].map((term) => (
            <button
              key={term}
              onClick={() => updateFilters('category', term)}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-primary-100 hover:text-primary-700 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 