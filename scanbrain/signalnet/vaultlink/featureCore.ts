export interface WatchTimePoint {
  timestamp: number
  volume: number
  price: number
  liquidity: number
}

export interface WatchFeatureVector {
  timestamp: number
  movingAverages: {
    short: number
    medium: number
    long: number
  }
  momentum: number
  volatility: number
  liquidityRatio: number
}

class Window {
  private readonly maxSize: number
  private values: number[] = []
  private sum = 0

  constructor(maxSize: number) {
    this.maxSize = maxSize
  }

  add(v: number): void {
    this.values.push(v)
    this.sum += v
    if (this.values.length > this.maxSize) {
      this.sum -= this.values.shift() as number
    }
  }

  avg(): number {
    return this.values.length ? this.sum / this.values.length : 0
  }
}

export class LunethFeatureExtractor {
  static extract(
    series: WatchTimePoint[],
    filterTimestamps: number[] = []
  ): WatchFeatureVector[] {
    const shortW = new Window(5)
    const medW = new Window(15)
    const longW = new Window(60)
    const results: WatchFeatureVector[] = []
    let prevPrice: number | null = null
    const oneHour = 3_600_000

    for (const point of series) {
      shortW.add(point.price)
      medW.add(point.price)
      longW.add(point.price)

      const maShort = shortW.avg()
      const maMed = medW.avg()
      const maLong = longW.avg()

      const momentum =
        prevPrice !== null && prevPrice !== 0
          ? (point.price - prevPrice) / prevPrice
          : 0

      const windowPoints = series.filter(
        p => p.timestamp >= point.timestamp - oneHour && p.timestamp <= point.timestamp
      ).map(p => p.price)

      const mean =
        windowPoints.reduce((s, v) => s + v, 0) / (windowPoints.length || 1)
      const variance =
        windowPoints.reduce((s, v) => s + (v - mean) ** 2, 0) / (windowPoints.length || 1)
      const volatility = Math.sqrt(variance)

      const liquidityRatio =
        point.liquidity !== 0 ? point.volume / point.liquidity : 0

      if (
        !filterTimestamps.length ||
        filterTimestamps.includes(point.timestamp)
      ) {
        results.push({
          timestamp: point.timestamp,
          movingAverages: { short: maShort, medium: maMed, long: maLong },
          momentum,
          volatility,
          liquidityRatio
        })
      }

      prevPrice = point.price
    }

    return results
  }
}
