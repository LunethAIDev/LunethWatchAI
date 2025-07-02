import fs from "fs"
import path from "path"

export interface RecordEntry {
  key: string
  value: any
  timestamp: number
}

export class DataBank {
  private file: string
  private store: Record<string, RecordEntry[]> = {}

  constructor(baseDir: string = process.cwd()) {
    this.file = path.join(baseDir, "databank.json")
    this.load()
  }

  private load(): void {
    if (fs.existsSync(this.file)) {
      try {
        this.store = JSON.parse(fs.readFileSync(this.file, "utf-8"))
      } catch {
        this.store = {}
      }
    }
  }

  private save(): void {
    fs.writeFileSync(this.file, JSON.stringify(this.store, null, 2))
  }

  add(key: string, value: any): void {
    const entry: RecordEntry = { key, value, timestamp: Date.now() }
    this.store[key] = this.store[key] || []
    this.store[key].push(entry)
    this.save()
  }

  get(key: string): RecordEntry[] {
    return this.store[key] || []
  }

  clear(key?: string): void {
    if (key) {
      delete this.store[key]
    } else {
      this.store = {}
    }
    this.save()
  }
}
