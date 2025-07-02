export interface Metrics {
  totalSupply: number
  holderCount: number
  avgBalance: number
}

export class MetricsCalculator {
  compute(values: number[]): Metrics {
    const totalSupply = values.reduce((s, v) => s + v, 0)
    const holderCount = values.filter(v => v > 0).length
    const avgBalance = holderCount ? totalSupply / holderCount : 0
    return { totalSupply, holderCount, avgBalance }
  }
}
