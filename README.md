# Zeal' Lab

A personal blog and notes site built with Astro 7 and TypeScript 7, Markdown, UnoCSS and Pagefind. UI components, content utilities and build configuration live in this repository; the site does not depend on `astro-pure` at runtime or build time.

[中文说明](README-zh-CN.md) · [Architecture and extension guide](docs/architecture.md)

## Development

Use Node.js 24 and Bun 1.3.14.

```sh
bun install --frozen-lockfile
bun run dev
bun run new:post --draft --folder --lang zh "Post title"
bun run test
bun run build
bun run preview
```

`bun run build` runs the TypeScript 7 native compiler and the isolated Astro component checker, builds the static site and generates the search index. Search is available in the production preview; development mode displays an explanatory message.

```sh
bunx playwright install --with-deps chromium
bun run test:e2e
```

Browser tests use the existing `dist/` output and start their own preview server. Run the build first. They block external browser requests and do not submit to the live comment service. To use an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

In the managed cloud environment, also set `ASTRO_TELEMETRY_DISABLED=1` and `NODE_USE_ENV_PROXY=1` before Astro commands, and add `/workspace/.cloud-tools/node_modules/.bin` to `PATH` if needed. Keep inherited proxy and certificate settings.

## Configuration

- Site metadata, menus and feature settings: `src/site.config.ts`.
- Validated defaults and schemas: `src/config/`.
- Content collections: `src/content.config.ts`.
- Markdown processing, assets and integrations: `astro.config.ts`.
- Colors and typography: `src/assets/styles/app.css` and `uno.config.ts`.

GitHub Actions validates changes and deploys `main` to GitHub Pages. The static site's canonical URL is configured in `astro.config.ts`.

## Attribution

The original design and migrated components derive from [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure), with local changes. See [third-party notices](THIRD_PARTY_NOTICES.md) and [upstream license](LICENSE-astro-pure).

## TypeScript tooling compatibility

The application uses TypeScript 7.0.2. `bun run check` runs `astro sync`, the native `tsc --noEmit`, and then `bun run check:astro` for `.astro` diagnostics. Astro's current checker and the ESLint parser still require the TypeScript 6 Language Service API; their exact 6.0.3 dependency is isolated in `tools/quality`. This does not replace the application's TypeScript 7 compiler. Use the package scripts rather than invoking `astro check` directly.

`bunfig.toml` selects isolated dependency linking, so fresh installs preserve these compiler boundaries. Install dependencies from the repository root. Markdown explicitly retain the Unified processor to preserve the existing Remark/Rehype extensions.

Markdown authoring and supported alerts: [Markdown guide](docs/markdown.md).
