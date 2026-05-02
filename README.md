# 随杰健身

一款极简风格的健身训练记录工具，支持 苹果、安卓和电脑。

## 功能

- **训练计划**：按天定制训练项目，打勾标记完成，进度条可视化
- **跑步 & 骑行**：GPS 实时追踪，记录距离、时间、配速，分段计时，自动计算卡路里
- **运动记录**：按月浏览历史数据，训练和运动分开展示
- **个人信息**：身高体重可随时修改，统计训练天数、跑步骑行次数、总卡路里消耗

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS v3 |
| 后端 | Node.js + Express + better-sqlite3 |
| 移动端 | Capacitor (Android APK) |
| 数据库 | SQLite |

## 快速开始

```bash
# 安装依赖
npm run install:all

# 本地开发（前后端同时启动）
npm run dev
```

浏览器访问 `http://localhost:5173`

## 生产部署

```bash
# 构建前端
npm run build

# 启动生产服务（Express 提供静态文件 + API）
npm start
```

## 生成 APK

```bash
cd client
npm run build
npx cap sync
cd android
./gradlew assembleDebug
# APK 输出位置: android/app/build/outputs/apk/debug/app-debug.apk
```

## 项目结构

```
随杰健身/
├── client/                  # 前端
│   ├── src/
│   │   ├── api/            # API 调用层
│   │   ├── components/     # UI 组件
│   │   ├── contexts/       # React Context
│   │   ├── pages/          # 页面
│   │   └── utils/          # 工具函数
│   ├── capacitor.config.ts # Capacitor 配置
│   └── vite.config.ts      # Vite 配置
├── server/                  # 后端
│   └── src/
│       ├── routes/         # API 路由
│       ├── middleware/      # JWT 认证
│       └── utils/          # 卡路里计算
└── package.json            # 根脚本
```

## License

MIT
