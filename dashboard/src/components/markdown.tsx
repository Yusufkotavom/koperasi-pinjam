import * as React from "react"
import { cn } from "@/lib/utils"

type InlineNode =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] }

function parseInline(input: string): InlineNode[] {
  // Minimal inline parser: code (`x`), strong (**x**), em (*x*), link [t](href)
  // This intentionally ignores complex nesting to keep it safe and predictable.

  const nodes: InlineNode[] = []

  // Code spans first: split by backticks and mark odd segments as code.
  const parts = input.split("`")
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] ?? ""
    if (part.length === 0) continue
    if (i % 2 === 1) {
      nodes.push({ type: "code", value: part })
    } else {
      nodes.push(...parseInlineNoCode(part))
    }
  }
  return nodes
}

function parseInlineNoCode(input: string): InlineNode[] {
  const out: InlineNode[] = []
  let s = input

  while (s.length > 0) {
    const linkStart = s.indexOf("[")
    const strongStart = s.indexOf("**")
    const emStart = s.indexOf("*")

    const candidates = [
      { kind: "link" as const, idx: linkStart },
      { kind: "strong" as const, idx: strongStart },
      { kind: "em" as const, idx: emStart },
    ].filter((c) => c.idx >= 0)

    if (candidates.length === 0) {
      out.push({ type: "text", value: s })
      break
    }

    candidates.sort((a, b) => a.idx - b.idx)
    const next = candidates[0]!

    if (next.idx > 0) {
      out.push({ type: "text", value: s.slice(0, next.idx) })
      s = s.slice(next.idx)
      continue
    }

    if (next.kind === "link") {
      const closeBracket = s.indexOf("]")
      const openParen = closeBracket >= 0 ? s.indexOf("(", closeBracket) : -1
      const closeParen = openParen >= 0 ? s.indexOf(")", openParen) : -1
      if (closeBracket >= 0 && openParen === closeBracket + 1 && closeParen >= 0) {
        const text = s.slice(1, closeBracket)
        const href = s.slice(openParen + 1, closeParen).trim()
        out.push({ type: "link", href, children: parseInline(text) })
        s = s.slice(closeParen + 1)
        continue
      }
      // Not a valid link pattern, treat "[" as text.
      out.push({ type: "text", value: "[" })
      s = s.slice(1)
      continue
    }

    if (next.kind === "strong") {
      const end = s.indexOf("**", 2)
      if (end >= 0) {
        const inner = s.slice(2, end)
        out.push({ type: "strong", children: parseInline(inner) })
        s = s.slice(end + 2)
        continue
      }
      out.push({ type: "text", value: "**" })
      s = s.slice(2)
      continue
    }

    // em (*x*)
    if (next.kind === "em") {
      // avoid treating "**" as em
      if (s.startsWith("**")) {
        out.push({ type: "text", value: "*" })
        s = s.slice(1)
        continue
      }
      const end = s.indexOf("*", 1)
      if (end >= 0) {
        const inner = s.slice(1, end)
        out.push({ type: "em", children: parseInline(inner) })
        s = s.slice(end + 1)
        continue
      }
      out.push({ type: "text", value: "*" })
      s = s.slice(1)
      continue
    }
  }

  return out
}

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((n, idx) => {
        if (n.type === "text") return <React.Fragment key={idx}>{n.value}</React.Fragment>
        if (n.type === "code") {
          return (
            <code
              key={idx}
              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200"
            >
              {n.value}
            </code>
          )
        }
        if (n.type === "strong") return <strong key={idx}><Inline nodes={n.children} /></strong>
        if (n.type === "em") return <em key={idx}><Inline nodes={n.children} /></em>
        if (n.type === "link") {
          const isExternal = /^https?:\/\//.test(n.href)
          return (
            <a
              key={idx}
              href={n.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              className="text-blue-700 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Inline nodes={n.children} />
            </a>
          )
        }
        return null
      })}
    </>
  )
}

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang?: string; lines: string[] }

