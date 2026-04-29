import { useState, useEffect } from 'react';
import { Star, Hexagon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { resolveAssetUrl, nextServiceLibraryFallbackUrl } from '../lib/assetUrl';
import { sanitizeContent } from '../lib/contentFilter';

interface ServiceCardProps {
  id: string;
  title: string;
  category: string;
  provider: string;
  price: string;
  rating: number;
  reviews: number;
  image?: string | null;
}

export function ServiceCard({
  id,
  title,
  category,
  provider,
  price,
  rating,
  reviews,
  image,
}: ServiceCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const resolvedImage = resolveAssetUrl(image);

  useEffect(() => {
    setImgError(false);
  }, [image]);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Music: 'bg-honey-100 text-honey-800',
      Coding: 'bg-blue-50 text-blue-700',
      Writing: 'bg-emerald-50 text-emerald-700',
      Photography: 'bg-violet-50 text-violet-700',
      Tutoring: 'bg-amber-50 text-amber-800',
      Errands: 'bg-charcoal-100 text-charcoal-600',
      Fitness: 'bg-rose-50 text-rose-700',
      Design: 'bg-orange-50 text-orange-700',
      Language: 'bg-cyan-50 text-cyan-700',
      Counseling: 'bg-purple-50 text-purple-700',
      Career: 'bg-emerald-50 text-emerald-700',
      Other: 'bg-charcoal-100 text-charcoal-600',
    };
    return colors[cat] || colors.Other;
  };

  // Avoid awkward line-breaks from the unicode currency glyph by
  // rendering the icon separately and keeping price text non-wrapping.
  const priceText = price.trim().replace(/^[⬡◊]\s*/, '');

  return (
    <div
      onClick={() => navigate(`/service/${id}`)}
      className="bg-cream-50 border border-charcoal-100 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
    >
      {resolvedImage && !imgError ? (
        <div className="h-36 overflow-hidden">
          <img
            src={resolvedImage}
            alt={title}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
            onError={(e) => {
              const current = e.currentTarget.currentSrc || e.currentTarget.src;
              const fallback = nextServiceLibraryFallbackUrl(current);
              if (fallback && fallback !== current) {
                e.currentTarget.src = fallback;
                return;
              }
              setImgError(true);
            }}
          />
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-charcoal-100 to-charcoal-50 flex items-center justify-center">
          <Hexagon className="w-12 h-12 text-charcoal-300" />
        </div>
      )}
      <div className="p-4">
        <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <span className="min-w-0">
            <span
              className={`inline-block max-w-full truncate whitespace-nowrap text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${getCategoryColor(
                category
              )}`}
              title={category}
            >
              {category}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-sm font-medium text-charcoal-900 leading-none">
            <Hexagon className="size-3.5 shrink-0 text-charcoal-700" />
            <span className="max-w-[10ch] truncate" title={priceText}>{priceText}</span>
          </span>
        </div>
        <h3 className="font-sans font-bold text-[15px] text-charcoal-900 leading-snug line-clamp-2 min-h-[3.25rem]">
          {sanitizeContent(title)}
        </h3>
        <p className="text-xs text-charcoal-400 mt-1.5">by {sanitizeContent(provider)}</p>
        <div className="flex items-center gap-1.5 mt-2.5">
          <Star className="w-3.5 h-3.5 fill-honey-500 text-honey-500 stroke-0" />
          <span className="font-mono text-xs text-charcoal-700">{rating}</span>
          <span className="text-xs text-charcoal-400">({reviews})</span>
        </div>
      </div>
    </div>
  );
}
