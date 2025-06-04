"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"

export function FeaturedProducts() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6)
        
        if (error) throw error
        return data
      } catch (err) {
        console.error("Error fetching products:", err)
        throw err
      }
    }
  })

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <p>Error loading products. Please check your Supabase configuration.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[400px] animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products?.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}