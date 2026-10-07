import { writeTuples } from "../service"
import { demoTuples } from "../tuples"

async function main(): Promise<void> {
  console.log(`→ Writing ${demoTuples.length} relationship tuples...`)
  await writeTuples([...demoTuples], true)
  console.log("✓ Relationship tuples written.")
}

main().catch((error: unknown) => {
  console.error("✗ Tuple seeding failed:", error)
  process.exit(1)
})
