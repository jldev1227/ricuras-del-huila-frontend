'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getProductImageUrl } from '@/lib/supabase'
import { CircleQuestionMark } from 'lucide-react'

interface ProductImageProps {
  imagePath: string | null
  productName: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  fill?: boolean
}

export default function ProductImage({ 
  imagePath, 
  productName, 
  className = "",
  width = 300,
  height = 200,
  priority = false,
  fill = false
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)
  
  const imageUrl = getProductImageUrl(imagePath)

  console.log(imageUrl)
  
  // Si hay error o no hay imagen, mostrar placeholder
  if (imageError) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center relative overflow-hidden ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <div className="text-center p-4">
            <CircleQuestionMark size={48} className="text-gray-400 mx-auto mb-2" />
            <span className="text-gray-500 text-sm block">
              {productName}
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={productName}
        fill
        className={`object-cover ${className}`}
        onError={() => setImageError(true)}
        loading={priority ? undefined : "lazy"}
        priority={priority}
      />
    )
  }
  
  return (
    <Image
      src={imageUrl}
      alt={productName}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      onError={() => setImageError(true)}
      loading={priority ? undefined : "lazy"}
      priority={priority}
    />
  )
}