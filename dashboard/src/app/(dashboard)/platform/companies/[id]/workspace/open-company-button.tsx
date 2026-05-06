"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Building2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { prepareEnterCompanyContext } from "@/actions/platform-admin"
import { Button } from "@/components/ui/button"

export function OpenCompanyButton(props: { companyId: string; companyName: string }) {
  const router = useRouter()
  const { update } = useSession()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      onClick={() => {
        startTransition(async () => {
          const prep = await prepareEnterCompanyContext(props.companyId)
          if ("error" in prep) {
            toast.error(prep.error)
            return
          }
          await update({ actingCompanyId: prep.data.companyId })
          toast.success(`Masuk ke konteks ${props.companyName}`)
          router.push("/dashboard")
          router.refresh()
        })
      }}
      disabled={isPending}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
      {isPending ? "Memproses..." : "Masuk Dashboard Company"}
    </Button>
  )
}
