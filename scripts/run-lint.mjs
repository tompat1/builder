import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.error) {
    console.error(`Error running ${cmd}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Running ESLint...");
run("npx", ["eslint", "."]);

const componentsDir = "components";
if (existsSync(componentsDir) && readdirSync(componentsDir).length > 0) {
  console.log("Running Impeccable layout detector on components/...");
  const impeccableBin = ".agent/skills/impeccable/scripts/impeccable";
  if (existsSync(impeccableBin)) {
    run(impeccableBin, ["detect", "--json", "--scope", "layout", componentsDir]);
  }
}

console.log("Lint checks passed.");
