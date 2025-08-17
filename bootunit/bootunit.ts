import express, { Application, Request, Response } from "express"
import { z } from "zod"

const schema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  SOLANA_RPC_URL: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info")
})

type Config = z.infer<typeof schema>

export class BootUnit {
  public readonly port: number
  public readonly rpcUrl: string
  public readonly logLevel: Config["LOG_LEVEL"]
  private server?: ReturnType<Application["listen"]>

  constructor(env: NodeJS.ProcessEnv = process.env) {
    let cfg: Config
    try {
      cfg = schema.parse(env)
    } catch (err) {
      console.error("❌ Invalid configuration:", err)
      process.exit(1)
    }

    this.port = cfg.PORT
    this.rpcUrl = cfg.SOLANA_RPC_URL
    this.logLevel = cfg.LOG_LEVEL
  }

  public start(appFactory: (rpcUrl: string) => Application): void {
    const app = appFactory(this.rpcUrl)

    app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "ok", time: Date.now() })
    })

    try {
      this.server = app.listen(this.port, () => {
        console.log(
          `🚀 Server running at http://localhost:${this.port} | logLevel=${this.logLevel} | rpcUrl=${this.rpcUrl}`
        )
      })

      this.server.once("error", (err) => {
        console.error("❌ Server startup error:", err)
        process.exit(1)
      })
    } catch (err) {
      console.error("❌ Failed to start server:", err)
      process.exit(1)
    }

    const shutdown = () => {
      if (!this.server) return
      console.log("🛑 Gracefully shutting down server...")
      this.server.close(() => {
        console.log("✅ Server closed successfully")
        process.exit(0)
      })

      // Force shutdown after 10s
      setTimeout(() => {
        console.warn("⏱ Force exiting after timeout")
        process.exit(1)
      }, 10_000)
    }

    process.once("SIGINT", shutdown)
    process.once("SIGTERM", shutdown)
  }
}
