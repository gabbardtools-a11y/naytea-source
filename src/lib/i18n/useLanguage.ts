'use client';

/**
 * React hook для доступа к переводам.
 * Читает язык из cookie (установленного middleware) на клиенте.
 * При первом рендере SSR получаем lang из initialLang, переданного сервером.
 */
import { useState, useCallback, useEffect } from 'react';
import { type Lang, type TranslationKey, t, DEFAULT_LANG, parseLang } from './translations';

export function useLanguage(initialLang: Lang = DEFAULT_LANG) {
  // На SSR используем initialLang, на клиенте — синхронизируем с cookie
  const [lang, setLang] = useState<Lang>(initialLang);

  // На клиенте: синхронизируем с cookie после гидратации
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cookieLang = parseLang(document.cookie);
      if (cookieLang !== lang) {
        setLang(cookieLang);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Переключить язык (устанавливает cookie и перезагружает страницу)
  const switchLang = useCallback((newLang: Lang) => {
    if (newLang === lang) return;
    // Устанавливаем cookie на 1 год
    document.cookie = `lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    const path = window.location.pathname;
    // Убираем существующий префикс языка из пути
    const cleanPath = path.replace(/^\/(zh|en)(?=\/|$)/, '') || '/';
    // Формируем новый URL с префиксом языка (кроме ru — для него нет префикса)
    const newPrefix = newLang === 'ru' ? '' : `/${newLang}`;
    // ВАЖНО: если cleanPath === '/', то для RU newPath = '/' (не пустая строка!)
    let newPath: string;
    if (newLang === 'ru') {
      newPath = cleanPath; // '/' или '/search' и т.д.
    } else {
      newPath = `${newPrefix}${cleanPath === '/' ? '' : cleanPath}`;
    }
    window.location.href = `${newPath}${window.location.search}${window.location.hash}`;
  }, [lang]);

  // Функция перевода
  const tt = useCallback((key: TranslationKey): string => {
    return t(key, lang);
  }, [lang]);

  return { lang, t: tt, switchLang };
}

/** Server-side helper: создать L() для server components */
export function createL(lang: Lang) {
  return (zh: string, en: string, ru: string): string => {
    if (lang === 'zh') return zh;
    if (lang === 'en') return en;
    return ru;
  };
}
