import readline from "readline"
import { ScanMap, TransferEdge } from "./scanmap"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const rpc = process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"
const scanner = new ScanMap(rpc)

rl.question("Token mint to map: ", async (mint) => {
  try {
    const edges: TransferEdge[] = await scanner.analyze(mint.trim())
    console.log("Transfer Graph Edges:")
    edges.forEach(e => {
      console.log(`${e.from} → ${e.to}: ${e.count}`)
    })
  } catch (err: any) {
    console.error("Error:", err.message)
  } finally {
    rl.close()
  }
})
