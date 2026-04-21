import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RoadmapClient } from "./roadmap-client"
import { ListTodo } from "lucide-react"

export const metadata = {
  title: "Roadmap Fitur",
}

export default function RoadmapPage() {
  return (
    <div className="p-6 space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
            <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_60%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.18),transparent_55%)]" />
            <div className="relative p-6 sm:p-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between text-white">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
                  <ListTodo className="size-3.5" />
                  Checklist & status
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Roadmap Fitur</h1>
                  <p className="mt-1 text-sm sm:text-base text-slate-300 max-w-3xl">
                    Ringkasan semua modul yang sudah ada, yang sedang dikerjakan, dan rencana berikutnya.
                  </p>
                </div>
              </div>
              <Badge className="bg-white/10 text-white border border-white/10 hover:bg-white/10 w-fit">
                Dashboard internal
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <RoadmapClient />
    </div>
  )
}

