# AI Diary

一个日记系统，分成三层：

1. `main.py`
   FastAPI 后端，负责日记、评论、搜索和静态页面入口。
2. `haven-diary/`
   React + Vite 前端。
3. `mcp_http_server.py`
   标准远程 MCP 服务，支持 `httpStream` 和 `sse`。

如果你只是给浏览器访问，这个项目只需要 `main.py + 前端`。
如果你还要让 Operit、Codex 这类客户端远程连接 MCP，再把 `mcp_http_server.py` 一起部署。

## 项目结构

```text
RiJi/
├─ main.py
├─ database.py
├─ diary_mcp.py
├─ mcp_server.py
├─ mcp_http_server.py
├─ deploy_remote.sh
├─ requirements.txt
├─ README.md
├─ DEPLOYMENT.md
├─ MCP_HTTP_GUIDE.md
└─ haven-diary/
   ├─ src/
   ├─ package.json
   └─ vite.config.ts
```

## 本地开发

### 后端

```bash
cd /path/to/RiJi
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

启动后端：

```bash
python main.py
```

后端默认监听：

- `http://localhost:8000/`
- `http://localhost:8000/api`
- `http://localhost:8000/docs`

### 本地 stdio MCP

```bash
cd /path/to/RiJi
DIARY_API_URL=http://localhost:8000 python mcp_server.py
```

### 前端

```bash
cd /path/to/RiJi/haven-diary
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

### 本地远程 MCP

```bash
DIARY_API_URL=http://localhost:8000 MCP_BEARER_TOKEN=change-me python mcp_http_server.py
```

可连接的标准远程 MCP 端点：

- `httpStream`: `http://localhost:8080/mcp`
- `sse`: `http://localhost:8080/mcp/sse`

设置了 `MCP_BEARER_TOKEN` 后，客户端需要带：

```http
Authorization: Bearer your-secret-key
```

## 远程部署

现在仓库里只保留一份部署脚本：

- [deploy_remote.sh](deploy_remote.sh)

它的目标很明确：

1. 本地构建前端
2. 上传代码到远程 Linux VPS
3. 在远程创建 Python 虚拟环境
4. 配置两个 systemd 服务
   - `ai-diary-api`
   - `ai-diary-mcp`
5. 配置 nginx
6. 对外暴露：
   - 网站根路径 `/`
   - 后端 API `/api`、`/diaries...`
   - 远程 MCP `/mcp`、`/mcp/sse`

### 部署前提

你的本地机器要有：

- `bash`
- `ssh`
- `python`
- `tar`
- `npm`

远程机器建议：

- Ubuntu 22.04 或其他常见 Linux
- 能用 `sudo`
- 已开放 `22` 和 `80`

### 最常用的执行方式

```bash
cd /path/to/RiJi
chmod +x deploy_remote.sh
./deploy_remote.sh \
  --host 203.0.113.10 \
  --user root \
  --server-name diary.example.com \
  --app-origin https://diary.example.com \
  --mcp-bearer-token 'replace-this-with-a-long-random-string'
```

如果你暂时没有域名，也可以先这样：

```bash
./deploy_remote.sh --host 203.0.113.10 --user root
```

这时默认会把前端 API 基地址写成：

```text
http://203.0.113.10
```

MCP 对外地址会是：

```text
http://203.0.113.10/mcp       # httpStream
http://203.0.113.10/mcp/sse   # SSE
```

### 部署后检查

网页：

```bash
curl http://your-host/api
```

MCP 元信息：

```bash
curl http://your-host/mcp/info
```

systemd：

```bash
ssh user@your-host "sudo systemctl status ai-diary-api ai-diary-mcp nginx"
```

日志：

```bash
ssh user@your-host "sudo journalctl -u ai-diary-api -f"
ssh user@your-host "sudo journalctl -u ai-diary-mcp -f"
```

## 给其他客户端调 MCP

如果你的客户端支持标准远程 MCP：

```text
https://your-domain/mcp        # httpStream
https://your-domain/mcp/sse    # SSE
```

常见客户端填写方式：

- `Operit`
  连接类型选 `httpStream` 时填 `https://your-domain/mcp`
  连接类型选 `sse` 时填 `https://your-domain/mcp/sse`
- `Codex`
  连接远程 MCP 时优先填 `https://your-domain/mcp`

Bearer Token 填你部署时设置的那串 token。

公开检查接口：

```bash
curl https://your-domain/mcp/info
curl https://your-domain/mcp/health
```

## 注意

1. `mcp_http_server.py` 现在是标准远程 MCP，不再走旧的 `/call/*` 自定义接口。
2. `mcp_server.py` 和 `mcp_http_server.py` 共用 [diary_mcp.py](diary_mcp.py) 里的同一套工具定义。
3. 默认部署脚本只配了 HTTP。
   真正上公网时，最好自己再加 HTTPS。
4. 部署脚本会自动写入 `MCP_ALLOWED_HOSTS` 和 `MCP_ALLOWED_ORIGINS`。
   如果你后面自己换了域名、端口或反代方式，记得同步更新 `ai-diary-mcp.service` 里的这两个环境变量。

## 文件说明

- [DEPLOYMENT.md](DEPLOYMENT.md)
  现在是简版部署说明，和这里保持同一套路径。
- [MCP_HTTP_GUIDE.md](MCP_HTTP_GUIDE.md)
  现在是简版远程 MCP 连接说明。
