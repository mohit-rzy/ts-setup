# create-ts-setup

Interactive CLI to scaffold a barebones custom TypeScript setup.

## Usage

```bash
pnpm dlx create-ts-setup
```

Or with npm:

```bash
npm create ts-setup
```

You can also pass an optional project name:

```bash
pnpm dlx create-ts-setup my-app
```

## What it does

1. Prompts for project name, package manager, git init, and dependency install
2. Copies the template from `templates/base/` into your target directory
3. Replaces `{{name}}` and `{{projectName}}` tokens in template files
4. Optionally runs `git init` and installs dependencies

## Development

```bash
pnpm install
pnpm build
node dist/cli.js test-out
```

## Publishing

```bash
pnpm build
npm publish --access public
```

After publishing, users can run:

```bash
pnpm dlx create-ts-setup
```

## Customizing the template

Edit files under `templates/base/`. The CLI copies them as-is and performs token replacement — no CLI code changes needed.

Available tokens:

- `{{name}}` — npm-safe package name
- `{{projectName}}` — original project name from the prompt

## License

MIT
