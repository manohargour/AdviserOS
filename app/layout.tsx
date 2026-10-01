import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Newsreader } from 'next/font/google'
import { CopilotProvider } from '@/components/copilot/copilot-provider'
import { AppShell } from '@/components/shell/app-shell'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' })

export const metadata: Metadata = {
  title: {
    default: 'AdviserOS — AI workspace for financial advisers',
    template: '%s · AdviserOS',
  },
  description:
    'Your AI copilot for client work. Bring client data, portfolios, risk information and documents together. AdviserOS prepares the work, surfaces what needs attention and leaves judgement with the adviser.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#faf9f6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-GB" className={`${geist.variable} ${newsreader.variable}`}>
      <body className="font-sans antialiased">
        <CopilotProvider>
          <AppShell>{children}</AppShell>
        </CopilotProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
