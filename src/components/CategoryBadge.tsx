import { useNavigate } from 'react-router';
import { CATEGORY_COLORS } from '../lib/constants';

interface CategoryBadgeProps {
  category: string;
  linked?: boolean;
}

export function CategoryBadge({ category, linked = false }: CategoryBadgeProps) {
  const navigate = useNavigate();
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;

  return (
    <span
      onClick={linked ? (e) => { e.preventDefault(); e.stopPropagation(); navigate(`/discover?category=${encodeURIComponent(category)}`); } : undefined}
      className={`font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 font-sans${linked ? ' cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      style={{ fontSize: '10px', backgroundColor: colors.bg, color: colors.text }}
    >
      {category}
    </span>
  );
}