function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []

  let i = 0
  const pushParagraph = (buf: string[]) => {
    const trimmed = buf.map((l) => l.trimEnd())
    if (trimmed.join("").trim().length === 0) return
    blocks.push({ type: "p", lines: trimmed })
  }

  while (i < lines.length) {
    const line = lines[i] ?? ""

    // fenced code
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || undefined
      i++
      const codeLines: string[] = []
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        codeLines.push(lines[i] ?? "")
        i++
      }
      // skip closing fence if present
      if (i < lines.length && (lines[i] ?? "").startsWith("```")) i++
      blocks.push({ type: "code", lang, lines: codeLines })
      continue
    }

    // headings
    if (line.startsWith("# ")) {
      blocks.push({ type: "h", level: 1, text: line.slice(2).trim() })
      i++
      continue
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h", level: 2, text: line.slice(3).trim() })
      i++
      continue
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h", level: 3, text: line.slice(4).trim() })
      i++
      continue
    }

    // lists
    const ulMatch = /^[-*]\s+(.+)$/.exec(line)
    if (ulMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const l = lines[i] ?? ""
        const m = /^[-*]\s+(.+)$/.exec(l)
        if (!m) break
        items.push(m[1] ?? "")
        i++
      }
      blocks.push({ type: "ul", items })
      continue
    }

    const olMatch = /^\d+\.\s+(.+)$/.exec(line)
    if (olMatch) {
      const items: string[] = []
      while (i < lines.length) {
        const l = lines[i] ?? ""
        const m = /^\d+\.\s+(.+)$/.exec(l)
        if (!m) break
        items.push(m[1] ?? "")
        i++
      }
      blocks.push({ type: "ol", items })
      continue
    }

    // paragraph (collect until blank line or a new block starts)
    if (line.trim().length === 0) {
      i++
      continue
    }

    const para: string[] = []
    while (i < lines.length) {
      const l = lines[i] ?? ""
      if (l.trim().length === 0) break
      if (l.startsWith("```")) break
      if (l.startsWith("# ")) break
      if (l.startsWith("## ")) break
      if (l.startsWith("### ")) break
      if (/^[-*]\s+/.test(l)) break
      if (/^\d+\.\s+/.test(l)) break
      para.push(l)
      i++
    }
    pushParagraph(para)
  }

  return blocks
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = React.useMemo(() => parseBlocks(content), [content])

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((b, idx) => {
        if (b.type === "h") {
          const nodes = parseInline(b.text)
          if (b.level === 1) return <h1 key={idx} className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"><Inline nodes={nodes} /></h1>
          if (b.level === 2) return <h2 key={idx} className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 pt-2"><Inline nodes={nodes} /></h2>
          return <h3 key={idx} className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 pt-1"><Inline nodes={nodes} /></h3>
        }

        if (b.type === "code") {
          const header = b.lang ? `(${b.lang})` : ""
          return (
            <div key={idx} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 overflow-hidden">
              {header ? (
                <div className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Code {header}
                </div>
              ) : null}
              <pre className="p-4 overflow-auto text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <code className="font-mono">{b.lines.join("\n")}</code>
              </pre>
            </div>
          )
        }

        if (b.type === "ul") {
          return (
            <ul key={idx} className="list-disc pl-6 space-y-1 text-sm text-slate-700 dark:text-slate-200">
              {b.items.map((it, j) => (
                <li key={j}><Inline nodes={parseInline(it)} /></li>
              ))}
            </ul>
          )
        }

        if (b.type === "ol") {
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-1 text-sm text-slate-700 dark:text-slate-200">
              {b.items.map((it, j) => (
                <li key={j}><Inline nodes={parseInline(it)} /></li>
              ))}
            </ol>
          )
        }

        // paragraph
        return (
          <p key={idx} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {b.lines.map((l, j) => (
              <React.Fragment key={j}>
                <Inline nodes={parseInline(l)} />
                {j < b.lines.length - 1 ? <br /> : null}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

