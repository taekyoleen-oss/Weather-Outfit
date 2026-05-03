import type { Metadata, Viewport } from 'next'
import { Inter, Newsreader, Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

/** Mistral PP Editorial Old 대체 — 히어로·통계용 near-serif */
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-display',
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: 'WeatherFit — 날씨 기반 복장 추천',
  description: '오늘 날씨에 딱 맞는 복장을 추천해드립니다.',
  applicationName: 'WeatherFit',
}

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} ${newsreader.variable} ${notoSansKR.variable}`}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
