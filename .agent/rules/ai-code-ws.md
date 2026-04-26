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

3. **插件管理 UI**:
   - **动态表单生成**: 根据后端 API 返回的 JSON Schema，动态渲染插件配置表单（例如让用户填 API Key）。
   - 安全地处理敏感数据（如 API Key），确保通过 HTTPS 传输。

4. **认证处理 (Authentication)**:
   - **Token 提取**: 兼容 `HashLocationStrategy`。从 URL 提取 Token 时，必须同时检查标准查询参数 (`window.location.search`) 和资源标识符后的参数 (`window.location.hash` 里的 `?token=`)，防止在路由跳转过程中丢失参数。

# Key Context (关键背景)
前端直接与网关交互。它需要展示实时的 AI 对话流，并提供一个管理后台让用户配置和开关各种 MCP 插件。