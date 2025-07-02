import { TaskGrid, TaskItem } from "./taskGrid"

const grid = new TaskGrid()

const sampleTasks: TaskItem[] = [
  { id: "t1", title: "Analyze volume spike" },
  { id: "t2", title: "Compute risk score" },
  { id: "t3", title: "Detect anomalies" }
]

grid.add(0, 0, sampleTasks[0])
grid.add(0, 1, sampleTasks[1])
grid.add(1, 0, sampleTasks[2])

console.log("All cells:")
console.table(grid.all())

console.log("Tasks at (0,1):", grid.get(0, 1))

console.log("Removing t2 from (0,1):", grid.remove(0, 1, "t2"))

console.log("Clear row 1, col 0")
grid.clear(1, 0)

console.log("Final grid:")
console.table(grid.all())
