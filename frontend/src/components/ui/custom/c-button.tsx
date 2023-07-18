import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

enum BUTTON_STATE {
  LOADING = "LOADING",
  SUBMIT = "SUBMIT",
}

function ButtonLoading() {
  return (
    <Button disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> "Loading"
    </Button>
  )
}
export default function CButton({ state }: { state: BUTTON_STATE }) {
  switch (state) {
    case BUTTON_STATE.LOADING:
      return <ButtonLoading />

    default:
      return <Button type="submit"> Submit </Button>
  }
}