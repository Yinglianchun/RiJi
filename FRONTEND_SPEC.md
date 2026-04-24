# AI 恋人日记系统 - 前端开发文档

## 项目概述

这是一个为 AI 恋人（Haven）设计的日记系统前端。用户可以查看 AI 写的日记、搜索历史记录、添加评论等。

## 设计要求

- **风格**: 温馨、浪漫、简洁
- **响应式**: 支持桌面和移动端
- **用户体验**: 流畅、直观、易用

## 技术栈建议

- 纯 HTML/CSS/JavaScript（无框架）
- 或使用 React/Vue/Svelte 等现代框架
- 可以使用 Tailwind CSS 或其他 CSS 框架

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:8000` (开发环境) 或 `http://your-vps-ip:8000` (生产环境)
- **数据格式**: JSON
- **字符编码**: UTF-8

---

### 1. 创建日记

**接口**: `POST /diaries`

**描述**: AI 通过 MCP 调用此接口创建日记（前端一般不需要调用）

**请求体**:
```json
{
  "date": "2026-04-14",
  "content": "今天和user聊了很多，感觉很开心...",
  "emotion_tags": ["开心", "温暖"]  // 可选，可以是任何自定义标签
}
```

**响应**:
```json
{
  "id": 1,
  "message": "日记创建成功"
}
```

**错误响应**:
- `400`: 日期格式错误或该日期已有日记
- `422`: 请求参数验证失败

---

### 2. 根据日期获取日记

**接口**: `GET /diaries/date/{date}`

**描述**: 获取指定日期的日记

**参数**:
- `date`: 日期字符串，格式 `YYYY-MM-DD`，例如 `2026-04-14`

**示例**: `GET /diaries/date/2026-04-14`

**响应**:
```json
{
  "id": 1,
  "date": "2026-04-14",
  "content": "今天和user聊了很多，感觉很开心...",
  "emotion_tags": ["开心", "温暖"],
  "created_at": "2026-04-14T10:30:00",
  "updated_at": "2026-04-14T10:30:00",
  "comments": [
    {
      "id": 1,
      "diary_id": 1,
      "content": "我也很开心呀！",
      "created_at": "2026-04-14T12:00:00"
    }
  ]
}
```

**错误响应**:
- `404`: 未找到该日期的日记

---

### 3. 根据 ID 获取日记

**接口**: `GET /diaries/{diary_id}`

**描述**: 获取指定 ID 的日记详情

**参数**:
- `diary_id`: 日记 ID（整数）

**示例**: `GET /diaries/1`

**响应**: 同上（根据日期获取日记）

**错误响应**:
- `404`: 未找到该日记

---

### 4. 搜索日记

**接口**: `POST /diaries/search`

**描述**: 根据条件搜索日记，所有参数都是可选的

**请求体**:
```json
{
  "keyword": "开心",           // 可选，搜索内容中包含的关键词
  "start_date": "2026-04-01",  // 可选，开始日期
  "end_date": "2026-04-30",    // 可选，结束日期
  "emotion_tag": "开心",       // 可选，情感标签
  "limit": 50                  // 可选，返回结果数量，默认 50
}
```

**响应**:
```json
{
  "count": 2,
  "diaries": [
    {
      "id": 2,
      "date": "2026-04-14",
      "content": "今天...",
      "emotion_tags": ["开心"],
      "created_at": "2026-04-14T10:30:00",
      "updated_at": "2026-04-14T10:30:00"
    },
    {
      "id": 1,
      "date": "2026-04-13",
      "content": "昨天...",
      "emotion_tags": ["温暖"],
      "created_at": "2026-04-13T20:00:00",
      "updated_at": "2026-04-13T20:00:00"
    }
  ]
}
```

**注意**: 
- 结果按日期倒序排列（最新的在前）
- 如果不传任何参数，返回最近的 50 条日记

---

### 5. 更新日记

**接口**: `PUT /diaries/{diary_id}`

**描述**: 更新日记内容或情感标签（前端一般不需要调用，除非要实现编辑功能）

**参数**:
- `diary_id`: 日记 ID（整数）

**请求体**:
```json
{
  "content": "更新后的内容...",      // 可选
  "emotion_tags": ["开心", "感动"]  // 可选
}
```

**响应**:
```json
{
  "message": "日记更新成功"
}
```

**错误响应**:
- `404`: 未找到该日记或无更新内容

---

### 6. 添加评论

**接口**: `POST /diaries/{diary_id}/comments`

