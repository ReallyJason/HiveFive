import { createContext, useContext, useState, useEffect, useCallback, createElement } from 'react';
import type { ReactNode } from 'react';
import { apiGet } from './api';

interface FeaturesState {
  requests: boolean;
  shop: boolean;
  messaging: boolean;
  leaderboard: boolean;
  docs: boolean;
  mock_data: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FeaturesContext = createContext<FeaturesState | null>(null);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState({
    requests: true,
    shop: true,
    messaging: true,
    leaderboard: true,
    docs: true,
    mock_data: true,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet<{ features: Record<string, boolean> }>('/settings/public.php');
      setFeatures({
        requests: data.features.requests ?? true,
        shop: data.features.shop ?? true,
        messaging: data.features.messaging ?? true,
        leaderboard: data.features.leaderboard ?? true,
        docs: data.features.docs ?? true,
        mock_data: data.features.mock_data ?? true,
      });
    } catch {
      // Default to all enabled on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return createElement(
    FeaturesContext.Provider,
    { value: { ...features, loading, refresh } },
    children,
  );
}

export function useFeatures(): FeaturesState {
  const ctx = useContext(FeaturesContext);
  if (!ctx) throw new Error('useFeatures must be used within FeaturesProvider');
  return ctx;
}
