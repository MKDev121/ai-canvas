import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Canvas - Flowchart Generator',
  description: 'Generate flowcharts from text descriptions using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
