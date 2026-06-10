import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Accounting Research Portal | ASC 606 & ASC 842',
  description:
    'Technical accounting research and document review for ASC 606 Revenue Recognition and ASC 842 Leases',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
