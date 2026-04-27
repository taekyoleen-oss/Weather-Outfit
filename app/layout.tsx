import type { Metadata } from 'next'
import './globals.css'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'WeatherFit — 날씨 기반 복장 추천',
  description: '오늘 날씨에 딱 맞는 복장을 추천해드립니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
