import './globals.css'
import './smart.css'

export const metadata = {
  title: 'BIZU Flashcards — PC/AP Oficial Investigador',
  description: 'Plataforma de revisão inteligente por flashcards para Oficial Investigador da Polícia Civil do Amapá.',
  manifest: '/manifest.webmanifest',
  themeColor: '#6F2BFF'
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
