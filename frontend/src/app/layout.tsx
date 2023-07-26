'use client'

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from '@/components/ui/toaster'
import AuthContextProvider from '@/context/auth-context'

const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Essential Voting',
//   description: 'Secure and trustful elections backed by blockchain technology.',
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
        <AuthContextProvider>
          {children}
          <Toaster />
        </AuthContextProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
