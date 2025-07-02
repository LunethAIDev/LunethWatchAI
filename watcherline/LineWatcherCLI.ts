
import dotenv from "dotenv"
import readline from "readline"
import { WatchGuardService } from "./watchGuardService"

dotenv.config()
const svc = new WatchGuardService(process.env.SOLANA_RPC_ENDPOINT!)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

svc.onNewTx((wallet, sig) => {
  console.log(`🔔 ${wallet}: ${sig}`)
})

rl.question("Wallets to watch (comma-separated): ", input => {
  input.split(",").map(s => s.trim()).filter(Boolean).forEach(addr => svc.addTarget(addr))
  svc.start(7000)
  console.log("WatchGuard is running every 7s…")
  rl.close()
})
