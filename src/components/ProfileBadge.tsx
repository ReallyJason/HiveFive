import type { BadgeData } from '../lib/auth';

interface ProfileBadgeProps {
  badge: BadgeData | null | undefined;
  size?: 'sm' | 'md';
}

export function ProfileBadge({ badge }: ProfileBadgeProps) {
  if (!badge) return null;

  const bgStyle: React.CSSProperties = badge.bg_gradient
    ? { background: badge.bg_gradient, color: badge.text_color }
    : { backgroundColor: badge.bg_color, color: badge.text_color };

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold whitespace-nowrap ${badge.css_animation || ''}`}
      style={{
        ...bgStyle,
        fontSize: 11,
        height: 20,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 10,
        letterSpacing: '0.03em',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {badge.tag}
    </span>
  );
}
