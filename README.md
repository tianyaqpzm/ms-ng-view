<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ms-ng-view - AI Studio Time Management App

A beautiful and intuitive countdown timer application built with Angular and Material Design.

View your app in AI Studio: https://ai.studio/apps/drive/1Lo-AY3TG6-o3mQ9kS2RgpDgmMRuhIIG-

## ✨ Features

- 🎯 Create and manage countdown events
- 🎨 Customizable event appearance (colors & images)
- ⏱️ Real-time countdown display
- 📊 Dashboard with statistics
- 🔔 Event categorization (Birthday, Anniversary, Holiday, etc.)
- 📱 Responsive design for mobile and desktop
- 🌙 Dark mode support

## 🚀 Run Locally

**Prerequisites:** Node.js (v20 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set the `GEMINI_API_KEY` (optional):**
   
   Create a `.env.local` file and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to `http://localhost:3000`

## 📦 Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

## 🚢 Deployment

This project supports two deployment options:

### Option 1: Cloudflare Pages (推荐)

**优势**: 全球 CDN、自动 HTTPS、零维护、免费

1. **Configure GitHub Secrets**:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **Access your site**:
   - URL: `https://ms-ng-view.pages.dev`
   - Custom domain: Configure in Cloudflare Dashboard

📖 **Detailed Guide**: [Cloudflare Pages 部署指南](.github/CLOUDFLARE_PAGES.md)

### Option 2: Traditional Server (VPS/自有服务器)

**适用场景**: 需要完全控制服务器环境

1. **Configure GitHub Secrets**:
   - `SERVER_HOST`: Your server IP or domain
   - `SERVER_USERNAME`: SSH username
   - `SERVER_SSH_KEY`: SSH private key
   - `DEPLOY_PATH`: Deployment directory

2. **Push to main branch**:
   ```bash
   git push origin main
   ```

3. **GitHub Actions will automatically**:
   - Build the application
   - Deploy to your server
   - Restart services (if configured)

📖 **Detailed Guide**: [Traditional Server 部署指南](.github/DEPLOYMENT.md)

### Server Setup

Use the provided setup script on your server:

```bash
# Download the script
wget https://raw.githubusercontent.com/YOUR_USERNAME/ms-ng-view/main/.github/setup-server.sh

# Make it executable
chmod +x setup-server.sh

# Run with custom configuration
sudo DEPLOY_USER=deploy DEPLOY_PATH=/var/www/ms-ng-view DOMAIN=your-domain.com bash setup-server.sh
```

## 🛠️ Tech Stack

- **Frontend Framework:** Angular 21
- **UI Components:** Angular Material
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Deployment:** GitHub Actions
- **Web Server:** Nginx (recommended)

## 📂 Project Structure (4-Layer Clean Architecture)

本工程遵循严格的 **整洁架构 (Clean Architecture)** 规范，旨在实现 UI 与业务逻辑的深度解耦：

```text
ms-ng-view/
├── src/
│   ├── app/
│   │   ├── core/               # 核心逻辑层
│   │   │   ├── domain/         # [1. Domain Layer] 业务实体、Repository 接口定义
│   │   │   ├── use-cases/      # [2. Use Case Layer] 业务流程编排、Signal 状态管理
│   │   │   ├── adapters/       # [3. Adapter Layer] 基础设施实现 (HttpClient, API 请求)
│   │   │   ├── constants/      # 集中化配置 (URLConfig 等)
│   │   │   ├── guards/         # 路由守卫
│   │   │   ├── interceptors/   # HTTP 拦截器
│   │   │   └── services/       # 全局基础服务 (Auth, User, Theme)
│   │   └── features/           # [4. UI Layer] 表现层
│   │       ├── chat/           # 智能助手模块 (Dumb Component)
│   │       ├── knowledge/      # 知识库管理模块
│   │       ├── dashboard/      # 概览展示模块
│   │       └── ...             # 其他功能模块
│   └── styles.css              # 全局样式
├── .agent/rules/               # AI 智能体规范
│   ├── CODING_STANDARDS.md     # 核心架构与编码规范
│   └── ai-code-ws.md           # 智能体执行准则
├── public/                     # 静态资源与国际化文件 (i18n)
└── tests/                      # 单元测试 (Jest)
```

详细架构细节请参考：👉 [CODING_STANDARDS.md](.agent/rules/CODING_STANDARDS.md)

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build and watch for changes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [AI Studio](https://ai.studio/apps/drive/1Lo-AY3TG6-o3mQ9kS2RgpDgmMRuhIIG-)
- [Cloudflare Pages 部署指南](.github/CLOUDFLARE_PAGES.md)
- [传统服务器部署指南](.github/DEPLOYMENT.md)
- [Angular Documentation](https://angular.dev)
- [Material Design](https://material.angular.io)
