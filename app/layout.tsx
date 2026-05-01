import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/layout/Footer'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: 'WeatherFit — 날씨 기반 복장 추천',
  description: '오늘 날씨에 딱 맞는 복장을 추천해드립니다.',
}

export const viewport: Viewport = {
  themeColor: '#0891B2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
