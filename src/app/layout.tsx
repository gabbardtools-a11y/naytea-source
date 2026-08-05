import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getLang } from "@/lib/i18n/server";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NayTea.ru — проверка товарного знака онлайн",
  description: "Бесплатная проверка товарного знака по базам Роспатента. Поиск по всем реестрам ФИПС.",
  icons: { icon: "/teapot.svg" },
  metadataBase: new URL("https://naytea.ru"),
  alternates: {
    canonical: "/",
    languages: {
      ru: "https://naytea.ru/",
      en: "https://naytea.ru/en",
      zh: "https://naytea.ru/zh",
      "x-default": "https://naytea.ru/",
    },
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {/* Pass lang to client via a hidden data attribute that page.tsx can read */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__NAYTEA_LANG__ = ${JSON.stringify(lang)};`,
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
