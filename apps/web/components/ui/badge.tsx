import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * OneStock Status Badge — shadcn base, restyled from Figcraft
 * Tones: Neutral / Positive / Negative / Warning / Info
 * Flat panel surface + 1px tone border (no glow)
 */
const badgeVariants = cva(
  "group/badge inline-flex h-[30px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border bg-panel px-2.5 text-xs font-normal leading-[18px] whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // Neutral — line border, muted label
        default: "border-border text-muted-foreground",
        secondary: "border-border text-muted-foreground",
        outline: "border-border text-muted-foreground",
        // Positive — up
        positive: "border-up text-up",
        // Negative — down / destructive
        destructive: "border-destructive text-destructive",
        // Warning — warn
        warning: "border-warning text-warning",
        // Info
        info: "border-info text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
