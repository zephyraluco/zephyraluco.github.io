# Zeal' Lab

基于 Astro 7、TypeScript 7、MDX、UnoCSS 和 Pagefind 的个人博客与笔记站点。组件、内容处理工具和构建集成均由当前项目维护，不再依赖 `astro-pure` 包。

[English](README.md) · [架构与扩展指南](docs/architecture.md)

## 本地开发

环境：Node.js 24、Bun 1.3.14。

```sh
bun install --frozen-lockfile
bun run dev
bun run new:post --draft --mdx --folder --lang zh "文章标题"
bun run test
bun run build
bun run preview
```

`new:post` 支持 `--draft`、`--mdx`、`--folder`、`--lang`，不会覆盖已有文章。`build` 包含类型检查、静态构建和搜索索引生成。搜索需要构建后使用 `preview` 验证，开发模式会显示提示。

浏览器回归测试：

```sh
bunx playwright install --with-deps chromium
bun run test:e2e
```

测试使用已有 `dist/` 并自动启动预览服务，因此需先构建。浏览器测试阻断外部请求，不会向真实评论服务提交内容。已有 Chromium 时，可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。

托管云环境运行 Astro 前需设置 `ASTRO_TELEMETRY_DISABLED=1`、`NODE_USE_ENV_PROXY=1`；必要时将 `/workspace/.cloud-tools/node_modules/.bin` 加入 `PATH`，保留平台注入的代理和证书设置。

## 配置入口

- 元数据、菜单与功能开关：`src/site.config.ts`。
- 配置校验、默认值和浏览器公开配置：`src/config/`。
- 博客与笔记的内容模型：`src/content.config.ts`。
- Markdown 插件、图片、字体与构建集成：`astro.config.ts`。
- 主题变量与排版：`src/assets/styles/app.css`、`uno.config.ts`。

GitHub Actions 执行质量检查，并在 `main` 更新时部署到 GitHub Pages。域名配置位于 `astro.config.ts`。

## 来源与授权

初始设计及迁移组件来自 [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure)，已在本地修改维护。详见 [第三方声明](THIRD_PARTY_NOTICES.md) 和 [上游许可证](LICENSE-astro-pure)。

## TypeScript 工具兼容

应用使用 TypeScript 7.0.2。`bun run check` 依次执行 `astro sync`、TS7 原生 `tsc --noEmit` 和 `bun run check:astro`，后者检查 `.astro` 组件。目前 Astro 检查器及 ESLint 解析器仍依赖 TS6 的语言服务 API，因此将它们连同精确版本 6.0.3 隔离在 `tools/quality`，不替代应用的 TS7 编译器。请使用项目脚本，不直接执行 `astro check`。

`bunfig.toml` 使用隔离依赖安装，保证全新安装时也能正确区分两套工具。从仓库根目录安装依赖即可。Markdown 与 MDX 显式使用 Unified，保留现有 Remark/Rehype 扩展。
