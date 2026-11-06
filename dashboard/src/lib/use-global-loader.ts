import { create } from "zustand"

interface GlobalLoaderState {
  isLoading: boolean
  title: string
  description?: string
  show: (title?: string, description?: string) => void
  hide: () => void
}

export const useGlobalLoader = create<GlobalLoaderState>((set) => ({
  isLoading: false,
  title: "Memproses...",
  description: "Mohon tunggu sebentar, sistem sedang memvalidasi data.",
  show: (
    title = "Memproses Transaksi...",
    description = "Mohon jangan menutup atau merefresh halaman."
  ) =>
    set({
      isLoading: true,
      title,
      description,
    }),
  hide: () =>
    set({
      isLoading: false,
    }),
}))
