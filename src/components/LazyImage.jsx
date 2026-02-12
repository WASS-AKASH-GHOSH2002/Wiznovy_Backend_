import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt = '', 
  className = '', 
  fallback = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(fallback);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setImageSrc(fallback || '');
        setIsLoading(false);
      };
      img.src = src;
    } else if (isInView) {
      setIsLoading(false);
    }
  }, [isInView, src, fallback]);

  if (!src && !fallback) {
    return null;
  }

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;