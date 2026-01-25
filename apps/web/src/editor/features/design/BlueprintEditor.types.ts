import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export type RouteItem = {
  id: string
  path: string
}

export type ComponentPreviewVariant = {
  id: string
  label: string
  element: ReactNode
  scale?: number
}

export type ComponentPreviewOption = {
  id: string
  label: string
  value: string
}

export type ComponentPreviewStatus = ComponentPreviewOption & {
  icon?: ReactNode
}

export type ComponentPreviewItem = {
  id: string
  name: string
  preview: ReactNode
  scale?: number
  variants?: ComponentPreviewVariant[]
  sizeOptions?: ComponentPreviewOption[]
  statusOptions?: ComponentPreviewStatus[]
  renderPreview?: (options: { size?: string; status?: string }) => ReactNode
  defaultStatus?: string
}

export type ComponentGroup = {
  id: string
  title: string
  items: ComponentPreviewItem[]
}

export type ViewportPreset = {
  id: string
  name: string
  kind: "Phone" | "Tablet" | "Laptop" | "Desktop" | "Watch"
  kindLabel: string
  width: string
  height: string
  icon: LucideIcon
}

export type QuickViewportPreset = {
  id: string
  label: string
  width: string
  height: string
}
