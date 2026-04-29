import { useState } from 'react';
import type { FrameData } from '../lib/auth';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 24 | 32 | 36 | 40 | 56 | 80;
  name?: string;
  initial?: string;
  src?: string | null;
  online?: boolean;
  frame?: FrameData | null;
}

export function Avatar({ size = 'md', name, initial, src, online = false, frame }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const actualSize = typeof size === 'string' ? sizeMap[size] : size;
  const displayInitial = initial || (name ? name.charAt(0).toUpperCase() : 'J');
  const fontSize = actualSize * 0.36;

  // Scale ring thickness proportionally — designed for 56px, thinner on small avatars
  const rawRing = frame ? (frame.ring_size ?? 4) : 0;
  const ringPad = frame ? Math.max(2, Math.min(rawRing, Math.round(rawRing * actualSize / 56))) : 0;

  // Fixed outer slot based on max possible ring (ring_size=6).
  // The slot never changes with frame presence/thickness, so avatars
  // in lists always align regardless of cosmetics.
  const MAX_RING = 6;
  const maxPad = Math.max(2, Math.min(MAX_RING, Math.round(MAX_RING * actualSize / 56)));
  const slotSize = actualSize + maxPad * 2;

  const hasSrc = src && !imgError;

  const initialFallback = (
    <div
      className={`rounded-full bg-gradient-to-br from-honey-200 to-honey-300 flex items-center justify-center ${frame ? '' : 'border-2 border-honey-400'}`}
      style={{ width: actualSize, height: actualSize }}
    >
      <span
        className="font-sans font-bold text-honey-800"
        style={{ fontSize: `${fontSize}px` }}
      >
        {displayInitial}
      </span>
    </div>
  );

  const avatarCircle = hasSrc ? (
    <div className="relative" style={{ width: actualSize, height: actualSize }}>
      {/* Show initial while image loads */}
      {!imgLoaded && <div className="absolute inset-0">{initialFallback}</div>}
      <img
        src={src}
        alt={name || 'Avatar'}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
        className={`rounded-full ${frame ? '' : 'border-2 border-honey-400'}`}
        style={{
          width: actualSize, height: actualSize, objectFit: 'cover',
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in',
        }}
      />
    </div>
  ) : initialFallback;

  const onlineDotSize = actualSize > 40 ? 10 : 8;

  return (
    <div
      className="avatar-frame relative inline-block flex-shrink-0"
      style={{ width: slotSize, height: slotSize }}
    >
      {/* Frame ring (only when frame exists) */}
      {frame && (
        <div
          className={`frame-ring absolute rounded-full ${frame.css_animation || ''}`}
          style={{
            width: actualSize + ringPad * 2,
            height: actualSize + ringPad * 2,
            top: maxPad - ringPad,
            left: maxPad - ringPad,
            background: frame.gradient,
            boxShadow: frame.glow,
          }}
        />
      )}

      {/* Avatar circle — always at the same position within the slot */}
      <div className="absolute" style={{ top: maxPad, left: maxPad }}>
        {avatarCircle}
      </div>

      {/* Online indicator */}
      {online && (
        <div
          className="absolute bg-emerald-500 border-2 border-cream-50 rounded-full"
          style={{
            width: onlineDotSize,
            height: onlineDotSize,
            bottom: maxPad - 1,
            right: maxPad - 1,
          }}
        />
      )}
    </div>
  );
}
