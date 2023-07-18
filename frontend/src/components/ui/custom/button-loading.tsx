import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ButtonLoading({ message = "Please wait" }: { message: string }) {
  return (
    <Button disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {message}
    </Button>
  )
}