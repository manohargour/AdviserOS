import type { AssetClass } from '@/lib/data'

export const ASSET_COLORS: Record<AssetClass, string> = {
  Equity: 'var(--chart-1)',
  Bonds: 'var(--chart-2)',
  Property: 'var(--chart-3)',
  Alternatives: 'var(--chart-4)',
  Cash: 'var(--chart-5)',
}
