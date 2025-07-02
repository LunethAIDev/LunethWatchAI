import { Metrics } from "./BrainMetrics"

export interface Alert {
  level: "info" | "warning" | "critical"
  message: string
  timestamp: number
}

export class BrainNotifier {
  private alerts: Alert[] = []

  evaluate(m: Metrics): Alert[] {
    this.alerts = []

    if (m.totalVolume > 1_000_000) {
      this.alerts.push({ level: "critical", message: "High transfer volume detected", timestamp: Date.now() })
    } else if (m.uniqueSenders > 50) {
      this.alerts.push({ level: "warning", message: "Many unique senders in recent transfers", timestamp: Date.now() })
    } else {
      this.alerts.push({ level: "info", message: "Transfer activity within normal range", timestamp: Date.now() })
    }

    return this.alerts
  }
}
