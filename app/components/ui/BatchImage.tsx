'use client';

import React, { useState, useEffect } from 'react';

interface BatchImageProps {
  src?: string;
  alt: string;
  className?: string;
}

const FALLBACK_IMAGE = "https://acdb.pages.dev/static/532b7976dd3ae54841e35ec43a24a658.png";

export function BatchImage({ src, alt, className }: BatchImageProps) {
  // If src is explicitly missing, empty, or "null"/"undefined", use fallback
  const isValidSrc = src && src.trim() !== "" && src !== "null" && src !== "undefined";
  const initialSrc = isValidSrc ? src : FALLBACK_IMAGE;

  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const valid = src && src.trim() !== "" && src !== "null" && src !== "undefined";
    setImgSrc(valid ? src : FALLBACK_IMAGE);
    setHasError(false);
  }, [src]);

  return (
    <img
      src={hasError ? FALLBACK_IMAGE : imgSrc}
      alt={alt}
      className={className}
      onError={() => {
          if (!hasError) {
              setHasError(true);
              setImgSrc(FALLBACK_IMAGE);
          }
      }}
      loading="lazy"
    />
  );
}
