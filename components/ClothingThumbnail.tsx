'use client';

import Image from 'next/image';

interface ClothingThumbnailProps {
  imageUrl?: string;
  name: string;
  fallbackIcon: string;
  className?: string;
}

export function ClothingThumbnail({
  imageUrl,
  name,
  fallbackIcon,
  className = 'h-11 w-11',
}: ClothingThumbnailProps) {
  if (!imageUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-muted text-xl ${className}`}
        aria-hidden="true"
      >
        {fallbackIcon}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl border border-border bg-muted ${className}`}>
      <Image
        src={imageUrl}
        alt={`${name} 照片`}
        fill
        sizes="96px"
        unoptimized
        className="object-cover"
      />
    </div>
  );
}
