import type { Metadata } from "next"
import type { ReactNode } from "react"

import { Providers } from "@/components/ui/Providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Avivavirtual",
  description: "AI-powered customer care platform for Canadian businesses"
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
