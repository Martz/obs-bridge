import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: true,
  setOpen: () => {},
})

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open } = React.useContext(SidebarContext)

  return (
    <aside
      className={cn(
        "border-r bg-sidebar transition-all duration-300",
        open ? "w-64" : "w-16",
        className
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("flex h-full flex-col", className)}>{children}</div>
}

export function SidebarGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>
}

export function SidebarGroupLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("text-sm font-medium text-sidebar-foreground", className)}>
      {children}
    </div>
  )
}

export function SidebarGroupContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(className)}>{children}</div>
}

export function SidebarMenu({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <nav className={cn("flex flex-col space-y-1 px-3", className)}>{children}</nav>
}

export function SidebarMenuItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(className)}>{children}</div>
}

export function SidebarMenuButton({
  children,
  className,
  asChild,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
}) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      ),
      ...props,
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function SidebarInset({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main className={cn("flex flex-1 flex-col bg-background", className)}>
      {children}
    </main>
  )
}

export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = React.useContext(SidebarContext)

  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9",
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <line x1="9" x2="9" y1="3" y2="21" />
      </svg>
      <span className="sr-only">Toggle sidebar</span>
    </button>
  )
}
