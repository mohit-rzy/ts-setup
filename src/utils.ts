import { cancel, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

const VALID_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

export function validateProjectName(name: string): string | undefined {
  const trimmed = name.trim();

  if (!trimmed) {
    return "Project name is required";
  }

  if (!VALID_NAME.test(trimmed)) {
    return "Use letters, numbers, dots, hyphens, and underscores only";
  }

  return undefined;
}

export function toPackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function handleCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value;
}

export async function isDirectoryEmpty(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.length === 0;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }

    throw error;
  }
}

export function resolveTargetDir(cwd: string, projectName: string): string {
  return path.resolve(cwd, projectName);
}

export type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("pnpm")) return "pnpm";
  if (userAgent.startsWith("yarn")) return "yarn";
  if (userAgent.startsWith("bun")) return "bun";

  return "npm";
}

export function getInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn";
    case "bun":
      return "bun install";
    default:
      return "npm install";
  }
}

export function getDevCommand(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return "pnpm dev";
    case "yarn":
      return "yarn dev";
    case "bun":
      return "bun run dev";
    default:
      return "npm run dev";
  }
}

export function printNextSteps(
  projectName: string,
  packageManager: PackageManager,
  options: { gitInit: boolean; installDeps: boolean },
): void {
  const installCmd = getInstallCommand(packageManager);
  const devCmd = getDevCommand(packageManager);

  console.log();
  console.log(pc.green("Done! Your TypeScript project is ready."));
  console.log();
  console.log(`  ${pc.cyan("cd")} ${projectName}`);

  if (!options.installDeps) {
    console.log(`  ${pc.cyan(installCmd)}`);
  }

  if (options.gitInit) {
    console.log(`  ${pc.cyan("git add . && git commit -m \"Initial commit\"")}`);
  }

  console.log(`  ${pc.cyan(devCmd)}`);
  console.log();
}

export function runGitInit(cwd: string): boolean {
  const result = spawnSync("git", ["init"], {
    cwd,
    stdio: "ignore",
  });

  return result.status === 0;
}

export function runInstall(cwd: string, packageManager: PackageManager): boolean {
  const commands: Record<PackageManager, { cmd: string; args: string[] }> = {
    pnpm: { cmd: "pnpm", args: ["install"] },
    npm: { cmd: "npm", args: ["install"] },
    yarn: { cmd: "yarn", args: [] },
    bun: { cmd: "bun", args: ["install"] },
  };

  const { cmd, args } = commands[packageManager];
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  return result.status === 0;
}
