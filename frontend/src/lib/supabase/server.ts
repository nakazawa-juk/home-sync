import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/types/database';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  // 型引数を明示的に指定
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {},
      remove() {},
    },
  });
}

// 本格的な実装（将来使用）
export async function createClientWithCookies() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(
        name: string,
        value: string,
        options: { [key: string]: string | number | boolean | Date },
      ) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(
        name: string,
        options: { [key: string]: string | number | boolean | Date },
      ) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
