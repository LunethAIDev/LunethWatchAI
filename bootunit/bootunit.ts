import express from "express"
import { z } from "zod"

const schema = z.object({
  PORT: z.string().optional().default("3000"),
  SOLANA_RPC_URL: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info")
})

type Config = z.infer<typeof schema>

export class BootUnit {
  public readonly port: number
  public readonly rpcUrl: string
  public readonly logLevel: Config["LOG_LEVEL"]

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const cfg = schema.parse(env)
    this.port = Number(cfg.PORT)
    this.rpcUrl = cfg.SOLANA_RPC_URL
    this.logLevel = cfg.LOG_LEVEL
  }

  public start(appFactory: (rpcUrl: string) => express.Application): void {
    const app = appFactory(this.rpcUrl)
    app.listen(this.port, () => {
      console.log(`▶️  Listening on port ${this.port} (logLevel=${this.logLevel})`)
    })
  }
}
