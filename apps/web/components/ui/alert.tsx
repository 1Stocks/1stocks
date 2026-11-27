import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/**
 * OneStock Alert — shadcn base, restyled from Figcraft Inputs & Notes
 * Tinted flat surfaces + tone border (success / warning / destructive / info)
 */
const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-3.5 py-3 text-left text-[13.5px] leading-5 has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-border bg-panel text-foreground *:data-[slot=alert-description]:text-muted-foreground",
        success: "border-alert-success-border bg-alert-success text-alert-success-foreground *:data-[slot=alert-description]:text-alert-success-foreground",
        warning: "border-alert-warning-border bg-alert-warning text-alert-warning-foreground *:data-[slot=alert-description]:text-alert-warning-foreground",
        destructive: "border-alert-destructive-border bg-alert-destructive text-alert-destructive-foreground *:data-[slot=alert-description]:text-alert-destructive-foreground",
        info: "border-alert-info-border bg-alert-info text-alert-info-foreground *:data-[slot=alert-description]:text-alert-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-[13.5px] leading-5 text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants }
