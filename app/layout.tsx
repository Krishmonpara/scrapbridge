import type { Metadata } from 'next'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { ViewTransitions } from '@/components/providers/ViewTransitions'
import { CommandPaletteProvider } from '@/components/providers/CommandPaletteProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScrapBridge — Industrial Scrap Materials Marketplace',
  description:
    'The world\'s B2B marketplace for scrap metals, industrial equipment, engines, and more. Connecting scrap yards, demolition firms, ship breakers, and manufacturers.',
  keywords: 'scrap metal, industrial surplus, scrap yard, demolition, HMS steel, copper scrap, electric motors',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` keeps the dark palette of the new theme as the default. Remove
    // it (or wire up a theme toggle) to fall back to the light palette.
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <SessionProvider>
          <ToastProvider>
            <ViewTransitions />
            <CommandPaletteProvider />
            {children}
            <ScrollToTop />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
