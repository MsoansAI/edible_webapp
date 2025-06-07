'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { Category } from '@/types/database'

interface ProductFiltersProps {
  categories: Category[]
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    occasions: true,
  })

  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || '',
  })

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
    
    router.push(`/products?${params.toString()}`)
  }

  const clearAllFilters = () => {
    setPriceRange({ min: '', max: '' })
    router.push('/products')
  }

  const currentCategory = searchParams.get('category')
  const currentMinPrice = searchParams.get('minPrice')
  const currentMaxPrice = searchParams.get('maxPrice')

  const quickCategories = [
    { key: 'arrangements', label: 'Fruit Arrangements', count: 45 },
    { key: 'chocolate', label: 'Chocolate Berries', count: 28 },
    { key: 'occasion', label: 'Occasion Gifts', count: 32 },
  ]

  const priceRanges = [
    { label: 'Under $30', min: '', max: '30' },
    { label: '$30 - $50', min: '30', max: '50' },
    { label: '$50 - $75', min: '50', max: '75' },
    { label: '$75 - $100', min: '75', max: '100' },
    { label: 'Over $100', min: '100', max: '' },
  ]

  const occasions = [
    { key: 'birthday', label: 'Birthday' },
    { key: 'anniversary', label: 'Anniversary' },
    { key: 'valentine', label: "Valentine's Day" },
    { key: 'mother', label: "Mother's Day" },
    { key: 'graduation', label: 'Graduation' },
    { key: 'sympathy', label: 'Sympathy' },
  ]

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {(currentCategory || currentMinPrice || currentMaxPrice) && (
        <div className="pb-6 border-b border-gray-200">
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Categories */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-medium text-gray-900">Categories</h3>
          {expandedSections.categories ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.categories && (
          <div className="mt-4 space-y-3">
            {quickCategories.map((category) => (
              <label key={category.key} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.key}
                  checked={currentCategory === category.key}
                  onChange={(e) => updateFilters('category', e.target.checked ? category.key : null)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-700 flex-1">{category.label}</span>
                <span className="text-xs text-gray-500">({category.count})</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-medium text-gray-900">Price Range</h3>
          {expandedSections.price ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.price && (
          <div className="mt-4 space-y-4">
            {/* Quick Price Ranges */}
            <div className="space-y-2">
              {priceRanges.map((range, index) => (
                <label key={index} className="flex items-center cursor-pointer">
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
                      router.push(`/products?${params.toString()}`)
                    }}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
            
            {/* Custom Price Range */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Custom Range</p>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="input-field text-sm w-20"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="input-field text-sm w-20"
                />
                <button
                  onClick={handlePriceFilter}
                  className="btn-primary text-xs px-3 py-1"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Occasions */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => toggleSection('occasions')}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-medium text-gray-900">Occasions</h3>
          {expandedSections.occasions ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.occasions && (
          <div className="mt-4 space-y-3">
            {occasions.map((occasion) => (
              <label key={occasion.key} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={occasion.key}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">{occasion.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Additional Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Additional Filters</h3>
        
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-3 text-sm text-gray-700">Same-day delivery available</span>
        </label>
        
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-3 text-sm text-gray-700">Free delivery eligible</span>
        </label>
        
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-3 text-sm text-gray-700">Nut-free options</span>
        </label>
      </div>
    </div>
  )
} 