# Deployment

这份仓库现在只保留一条推荐部署路径：

- 用 [deploy_remote.sh](deploy_remote.sh) 从本地发起部署
- 远程部署 `main.py + mcp_http_server.py + nginx`
- 对外统一暴露：
  - 网站：`/`
  - API：`/api`、`/diaries...`
  - MCP：`/mcp`、`/mcp/sse`

完整说明请直接看 [README.md](README.md) 里的：

- “远程部署”
- “给其他客户端调 MCP”

最常用示例：

```bash
./deploy_remote.sh \
  --host 203.0.113.10 \
  --user root \
  --server-name diary.example.com \
  --app-origin https://diary.example.com \
  --mcp-bearer-token 'replace-this-with-a-long-random-string'
```
