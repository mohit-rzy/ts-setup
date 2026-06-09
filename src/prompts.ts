import {
  confirm,
  intro,
  outro,
  select,
  spinner,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import {
  detectPackageManager,
  handleCancel,
  resolveTargetDir,
  toPackageName,
  validateProjectName,
  type PackageManager,
} from "./utils.js";

export interface PromptResult {
  projectName: string;
  packageName: string;
  targetDir: string;
  packageManager: PackageManager;
  gitInit: boolean;
  installDeps: boolean;
}

export async function runPrompts(
  cwd: string,
  initialName?: string,
): Promise<PromptResult> {
  intro(pc.inverse(" create-ts-setup "));

  const projectName = handleCancel(
    await text({
      message: "Project name",
      placeholder: "my-app",
      initialValue: initialName,
      validate: validateProjectName,
    }),
  );

  const packageName = toPackageName(projectName);
  const targetDir = resolveTargetDir(cwd, projectName);

  const defaultPm = detectPackageManager();

  const packageManager = handleCancel(
    await select<PackageManager>({
      message: "Package manager",
      initialValue: defaultPm,
      options: [
        { value: "pnpm", label: "pnpm" },
        { value: "npm", label: "npm" },
        { value: "yarn", label: "yarn" },
        { value: "bun", label: "bun" },
      ],
    }),
  );

  const gitInit = handleCancel(
    await confirm({
      message: "Initialize a git repository?",
      initialValue: true,
    }),
  );

  const installDeps = handleCancel(
    await confirm({
      message: "Install dependencies?",
      initialValue: true,
    }),
  );

  return {
    projectName,
    packageName,
    targetDir,
    packageManager,
    gitInit,
    installDeps,
  };
}

export async function withSpinner<T>(
  message: string,
  task: () => Promise<T>,
): Promise<T> {
  const s = spinner();
  s.start(message);

  try {
    const result = await task();
    s.stop(pc.green(message));
    return result;
  } catch (error) {
    s.stop(pc.red(message));
    throw error;
  }
}

export function finish(message: string): void {
  outro(pc.green(message));
}
