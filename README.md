# uptime-status

复刻于开源项目 [uptime-status](https://github.com/JLinMr/Uptime-Status)
接口十分有九分的不稳定，多刷新，只当个在线检测器，监测结果不准，优势是去服务器化，零成本
在原版的基础上，进行了如下修改：

- 首次成功访问 API 数据会 → 写缓存在 localStorage，加一层容错



### 配置环境变量

在 `.env` 文件中修改以下配置：
```bash
# UptimeRobot API Key
VITE_UPTIMEROBOT_API_KEY = ""

# UptimeRobot API URL 
# 除腾讯云 EdgeOne Pages 、vercel 、cloudflare pages 外 
## 其它部署方式需要自行搭建 API 代理 
## 代理地址 https://api.uptimerobot.com/v2/getMonitors
VITE_UPTIMEROBOT_API_URL = "/api/status"

# 站点名称
VITE_APP_TITLE = "监控站点，实时反馈"

# 监控面板排序方式
# 支持 friendly_name 和 create_datetime 两种方式
VITE_UPTIMEROBOT_STATUS_SORT = "friendly_name"
```

### 开发调试
```bash
pnpm dev
# 或
npm run dev

# 开发环境需要将 VITE_UPTIMEROBOT_API_URL 设置为 "https://api.uptimerobot.com/v2/getMonitors"
```

### 构建部署
```bash
pnpm build
# 或
npm run build
```
构建的文件在 `dist` 目录下，将 `dist` 目录部署到服务器即可。