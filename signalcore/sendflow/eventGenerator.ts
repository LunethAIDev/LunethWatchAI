import { Event } from "./patternDetector"

export interface Signal {
  mint: string
  totalVolume: number
  events: Event[]
  timestamp: number
}

export class EventGenerator {
  build(mint: string, events: Event[]): Signal {
    const totalVolume = events.reduce((s, e) => s + e.amount, 0)
    return { mint, totalVolume, events, timestamp: Date.now() }
  }
}
