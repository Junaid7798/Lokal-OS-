import React, { useState, useEffect, useRef, memo } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  placeholder,
  threshold = 0.1,
  rootMargin = '100px',
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (!isInView) {
    return (
      <div ref={imgRef} className={`bg-muted animate-pulse ${className}`}>
        {placeholder}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={`${className} ${isLoaded ? '' : 'opacity-0'}`}
      onLoad={handleLoad}
      loading="lazy"
      {...props}
    />
  );
});

LazyImage.displayName = 'LazyImage';

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
  gap?: number;
}

export function SkeletonLoader({
  count = 3,
  className = '',
  gap = 2,
}: SkeletonLoaderProps) {
  return (
    <div className={`space-y-${gap}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-muted rounded animate-pulse ${className}`}
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  children,
  skeleton,
}: LoadingOverlayProps) {
  if (isLoading) {
    return skeleton || <div className="animate-pulse bg-muted rounded h-32" />;
  }
  return <>{children}</>;
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export function OptimizedImage({
  src,
  alt,
  aspectRatio = '16/9',
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ aspectRatio }} className="relative overflow-hidden bg-muted">
      <img
        src={src}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ objectFit }}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        decoding="async"
      />
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
    </div>
  );
}
