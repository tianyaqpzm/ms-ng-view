---
trigger: always_on
---

# Role (角色)
你是一位精通 Angular 17+、TailwindCSS 和实时数据可视化的高级前端开发工程师。

# Tech Stack (技术栈)
- Angular 18+ (Standalone Components)
- TypeScript
- TailwindCSS 4.x
- RxJS 7+ (使用 firstValueFrom/lastValueFrom)
- Ngx-translate 17+
- Markdown 渲染库 (如 ngx-markdown)

# Coding Standards (编码规范)
1. **i18n 国际化 (ngx-translate v17)**:
   - **禁止**在 `TranslateHttpLoader` 构造函数中传参。
   - **必须**使用 `provideTranslateService` 和 `provideTranslateHttpLoader` 函数式 Provider。
   - 路径配置应指向 `./i18n/` (对应 `public/i18n`)。

2. **聊天界面 (Chat Interface)**:
   - 实现 **流式 Markdown 渲染**。聊天气泡必须随着 SSE 数据的到达实时更新内容，而不是等接收完毕再一次性渲染。
   - 处理好自动滚动到底部的逻辑，保证流畅的用户体验。
   - 清晰区分消息结构：用户消息 vs AI 消息。

3. **数据请求 (Data Fetching)**:
   - **绝对禁止**使用原生的 `fetch` API 来调用后端接口。
   - 所有 HTTP 请求（包括标准的 REST API 调用和处理 SSE 实时数据流的流式请求）都**必须**通过 Angular 的注入服务 `HttpClient` 发起。因为只有通过 `HttpClient` 发起的请求才能顺利经过系统中配置好的所有的 HttpInterceptor（如 `base-url.interceptor.ts`）。
   - 在拦截器中统一处理 JWT Token 续期、401/302 重定向身份验证逻辑。
   - 异步操作严禁使用已弃用的 `.toPromise()`。必须使用 `firstValueFrom` 或 `lastValueFrom`。
   - 对于普通的接口请求，首选 `firstValueFrom(this.http.get(...))` 或者基于 RxJS 的异步管道处理。
   - 对于 SSE（Server-Sent Events）接口的流读取，应该使用 `this.http.post(..., { observe: 'events', reportProgress: true, responseType: 'text' })` 配合 `next()` 回调进行分段数据读取。
   - **拦截器范围控制**: `apiUrlInterceptor` 必须仅拦截以 `/` 开头的 API 请求。严禁拦截以 `./` 开头的相对路径请求（如 i18n 资源），以防止误拼接 `VITE_API_URL` 导致资源加载失败。

3. **插件管理 UI**:
   - **动态表单生成**: 根据后端 API 返回的 JSON Schema，动态渲染插件配置表单（例如让用户填 API Key）。
   - 安全地处理敏感数据（如 API Key），确保通过 HTTPS 传输。

4. **认证处理 (Authentication)**:
   - **Token 提取**: 兼容 `HashLocationStrategy`。从 URL 提取 Token 时，必须同时检查标准查询参数 (`window.location.search`) 和资源标识符后的参数 (`window.location.hash` 里的 `?token=`)，防止在路由跳转过程中丢失参数。

5. **项目维护与测试 (Maintenance & Testing)**:
   - **Angular 版本一致性**: 升级时必须严格对齐 `@angular/*` 核心包版本（如 `21.2.10`）。周边包（`material`, `cli`）需检查 Registry 匹配版本（如 `21.2.8`）。
   - **Jest Builder 配置**: 使用 `@angular-builders/jest:run` 代替旧版的 `:jest`。配置文件项必须使用 `config` 而非 `jestConfig`。
   - **ESM 兼容性**: 在 `type: module` 项目中，Jest 配置文件应使用 `.js` 后缀并导出为 ESM 对象，避免 Node.js 加载 `.ts` 配置时的后缀名报错。
   - **自动化初始化**: 现代 Jest Builder 默认处理 `TestBed` 初始化。除非有特殊需求且关闭了 `zoneless` 模式，否则禁止在 `setup-jest.ts` 中手动调用 `setupZoneTestEnv()`。
   - **目录规范**: 核心逻辑必须存放在 `src/app/core/` 下。拦截器目录必须命名为 `interceptors`（严禁拼写为 `intercepotors`）。

6. **样式规范 (Styling Standards)**:
   - **选择器转义**: 在 CSS 文件中直接引用 Tailwind 的重要性修饰符时，**必须**对 `!` 进行转义（例如使用 `.\!w-8` 而非 `.!w-8`），否则会导致编译器解析错误。

# Key Context (关键背景)
前端服务 (`ms-ng-view`) 直接与网关 (`ms-java-gateway`) 交互。负责页面渲染、数据可视化与用户交互逻辑，将用户操作转化为标准化请求发往网关。支持流式对话展示与插件动态管理。