# 项目架构与扩展指南

项目直接维护应用组件、配置和构建流程，不通过主题包或隐式虚拟模块注入功能。

## 模块职责

| 目录 / 文件                                                       | 职责                                                   | 扩展方式                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| `src/site.config.ts`                                              | 用户可编辑的站点设置                                   | 调整导航、元数据、评论、语录和内容选项            |
| `src/config/index.ts`                                             | 服务端配置校验与默认值                                 | 所有页面和构建模块从这里读取配置                  |
| `src/config/client.ts`                                            | 浏览器公开设置                                         | 仅提供浏览器实际需要的字段，不导入配置校验器      |
| `src/config/schema.ts`、`theme.ts`、`integrations.ts`、`schemas/` | 配置类型、默认值和约束                                 | 新增配置时同时定义校验、默认值和输入类型          |
| `src/types/`                                                      | 组件元数据和第三方类型声明                             | 跨模块的共享类型放在这里                          |
| `src/components/ui/`                                              | Button、Aside、Card、Icon 等通用组件                   | 通过 props 和 slots 组合，避免依赖页面内容集合    |
| `src/components/site/`、`Header.astro`、`BaseHead.astro`          | 页头、页尾、主题初始化、SEO                            | 站点级展示和交互                                  |
| `src/components/content/`                                         | 文章信息、前后篇、预览、图片缩放、分享和语录           | 文章内容相关展示，不负责路由或构建                |
| `src/components/search/`                                          | Pagefind 浏览器搜索界面                                | 修改搜索展示、结果处理和主题样式                  |
| `src/components/toc/`、`waline/`、`Mermaid.astro`                 | 目录、评论和图表                                       | 独立功能模块；保留原有接口                        |
| `src/lib/`                                                        | 内容集合查询、排序、日期、样式类、主题、图标和阅读时间 | 明确区分服务端内容工具与浏览器工具                |
| `src/plugins/`                                                    | Remark、Rehype、Shiki 内容变换及 SVG 处理              | 在 `astro.config.ts` 显式注册新插件               |
| `src/integrations/search.ts`                                      | 静态构建后的搜索索引生成                               | 构建错误会传播，不静默忽略索引失败                |
| `src/layouts/`                                                    | 通用页面与文章布局                                     | 复用展示组件，通过 slot 填充页面内容              |
| `src/pages/`                                                      | 路由、静态路径、RSS 和 sitemap 关联页面                | 路由层获取数据并组合布局                          |
| `scripts/new-post.mjs`                                            | 新文章创建工具                                         | 不覆盖现有文件，支持 MD/MDX、草稿、语言与目录模式 |
| `tests/unit/`、`tests/e2e/`                                       | 配置、内容处理、工具与浏览器回归                       | 业务规则使用单元测试，用户操作使用生产预览测试    |

## 依赖方向

- 页面组合布局和展示组件；组件调用 `lib`，通过配置读取展示选项。
- `site.config.ts` 只引用类型，避免与配置解析器形成运行时循环依赖。
- `config/index.ts` 使用本地 schema 校验原始设置，填充 favicon、搜索、分页等默认值。
- 浏览器脚本不得导入 `config/index.ts`、`lib/content.ts` 或 `node:*` 模块；公开设置从 `config/client.ts` 获取，其他组件使用 `data-*` 传递参数。
- 通用 UI 组件直接引用具体模块；不引入一个包含所有功能的大型 barrel 入口。
- `astro.config.ts` 显式启用 MDX、UnoCSS、sitemap、阅读时间、图片缩放标记、外链处理与搜索索引。

## 功能保留与迁移

`astro-pure@1.4.9` 中项目使用的组件及其依赖已迁移到本地。未使用的旧页头、TOC、GitHub 卡片、链接预览、Tabs、Steps、REPL 等主题功能没有整包复制。已保留本项目原有的导航、TOC、Mermaid、Waline 样式和内容集合。

迁移后的通用工具与组件保留来源声明，见根目录 `THIRD_PARTY_NOTICES.md`。图片缩放和二维码使用显式 npm 依赖并本地打包，不再依赖 CDN 全局变量。

语录转换器现在是类型明确的 `(data: unknown) => string` 函数，直接在 `src/site.config.ts` 配置，替代以前的可执行代码字符串。网络失败会显示 fallback。主题监听仅在 system 模式下响应系统变化。评论仍连接配置中的 Waline 服务，测试不提交真实评论。

## 添加功能

1. 展示组件按职责放入 `components/`，纯工具放入 `lib/`；避免在页面中复制相同逻辑。
2. 新增配置时同步修改 schema、输入设置和浏览器公开投影（如果浏览器需要），不要把未来的密钥放入客户端配置。
3. 新增内容类型时修改 `content.config.ts`，在对应路由中查询并渲染；文章内部组件可通过本地路径在 MDX 中导入。
4. 内容变换在 `plugins/` 编写并显式注册；构建完成后的任务放入 `integrations/`。
5. 使用 `bun run test` 验证规则，`bun run build` 验证内容和类型，`bun run test:e2e` 验证用户流程。

## 验证与部署

质量检查工作流执行锁文件安装、单元测试、完整构建和生产预览浏览器测试。部署仍由原有 GitHub Pages 工作流负责。Pagefind 索引只在静态构建后生成，开发服务不提供全文搜索。

远程字体与 GitHub 活跃图仍在构建时请求公共服务，Waline 与语录需要浏览器可访问各自服务。外部服务不可用时，语录回退；评论服务的真实数据和写入不属于离线回归测试范围。

## Astro 7 / TypeScript 7

- 应用依赖 Astro 7.4.11、TypeScript 7.0.2，官方 MDX 集成升级至 8.x。
- `markdown.processor: unified(...)` 显式保留原有插件；MDX 继承同一流程。`compressHTML: true` 保留升级前的行内空白行为，移除已成为默认行为的 queuedRendering 实验开关。
- `bun run check` 先同步内容类型，再执行 TS7 原生编译检查，最后通过工具工作区检查 Astro 模板。
- Astro 检查器和 ESLint 解析器暂不支持 TS7 的原生语言服务 API。兼容用 TS6 仅存在于工具依赖树，使用 Bun workspace 和 isolated linker 隔离，不能用删除原生检查的方式绕开升级。
- `.astro` 组件直接在 Astro 文件中导入，不通过 `.ts` barrel 再导出，避免原生 TS 编译器误把组件当作普通 TS 模块解析。
- HAST 类型统一至 3.0.5，避免自定义 Shiki/Markdown 插件因重复类型树而失配。没有使用类型忽略来跳过这些插件的检查。
