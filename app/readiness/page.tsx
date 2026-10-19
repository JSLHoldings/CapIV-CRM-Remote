import { readFile } from "node:fs/promises"
import path from "node:path"
import { cookies } from "next/headers"
import { DashboardShell } from "@/components/dashboard-shell"
import { CopyReportButton } from "@/components/copy-report-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_SESSION_COOKIE, isValidAdminCookie } from "@/lib/admin-session"
import * as handoff from "@/lib/handoff-meta"
import { PROFILE_MAX_AGE_SECONDS, runPolicySamples } from "@/lib/ian-access"
import { ACTION_LABELS, ACTIONS, buildRoleMatrix } from "@/lib/workspace-authz"
import { TEST_CATALOG } from "@/lib/readiness-test-catalog"

export const dynamic = "force-dynamic"

const OPEN_ITEMS = [
  "Real IAN resolver (stays unavailable until the beta contract exists)",
  "Session verification between IAN and this app",
  "Consent record format for assessment consent",
  "Profile freshness limit (PROFILE_MAX_AGE_SECONDS, value owned by IAN)",
  "Sign-in destinations for IAN-originated users",
  "Entitlement ownership",
]

type StoredResults = {
  ranAt: string
  tests: { name: string; status: "passed" | "failed"; durationMs: number; error?: string }[]
}

async function isFounder(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== "admin") return false
  const cookieStore = await cookies()
  return isValidAdminCookie(cookieStore.get(ADMIN_SESSION_COOKIE)?.value, user.id)
}

async function loadTestResults(): Promise<StoredResults | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "readiness-test-results.json"), "utf8")
    return JSON.parse(raw) as StoredResults
  } catch {
    return null
  }
}

function reasonLabel(reason: string) {
  return reason.replaceAll("_", " ")
}

export default async function ReadinessPage() {
  if (!(await isFounder())) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-md py-24 text-center">
          <p className="text-sm font-medium text-muted-foreground">403</p>
          <h1 className="mt-2 text-xl font-semibold">Founder access only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in through the admin sign-in to view Integration Readiness.
          </p>
        </div>
      </DashboardShell>
    )
  }

  const [samples, stored] = await Promise.all([runPolicySamples(), loadTestResults()])
  const matrix = buildRoleMatrix()

  const testRows = TEST_CATALOG.map((t) => {
    const found = stored?.tests.find((r) => r.name === t.name)
    return { ...t, outcome: found?.status ?? "not run", error: found?.error }
  })

  const report = [
    "IAN INTEGRATION READINESS",
    `Edition ${handoff.editionVersion} | Source ${handoff.sourceVersion} (${handoff.sourceDate})`,
    `Status: ${handoff.status}`,
    handoff.implementedNote,
    "",
    "ACCESS POLICY CHECK",
    ...samples.map(
      (s) =>
        `- ${s.label}: ${s.decision.allowed ? "ALLOWED" : `DENIED (${reasonLabel(s.decision.reason)})`}`,
    ),
    "",
    "ROLE ACCESS MATRIX",
    ...matrix.map(
      (row) =>
        `- ${row.role}: ${row.cells
          .map((c) => `${ACTION_LABELS[c.action]}=${c.result.allowed ? "yes" : "no"}`)
          .join(", ")}`,
    ),
    "",
    `TEST RESULTS${stored ? ` (last run ${stored.ranAt})` : ""}`,
    ...testRows.map((t) => `- ${t.name}: ${t.outcome}`),
    "",
    "OPEN ITEMS (blocked on IAN beta contract)",
    ...OPEN_ITEMS.map((i) => `- ${i}`),
  ].join("\n")

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Integration Readiness</h1>
            <p className="text-sm text-muted-foreground">Founder-only. Generated from the code at request time.</p>
          </div>
          <CopyReportButton text={report} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Edition {handoff.editionVersion} · Source {handoff.sourceVersion} · {handoff.sourceDate}
            </p>
            <p className="font-medium">{handoff.status}</p>
            <p className="text-muted-foreground">{handoff.implementedNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access policy check</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.map((s) => (
                  <TableRow key={s.label}>
                    <TableCell>
                      {s.label}
                      {s.note ? <span className="ml-2 text-xs text-muted-foreground">{s.note}</span> : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.decision.allowed ? "default" : "secondary"}>
                        {s.decision.allowed ? "Allowed" : "Denied"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.decision.allowed ? "eligible" : reasonLabel(s.decision.reason)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              Freshness limit: {PROFILE_MAX_AGE_SECONDS ?? "not set (owned by IAN)"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role access matrix</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  {ACTIONS.map((a) => (
                    <TableHead key={a}>{ACTION_LABELS[a]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.map((row) => (
                  <TableRow key={row.role}>
                    <TableCell className="font-medium capitalize">{row.role}</TableCell>
                    {row.cells.map((c) => (
                      <TableCell key={c.action}>
                        <Badge variant={c.result.allowed ? "default" : "secondary"}>
                          {c.result.allowed ? "Yes" : "403"}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test results</CardTitle>
            <p className="text-xs text-muted-foreground">
              {stored ? `Last run ${stored.ranAt}` : "No run recorded. Run npm run test:readiness."}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>What it checks</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testRows.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.checks}</TableCell>
                    <TableCell>
                      <Badge variant={t.outcome === "passed" ? "default" : "secondary"}>{t.outcome}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open items (blocked on the IAN beta contract)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {OPEN_ITEMS.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
