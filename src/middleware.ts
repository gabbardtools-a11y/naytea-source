/**
 * Next.js middleware для двуязычности NayTea.ru.
 *
 * URL /en/... или /zh/... переписывается в ... с установкой cookie lang=en|zh.
 * Это позволяет использовать ТЕ ЖЕ компоненты, но с другим языком.
 *
 * Например:
 * - /en/ → / с cookie lang=en
 * - /en/search → /search с cookie lang=en
 * - /zh/ → / с cookie lang=zh
 *
 * ВАЖНО: middleware НЕ делает авто-редирект с / на /en или /zh.
 * Пользователь сам выбирает язык через switchLang() в шапке.
 * Это предотвращает цикл: пользователь сменил язык на RU → middleware видит старый cookie
 * и редиректит обратно на /en.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Если URL начинается с /zh или /en — переписываем и устанавливаем cookie
  if (pathname === '/zh' || pathname.startsWith('/zh/')) {
    const newPath = pathname.replace(/^\/zh/, '') || '/';
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    const response = NextResponse.rewrite(url);
    response.cookies.set('lang', 'zh', {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return response;
  }

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const newPath = pathname.replace(/^\/en/, '') || '/';
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    const response = NextResponse.rewrite(url);
    response.cookies.set('lang', 'en', {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return response;
  }

  // Для обычных URL (без /en или /zh префикса) —
  // НЕ делаем авто-редирект. Пусть пользователь сам выбирает язык через switchLang().
  // Если cookie нет — устанавливаем lang=ru по умолчанию.
  const lang = request.cookies.get('lang')?.value;
  const response = NextResponse.next();
  if (!lang) {
    response.cookies.set('lang', 'ru', {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  // Применяем middleware ко всем URL кроме:
  // - API routes
  // - Next.js служебных файлов (_next/*)
  // - Статических файлов (с расширением .svg, .jpg, .webp, .png, .ico, .txt, .xml)
  // - .html files (static partner pages like /znakvsem.html)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap|google|og-image|.*\\.(?:svg|jpg|jpeg|webp|png|ico|xml|txt|html|mp4|css|js|woff2?|ttf|map)$).*)',
  ],
};
