import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-[#F5F5F7] dark:bg-[#2C2C2E] animate-pulse rounded-md",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
