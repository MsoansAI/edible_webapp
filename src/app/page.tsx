'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, HeartIcon, GiftIcon, TruckIcon, SparklesIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/outline'
import { Product } from '@/types/database'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(8)

        if (error) {
          console.error('Error fetching products:', error)
        } else {
          setFeaturedProducts(data || [])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  const features = [
    {
      icon: HeartIcon,
      title: 'Handcrafted with Love',
      description: 'Each arrangement is carefully crafted by our skilled artisans using the freshest ingredients.',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: TruckIcon,
      title: 'Same-Day Delivery',
      description: 'Order by 2PM for same-day delivery. Perfect for last-minute gifts and surprises.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: GiftIcon,
      title: 'Perfect for Any Occasion',
      description: 'From birthdays to anniversaries, our arrangements make every moment special.',
      color: 'from-purple-500 to-indigo-500'
    }
  ]

  const stats = [
    { number: '25+', label: 'Years of Excellence' },
    { number: '1M+', label: 'Happy Customers' },
    { number: '99%', label: 'On-Time Delivery' },
    { number: '4.9', label: 'Average Rating', icon: StarIcon }
  ]

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-accent-200/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-200/30 to-primary-200/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container-width section-padding py-16 sm:py-20 lg:py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-6">
                <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-primary-100">
                  <SparklesIcon className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm font-semibold text-primary-700">Fresh • Premium • Delivered Daily</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 font-display leading-tight">
                  Fresh Fruit
                  <span className="block bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Arrangements
                  </span>
                  <span className="block text-3xl sm:text-4xl lg:text-5xl text-gray-700 font-medium">
                    Delivered with Love
                  </span>
                </h1>
                
                <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed max-w-2xl">
                  Send the perfect gift with our premium fruit arrangements, chocolate-covered strawberries, 
                  and gourmet treats. <span className="font-semibold text-primary-600">Handcrafted fresh</span> and delivered nationwide.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products" className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                  <ShieldCheckIcon className="mr-3 h-6 w-6" />
                  Shop Premium Gifts
                  <ArrowRightIcon className="ml-3 h-6 w-6" />
                </Link>
                <Link href="/products?category=occasion" className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center backdrop-blur-sm">
                  Browse by Occasion
                </Link>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-gray-200/50">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.number}</span>
                      {stat.icon && <stat.icon className="h-6 w-6 text-yellow-500 ml-1" />}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-white to-gray-50 p-4">
                  <Image
                    src="https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp"
                    alt="Fresh Fruit Arrangement"
                    width={600}
                    height={600}
                    className="w-full h-auto rounded-2xl"
                    priority
                  />
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full opacity-80 animate-bounce-gentle shadow-lg"></div>
                  <div className="absolute top-1/3 -left-6 w-12 h-12 bg-gradient-to-br from-accent-400 to-primary-400 rounded-full opacity-60 animate-bounce-gentle animation-delay-200 shadow-lg"></div>
                </div>
              </div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-primary-200/40 to-accent-200/40 rounded-full blur-2xl"></div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-accent-200/40 to-primary-200/40 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container-width section-padding">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-primary-100 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-semibold text-primary-700">Why Choose Us</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 font-display mb-6">
              The Edible Arrangements
              <span className="block text-primary-600">Difference</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We've been creating smiles and sweet memories for over 25 years with our premium fruit arrangements and exceptional service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="container-width section-padding">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-accent-100 rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-semibold text-accent-700">Bestsellers</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 font-display mb-6">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our most popular arrangements and treats, handcrafted with love and delivered fresh
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="w-full h-48 bg-gray-200 rounded-xl shimmer mb-6"></div>
                  <div className="h-5 bg-gray-200 rounded-lg shimmer mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-lg shimmer w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded-lg shimmer w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-16">
            <Link href="/products" className="btn-primary text-lg px-8 py-4 inline-flex items-center shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              View All Products
              <ArrowRightIcon className="ml-3 h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full opacity-50"></div>
          </div>
        </div>
        
        <div className="container-width section-padding text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold font-display mb-8 leading-tight">
              Ready to Send Something
              <span className="block text-accent-200">Extraordinary?</span>
            </h2>
            <p className="text-xl sm:text-2xl mb-12 opacity-90 leading-relaxed">
              Browse our collection of fresh fruit arrangements, chocolate treats, and gourmet gifts. 
              <span className="block mt-2 font-semibold">Perfect for any occasion or just because.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/products" className="bg-white text-primary-600 hover:text-primary-700 text-lg px-8 py-4 rounded-xl font-bold inline-flex items-center justify-center shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200">
                <GiftIcon className="mr-3 h-6 w-6" />
                Start Shopping Now
                <ArrowRightIcon className="ml-3 h-6 w-6" />
              </Link>
              <Link href="/products?category=occasion" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4 rounded-xl font-bold inline-flex items-center justify-center transition-all duration-200">
                Browse Occasions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 