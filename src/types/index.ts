export type ShortLink = {
  id: string;
  shortCode: string;
  shortUrl: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  package: 'free' | 'basic' | 'pro';
  link_limit: number;
  link_count: number;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type Link = {
  id: string;
  user_id: string;
  short_code: string;
  original_url: string;
  title?: string;
  description?: string;
  created_at: number;
  expires_at?: number;
  max_clicks?: number;
  click_count: number;
  is_active: boolean;
};

export type ClickStats = {
  name: string;
  count: number;
};

export type ClickByDay = {
  date: string;
  count: number;
};

export type Analytics = {
  link: {
    shortCode: string;
    originalUrl: string;
    createdAt: number;
    totalClicks: number;
  };
  stats: {
    countries: ClickStats[];
    referrers: ClickStats[];
    devices: ClickStats[];
    browsers: ClickStats[];
    osTypes: ClickStats[];
    clicksByDay: ClickByDay[];
  };
  recentClicks: any[];
};

export type CreateLinkInput = {
  url: string;
  customSlug?: string;
  title?: string;
  description?: string;
  expiresAt?: number;
  maxClicks?: number;
};

export type UpdateLinkInput = {
  original_url?: string;
  title?: string;
  description?: string;
  expires_at?: number;
  max_clicks?: number;
  is_active?: boolean;
};






