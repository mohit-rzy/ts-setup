import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldProject } from "../src/scaffold.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const targetDir = path.join(root, "test-out");

await rm(targetDir, { recursive: true, force: true });

await scaffoldProject({
  projectName: "test-out",
  packageName: "test-out",
  targetDir,
});

const pkg = JSON.parse(
  await readFile(path.join(targetDir, "package.json"), "utf8"),
);
const index = await readFile(path.join(targetDir, "src/index.ts"), "utf8");
const gitignore = await readFile(path.join(targetDir, ".gitignore"), "utf8");

if (pkg.name !== "test-out") {
  throw new Error("package name token not replaced");
}

if (!index.includes('const projectName = "test-out"')) {
  throw new Error("projectName token not replaced");
}

if (!gitignore.includes("node_modules/")) {
  throw new Error(".gitignore not created");
}

console.log("Scaffold verification passed");
