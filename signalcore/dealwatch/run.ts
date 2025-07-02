import readline from "readline"
import { PriceTracker } from "./priceTracker"

const rpc = process.env.SOLANA_RPC_ENDPOINT || ""
const tracker = new PriceTracker(rpc)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

rl.question("Token mint for dealwatch: ", async (mint) => {
  try {
    const prices = await tracker.getRecentPrices(mint.trim())
    const avg = prices.reduce((a, b) => a + b, 0) / (prices.length || 1)
    console.log(`Observed ${prices.length} swaps, avg price: ${avg.toFixed(6)}`)
  } catch (err: any) {
    console.error("Error:", err.message)
  } finally {
    rl.close()
  }
})
