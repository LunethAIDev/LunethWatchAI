import fetch from "node-fetch"

export interface Order { price: number; size: number }
export interface Trade { timestamp: number; price: number; size: number; side: "buy" | "sell" }
export interface FlowMetrics {
  symbol: string
  bidAskImbalance: number
  volumeBuy: number
  volumeSell: number
  vwapBuy: number
  vwapSell: number
}

export class DexFlow {
  constructor(private apiBase: string) {}

  async fetchOrderBook(symbol: string, depth = 50): Promise<{ bids: Order[]; asks: Order[] }> {
    const res = await fetch(`${this.apiBase}/markets/${symbol}/orderbook?depth=${depth}`)
    if (!res.ok) throw new Error(res.statusText)
    return (await res.json()) as any
  }

  async fetchTrades(symbol: string, limit = 100): Promise<Trade[]> {
    const res = await fetch(`${this.apiBase}/markets/${symbol}/trades?limit=${limit}`)
    if (!res.ok) throw new Error(res.statusText)
    return (await res.json()) as Trade[]
  }

  async computeFlow(symbol: string): Promise<FlowMetrics> {
    const [book, trades] = await Promise.all([
      this.fetchOrderBook(symbol),
      this.fetchTrades(symbol)
    ])

    const bidVol = book.bids.reduce((s, o) => s + o.size, 0)
    const askVol = book.asks.reduce((s, o) => s + o.size, 0)
    const imbalance = bidVol && askVol ? (bidVol - askVol) / (bidVol + askVol) : 0

    const buys = trades.filter(t => t.side === "buy")
    const sells = trades.filter(t => t.side === "sell")

    const volBuy = buys.reduce((s, t) => s + t.size, 0)
    const volSell = sells.reduce((s, t) => s + t.size, 0)

    const vwap = (arr: Trade[]) => {
      const pv = arr.reduce((s, t) => s + t.price * t.size, 0)
      const v = arr.reduce((s, t) => s + t.size, 0)
      return v ? pv / v : 0
    }

    return {
      symbol,
      bidAskImbalance: Number(imbalance.toFixed(4)),
      volumeBuy: volBuy,
      volumeSell: volSell,
      vwapBuy: Number(vwap(buys).toFixed(6)),
      vwapSell: Number(vwap(sells).toFixed(6))
    }
  }
}
