import pc from "picocolors";
import { finish, runPrompts, withSpinner } from "./prompts.js";
import { scaffoldProject } from "./scaffold.js";
import {
  printNextSteps,
  runGitInit,
  runInstall,
} from "./utils.js";

function parseArgs(argv: string[]): { targetName?: string } {
  const args = argv.slice(2).filter((arg) => !arg.startsWith("-"));
  return { targetName: args[0] };
}

async function main(): Promise<void> {
  const { targetName } = parseArgs(process.argv);
  const cwd = process.cwd();

  try {
    const options = await runPrompts(cwd, targetName);

    await withSpinner("Scaffolding project...", () =>
      scaffoldProject({
        projectName: options.projectName,
        packageName: options.packageName,
        targetDir: options.targetDir,
      }),
    );

    if (options.gitInit) {
      const initialized = await withSpinner("Initializing git repository...", async () =>
        runGitInit(options.targetDir),
      );

      if (!initialized) {
        console.log(pc.yellow("  Warning: git init failed. Is git installed?"));
      }
    }

    if (options.installDeps) {
      const installed = await withSpinner("Installing dependencies...", async () =>
        runInstall(options.targetDir, options.packageManager),
      );

      if (!installed) {
        console.log(
          pc.yellow(
            `  Warning: dependency install failed. Run ${options.packageManager} install manually.`,
          ),
        );
      }
    }

    finish("Project created successfully!");
    printNextSteps(options.projectName, options.packageManager, {
      gitInit: options.gitInit,
      installDeps: options.installDeps,
    });
  } catch (error) {
    console.error(pc.red("Error:"), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