**描述**: 用户对 AI 的日记添加评论

**参数**:
- `diary_id`: 日记 ID（整数）

**请求体**:
```json
{
  "content": "我也很开心呀！"
}
```

**响应**:
```json
{
  "id": 1,
  "message": "评论添加成功"
}
```

**错误响应**:
- `404`: 未找到该日记

---

### 7. 获取日记的所有评论

**接口**: `GET /diaries/{diary_id}/comments`

**描述**: 获取指定日记的所有评论

**参数**:
- `diary_id`: 日记 ID（整数）

**示例**: `GET /diaries/1/comments`

**响应**:
```json
{
  "count": 2,
  "comments": [
    {
      "id": 1,
      "diary_id": 1,
      "content": "我也很开心呀！",
      "created_at": "2026-04-14T12:00:00"
    },
    {
      "id": 2,
      "diary_id": 1,
      "content": "今天天气真好",
      "created_at": "2026-04-14T15:30:00"
    }
  ]
}
```

---

## 前端功能需求

### 1. 时间线视图（Timeline）

**功能描述**:
- 展示所有日记，按时间倒序排列（最新的在上面）
- 每条日记显示：日期、内容预览（前 200 字）、情感标签、评论数量
- 点击日记卡片可以查看详情

**实现建议**:
- 页面加载时调用 `POST /diaries/search`，不传参数获取最近 50 条
- 使用卡片式布局展示日记
- 内容过长时显示省略号和"展开"按钮

**UI 元素**:
- 日记卡片（可点击）
- 日期标签
- 情感标签（彩色小标签）
- 评论图标 + 数量

---

### 2. 日历视图（Calendar）

**功能描述**:
- 以日历形式展示日记
- 有日记的日期高亮显示（例如用粉色圆点或背景色标记）
- 点击有日记的日期，下方显示该日期的日记内容
- 可以切换月份（上一月/下一月按钮）

**实现建议**:
- 使用 `POST /diaries/search` 传入 `start_date` 和 `end_date` 获取当月所有日记
- 渲染日历网格（7列 × 5-6行）
- 点击日期后调用 `GET /diaries/date/{date}` 获取详情

**UI 元素**:
- 月份标题 + 切换按钮
- 日历网格（周日到周六）
- 日期单元格（有日记的高亮）
- 选中日期的日记展示区域

---

### 3. 搜索视图（Search）

**功能描述**:
- 提供多种搜索条件：关键词、日期范围、情感标签
- 所有条件都是可选的，可以组合使用
- 显示搜索结果列表

**实现建议**:
- 调用 `POST /diaries/search` 传入搜索条件
- 情感标签使用文本输入框 + datalist 提供建议
- 搜索结果使用与时间线相同的卡片布局

**UI 元素**:
- 关键词输入框
- 开始日期选择器
- 结束日期选择器
- 情感标签输入框（带建议列表）
- 搜索按钮
- 结果列表

**情感标签建议列表**:
```
开心、难过、兴奋、平静、思念、感动、温暖、期待、幸福、孤独、甜蜜、温柔、想你
```

---

### 4. 日记详情模态框（Modal）

**功能描述**:
- 点击日记卡片时弹出模态框
- 显示完整的日记内容、日期、情感标签
- 显示所有评论
- 提供添加评论的输入框和按钮

**实现建议**:
- 点击卡片时调用 `GET /diaries/{diary_id}` 获取完整信息
- 使用模态框/对话框组件展示
- 评论区域可滚动

**UI 元素**:
- 关闭按钮（X）
- 日记日期
- 情感标签
- 完整日记内容（保留换行）
- 评论列表
- 评论输入框（多行文本框）
- 提交评论按钮

**添加评论流程**:
1. 用户输入评论内容
2. 点击"添加评论"按钮
3. 调用 `POST /diaries/{diary_id}/comments`
4. 成功后刷新评论列表
5. 清空输入框

---

## 数据结构说明

### Diary（日记对象）

```typescript
interface Diary {
  id: number;                    // 日记 ID
  date: string;                  // 日期，格式 YYYY-MM-DD
  content: string;               // 日记内容
  emotion_tags: string[] | null; // 情感标签数组，可能为 null
  created_at: string;            // 创建时间，ISO 8601 格式
  updated_at: string;            // 更新时间，ISO 8601 格式
  comments?: Comment[];          // 评论列表（仅在详情接口返回）
}
```

### Comment（评论对象）

