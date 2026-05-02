import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { createElement } from 'react';
import { apiGet, apiPost } from './api';

// ── Cosmetic data types ──

export interface FrameData {
  id: number;
  name: string;
  gradient: string;
  glow: string;
  css_animation: string | null;
  ring_size: number;
}

export interface BadgeData {
  id: number;
  name: string;
  tag: string;
  bg_color: string;
  text_color: string;
  bg_gradient: string | null;
  css_animation: string | null;
}

export interface ThemeData {
  id: number;
  name: string;
  banner_gradient: string;
  accent_color: string;
  text_color: string;
  css_animation: string | null;
}

export interface CosmeticData {
  frame: FrameData | null;
  badge: BadgeData | null;
  theme: ThemeData | null;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  job: string;
  is_student: boolean;
  university: string;
  profile_image: string;
  hivecoin_balance: number;
  verified: boolean;
  onboarding_done: boolean;
  wants_to_offer: boolean;
  wants_to_find: boolean;
  notify_orders: boolean;
  notify_messages: boolean;
  notify_proposals: boolean;
  active_frame_id: number | null;
  active_badge_id: number | null;
  active_theme_id: number | null;
  cosmetics?: CosmeticData;
  created_at: string;
  role: 'user' | 'admin';
  suspended_until: string | null;
  banned_at: string | null;
  ban_reason: string | null;
  impersonating: number | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{
    user: User;
    needs_reverification?: boolean;
    past_grace_period?: boolean;
    message?: string;
  }>;
  signup: (data: {
    email: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    university: string;
  }) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiGet<{ user: User }>('/auth/me.php');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe?: boolean): Promise<{
    user: User;
    needs_reverification?: boolean;
    past_grace_period?: boolean;
    message?: string;
  }> => {
    const data = await apiPost<{
      user: User;
      needs_reverification?: boolean;
      past_grace_period?: boolean;
      message?: string;
    }>('/auth/login.php', { email, password, remember_me: rememberMe ?? false });
    setUser(data.user);
    refreshUser();
    return data;
  };

  const signup = async (body: {
    email: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    university: string;
  }) => {
    const data = await apiPost<{ user: User }>(
      '/auth/signup.php',
      body,
    );
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await apiPost('/auth/logout.php');
    setUser(null);
  };

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        isLoggedIn: !!user,
        login,
        signup,
        logout,
        refreshUser,
      },
    },
    children,
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
