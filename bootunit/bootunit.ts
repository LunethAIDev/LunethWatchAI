import express, { Application, Request, Response } from "express"
import { z } from "zod"

const schema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  SOLANA_RPC_URL: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional().default("info")
})

type Config = z.infer<typeof schema>

/**
 * BootUnit handles configuration parsing, app instantiation,
 * healthcheck endpoint, server startup, and graceful shutdown.
 */
export class BootUnit {
  public readonly port: number
  public readonly rpcUrl: string
  public readonly logLevel: Config["LOG_LEVEL"]
  private server?: ReturnType<Application["listen"]>

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const cfg = schema.parse(env)
    this.port = cfg.PORT
    this.rpcUrl = cfg.SOLANA_RPC_URL
    this.logLevel = cfg.LOG_LEVEL
  }

  /**
   * Starts the Express app created by `appFactory`,
   * adds a /health endpoint, and handles graceful shutdown.
   */
  public start(appFactory: (rpcUrl: string) => Application): void {
    const app = appFactory(this.rpcUrl)

    // default health endpoint
    app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "ok", time: Date.now() })
    })

    try {
      this.server = app.listen(this.port, () => {
        console.log(
          `▶️ Listening on port ${this.port} (logLevel=${this.logLevel}, rpcUrl=${this.rpcUrl})`
        )
      })
    } catch (err) {
      console.error("❌ Failed to start server:", err)
      process.exit(1)
    }

    // Graceful shutdown
    const shutdown = () => {
      if (!this.server) return
      console.log("🛑 Shutting down...")
      this.server.close(() => {
        console.log("✅ Shutdown complete")
        process.exit(0)
      })
      // force exit after 10s
      setTimeout(() => process.exit(1), 10_000)
    }

    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
  }
}