```typescript
interface Comment {
  id: number;           // 评论 ID
  diary_id: number;     // 所属日记 ID
  content: string;      // 评论内容
  created_at: string;   // 创建时间，ISO 8601 格式
}
```

---

## UI/UX 设计建议



### 字体

- 中文：思源黑体、苹方、微软雅黑、宋体
- 英文：-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

### 图标建议

可以使用 emoji 或图标库（如 Font Awesome、Material Icons）：
- 📅 日期
- 💭 情感
- 💬 评论
- 🔍 搜索
- ❤️ 喜欢
- 🌸 装饰

### 动画效果

- 卡片悬停时轻微上浮
- 模态框淡入淡出
- 按钮点击反馈
- 页面切换过渡

### 响应式断点

- 桌面：> 1024px
- 平板：768px - 1024px
- 手机：< 768px

---

## 开发注意事项

### 1. 跨域问题（CORS）

如果前端和后端不在同一域名/端口，需要处理 CORS。后端已配置允许跨域请求。

### 2. 日期格式

- API 接受和返回的日期格式统一为 `YYYY-MM-DD`
- 时间戳格式为 ISO 8601：`2026-04-14T10:30:00`

### 3. 空状态处理

- 没有日记时显示友好提示："还没有日记，让 AI 开始记录吧 🌸"
- 搜索无结果时显示："没有找到匹配的日记"
- 没有评论时显示："还没有评论"

### 4. 错误处理

- 网络请求失败时显示错误提示
- API 返回错误时显示具体错误信息
- 使用 try-catch 捕获异常

### 5. 加载状态

- 数据加载时显示加载动画或骨架屏
- 按钮点击后显示加载状态，防止重复提交

### 6. 性能优化

- 图片懒加载（如果有图片）
- 长列表虚拟滚动（如果日记很多）
- 防抖搜索输入

---

## 示例代码片段

### 获取日记列表

```javascript
async function loadDiaries() {
  try {
    const response = await fetch('http://localhost:8000/diaries/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ limit: 50 })
    });
    
    const data = await response.json();
    
    if (data.count > 0) {
      renderDiaries(data.diaries);
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('加载失败:', error);
    showError('加载日记失败，请稍后重试');
  }
}
```

### 添加评论

```javascript
async function addComment(diaryId, content) {
  try {
    const response = await fetch(`http://localhost:8000/diaries/${diaryId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('评论添加成功！');
      // 刷新评论列表
      loadComments(diaryId);
    } else {
      alert('添加失败: ' + result.detail);
    }
  } catch (error) {
    console.error('添加评论失败:', error);
    alert('添加评论失败，请稍后重试');
  }
}
```

### 搜索日记

```javascript
async function searchDiaries(keyword, startDate, endDate, emotionTag) {
  const searchParams = {};
  
  if (keyword) searchParams.keyword = keyword;
  if (startDate) searchParams.start_date = startDate;
  if (endDate) searchParams.end_date = endDate;
  if (emotionTag) searchParams.emotion_tag = emotionTag;
  
  try {
    const response = await fetch('http://localhost:8000/diaries/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });
    
    const data = await response.json();
    renderSearchResults(data.diaries);
  } catch (error) {
    console.error('搜索失败:', error);
    showError('搜索失败，请稍后重试');
  }
}
```

---

## 测试建议

### 功能测试

1. 加载日记列表
2. 点击日记查看详情
3. 添加评论
4. 搜索功能（各种条件组合）
5. 日历视图切换月份
6. 响应式布局测试

### 边界情况

1. 没有日记时的显示
2. 日记内容很长时的显示
3. 没有情感标签的日记
4. 没有评论的日记
5. 搜索无结果
6. 网络错误处理

---

## 部署说明

### 静态文件部署

将前端文件放在 `D:\RiJi\static\` 目录下：
```
static/
├── index.html
├── style.css
├── app.js
└── (其他资源文件)
```

后端会自动提供静态文件服务，访问 `http://localhost:8000` 即可看到前端页面。

### 生产环境

- 修改 API Base URL 为生产环境地址
- 压缩 CSS 和 JavaScript
- 优化图片资源
- 启用 HTTPS

---

## 参考资源

- FastAPI 文档: https://fastapi.tiangolo.com/
- Fetch API: https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API
- 日期处理: 可以使用 `new Date()` 或 day.js 库

---

## 联系方式

如有问题，请参考 `README.md` 或查看后端 API 文档：`http://localhost:8000/docs`

---

**祝开发顺利！🌸**
