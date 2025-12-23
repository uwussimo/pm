import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("h-4 w-4 animate-spin", className)}
      strokeWidth={2}
      {...props}
    />
  )
}

export { Spinner }
