import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationIndicatorProvider } from "@/components/navigation-indicator"
import { PageViewTransition } from "@/components/page-view-transition"

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
      className="antialiased"
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
