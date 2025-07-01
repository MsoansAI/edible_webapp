'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, CheckIcon, TruckIcon, HeartIcon, GiftIcon, StarIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { Product } from '@/types/database'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import { useCartStore } from '@/store/cartStore'
import toast from 'react-hot-toast'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addItem } = useCartStore()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featuredResponse, bestSellersResponse] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .limit(4),
          supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(8)
        ])

        if (featuredResponse.error) console.error('Error fetching featured products:', featuredResponse.error)
        else setFeaturedProducts(featuredResponse.data || [])

        if (bestSellersResponse.error) console.error('Error fetching bestsellers:', bestSellersResponse.error)
        else setBestSellers(bestSellersResponse.data || [])

      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`${product.name} added to cart!`)
  }

  const trustIndicators = [
    {
      icon: TruckIcon,
      title: 'Same-Day Delivery',
      description: 'Order by 2PM',
    },
    {
      icon: HeartIcon,
      title: 'Hand-Crafted Fresh',
      description: 'Made with love',
    },
    {
      icon: ShieldCheckIcon,
      title: '100% Satisfaction',
      description: 'Guaranteed quality',
    },
    {
      icon: GiftIcon,
      title: 'Perfect for Gifting',
      description: 'Every occasion',
    }
  ]

  const socialProof = [
    { metric: '25+', label: 'Years of Excellence' },
    { metric: '1M+', label: 'Happy Customers' },
    { metric: '4.9', label: 'Customer Rating', icon: StarIcon },
    { metric: '99%', label: 'On-Time Delivery' }
  ]

  return (
    <div className="min-h-screen bg-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-neutral-50 to-primary-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23DC2626' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>
        
        <div className="container-width responsive-padding relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[500px] sm:min-h-[600px] py-8 sm:py-12 lg:py-24">
            
            {/* Hero Content */}
            <div className="space-y-6 sm:space-y-8 lg:pr-8">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center bg-white shadow-clean px-3 sm:px-4 py-2 sm:py-3 border border-success-200">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-semibold text-success-700">
                    <span className="hidden sm:inline">Trusted by 1M+ Happy Customers</span>
                    <span className="sm:hidden">1M+ Happy Customers</span>
                  </span>
                  <div className="flex items-center space-x-1 ml-2 sm:ml-4">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-3 w-3 sm:h-4 sm:w-4 text-warning-500 fill-warning-500" />
                    ))}
                    <span className="text-xs sm:text-sm font-medium text-neutral-700 ml-1 sm:ml-2">4.9/5</span>
                  </div>
                </div>
                </div>
                
              {/* Main Headline */}
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 leading-[0.9] tracking-tight">
                  Send 
                  <span className="text-primary-600"> Perfect</span>
                  <br />
                  <span className="relative">
                    Gifts
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-accent-600"></div>
                  </span>
                </h1>
                
                <p className="text-xl text-neutral-600 font-medium max-w-lg leading-relaxed">
                  Premium fresh fruit arrangements & gourmet treats, delivered nationwide with love.
                </p>
              </div>
              
              {/* Primary CTA */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <Link href="/products" className="btn-primary btn-large group shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                  <GiftIcon className="mr-3 h-6 w-6" />
                  Shop Premium Gifts
                  <ArrowRightIcon className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                
                <div className="flex items-center space-x-3 text-sm text-neutral-600">
                  <TruckIcon className="h-5 w-5 text-primary-600" />
                  <span>Same-day delivery available</span>
                </div>
              </div>
              
              {/* Key Benefits */}
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-neutral-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success-100 flex items-center justify-center">
                    <HeartIcon className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Hand-Crafted</p>
                    <p className="text-sm text-neutral-600">Fresh daily</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success-100 flex items-center justify-center">
                    <ShieldCheckIcon className="h-5 w-5 text-success-600" />
                    </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Guaranteed</p>
                    <p className="text-sm text-neutral-600">100% satisfaction</p>
                  </div>
                </div>
              </div>
              
              {/* Social Proof Numbers */}
              <div className="flex items-center space-x-8 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">25+</div>
                  <div className="text-sm text-neutral-600">Years</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">1M+</div>
                  <div className="text-sm text-neutral-600">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neutral-900">99%</div>
                  <div className="text-sm text-neutral-600">On-time</div>
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              
              {/* Main Product Image */}
              <div className="relative z-10">
                <div className="relative bg-white shadow-premium hover:shadow-2xl transition-all duration-500 p-8 transform hover:-translate-y-2">
                  <Image
                    src="https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp"
                    alt="Premium Fresh Fruit Arrangement - Perfect Gift"
                    width={400}
                    height={400}
                    className="w-full h-auto"
                    priority
                  />
                  
                  {/* Premium Badge */}
                  <div className="absolute -top-3 -right-3 bg-primary-600 text-white px-3 py-1 text-sm font-bold shadow-lg">
                    PREMIUM
                  </div>
                  
                  {/* Floating Trust Elements */}
                  <div className="absolute -bottom-4 -left-4 bg-white shadow-lg px-4 py-3 border border-success-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-success-700">Fresh Guaranteed</span>
                    </div>
                  </div>
                  
                  <div className="absolute -top-4 -left-8 bg-white shadow-lg px-4 py-3 border border-primary-200">
                    <div className="flex items-center space-x-2">
                      <TruckIcon className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-semibold text-primary-700">Same-Day</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background Decoration */}
              <div className="absolute top-8 right-8 w-32 h-32 bg-gradient-to-br from-primary-200 to-accent-200 opacity-20 transform rotate-12"></div>
              <div className="absolute bottom-8 left-8 w-24 h-24 bg-gradient-to-br from-success-200 to-warning-200 opacity-20 transform -rotate-12"></div>
              
              {/* Floating Elements */}
              <div className="absolute top-1/4 right-4 animate-float animation-delay-100">
                <div className="w-16 h-16 bg-white shadow-md flex items-center justify-center">
                  <HeartIcon className="h-8 w-8 text-primary-600" />
                </div>
              </div>
              
              <div className="absolute bottom-1/4 left-4 animate-float animation-delay-200">
                <div className="w-14 h-14 bg-white shadow-md flex items-center justify-center">
                  <StarIcon className="h-6 w-6 text-warning-500 fill-warning-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trust Bar */}
        <div className="bg-white border-t border-neutral-200">
          <div className="container-width section-padding py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-neutral-600">As featured in:</span>
                <div className="flex items-center space-x-6 text-xs font-bold text-neutral-400">
                  <span>TODAY SHOW</span>
                  <span>•</span>
                  <span>FOOD NETWORK</span>
                  <span>•</span>
                  <span>GOOD MORNING AMERICA</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <ShieldCheckIcon className="h-5 w-5 text-success-600" />
                  <span className="text-sm font-medium text-neutral-700">SSL Secured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-neutral-700">Order by 2PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-spacing bg-neutral-50">
        <div className="container-width section-padding">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 mb-6">
              Perfect For Every Occasion
            </div>
            <h2 className="heading-section mb-6">
              Shop by
              <span className="block text-primary-600">Category</span>
            </h2>
            <p className="text-large max-w-3xl mx-auto">
              From birthday celebrations to sympathy gifts, find the perfect arrangement for any moment that matters.
            </p>
          </div>
          
          {/* Popular Occasions */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-center mb-8 text-neutral-700">Popular Occasions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { name: 'Birthday', icon: '🎂', link: '/products?category=Birthday', count: '15 items' },
                { name: 'Congratulations', icon: '🎉', link: '/products?category=Congratulations', count: '65 items' },
                { name: 'Get Well', icon: '🌻', link: '/products?category=Get%20Well', count: '31 items' },
                { name: 'Graduation', icon: '🎓', link: '/products?category=Graduation', count: '23 items' },
                { name: 'New Baby', icon: '👶', link: '/products?category=New%20Baby', count: '46 items' },
                { name: 'Just Because', icon: '💕', link: '/products?category=Just%20because', count: '49 items' }
              ].map((category, index) => (
                <Link
                  key={index}
                  href={category.link}
                  className="group bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200 p-6 text-center hover:border-primary-300"
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                    {category.icon}
                  </div>
                  <h4 className="font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {category.count}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Product Types */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-center mb-8 text-neutral-700">Popular Product Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  name: 'Fresh Fruits', 
                  description: 'Premium fresh fruit arrangements',
                  image: 'https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp',
                  link: '/products?category=Fresh%20Fruits%20Arrangements',
                  count: '14 items'
                },
                { 
                  name: 'Chocolate Dipped', 
                  description: 'Decadent chocolate-dipped treats',
                  image: 'https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp',
                  link: '/products?category=Chocolate%20Dipped%20Fruit',
                  count: '22 items'
                },
                { 
                  name: 'Gift Sets', 
                  description: 'Curated gift collections',
                  image: 'https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp',
                  link: '/products?category=Gift%20Sets',
                  count: '18 items'
                },
                { 
                  name: 'Edible Bakeshop', 
                  description: 'Baked goods and sweet treats',
                  image: 'https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp',
                  link: '/products?category=Edible%20Bakeshop',
                  count: '8 items'
                }
              ].map((category, index) => (
                <Link
                  key={index}
                  href={category.link}
                  className="group bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h4 className="font-semibold text-white text-lg">
                        {category.name}
                      </h4>
                      <p className="text-white/90 text-sm">
                        {category.description}
                      </p>
                      <p className="text-white/70 text-xs mt-1">
                        {category.count}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Special Dietary Options */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-8 text-neutral-700">Dietary Options</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Nut-Free', icon: '🚫🥜', link: '/products?category=Nut-Free' },
                { name: 'Vegan-Friendly', icon: '🌱', link: '/products?category=Vegan-Friendly' }
              ].map((option, index) => (
                <Link
                  key={index}
                  href={option.link}
                  className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200 hover:border-success-300 group"
                >
                  <span className="text-lg mr-3 group-hover:scale-110 transition-transform duration-200">
                    {option.icon}
                  </span>
                  <span className="font-semibold text-neutral-800 group-hover:text-success-600">
                    {option.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="container-width section-padding">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center mx-auto mb-4 transition-colors group-hover:bg-primary-50">
                  <indicator.icon className="h-8 w-8 text-neutral-600 group-hover:text-primary-600 transition-colors" />
                </div>
                <h3 className="heading-card text-lg mb-2">{indicator.title}</h3>
                <p className="text-small">{indicator.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-spacing bg-neutral-50">
        <div className="container-width section-padding">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 mb-6">
              Featured Collection
            </div>
            <h2 className="heading-section mb-6">
              Our Most Popular
              <span className="block text-primary-600">Arrangements</span>
            </h2>
            <p className="text-large max-w-3xl mx-auto">
              Discover our most loved arrangements, perfect for any occasion. Each one is handcrafted with the freshest ingredients.
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-6 space-y-4">
                  <div className="skeleton aspect-square"></div>
                  <div className="skeleton h-6 w-3/4"></div>
                  <div className="skeleton h-4 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
              
              <div className="text-center mt-12">
                <Link href="/products" className="btn-secondary">
                  View All Products
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-spacing bg-white">
        <div className="container-width section-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center bg-success-50 px-4 py-2 text-sm font-semibold text-success-700">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Trusted by Millions
                </div>
                
                <h2 className="heading-section">
                  Why Customers Choose
                  <span className="block text-primary-600">Edible Arrangements</span>
                </h2>
                
                <p className="text-large">
                  For over 25 years, we've been creating smiles and sweet memories with our premium fruit arrangements and exceptional service.
                </p>
              </div>
              
              <div className="space-y-6">
                {[
                  {
                    title: 'Fresh Guarantee',
                    description: 'We use only the freshest, highest-quality fruit and ingredients in every arrangement.'
                  },
                  {
                    title: 'Expert Craftsmanship', 
                    description: 'Our skilled artisans hand-craft each arrangement with attention to detail and care.'
                  },
                  {
                    title: 'Reliable Delivery',
                    description: 'Same-day and next-day delivery options ensure your gift arrives fresh and on time.'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-primary-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="heading-card text-lg mb-2">{benefit.title}</h3>
                      <p className="text-body">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Image */}
            <div className="relative">
              <div className="card-product bg-gradient-to-br from-primary-50 to-accent-50 p-8">
                <Image
                  src="https://rescloud.ediblearrangements.com/image/private/t_EA_PDP/Creative-Marketing/Products/SKU/6479_5507_No1_Mom_Fruit_Arrangement_MOM_s.webp"
                  alt="Quality Assurance"
                  width={500}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section-spacing bg-neutral-50">
        <div className="container-width section-padding">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-warning-100 px-4 py-2 text-sm font-semibold text-warning-700 mb-6">
              <StarIcon className="h-4 w-4 mr-2" />
              Customer Favorites
            </div>
            <h2 className="heading-section mb-6">Best Selling Arrangements</h2>
            <p className="text-large max-w-3xl mx-auto">
              These arrangements are loved by our customers and perfect for any celebration or special moment.
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card p-6 space-y-4">
                  <div className="skeleton aspect-square"></div>
                  <div className="skeleton h-6 w-3/4"></div>
                  <div className="skeleton h-4 w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {bestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-spacing gradient-primary text-white">
        <div className="container-width section-padding text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="heading-section text-white">
              Ready to Send Something
              <span className="block">Extraordinary?</span>
            </h2>
            <p className="text-large text-white/90 max-w-2xl mx-auto">
              Browse our collection of fresh fruit arrangements, chocolate treats, and gourmet gifts. 
              Perfect for any occasion or just because.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="btn-secondary bg-white text-primary-600 hover:bg-neutral-50">
                <GiftIcon className="mr-3 h-5 w-5" />
                Start Shopping Now
              </Link>
              <Link href="/products?category=occasion" className="btn-ghost text-white border-white hover:bg-white/10">
                Browse Occasions
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
} 