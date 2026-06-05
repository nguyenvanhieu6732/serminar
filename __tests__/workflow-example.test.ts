import { readFileSync } from "node:fs"

describe("workflow example", () => {
  const workflow = readFileSync("examples/workflow.yml", "utf8")
  const localWorkflow = readFileSync(
    ".github/workflows/dev-ticket-preflight.yml",
    "utf8"
  )
  const readme = readFileSync("README.md", "utf8")

  it("uses the issues labeled trigger with issue-scoped concurrency", () => {
    expect(workflow).toContain("issues:")
    expect(workflow).toContain("types: [labeled]")
    expect(workflow).toContain("github.event.label.name == 'ready-for-dev'")
    expect(workflow).toContain("!github.event.issue.pull_request")
    expect(workflow).toContain("concurrency:")
    expect(workflow).toContain("github.event.issue.number")
    expect(workflow).toContain("cancel-in-progress: true")
  })

  it("passes the required action inputs without hardcoded secrets", () => {
    expect(workflow).toContain("github-token:")
    expect(workflow).toContain("openai-api-key:")
    expect(workflow).toContain("ready-label:")
    expect(workflow).toContain("${{ secrets.GITHUB_TOKEN }}")
    expect(workflow).toContain("${{ secrets.OPENAI_API_KEY }}")
    expect(workflow).not.toContain("fake-gh-token")
    expect(workflow).not.toContain("fake-openai-key")
  })

  it("requests only advisory issue-comment write permission", () => {
    expect(workflow).toContain("permissions:\n  issues: write")
    expect(workflow).not.toContain("checks: write")
    expect(workflow).not.toContain("contents: write")
    expect(workflow).not.toContain("pull-requests: write")
    expect(workflow).not.toContain("actions: write")
  })

  it("allows only read access for local-action checkout", () => {
    expect(localWorkflow).toContain(
      "permissions:\n  contents: read\n  issues: write"
    )
    expect(localWorkflow).not.toContain("checks: write")
    expect(localWorkflow).not.toContain("contents: write")
    expect(localWorkflow).not.toContain("pull-requests: write")
    expect(localWorkflow).not.toContain("actions: write")
  })

  it("documents duplicate prevention and its limits", () => {
    expect(readme).toContain("Duplicate prevention")
    expect(readme).toContain("concurrency.group")
    expect(readme).toContain("cancel-in-progress: true")
    expect(readme).toContain("best-effort")
    expect(readme).toContain("not a durable exactly-once guarantee")
    expect(readme).toContain("does not remove labels")
    expect(readme).toContain("does not edit issues")
    expect(readme).toContain("does not create required checks")
  })
})
