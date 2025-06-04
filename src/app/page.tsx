import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout/navbar"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
              Fresh & Beautiful{" "}
              <span className="text-edible-red">Gifts</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Delicious fruit arrangements, chocolate-dipped fruits, and gift baskets for any occasion. 
              Made fresh daily and guaranteed to delight.
            </p>
            <div className="space-x-4">
              <Button asChild>
                <a href="/products">Shop Now</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/occasions">Browse by Occasion</a>
              </Button>
            </div>
          </div>
        </section>
        
        <section className="container space-y-6 py-8 md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">
              Featured Products
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Discover our most popular arrangements and seasonal favorites.
            </p>
          </div>
          
          {/* Featured products grid will go here */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Product cards will be added here */}
          </div>
        </section>
      </main>
    </>
  )
}