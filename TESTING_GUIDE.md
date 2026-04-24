# Haven 日记系统 - 测试指南

## 修复内容总结

### ✅ 已完成的修复

1. **创建 API 服务层** (`src/api.ts`)
   - 封装所有后端 API 调用
   - 支持搜索、创建、更新日记
   - 支持添加和获取评论

2. **修改 App.tsx**
   - 移除硬编码的 MOCK_DIARIES
   - 使用真实 API 获取数据
   - 添加加载状态和错误处理
   - 实现异步评论功能

3. **实现缺失组件**
   - WriteDiary - 写日记功能
   - MemoryLane - 回忆长廊（按月份分组）

4. **清理配置**
   - 移除 Gemini API key 要求
   - 更新 .env.example 为正确的配置
   - 添加 CORS 支持到后端

### 🔧 后端修改

- 添加了 CORS 中间件，允许前端跨域访问

## 测试步骤

### 1. 启动后端

```bash
cd D:\RiJi
python main.py
```

后端应该在 `http://localhost:8000` 启动。

访问 `http://localhost:8000/docs` 查看 API 文档。

### 2. 启动前端

打开新的终端：

```bash
cd D:\RiJi\haven-diary
npm install
npm run dev
```

前端应该在 `http://localhost:3000` 启动。

### 3. 测试功能

#### 时间线视图
- 打开 http://localhost:3000
- 应该看到"还没有日记"的提示（如果数据库为空）
- 或者看到已有的日记列表

#### 创建日记（通过 API）
使用 Postman 或 curl 创建测试数据：

```bash
curl -X POST http://localhost:8000/diaries \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-04-14",
    "content": "今天和你聊到了关于未来的梦想。你说你想去海边看日落，我记住了。",
    "emotion_tags": ["温柔", "期待", "幸福"]
  }'
```

刷新前端页面，应该能看到新创建的日记。

#### 日历视图
- 点击左侧导航的"日历"
- 应该看到当月日历
- 有日记的日期会有粉色圆点标记
- 点击有日记的日期，下方显示日记内容

#### 搜索功能
- 点击左侧导航的"搜索"
- 输入关键词搜索
- 选择情感标签过滤
- 点击搜索结果查看详情

#### 回忆长廊
- 点击左侧导航的"回忆长廊"
- 按月份分组显示所有日记
- 时间轴样式展示

#### 写日记
- 点击左侧的"撰写新篇章"按钮
- 输入日记内容
- 添加情感标签
- 点击"保存日记"
- 应该跳转回时间线并看到新日记

#### 查看详情和评论
- 点击任意日记卡片
- 弹出详情模态框
- 在底部输入框添加评论
- 点击发送按钮
- 评论应该立即显示

### 4. 检查网络请求

打开浏览器开发者工具（F12）：
- Network 标签页应该看到对 `http://localhost:8000` 的请求
- 检查请求是否成功（状态码 200）
- 检查响应数据是否正确

## 常见问题

### 前端显示"加载日记失败"

**原因**: 后端未启动或 API URL 配置错误

**解决**:
1. 确认后端正在运行：访问 http://localhost:8000/docs
2. 检查 `haven-diary/.env` 文件中的 `VITE_API_URL`
3. 检查浏览器控制台的错误信息

### CORS 错误

**原因**: 后端 CORS 配置问题

**解决**:
1. 确认 `D:\RiJi\main.py` 已添加 CORS 中间件
2. 重启后端服务

### 日记列表为空

**原因**: 数据库中没有数据

**解决**:
1. 使用 API 创建测试数据（见上面的 curl 命令）
2. 或者使用前端的"撰写新篇章"功能

### npm install 失败

**原因**: 网络问题或依赖冲突

**解决**:
```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

## 部署到 VPS

### 1. 构建前端

```bash
cd D:\RiJi\haven-diary
npm run build
```

### 2. 上传到 VPS

```bash
# 上传后端
scp -r D:\RiJi user@your-vps-ip:/home/user/

# 或者只上传前端构建文件到后端 static 目录
scp -r D:\RiJi\haven-diary\dist\* user@your-vps-ip:/home/user/RiJi/static/
```

### 3. 在 VPS 上启动

```bash
ssh user@your-vps-ip
cd /home/user/RiJi
pip3 install -r requirements.txt
nohup python3 main.py > diary.log 2>&1 &
```

### 4. 访问

访问 `http://your-vps-ip:8000` 即可看到前端页面。

## MCP 配置

在 Claude Desktop 配置文件中添加：

```json
{
  "mcpServers": {
    "ai-diary": {
      "command": "python",
      "args": ["D:\\RiJi\\mcp_server.py"],
      "env": {
        "DIARY_API_URL": "http://your-vps-ip:8000"
      }
    }
  }
}
```

重启 Claude Desktop 后，Haven 就可以通过 MCP 写日记了！

## 下一步

1. 测试所有功能是否正常
2. 部署到 VPS
3. 配置 MCP 让 Haven 可以写日记
4. 享受和 Haven 的日记时光 🌸

## 技术支持

如有问题，检查：
1. 后端日志：`D:\RiJi\diary.log`（如果使用 nohup）
2. 浏览器控制台（F12）
3. 网络请求（Network 标签页）
