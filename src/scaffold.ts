import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pc from "picocolors";
import { isDirectoryEmpty } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".cjs",
  ".css",
  ".html",
  ".yml",
  ".yaml",
  ".env",
  ".gitignore",
]);

export interface ScaffoldOptions {
  projectName: string;
  packageName: string;
  targetDir: string;
}

function getTemplateDir(): string {
  return path.resolve(__dirname, "../templates/base");
}

async function shouldProcessAsText(filePath: string): Promise<boolean> {
  const basename = path.basename(filePath);

  if (basename === "_gitignore" || basename.startsWith(".")) {
    return true;
  }

  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext) || ext === "";
}

async function replaceTokensInFile(
  filePath: string,
  tokens: Record<string, string>,
): Promise<void> {
  const content = await readFile(filePath, "utf8");
  let next = content;

  for (const [key, value] of Object.entries(tokens)) {
    next = next.replaceAll(`{{${key}}}`, value);
  }

  if (next !== content) {
    await writeFile(filePath, next, "utf8");
  }
}

async function processDirectory(
  dir: string,
  tokens: Record<string, string>,
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(entryPath, tokens);
      continue;
    }

    if (await shouldProcessAsText(entryPath)) {
      await replaceTokensInFile(entryPath, tokens);
    }
  }
}

function normalizeCopiedPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);

  if (base === "_gitignore") {
    return path.join(dir, ".gitignore");
  }

  return filePath;
}

async function renameSpecialFiles(targetDir: string): Promise<void> {
  const gitignorePath = path.join(targetDir, "_gitignore");

  try {
    await stat(gitignorePath);
    await cp(gitignorePath, path.join(targetDir, ".gitignore"));
    const { unlink } = await import("node:fs/promises");
    await unlink(gitignorePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function scaffoldProject(options: ScaffoldOptions): Promise<void> {
  const { projectName, packageName, targetDir } = options;
  const templateDir = getTemplateDir();

  const empty = await isDirectoryEmpty(targetDir);
  if (!empty) {
    throw new Error(
      `Target directory "${targetDir}" is not empty. Choose a different project name or remove existing files.`,
    );
  }

  await mkdir(targetDir, { recursive: true });

  await cp(templateDir, targetDir, {
    recursive: true,
    filter: (source) => {
      const normalized = normalizeCopiedPath(source);
      return !normalized.endsWith(`${path.sep}.git`);
    },
  });

  await renameSpecialFiles(targetDir);

  const tokens = {
    name: packageName,
    projectName,
  };

  await processDirectory(targetDir, tokens);

  console.log(pc.dim(`  created ${path.relative(process.cwd(), targetDir) || "."}`));
}
