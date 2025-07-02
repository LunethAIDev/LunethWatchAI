import { LunethEngine } from './lunethEngine'

export interface OnChainMetric {
  timestamp: number
  volume: number
  liquidity: number
  activeAddresses: number
}

export interface CorrelationResult {
  pair: [keyof OnChainMetric, keyof OnChainMetric]
  coefficient: number
}

function pearson(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0 || y.length !== n) return 0
  const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / n
  const mX = mean(x), mY = mean(y)
  let num = 0, dx2 = 0, dy2 = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mX, dy = y[i] - mY
    num += dx * dy
    dx2 += dx * dx
    dy2 += dy * dy
  }
  const denom = Math.sqrt(dx2 * dy2)
  return denom === 0 ? 0 : num / denom
}

export class LunethCorrelationAnalyzer {
  private engine: LunethEngine

  constructor(apiUrl: string, apiKey: string) {
    this.engine = new LunethEngine(apiUrl, apiKey)
  }

  async analyze(address: string, hours: number): Promise<CorrelationResult[]> {
    const data = await this.engine.fetchMetrics(address, hours) as OnChainMetric[]
    if (!data.length) return []
    const series = {
      volume: data.map(d => d.volume),
      liquidity: data.map(d => d.liquidity),
      activeAddresses: data.map(d => d.activeAddresses)
    }
    const keys: (keyof typeof series)[] = ['volume', 'liquidity', 'activeAddresses']
    const out: CorrelationResult[] = []
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = keys[i], b = keys[j]
        const coeff = pearson(series[a], series[b])
        out.push({ pair: [a, b], coefficient: Number(coeff.toFixed(4)) })
      }
    }
    return out
  }
}
