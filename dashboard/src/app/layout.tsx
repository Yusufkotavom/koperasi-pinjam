import type { Metadata } from "next"
import { Geist_Mono, Inter, Manrope } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationIndicatorProvider } from "@/components/navigation-indicator"
import { PageViewTransition } from "@/components/page-view-transition"

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "KoperasiApp — Sistem Informasi Koperasi Simpan Pinjam",
    template: "%s | KoperasiApp",
  },
  description:
    "Sistem manajemen koperasi simpan pinjam — nasabah, pinjaman, angsuran, dan laporan keuangan.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${manrope.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationIndicatorProvider>
            <PageViewTransition>{children}</PageViewTransition>
            <Toaster richColors position="top-right" />
          </NavigationIndicatorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
