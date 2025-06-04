import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    base_price: number
    image_url: string
    product_identifier: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="product-card"
    >
      <Link href={`/products/${product.product_identifier}`}>
        <div className="product-image">
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <h3 className="product-title">{product.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="product-price">
            {formatPrice(product.base_price)}
          </span>
          <Button size="sm" className="btn-primary">
            Add to Cart
          </Button>
        </div>
      </Link>
    </motion.div>
  )
}