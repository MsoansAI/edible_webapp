import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"
import { FeaturedProducts } from "@/components/product/featured-products"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/50" />
          <div className="container relative space-y-8 pb-12 pt-24 md:pb-16 md:pt-36 lg:pt-48">
            <div className="flex max-w-[64rem] flex-col items-start gap-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Fresh & Beautiful{" "}
                <span className="text-primary">Gifts</span>
              </h1>
              <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                Delicious fruit arrangements, chocolate-dipped fruits, and gift baskets for any occasion. 
                Made fresh daily and guaranteed to delight.
              </p>
              <div className="mt-6 flex gap-4">
                <Button size="lg" className="btn-primary" asChild>
                  <a href="/products">Shop Now</a>
                </Button>
                <Button size="lg" className="btn-secondary" asChild>
                  <a href="/occasions">Browse by Occasion</a>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="container space-y-12 py-16 md:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2>Featured Products</h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Discover our most popular arrangements and seasonal favorites.
            </p>
          </div>
          
          <FeaturedProducts />
        </section>
      </main>
    </>
  )
}