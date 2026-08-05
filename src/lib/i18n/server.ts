/**
 * Серверная функция для чтения языка из cookie.
 * Используется в Server Components для SSR правильного языка.
 */
import { cookies } from 'next/headers';
import { type Lang, DEFAULT_LANG, parseLang } from './translations';

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const cookieStr = cookieStore.toString();
  return parseLang(cookieStr || null);
}

export { DEFAULT_LANG };
