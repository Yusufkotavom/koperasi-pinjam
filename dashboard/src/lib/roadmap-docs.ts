import { promises as fs } from "fs"
import path from "path"

export type RoadmapDocItem = {
  title: string
  status: "DONE" | "IN_PROGRESS" | "PLANNED"
  notes?: string
}

export type RoadmapDocSection = {
  title: string
  description?: string
  items: RoadmapDocItem[]
}

type ChangelogEntry = {
  version: string
  date?: string
  items: string[]
}

const ROADMAP_MD_PATH = path.join(process.cwd(), "ROADMAP.md")
const CHANGELOG_MD_PATH = path.join(process.cwd(), "CHANGELOG.md")

async function readIfExists(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8")
  } catch {
    return ""
  }
}

function parseRoadmapMarkdown(markdown: string): RoadmapDocSection[] {
  if (!markdown.trim()) return []

  const lines = markdown.split(/\r?\n/)
  const sections: RoadmapDocSection[] = []
  let current: RoadmapDocSection | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      if (current && current.items.length > 0) sections.push(current)
      current = { title: headingMatch[1], items: [] }
      continue
    }

    const itemMatch = line.match(/^-\s*\[( |x|X)\]\s+(.+)$/)
    if (itemMatch) {
      if (!current) current = { title: "Roadmap Tambahan", items: [] }
      current.items.push({
        title: itemMatch[2],
        status: itemMatch[1].toLowerCase() === "x" ? "DONE" : "PLANNED",
      })
      continue
    }

    if (current && !current.description && !line.startsWith("-")) {
      current.description = line
    }
  }

  if (current && current.items.length > 0) sections.push(current)
  return sections
}

function parseChangelogMarkdown(markdown: string): ChangelogEntry[] {
  if (!markdown.trim()) return []

  const lines = markdown.split(/\r?\n/)
  const entries: ChangelogEntry[] = []
  let current: ChangelogEntry | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      if (current && current.items.length > 0) entries.push(current)
      const title = headingMatch[1]
      const dateMatch = title.match(/(\d{4}-\d{2}-\d{2})/)
      current = {
        version: title,
        date: dateMatch?.[1],
        items: [],
      }
      continue
    }

    const bulletMatch = line.match(/^-\s+(.+)$/)
    if (bulletMatch) {
      if (!current) {
        current = { version: "Unreleased", items: [] }
      }
      current.items.push(bulletMatch[1])
    }
  }

  if (current && current.items.length > 0) entries.push(current)
  return entries
}

function changelogToRoadmapSections(entries: ChangelogEntry[]): RoadmapDocSection[] {
  return entries.slice(0, 5).map((entry) => ({
    title: `Changelog: ${entry.version}`,
    description: entry.date ? `Perubahan tanggal ${entry.date}` : "Perubahan terbaru",
    items: entry.items.map((item) => ({
      title: item,
      status: "DONE",
    })),
  }))
}

export async function getRoadmapDocSections(): Promise<RoadmapDocSection[]> {
  const [roadmapMd, changelogMd] = await Promise.all([
    readIfExists(ROADMAP_MD_PATH),
    readIfExists(CHANGELOG_MD_PATH),
  ])

  const roadmapSections = parseRoadmapMarkdown(roadmapMd)
  const changelogSections = changelogToRoadmapSections(parseChangelogMarkdown(changelogMd))
  return [...roadmapSections, ...changelogSections]
}
