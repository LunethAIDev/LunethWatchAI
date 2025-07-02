
export interface TaskItem {
  id: string
  title: string
  payload?: any
}

export class TaskGrid {
  private grid: Map<string, TaskItem[]> = new Map()

  private key(row: number, col: number): string {
    return `${row}:${col}`
  }

  add(row: number, col: number, task: TaskItem): void {
    const k = this.key(row, col)
    const list = this.grid.get(k) || []
    list.push(task)
    this.grid.set(k, list)
  }

  get(row: number, col: number): TaskItem[] {
    return this.grid.get(this.key(row, col)) || []
  }

  remove(row: number, col: number, taskId: string): boolean {
    const k = this.key(row, col)
    const list = this.grid.get(k)
    if (!list) return false
    const filtered = list.filter(t => t.id !== taskId)
    if (filtered.length === list.length) return false
    this.grid.set(k, filtered)
    return true
  }

  clear(row?: number, col?: number): void {
    if (row == null || col == null) {
      this.grid.clear()
    } else {
      this.grid.delete(this.key(row, col))
    }
  }

  all(): { row: number; col: number; tasks: TaskItem[] }[] {
    return Array.from(this.grid.entries()).map(([k, tasks]) => {
      const [r, c] = k.split(":").map(Number)
      return { row: r, col: c, tasks }
    })
  }
}
