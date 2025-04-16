import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface LinkItem {
  url?: string;
  title?: string;
  type: 'link' | 'header';
  content?: string;
}

export interface LinkDump {
  id: string;
  slug: string;
  links: Array<LinkItem>;
  expires_at: string;
  created_at: string;
}