import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'SomosRentable - Crowdfunding Inmobiliario',
  description: 'Plataforma de crowdfunding inmobiliario. Invierte en proyectos inmobiliarios y obtén rentabilidad.',
  keywords: 'crowdfunding, inmobiliario, inversión, rentabilidad, Chile',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
