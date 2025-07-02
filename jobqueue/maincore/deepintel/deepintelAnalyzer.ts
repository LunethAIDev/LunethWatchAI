import { TimePoint } from "./deepintelService"

export interface Anomaly {
  timestamp: number
  field: keyof TimePoint
  deviation: number
}

export class DeepIntelAnalyzer {
  detectAnomalies(series: TimePoint[], threshold = 3): Anomaly[] {
    const anomalies: Anomaly[] = []
    const fields: (keyof TimePoint)[] = ["volume", "price", "liquidity"]

    for (const field of fields) {
      const values = series.map(p => p[field] as number)
      const mean = values.reduce((s, v) => s + v, 0) / (values.length || 1)
      const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length || 1)
      const std = Math.sqrt(variance)

      series.forEach(point => {
        const delta = Math.abs((point[field] as number) - mean)
        if (std > 0 && delta / std > threshold) {
          anomalies.push({ timestamp: point.timestamp, field, deviation: Number((delta / std).toFixed(2)) })
        }
      })
    }

    return anomalies
  }
}
