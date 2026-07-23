import { useState } from 'react'
import { resolveImageUrl } from '../utils/image'

interface ImageWithFallbackProps {
  src?: string | null
  alt: string
  className?: string
  fallback: React.ReactNode
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className, fallback }) => {
  const url = resolveImageUrl(src)
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return <>{fallback}</>
  }

  return <img src={url} alt={alt} className={className} onError={() => setErrored(true)} />
}
