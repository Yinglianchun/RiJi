# Haven 日记系统 - 前端

这是 Haven AI 恋人日记系统的前端界面，使用 React + TypeScript + Vite 构建。

## 功能特性

- 📖 时间线视图 - 按时间顺序查看所有日记
- 📅 日历视图 - 日历形式展示日记
- 🔍 搜索功能 - 支持关键词和情感标签搜索
- ✍️ 写日记 - 创建新的日记（通常由 AI 通过 MCP 调用）
- 🌸 回忆长廊 - 按月份分组查看历史记忆
- 💬 评论功能 - 对 AI 的日记添加评论

## 快速开始

### 1. 安装依赖

```bash
cd haven-diary
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置后端 API 地址：

```
VITE_API_URL=http://localhost:8000
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

构建后的文件在 `dist` 目录。

## 部署

### 部署到 VPS

1. 构建生产版本：
```bash
npm run build
```

2. 将 `dist` 目录上传到 VPS：
```bash
scp -r dist/* user@your-vps-ip:/path/to/web/root/
```

3. 配置 Nginx 或其他 Web 服务器指向该目录

### 使用后端静态文件服务

将构建后的文件复制到后端的 `static` 目录：

```bash
# Windows
xcopy /E /I dist\* ..\static\

# Linux/Mac
cp -r dist/* ../static/
```

然后访问后端地址即可：http://your-vps-ip:8000

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Motion (动画)
- Lucide React (图标)

## 项目结构

```
src/
├── App.tsx           # 主应用组件
├── api.ts            # API 服务层
├── types.ts          # TypeScript 类型定义
├── main.tsx          # 入口文件
├── index.css         # 全局样式
└── components/
    ├── CalendarView.tsx  # 日历视图
    └── SearchView.tsx    # 搜索视图
```

## API 配置

前端通过 `src/api.ts` 与后端通信。API 基础 URL 通过环境变量 `VITE_API_URL` 配置。

开发环境默认使用 `http://localhost:8000`，生产环境需要修改为实际的 VPS 地址。

## 开发说明

- 所有 API 调用都在 `src/api.ts` 中封装
- 使用 TypeScript 确保类型安全
- 使用 Motion 库实现流畅的动画效果
- 响应式设计，支持桌面和移动端

## 故障排查

### 无法连接后端

1. 检查后端服务是否启动：`http://localhost:8000/docs`
2. 检查 `.env` 中的 `VITE_API_URL` 是否正确
3. 检查浏览器控制台的错误信息

### CORS 错误

后端已配置 CORS，如果仍有问题，检查后端的 CORS 配置。

## 许可证

MIT License
