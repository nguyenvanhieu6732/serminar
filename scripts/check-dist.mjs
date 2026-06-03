import { existsSync } from "node:fs"
import { execFileSync } from "node:child_process"

if (!existsSync("dist/index.js")) {
  throw new Error("dist/index.js does not exist. Run npm run package.")
}

if (existsSync(".git")) {
  execFileSync("git", ["diff", "--exit-code", "--", "dist/index.js"], {
    stdio: "inherit"
  })
}
