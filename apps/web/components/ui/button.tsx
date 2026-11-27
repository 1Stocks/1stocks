import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * OneStock Button — shadcn base-nova, restyled from Figcraft
 * Variants: Primary / Secondary / Ghost (+ Disabled via `disabled`)
 * Sizes: Md (42px) / Sm (32px)
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:border-transparent disabled:bg-border disabled:text-muted-foreground disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary — accent fill, accent-ink label
        default:
          "bg-primary text-primary-foreground hover:bg-primary-active",
        // Secondary — panel fill + line border, fg label
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-panel2",
        // Outline mirrors Secondary (Figcraft has no separate outline)
        outline:
          "border-border bg-secondary text-secondary-foreground hover:bg-panel2",
        // Ghost — muted label, no fill
        ghost:
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline disabled:bg-transparent",
      },
      size: {
        // Md — 42px / 14px / px-18
        default:
          "h-[42px] gap-2 px-[18px] text-sm has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        // Sm — 32px / 13px / px-12
        sm: "h-8 gap-1.5 px-3 text-[13px] leading-5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-7 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        lg: "h-[42px] gap-2 px-5 text-[15px] font-semibold has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-[42px]",
        "icon-xs":
          "size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-[42px]",
      },
    },
    compoundVariants: [
      { variant: "ghost", size: "default", class: "px-3.5" },
      { variant: "ghost", size: "sm", class: "px-2.5" },
      {
        variant: "link",
        class: "h-auto px-0 disabled:text-muted-foreground",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
