import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Партнёрский поиск товарных знаков | NayTea",
  description: "Встроенная поисковая форма для сайтов-партнёров.",
};

/**
 * Layout for /partners/* routes.
 *
 * Override body styles via <style> to be transparent (so parent site's background
 * shows through when embedded in iframe) and use light text colors regardless of
 * the root :root dark theme variables.
 */
export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          background: transparent !important;
          color: #0f172a !important;
        }
      ` }} />
      {children}
    </>
  );
}
