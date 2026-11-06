/**
 * Helper untuk memberikan delay 2-7 detik (atau range custom)
 * pada mutasi Server Action untuk mensimulasikan proses/processing time.
 * Eksekusi fn berjalan bersamaan (paralel) dengan timer agar efisien.
 */
export async function withActionDelay<T>(
  fn: () => Promise<T>,
  minSeconds = 2,
  maxSeconds = 7
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
