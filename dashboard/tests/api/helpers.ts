export async function readCsv(response: Response) {
  const text = await response.text()
  return text.replace(/^\uFEFF/, "")
}

