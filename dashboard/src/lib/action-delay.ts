/**
 * Helper untuk memberikan delay singkat 1-2 detik (responsif tapi tetap aman)
 * pada mutasi Server Action untuk memastikan feedback UI tampil tanpa jeda terlalu lama.
 * Eksekusi fn berjalan bersamaan (paralel) dengan timer agar efisien.
 */
export async function withActionDelay<T>(
  fn: () => Promise<T>,
  minSeconds = 1,
  maxSeconds = 2
): Promise<T> {
  const minMs = Math.max(0, minSeconds * 1000)
  const maxMs = Math.max(minMs, maxSeconds * 1000)
  const delayMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs

  const [result] = await Promise.all([
    fn(),
    new Promise((resolve) => setTimeout(resolve, delayMs)),
  ])

  return result
}
