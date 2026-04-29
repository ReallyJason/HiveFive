import { Navigate } from 'react-router';
import { useFeatures } from '../lib/features';

interface FeatureRouteProps {
  feature: 'requests' | 'shop' | 'messaging' | 'leaderboard';
  children: React.ReactNode;
}

export function FeatureRoute({ feature, children }: FeatureRouteProps) {
  const features = useFeatures();

  if (features.loading) return null;
  if (!features[feature]) return <Navigate to="/discover" replace />;

  return <>{children}</>;
}
