import type { LucideIcon, LucideProps } from 'lucide-react'
import {
  AirVent,
  Building2,
  Flame,
  Frame,
  Home,
  House,
  HousePlus,
  Layers,
  LayoutGrid,
  Sparkles,
  Sun,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  home: Home,
  'building-2': Building2,
  frame: Frame,
  layers: Layers,
  'air-vent': AirVent,
  sun: Sun,
  sparkles: Sparkles,
  'layout-grid': LayoutGrid,
  flame: Flame,
  'house-plus': HousePlus,
  house: House,
}

export function ReEnergieArticleIcon({
  iconKey,
  className,
  ...props
}: { iconKey: string | null; className?: string } & Omit<LucideProps, "ref" | "name">) {
  const I = (iconKey && MAP[iconKey]) as LucideIcon | undefined
  const Icon: LucideIcon = I ?? LayoutGrid
  return <Icon className={className} aria-hidden {...props} />
}
