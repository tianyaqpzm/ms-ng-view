---
trigger: always_on
---

# 前端架构与代码规范指南

## 整洁架构
前端代码必须严格遵循“关注点分离”，严禁在 UI 组件中混杂网络请求和复杂业务逻辑。请按照以下四层架构生成代码：

### 1. Domain Layer (领域层 - 核心)
职责： 定义业务实体、类型声明和业务规则接口。
规范： 只能包含纯 TS 的 interface、type 和纯函数。
禁区： 严禁包含任何框架代码（React/Vue）、外部库（Axios）或状态管理（Redux/Pinia）的引用。

### 2. Use Case Layer (用例层 / 应用逻辑)
职责： 编排具体的业务场景（如：获取用户列表、提交订单）。
规范： 接收 Domain 层的数据结构，调用 Adapter 层的接口。通常实现为纯函数或 Class。
禁区： 严禁直接调用 fetch 或 axios，必须通过依赖注入或引入 Adapter 暴露的接口来实现通信。

### 3. Adapter / Infrastructure Layer (适配器层 / 基础设施)
职责： 与外部世界交互，包括网络请求 (HTTP/WebSocket)、本地存储 (LocalStorage) 和状态管理库的对接。
规范： 在此处封装 Axios 客户端，处理请求拦截、Token 注入和后端 DTO 到前端 Domain 模型的数据转换 (Mapper)。
防腐层 (ACL)： 后端返回的 JSON 结构必须在此层被转换为 Domain 层定义的标准接口，UI 层只能看到 Domain 接口。

### 4. UI / Presentation Layer (表现层)
职责： 仅负责“渲染数据”和“捕获用户事件”。
规范： 必须是“傻瓜组件”（Dumb Components）。UI 组件通过调用 Use Case 或派发状态管理 Action 来触发业务。
禁区： useEffect 或组件的 methods 中严禁直接出现 API URL 字符串或裸露的 HTTP 请求。

## Angular 开发进阶规范 (Angular Component Standards)
本规范是对 `ms-ng-view` 工程中组件开发的详细约束，必须严格执行。
### 1. 命名约定
- **文件与目录**: 统一使用 `kebab-case` (例: `event-list.component.ts`, `auth-service.ts`)。
- **类与接口**: 统一使用 `PascalCase` (例: `EventListComponent`, `UserAuthService`)。
- **属性与方法**: 统一使用 `camelCase` (例: `userName`, `formatDate()`, `isLoading`)。

### 2. 前端核心技术栈 (Frontend Core Stack)
- **框架**: Angular 21 (Standalone Components)
- **UI 组件库**: Angular Material 21
- **样式方案**: Tailwind CSS + 组件级 CSS
- **构建工具**: Vite 6 / ESBuild
- **语言**: TypeScript (Strict Mode)

### 3. 结构与声明
- **三文件分离**: 严禁内联模板 (`template`) 或样式 (`styles`)。每个组件必须由 `.ts` (逻辑), `.html` (模板), `.css` (样式) 组成。
- **独立组件**: 必须设置 `standalone: true`。
- **变更检测**: 必须设置 `changeDetection: ChangeDetectionStrategy.OnPush`，以获得最佳性能。

### 4. 模板语法 (Angular 21+)
- **新控制流**: 必须使用 `@if`, `@for`, `@switch` 语法。
- **严禁使用**: 禁止使用旧版的 `*ngIf`, `*ngFor`, `*ngSwitch` 指令。
- **渲染优化**: `@for` 循环中必须配置 `track` 表达式。

### 6. 样式规范 (Tailwind CSS)
- **Tailwind 优先**: 布局、间距、颜色、响应式等基础样式必须优先使用 Tailwind class。
- **CSS 文件用途**: 组件对应的 `.css` 文件仅用于：
    - 覆盖 Angular Material 的深层样式 (使用 `::ng-deep`)。
    - 定义复杂的 Keyframes 动画。
    - 处理无法通过 Tailwind 实现的特殊交互样式。

### 7. 类结构与导入
- **导入顺序**: 
    1. `@angular/core` 等核心库
    2. `@angular/material` 组件库
    3. `@angular/forms` 表单模块
    4. 本地 Service、接口和常量
- **属性顺序**: 
    1. `@Input()`, `@Output()`
    2. Signals 状态
    3. `computed` 计算属性
    4. Constructor & Lifecycle Hooks
    5. Methods (public -> protected -> private)
