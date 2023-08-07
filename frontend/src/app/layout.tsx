'use client'

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import AuthContextProvider from '@/context/auth-context'
import { NODE_RPC_URL, PROVIDER } from '@/lib/contract'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Essential Voting',
  description: 'Secure and trustful elections backed by blockchain technology.',
}


console.log("LOG PROVIDER", PROVIDER);
console.log("LOG NODE RPC URL", NODE_RPC_URL);
console.log("LOG ENV NODE RPC URL", process.env.NEXT_PUBLIC_NGROK_NODE_RPC_URL);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthContextProvider>
          {children}
          <Toaster />
        </AuthContextProvider>
      </body>
    </html>
  )
}
