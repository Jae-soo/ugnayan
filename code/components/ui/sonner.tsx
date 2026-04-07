"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      expand
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl px-8 py-5 text-lg md:text-xl max-w-[40rem]",
          description:
            "group-[.toast]:text-muted-foreground text-base md:text-lg",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-base md:text-lg px-4 py-2",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-base md:text-lg px-4 py-2",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
