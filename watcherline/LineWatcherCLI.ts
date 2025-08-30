import dotenv from "dotenv"
import readline from "readline"
import { WatchGuardService } from "./watchGuardService"

dotenv.config()

const svc = new WatchGuardService(process.env.SOLANA_RPC_ENDPOINT!)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

svc.onNewTx((wallet, sig) => {
  console.log(`🔔 New Transaction Detected for Wallet: ${wallet}`)
  console.log(`Transaction Signature: ${sig}`)
})

const promptForWallets = () => {
  rl.question("Enter Wallets to Watch (comma-separated): ", (input) => {
    const wallets = input.split(",").map(s => s.trim()).filter(Boolean)

    if (wallets.length === 0) {
      console.log("No valid wallets entered. Please try again.")
      rl.close()
      return
    }

    wallets.forEach((addr) => svc.addTarget(addr))

    console.log(`Watching ${wallets.length} wallets...`)
    svc.start(7000) // Start monitoring with a 7-second interval
    console.log("WatchGuard is now running every 7 seconds…")
    rl.close()
  })
}

promptForWallets()
