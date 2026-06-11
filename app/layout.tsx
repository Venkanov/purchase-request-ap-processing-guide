import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const isGuidesProject =
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '').includes('purchase-request') ||
  (process.env.VERCEL_URL ?? '').includes('purchase-request')

export const metadata: Metadata = isGuidesProject
  ? {
      title: 'Purchase Request & AP Processing Guide',
      description:
        'FluidStack internal guide for purchase requests and AP invoice processing in Zip and NetSuite',
    }
  : {
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
