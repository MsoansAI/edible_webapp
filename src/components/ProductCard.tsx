import React from 'react'
import Image from 'next/image'
import { Product, ProductOption } from '@/types/database'

interface ProductCardProps {
  product: Product
  options?: ProductOption[]
  onSelectOption?: (option: ProductOption) => void
  onAddToCart?: (product: Product, option?: ProductOption) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, options = [], onSelectOption, onAddToCart }) => {
  return (
    <div className="card p-4 flex flex-col gap-3 shadow-md rounded-lg bg-white">
      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={300}
            height={300}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-gray-400">No image</span>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
        <p className="text-primary-600 font-semibold text-base">${product.base_price.toFixed(2)}</p>
        {product.description && (
          <p className="text-gray-600 text-sm line-clamp-3">{product.description}</p>
        )}
        {options.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Options:</h3>
            <ul className="space-y-1">
              {options.map(option => (
                <li key={option.id} className="flex items-center justify-between">
                  <span>{option.option_name}</span>
                  <span className="font-medium">${option.price.toFixed(2)}</span>
                  {onSelectOption && (
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                      onClick={() => onSelectOption(option)}
                    >
                      Select
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {onAddToCart && (
        <button
          className="mt-2 w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700 font-semibold"
          onClick={() => onAddToCart(product)}
        >
          Add to Cart
        </button>
      )}
    </div>
  )
}

export default ProductCard 