import { run } from "node:test"
import { mkdirSync, writeFileSync } from "node:fs"

const results = []

const stream = run({ files: ["tests/readiness.test.ts"] })
stream.on("test:pass", (e) => {
  results.push({ name: e.name, status: "passed", durationMs: Math.round(e.details.duration_ms) })
})
stream.on("test:fail", (e) => {
  results.push({
    name: e.name,
    status: "failed",
    durationMs: Math.round(e.details.duration_ms),
    error: String(e.details.error?.cause?.message ?? e.details.error?.message ?? "failed"),
  })
})
stream.on("test:stderr", (e) => process.stderr.write(e.message))
stream.on("test:stdout", (e) => process.stdout.write(e.message))

// Drain the stream so all events fire.
for await (const _ of stream) void _

mkdirSync("data", { recursive: true })
writeFileSync(
  "data/readiness-test-results.json",
  JSON.stringify({ ranAt: new Date().toISOString(), tests: results }, null, 2),
)

for (const r of results) console.log(`${r.status.toUpperCase()}  ${r.name}`)
const failed = results.filter((r) => r.status === "failed").length
console.log(`\n${results.length - failed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
